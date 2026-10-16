/**
 * MediTrack Central Alert Manager & Emergency Pipeline
 * Coordinates:
 * 1. Extraction / Clinical Evaluation
 * 2. Deduplication via idempotency keys
 * 3. Persistence into health_alerts
 * 4. Policy evaluation for Emergency Contacts
 * 5. Asynchronous Email & SMS delivery
 * 6. Audit logging into notification_deliveries and system_logs
 */

import { db } from '../db/db.js';
import { 
  classifyMeasurement, 
  createInformationalAlert, 
  createEmergencyTestAlert,
  ClassifiedAlert, 
  RawMeasurementInput 
} from './alertClassification.service.js';
import { emailDeliveryService, EmailDeliveryResult } from './emailDelivery.service.js';
import { smsDeliveryService, SmsDeliveryResult } from './smsDelivery.service.js';

export interface AlertDeliveryRecord {
  id: number;
  alert_id: number;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  recipient: string;
  provider_message_id?: string;
  delivery_status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  attempt_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthAlertWithDeliveries {
  id: number;
  user_id: number;
  contact_id?: number | null;
  contact_name?: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  source: string;
  status: string;
  parameter?: string;
  measured_value?: string;
  reference_range?: string;
  source_report_id?: number;
  idempotency_key?: string;
  action_url?: string;
  details_json?: string;
  is_read: number;
  read_at?: string;
  created_at: string;
  deliveries: AlertDeliveryRecord[];
}

export const alertManager = {
  /**
   * Process and evaluate all measurements from a medical report.
   * Generates deduplicated alerts and triggers emergency notifications when criteria are met.
   */
  async processReportAlerts(userId: number, reportId: number): Promise<HealthAlertWithDeliveries[]> {
    // 1. Fetch report details
    const reportRes = await db.execute({
      sql: 'SELECT id, filename, report_type, report_date FROM medical_reports WHERE id = ? AND user_id = ?',
      args: [reportId, userId]
    });
    if (reportRes.rows.length === 0) return [];
    const report = reportRes.rows[0];

    // 2. Fetch extracted measurements for this report
    const measRes = await db.execute({
      sql: `SELECT parameter, raw_value, normalized_value, unit, normalized_unit, source_page, source_text, extraction_confidence, validation_status 
            FROM measurements WHERE report_id = ?`,
      args: [reportId]
    });

    const measurements = measRes.rows as unknown as RawMeasurementInput[];
    const createdAlerts: HealthAlertWithDeliveries[] = [];

    // 3. Classify each measurement
    for (const m of measurements) {
      const classified = classifyMeasurement(userId, m, reportId, String(report.report_date));
      if (!classified) continue;

      // 4. Save and dispatch alert with deduplication
      const savedAlert = await this.persistAndDispatchAlert(userId, classified, reportId);
      if (savedAlert) {
        createdAlerts.push(savedAlert);
      }
    }

    // 5. If no critical or warning alerts were created, create an informational alert confirming report processing
    if (createdAlerts.length === 0) {
      const infoAlert = createInformationalAlert(
        userId,
        'Report Processed Successfully',
        `Medical report "${report.filename}" was analyzed. All extracted biomarker values are within normal physiological bounds.`,
        reportId
      );
      const savedInfo = await this.persistAndDispatchAlert(userId, infoAlert, reportId);
      if (savedInfo) createdAlerts.push(savedInfo);
    }

    return createdAlerts;
  },

  /**
   * Persist an alert into `health_alerts` and trigger emergency dispatch if eligible.
   * Uses idempotency_key to prevent duplicate entries on page reload or repeated evaluation.
   */
  async persistAndDispatchAlert(
    userId: number, 
    alert: ClassifiedAlert, 
    reportId?: number
  ): Promise<HealthAlertWithDeliveries | null> {
    const now = new Date().toISOString();

    // 1. Deduplication check via idempotency_key
    if (alert.idempotencyKey) {
      const existing = await db.execute({
        sql: 'SELECT id FROM health_alerts WHERE user_id = ? AND idempotency_key = ?',
        args: [userId, alert.idempotencyKey]
      });
      if (existing.rows.length > 0) {
        console.log(`[AlertManager] Duplicate alert suppressed via idempotency key: ${alert.idempotencyKey}`);
        return null;
      }
    }

    // 2. Insert into health_alerts
    const actionUrl = alert.sourceReportId ? `/reports?highlight=${alert.sourceReportId}` : '/dashboard';
    const detailsJson = JSON.stringify({
      canonicalValue: alert.canonicalValue,
      canonicalUnit: alert.canonicalUnit,
      explanation: alert.explanation,
      recommendedAction: alert.recommendedAction,
      sourceText: alert.sourceText
    });

    const insertResult = await db.execute({
      sql: `INSERT INTO health_alerts 
            (user_id, contact_id, type, severity, title, message, source, status, parameter, measured_value, reference_range, source_report_id, idempotency_key, action_url, details_json, is_read, created_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            RETURNING *`,
      args: [
        userId,
        alert.severity, // type
        alert.severity, // severity
        alert.title,
        alert.message,
        'Clinical System',
        'DELIVERED',
        alert.parameter,
        alert.measuredValue,
        alert.referenceRange,
        reportId || null,
        alert.idempotencyKey || null,
        actionUrl,
        detailsJson,
        now
      ]
    });

    const savedRecord = insertResult.rows[0];
    const alertId = Number(savedRecord.id);

    // 3. Log alert creation in system_logs
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [
        alert.severity === 'CRITICAL' ? 'WARN' : 'INFO',
        'HEALTH_ALERT_CREATED',
        `[${alert.severity}] Alert created for user ${userId}: ${alert.title}`,
        userId,
        now
      ]
    });

    // 4. Emergency Contact Notification Policy Evaluation
    // Emergency notifications are triggered for CRITICAL alerts (and explicit test alerts)
    const deliveries: AlertDeliveryRecord[] = [];
    if (alert.severity === 'CRITICAL') {
      const dispatchedDeliveries = await this.dispatchEmergencyPolicy(userId, alertId, alert);
      deliveries.push(...dispatchedDeliveries);
    }

    return {
      ...savedRecord,
      deliveries
    } as unknown as HealthAlertWithDeliveries;
  },

  /**
   * Evaluates user notification preferences and active trusted contacts,
   * then dispatches transactional email and SMS accordingly.
   */
  async dispatchEmergencyPolicy(
    userId: number,
    alertId: number,
    alert: ClassifiedAlert,
    isTest: boolean = false
  ): Promise<AlertDeliveryRecord[]> {
    const deliveries: AlertDeliveryRecord[] = [];
    const now = new Date().toISOString();

    // 1. Fetch user profile and preferences
    const userRes = await db.execute({
      sql: 'SELECT id, email, name, notification_email, notification_sms FROM users WHERE id = ?',
      args: [userId]
    });
    if (userRes.rows.length === 0) return [];
    const user = userRes.rows[0];
    const patientName = (user.name as string) || 'Patient';

    // 2. Fetch active trusted contacts for this user
    const contactsRes = await db.execute({
      sql: `SELECT id, name, relationship, contact_method, contact_value, status 
            FROM trusted_contacts 
            WHERE user_id = ? AND status = 'ACTIVE'`,
      args: [userId]
    });

    const activeContacts = contactsRes.rows;

    if (activeContacts.length === 0) {
      console.warn(`[AlertManager] No active trusted contacts configured for user ${userId}. Recording SKIPPED delivery.`);
      const skippedRes = await db.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, channel, recipient, delivery_status, attempt_count, error_message, created_at, updated_at) 
              VALUES (?, 'IN_APP', ?, 'SKIPPED', 0, 'No active trusted contacts configured', ?, ?) 
              RETURNING *`,
        args: [alertId, user.email || 'N/A', now, now]
      });
      deliveries.push(skippedRes.rows[0] as unknown as AlertDeliveryRecord);
      return deliveries;
    }

    // 3. Dispatch for each eligible contact
    for (const c of activeContacts) {
      const contactName = String(c.name || 'Emergency Contact');
      const contactMethod = String(c.contact_method || 'EMAIL').toUpperCase();
      const contactValue = String(c.contact_value || '').trim();

      // Email Dispatch
      const isEmail = contactMethod === 'EMAIL' || contactValue.includes('@');
      if (isEmail) {
        // Check user consent preference: user.notification_email defaults to 1 unless explicitly 0
        const userConsentsEmail = user.notification_email !== 0;
        if (!userConsentsEmail) {
          console.log(`[AlertManager] User ${userId} has disabled email alerts.`);
          continue;
        }

        console.log(`[AlertManager] Dispatching emergency email to ${contactName} (${contactValue})...`);
        const emailResult: EmailDeliveryResult = await emailDeliveryService.sendEmergencyAlert({
          toEmail: contactValue,
          recipientName: contactName,
          patientName,
          alert,
          isTest
        });

        const deliveryInsert = await db.execute({
          sql: `INSERT INTO notification_deliveries 
                (alert_id, channel, recipient, provider_message_id, delivery_status, attempt_count, error_message, created_at, updated_at)
                VALUES (?, 'EMAIL', ?, ?, ?, 1, ?, ?, ?)
                RETURNING *`,
          args: [
            alertId,
            contactValue,
            emailResult.providerMessageId || null,
            emailResult.deliveryStatus,
            emailResult.errorMessage || null,
            now,
            now
          ]
        });

        deliveries.push(deliveryInsert.rows[0] as unknown as AlertDeliveryRecord);

        // Update contact_id reference in health_alerts
        await db.execute({
          sql: 'UPDATE health_alerts SET contact_id = ? WHERE id = ?',
          args: [c.id, alertId]
        });

        // Audit log
        await db.execute({
          sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
          args: [
            emailResult.success ? 'INFO' : 'WARN',
            'EMERGENCY_EMAIL_DISPATCH',
            `Email to ${contactValue} [${emailResult.deliveryStatus}] ${emailResult.errorMessage ? `Error: ${emailResult.errorMessage}` : ''}`,
            userId,
            now
          ]
        });
      }

      // SMS Dispatch
      const isSms = contactMethod === 'SMS' || /^\+?[0-9\s\-]+$/.test(contactValue);
      if (isSms) {
        const userConsentsSms = user.notification_sms !== 0;
        if (!userConsentsSms) {
          console.log(`[AlertManager] User ${userId} has disabled SMS alerts.`);
          continue;
        }

        console.log(`[AlertManager] Dispatching emergency SMS to ${contactName} (${contactValue})...`);
        const smsResult: SmsDeliveryResult = await smsDeliveryService.sendEmergencyAlert({
          toPhone: contactValue,
          recipientName: contactName,
          patientName,
          alert,
          isTest
        });

        const deliveryInsert = await db.execute({
          sql: `INSERT INTO notification_deliveries 
                (alert_id, channel, recipient, provider_message_id, delivery_status, attempt_count, error_message, created_at, updated_at)
                VALUES (?, 'SMS', ?, ?, ?, 1, ?, ?, ?)
                RETURNING *`,
          args: [
            alertId,
            contactValue,
            smsResult.providerMessageId || null,
            smsResult.deliveryStatus,
            smsResult.errorMessage || null,
            now,
            now
          ]
        });

        deliveries.push(deliveryInsert.rows[0] as unknown as AlertDeliveryRecord);

        // Audit log
        await db.execute({
          sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
          args: [
            smsResult.success ? 'INFO' : 'WARN',
            'EMERGENCY_SMS_DISPATCH',
            `SMS to ${contactValue} [${smsResult.deliveryStatus}] ${smsResult.errorMessage ? `Error: ${smsResult.errorMessage}` : ''}`,
            userId,
            now
          ]
        });
      }
    }

    return deliveries;
  },

  /**
   * Explicit test-send action for user verification of emergency alert channels.
   * Labels the message prominently so it cannot be mistaken for an actual emergency.
   */
  async sendTestEmergencyAlert(userId: number, contactId?: number): Promise<{ alert: HealthAlertWithDeliveries; deliveries: AlertDeliveryRecord[] }> {
    let recipientName = 'Emergency Contact';
    if (contactId) {
      const cRes = await db.execute({
        sql: 'SELECT name FROM trusted_contacts WHERE id = ? AND user_id = ?',
        args: [contactId, userId]
      });
      if (cRes.rows.length > 0) {
        recipientName = String(cRes.rows[0].name);
      }
    }

    const testAlert = createEmergencyTestAlert(userId, recipientName);
    const savedAlert = await this.persistAndDispatchAlert(userId, testAlert);
    if (!savedAlert) {
      throw new Error('Failed to create test emergency alert record');
    }

    // Force dispatch with isTest = true
    const deliveries = await this.dispatchEmergencyPolicy(userId, savedAlert.id, testAlert, true);
    savedAlert.deliveries = deliveries;

    return { alert: savedAlert, deliveries };
  },

  /**
   * Get all alerts for a user with deliveries
   */
  async getUserAlerts(userId: number, limit: number = 50): Promise<HealthAlertWithDeliveries[]> {
    const alertsRes = await db.execute({
      sql: `SELECT a.*, c.name as contact_name 
            FROM health_alerts a 
            LEFT JOIN trusted_contacts c ON a.contact_id = c.id 
            WHERE a.user_id = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
      args: [userId, limit]
    });

    const alertRows = alertsRes.rows;
    if (alertRows.length === 0) return [];

    const alertIds = alertRows.map(r => r.id);
    const placeholders = alertIds.map(() => '?').join(',');

    const deliveriesRes = await db.execute({
      sql: `SELECT * FROM notification_deliveries WHERE alert_id IN (${placeholders}) ORDER BY created_at ASC`,
      args: alertIds
    });

    const deliveriesByAlert: Record<number, AlertDeliveryRecord[]> = {};
    for (const d of deliveriesRes.rows) {
      const aid = Number(d.alert_id);
      if (!deliveriesByAlert[aid]) deliveriesByAlert[aid] = [];
      deliveriesByAlert[aid].push(d as unknown as AlertDeliveryRecord);
    }

    return alertRows.map(a => ({
      ...a,
      deliveries: deliveriesByAlert[Number(a.id)] || []
    })) as unknown as HealthAlertWithDeliveries[];
  }
};
