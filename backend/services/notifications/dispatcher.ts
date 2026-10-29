import { envConfig } from '../../config/env.js';
import {
  CanonicalHealthSummary,
  AlertSeverity,
  formatEmailHtml,
  formatEmailText,
  formatTelegram,
  formatSms,
  formatPush,
  MEDICAL_DISCLAIMER
} from './canonicalSummary.js';
import {
  sendEmail,
  sendSms,
  sendPush,
  isValidEmail,
  normalizePhoneToE164,
  PushSubscriptionData
} from './providers.js';
import { sendTelegramMessage } from './telegramService.js';

export interface DispatchAlertResult {
  alertId: number;
  totalAttempted: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  deliveries: Array<{
    id: number;
    channel: string;
    destination: string;
    status: string;
    error?: string;
  }>;
}

/**
 * Creates a canonical health summary from report measurements, existing history, and evaluated risk.
 */
export async function buildCanonicalSummary(
  db: any,
  userId: number,
  alertId: number,
  severity: AlertSeverity,
  title: string,
  mainReason: string,
  sourceReportId?: number
): Promise<CanonicalHealthSummary> {
  // 1. Fetch user info for approved identifier
  const userRes = await db.execute({
    sql: 'SELECT id, name, email FROM users WHERE id = ?',
    args: [userId]
  });
  const user = userRes.rows[0] || { id: userId, name: 'Patient', email: '' };
  const patientId = `P-${String(userId).padStart(4, '0')}`;
  const patientName = user.name || 'Patient';

  // 2. Fetch latest measurements for this report or user
  let measurements: any[] = [];
  if (sourceReportId) {
    const measRes = await db.execute({
      sql: `SELECT m.*, r.report_date, r.filename 
            FROM measurements m 
            JOIN medical_reports r ON m.report_id = r.id 
            WHERE m.report_id = ? AND r.user_id = ?`,
      args: [sourceReportId, userId]
    });
    measurements = measRes.rows;
  } else {
    const measRes = await db.execute({
      sql: `SELECT m.*, r.report_date, r.filename 
            FROM measurements m 
            JOIN medical_reports r ON m.report_id = r.id 
            WHERE r.user_id = ? 
            ORDER BY r.report_date DESC LIMIT 30`,
      args: [userId]
    });
    measurements = measRes.rows;
  }

  // 3. Extract clinically relevant abnormal findings
  const abnormalFindings: CanonicalHealthSummary['abnormalFindings'] = [];
  for (const m of measurements) {
    const param = (m.parameter || '').trim();
    const valStr = m.normalized_value || m.raw_value || '';
    const num = parseFloat(valStr.replace(/,/g, ''));
    const unit = m.normalized_unit || m.unit || '';
    const paramLower = param.toLowerCase();

    // Blood Pressure
    if (paramLower.includes('blood pressure') || paramLower.includes('bp')) {
      const parts = valStr.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        if (sys >= 140 || dia >= 90) {
          abnormalFindings.push({
            parameter: 'Blood Pressure',
            measuredValue: valStr,
            unit: 'mmHg',
            referenceRange: '<120/80 mmHg',
            status: sys >= 180 || dia >= 120 ? 'Critical' : 'High',
            clinicalNote: sys >= 140 ? 'Stage 2 Hypertension threshold met' : 'Elevated'
          });
        }
      }
    }
    // HbA1c
    else if (paramLower === 'hba1c' || paramLower.includes('glycated')) {
      if (!isNaN(num) && num >= 6.5) {
        abnormalFindings.push({
          parameter: 'HbA1c',
          measuredValue: num,
          unit: unit || '%',
          referenceRange: '4.0 - 5.6%',
          status: num >= 9.0 ? 'Critical' : 'High',
          clinicalNote: 'Indicates elevated long-term blood glucose levels'
        });
      } else if (!isNaN(num) && num >= 5.7) {
        abnormalFindings.push({
          parameter: 'HbA1c',
          measuredValue: num,
          unit: unit || '%',
          referenceRange: '4.0 - 5.6%',
          status: 'Borderline',
          clinicalNote: 'Prediabetes range'
        });
      }
    }
    // Fasting Glucose
    else if (paramLower.includes('glucose') || paramLower.includes('sugar')) {
      if (!isNaN(num) && (num >= 126 || num < 70)) {
        abnormalFindings.push({
          parameter: paramLower.includes('fasting') ? 'Fasting Glucose' : 'Glucose',
          measuredValue: num,
          unit: unit || 'mg/dL',
          referenceRange: '70 - 99 mg/dL',
          status: num >= 200 || num < 55 ? 'Critical' : num >= 126 ? 'High' : 'Low',
          clinicalNote: num >= 126 ? 'Fasting glucose elevated' : 'Hypoglycemia alert'
        });
      }
    }
    // LDL Cholesterol
    else if (paramLower.includes('ldl')) {
      if (!isNaN(num) && num >= 130) {
        abnormalFindings.push({
          parameter: 'LDL Cholesterol',
          measuredValue: num,
          unit: unit || 'mg/dL',
          referenceRange: '<100 mg/dL',
          status: num >= 160 ? 'Critical' : 'High',
          clinicalNote: 'Atherogenic lipoprotein elevated above optimal threshold'
        });
      }
    }
    // Creatinine
    else if (paramLower.includes('creatinine')) {
      if (!isNaN(num) && num > 1.3) {
        abnormalFindings.push({
          parameter: 'Creatinine',
          measuredValue: num,
          unit: unit || 'mg/dL',
          referenceRange: '0.6 - 1.2 mg/dL',
          status: num > 2.0 ? 'Critical' : 'High',
          clinicalNote: 'Elevated renal filtration marker'
        });
      }
    }
  }

  // 4. Historical comparisons across older reports
  const historicalChanges: CanonicalHealthSummary['historicalChanges'] = [];
  if (measurements.length > 0 && sourceReportId) {
    try {
      const olderMeasRes = await db.execute({
        sql: `SELECT m.parameter, m.normalized_value, r.report_date
              FROM measurements m
              JOIN medical_reports r ON m.report_id = r.id
              WHERE r.user_id = ? AND r.id != ?
              ORDER BY r.report_date DESC LIMIT 50`,
        args: [userId, sourceReportId]
      });

      for (const finding of abnormalFindings) {
        const older = olderMeasRes.rows.find((om: any) =>
          om.parameter.toLowerCase() === finding.parameter.toLowerCase()
        );
        if (older) {
          const oldNum = parseFloat(String(older.normalized_value));
          const newNum = parseFloat(String(finding.measuredValue));
          let direction: 'increased' | 'decreased' | 'stable' = 'stable';
          if (!isNaN(oldNum) && !isNaN(newNum)) {
            if (newNum > oldNum) direction = 'increased';
            else if (newNum < oldNum) direction = 'decreased';
          }
          historicalChanges.push({
            parameter: finding.parameter,
            previousDate: older.report_date,
            previousValue: `${older.normalized_value}`,
            currentValue: `${finding.measuredValue} ${finding.unit}`,
            changeDirection: direction
          });
        }
      }
    } catch (e) {}
  }

  // 5. Recommended Actions based on severity
  const recommendedActions: string[] = [];
  if (severity === 'CRITICAL') {
    recommendedActions.push('Seek immediate medical triage or consult an emergency care physician.');
    recommendedActions.push('Do not disregard critical markers; retain this summary for clinical providers.');
  } else if (severity === 'HIGH') {
    recommendedActions.push('Schedule a prompt consultation with your primary care provider or specialist.');
    recommendedActions.push('Recheck biomarker levels as recommended by your physician within 1–2 weeks.');
  } else {
    recommendedActions.push('Review authorized findings during your next scheduled clinical checkup.');
    recommendedActions.push('Continue monitoring dietary and lifestyle habits documented in MediTrack.');
  }

  const appBaseUrl = envConfig.FRONTEND_URL || 'http://localhost:3000';
  const secureLink = `${appBaseUrl}/family-alerts?alertId=${alertId}`;

  return {
    alertId,
    patientId,
    patientName,
    timestamp: new Date().toISOString(),
    severity,
    title,
    mainReason,
    abnormalFindings,
    historicalChanges,
    documentedRiskFactors: [],
    explanation: 'Automated biomarker extraction and risk stratification based on uploaded laboratory reports and verified parameters.',
    limitations: 'Calculated exclusively from validated OCR and numerical report data; pending full medical provider review.',
    recommendedActions,
    secureLink,
    disclaimer: MEDICAL_DISCLAIMER
  };
}

/**
 * Creates and persists a new qualifying health alert and initiates notification dispatch immediately.
 */
export async function createAndDispatchHealthAlert(
  db: any,
  params: {
    userId: number;
    severity: AlertSeverity;
    title: string;
    mainReason: string;
    source: string;
    sourceReportId?: number;
    eventKey?: string;
  }
): Promise<{ alert: any; dispatchResult: DispatchAlertResult }> {
  const now = new Date().toISOString();
  const eventKey = params.eventKey || `${params.source.toLowerCase()}:${params.sourceReportId || Date.now()}`;

  // 1. Insert alert in health_alerts
  const insertResult = await db.execute({
    sql: `INSERT INTO health_alerts 
          (user_id, type, message, source, status, delivery_channel, event_key, severity, title, trigger_source, source_id, is_read, created_at)
          VALUES (?, ?, ?, ?, 'RECORDED', 'MULTI_CHANNEL', ?, ?, ?, ?, ?, 0, ?)
          RETURNING *`,
    args: [
      params.userId,
      `${params.severity}_ALERT`,
      params.mainReason,
      params.source,
      eventKey,
      params.severity,
      params.title,
      params.source,
      params.sourceReportId || null,
      now
    ]
  });

  const alert = insertResult.rows[0];

  // 2. Build canonical health summary
  const summary = await buildCanonicalSummary(
    db,
    params.userId,
    Number(alert.id),
    params.severity,
    params.title,
    params.mainReason,
    params.sourceReportId
  );

  // Update alert row with serialized summary JSON
  await db.execute({
    sql: `UPDATE health_alerts 
          SET summary_json = ?, abnormal_findings_json = ?, recommendations_json = ?
          WHERE id = ?`,
    args: [
      JSON.stringify(summary),
      JSON.stringify(summary.abnormalFindings),
      JSON.stringify(summary.recommendedActions),
      alert.id
    ]
  });

  // 3. Dispatch notifications immediately
  const dispatchResult = await dispatchHealthAlert(db, Number(alert.id), summary);

  return { alert, dispatchResult };
}

/**
 * Dispatches one consolidated notification per eligible recipient per enabled channel.
 * Enforces strict deduplication via unique idempotency keys.
 */
export async function dispatchHealthAlert(
  db: any,
  alertId: number,
  existingSummary?: CanonicalHealthSummary
): Promise<DispatchAlertResult> {
  // 1. Load Alert
  const alertRes = await db.execute({
    sql: 'SELECT * FROM health_alerts WHERE id = ?',
    args: [alertId]
  });
  if (alertRes.rows.length === 0) {
    throw new Error(`Alert #${alertId} not found`);
  }
  const alert = alertRes.rows[0];
  const userId = Number(alert.user_id);
  const severity: AlertSeverity = (alert.severity as AlertSeverity) || 'MODERATE';

  // 2. Parse or rebuild canonical health summary
  let summary: CanonicalHealthSummary;
  if (existingSummary) {
    summary = existingSummary;
  } else if (alert.summary_json) {
    try {
      summary = JSON.parse(alert.summary_json);
    } catch {
      summary = await buildCanonicalSummary(db, userId, alertId, severity, alert.title || alert.type, alert.message);
    }
  } else {
    summary = await buildCanonicalSummary(db, userId, alertId, severity, alert.title || alert.type, alert.message);
  }

  // 3. Load User Preferences
  const userRes = await db.execute({
    sql: 'SELECT id, email, name, notification_email, notification_sms, notification_telegram, notification_push FROM users WHERE id = ?',
    args: [userId]
  });
  const user = userRes.rows[0] || {};
  const userEmailEnabled = user.notification_email !== 0;
  const userTelegramEnabled = user.notification_telegram !== 0;
  const userPushEnabled = user.notification_push !== 0;

  // 4. Load Active Trusted Contacts
  const contactsRes = await db.execute({
    sql: "SELECT * FROM trusted_contacts WHERE user_id = ? AND status = 'ACTIVE'",
    args: [userId]
  });
  const contacts = contactsRes.rows;

  // 5. Load Active Push Subscriptions for User (Inactive by default)
  const pushSubsRes = await db.execute({
    sql: 'SELECT * FROM push_subscriptions WHERE user_id = ? AND is_active = 1',
    args: [userId]
  });
  const pushSubscriptions = pushSubsRes.rows;

  const now = new Date().toISOString();
  const deliveries: DispatchAlertResult['deliveries'] = [];
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let totalAttempted = 0;

  // --- A. Process Trusted Contacts (Email via Gmail API & Telegram via Telegram Bot API) ---
  for (const contact of contacts) {
    const contactId = Number(contact.id);
    const contactName = contact.name || 'Trusted Contact';
    const emailVal = (contact.email || (contact.contact_method === 'EMAIL' ? contact.contact_value : '') || '').trim().toLowerCase();
    const telegramChatId = (contact.telegram_chat_id || '').trim();

    const contactEmailEligible = contact.email_enabled !== 0 && contact.consent_status !== 'REVOKED';
    const contactTelegramEligible = contact.telegram_enabled !== 0 && contact.consent_status !== 'REVOKED';

    // 1. Gmail Email Channel
    if (userEmailEnabled && contactEmailEligible && emailVal && isValidEmail(emailVal)) {
      totalAttempted++;
      const idempotencyKey = `alert_${alertId}_contact_${contactId}_EMAIL_HEALTH_ALERT`;

      // Check if already dispatched
      const existing = await db.execute({
        sql: 'SELECT id, status FROM notification_deliveries WHERE idempotency_key = ?',
        args: [idempotencyKey]
      });

      if (existing.rows.length > 0 && ['SENT', 'DELIVERED', 'ACCEPTED'].includes(existing.rows[0].status)) {
        skippedCount++;
        deliveries.push({
          id: existing.rows[0].id,
          channel: 'EMAIL',
          destination: emailVal,
          status: 'SKIPPED (Already Dispatched)'
        });
      } else {
        // Record pending outbox entry
        let deliveryId: number;
        if (existing.rows.length === 0) {
          const outboxRes = await db.execute({
            sql: `INSERT INTO notification_deliveries 
                  (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, attempts, created_at, updated_at)
                  VALUES (?, ?, ?, 'CONTACT', ?, 'EMAIL', ?, 'HEALTH_ALERT', ?, 'PENDING', 0, ?, ?)
                  RETURNING id`,
            args: [alertId, userId, contactId, contactName, emailVal, idempotencyKey, now, now]
          });
          deliveryId = outboxRes.rows[0].id;
        } else {
          deliveryId = existing.rows[0].id;
        }

        // Format HTML and plain text email
        const emailSubject = `[MediTrack] ${summary.severity} Health Alert — Patient ${summary.patientId}`;
        const emailHtml = formatEmailHtml(summary);
        const emailText = formatEmailText(summary);

        try {
          const result = await sendEmail({
            to: emailVal,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
          }, userId, db);

          const deliveryStatus = result.success ? result.status : 'FAILED';
          const updateTime = new Date().toISOString();

          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = ?, provider = ?, provider_message_id = ?, attempts = attempts + 1, last_attempt_at = ?, delivered_at = ?, error_message = ?, payload_summary = ?, updated_at = ?
                  WHERE id = ?`,
            args: [
              deliveryStatus,
              result.provider,
              result.providerMessageId || null,
              updateTime,
              result.success ? updateTime : null,
              result.error || null,
              summary.mainReason,
              updateTime,
              deliveryId
            ]
          });

          if (result.success) sentCount++;
          else failedCount++;

          deliveries.push({
            id: deliveryId,
            channel: 'EMAIL',
            destination: emailVal,
            status: deliveryStatus,
            error: result.error
          });
        } catch (err: any) {
          failedCount++;
          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = 'FAILED', attempts = attempts + 1, last_attempt_at = ?, error_message = ?, updated_at = ?
                  WHERE id = ?`,
            args: [new Date().toISOString(), err.message || String(err), new Date().toISOString(), deliveryId]
          });
          deliveries.push({
            id: deliveryId,
            channel: 'EMAIL',
            destination: emailVal,
            status: 'FAILED',
            error: err.message || String(err)
          });
        }
      }
    }

    // 2. Telegram Bot Channel (Official Telegram Bot API - Replaces SMS)
    if (userTelegramEnabled && contactTelegramEligible && telegramChatId) {
      totalAttempted++;
      const idempotencyKey = `alert_${alertId}_contact_${contactId}_TELEGRAM_HEALTH_ALERT`;

      const existing = await db.execute({
        sql: 'SELECT id, status FROM notification_deliveries WHERE idempotency_key = ?',
        args: [idempotencyKey]
      });

      if (existing.rows.length > 0 && ['SENT', 'DELIVERED', 'ACCEPTED'].includes(existing.rows[0].status)) {
        skippedCount++;
        deliveries.push({
          id: existing.rows[0].id,
          channel: 'TELEGRAM',
          destination: `Chat:${telegramChatId}`,
          status: 'SKIPPED (Already Dispatched)'
        });
      } else {
        let deliveryId: number;
        if (existing.rows.length === 0) {
          const outboxRes = await db.execute({
            sql: `INSERT INTO notification_deliveries 
                  (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, attempts, created_at, updated_at)
                  VALUES (?, ?, ?, 'CONTACT', ?, 'TELEGRAM', ?, 'HEALTH_ALERT', ?, 'PENDING', 0, ?, ?)
                  RETURNING id`,
            args: [alertId, userId, contactId, contactName, telegramChatId, idempotencyKey, now, now]
          });
          deliveryId = outboxRes.rows[0].id;
        } else {
          deliveryId = existing.rows[0].id;
        }

        const telegramText = formatTelegram(summary);

        try {
          const result = await sendTelegramMessage(telegramChatId, telegramText);
          const deliveryStatus = result.success ? result.status : 'FAILED';
          const updateTime = new Date().toISOString();

          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = ?, provider = ?, provider_message_id = ?, attempts = attempts + 1, last_attempt_at = ?, delivered_at = ?, error_message = ?, payload_summary = ?, updated_at = ?
                  WHERE id = ?`,
            args: [
              deliveryStatus,
              result.provider,
              result.providerMessageId || null,
              updateTime,
              result.success ? updateTime : null,
              result.error || null,
              summary.mainReason,
              updateTime,
              deliveryId
            ]
          });

          if (result.success) sentCount++;
          else failedCount++;

          deliveries.push({
            id: deliveryId,
            channel: 'TELEGRAM',
            destination: `Chat:${telegramChatId}`,
            status: deliveryStatus,
            error: result.error
          });
        } catch (err: any) {
          failedCount++;
          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = 'FAILED', attempts = attempts + 1, last_attempt_at = ?, error_message = ?, updated_at = ?
                  WHERE id = ?`,
            args: [new Date().toISOString(), err.message || String(err), new Date().toISOString(), deliveryId]
          });
          deliveries.push({
            id: deliveryId,
            channel: 'TELEGRAM',
            destination: `Chat:${telegramChatId}`,
            status: 'FAILED',
            error: err.message || String(err)
          });
        }
      }
    }
  }

  // --- B. Process Browser Push Notifications (Disabled in Gmail-only mode) ---
  if (envConfig.NOTIFICATION_MODE !== 'gmail-only' && userPushEnabled && pushSubscriptions.length > 0) {
    const pushPayload = formatPush(summary);

    for (const sub of pushSubscriptions) {
      totalAttempted++;
      const subId = Number(sub.id);
      const idempotencyKey = `alert_${alertId}_pushsub_${subId}_PUSH_HEALTH_ALERT`;

      const existing = await db.execute({
        sql: 'SELECT id, status FROM notification_deliveries WHERE idempotency_key = ?',
        args: [idempotencyKey]
      });

      if (existing.rows.length > 0 && ['SENT', 'DELIVERED'].includes(existing.rows[0].status)) {
        skippedCount++;
        deliveries.push({
          id: existing.rows[0].id,
          channel: 'PUSH',
          destination: sub.endpoint.substring(0, 30) + '...',
          status: 'SKIPPED (Already Dispatched)'
        });
      } else {
        let deliveryId: number;
        if (existing.rows.length === 0) {
          const outboxRes = await db.execute({
            sql: `INSERT INTO notification_deliveries 
                  (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, attempts, created_at, updated_at)
                  VALUES (?, ?, ?, 'USER', 'Patient Device', 'PUSH', ?, 'HEALTH_ALERT', ?, 'PENDING', 0, ?, ?)
                  RETURNING id`,
            args: [alertId, userId, subId, sub.endpoint, idempotencyKey, now, now]
          });
          deliveryId = outboxRes.rows[0].id;
        } else {
          deliveryId = existing.rows[0].id;
        }

        try {
          const subData: PushSubscriptionData = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          const result = await sendPush({
            subscription: subData,
            title: pushPayload.title,
            body: pushPayload.body,
            data: pushPayload.data
          });

          const deliveryStatus = result.success ? result.status : 'FAILED';
          const updateTime = new Date().toISOString();

          // Deactivate subscription if permanently rejected
          if (result.details?.permanentFailure) {
            await db.execute({
              sql: 'UPDATE push_subscriptions SET is_active = 0, updated_at = ? WHERE id = ?',
              args: [updateTime, subId]
            });
          }

          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = ?, provider = ?, provider_message_id = ?, attempts = attempts + 1, last_attempt_at = ?, delivered_at = ?, error_message = ?, payload_summary = ?, updated_at = ?
                  WHERE id = ?`,
            args: [
              deliveryStatus,
              result.provider,
              result.providerMessageId || null,
              updateTime,
              result.success ? updateTime : null,
              result.error || null,
              pushPayload.body,
              updateTime,
              deliveryId
            ]
          });

          if (result.success) sentCount++;
          else failedCount++;

          deliveries.push({
            id: deliveryId,
            channel: 'PUSH',
            destination: sub.endpoint.substring(0, 30) + '...',
            status: deliveryStatus,
            error: result.error
          });
        } catch (err: any) {
          failedCount++;
          await db.execute({
            sql: `UPDATE notification_deliveries 
                  SET status = 'FAILED', attempts = attempts + 1, last_attempt_at = ?, error_message = ?, updated_at = ?
                  WHERE id = ?`,
            args: [new Date().toISOString(), err.message || String(err), new Date().toISOString(), deliveryId]
          });
          deliveries.push({
            id: deliveryId,
            channel: 'PUSH',
            destination: sub.endpoint.substring(0, 30) + '...',
            status: 'FAILED',
            error: err.message || String(err)
          });
        }
      }
    }
  }

  // Update overall health_alerts status
  const overallStatus = sentCount > 0 ? 'DISPATCHED' : failedCount > 0 ? 'DELIVERY_FAILED' : 'RECORDED';
  await db.execute({
    sql: 'UPDATE health_alerts SET status = ? WHERE id = ?',
    args: [overallStatus, alertId]
  });

  return {
    alertId,
    totalAttempted,
    sentCount,
    failedCount,
    skippedCount,
    deliveries
  };
}

/**
 * Sends a real test notification to verify channel configuration without generating fake medical alerts.
 */
export async function sendTestNotification(
  db: any,
  userId: number,
  params: {
    channel: 'EMAIL' | 'TELEGRAM' | 'SMS' | 'PUSH';
    destination?: string;
    contactId?: number;
  }
): Promise<{
  success: boolean;
  channel: string;
  provider: string;
  providerMessageId?: string;
  status: string;
  message: string;
  details?: any;
}> {
  const channel = params.channel.toUpperCase();
  const now = new Date().toISOString();

  if (channel === 'EMAIL') {
    let targetEmail = params.destination;
    let recipientName = 'User';

    if (params.contactId) {
      const contactRes = await db.execute({
        sql: 'SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?',
        args: [params.contactId, userId]
      });
      if (contactRes.rows.length === 0) throw new Error('Trusted contact not found');
      const c = contactRes.rows[0];
      targetEmail = c.email || (c.contact_method === 'EMAIL' ? c.contact_value : '');
      recipientName = c.name;
    } else if (!targetEmail) {
      const userRes = await db.execute({
        sql: 'SELECT email, name FROM users WHERE id = ?',
        args: [userId]
      });
      targetEmail = userRes.rows[0]?.email;
      recipientName = userRes.rows[0]?.name || 'Patient';
    }

    if (!targetEmail || !isValidEmail(targetEmail)) {
      throw new Error(`Invalid recipient email address: ${targetEmail || 'empty'}`);
    }

    const testSubject = `[MediTrack] Test Email Notification`;
    const testHtml = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #059669; margin-top: 0;">MediTrack Delivery Verification</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Hello ${recipientName},<br><br>
          This is an authorized <strong>test notification</strong> confirming that your MediTrack email alert channel is active, verified, and correctly configured.
        </p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #166534;">
          &#10004; Live email delivery channel operational via official Gmail API.
        </div>
        <p style="font-size: 12px; color: #64748B; margin-bottom: 0;">
          Timestamp: ${new Date().toLocaleString()}<br>
          <em>This is a diagnostic test. No medical alert was generated.</em>
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml,
      text: `MediTrack Test Notification: Your Gmail alert channel is active and configured. Timestamp: ${now}. This is NOT a medical alert.`
    }, userId, db);

    // Record delivery attempt in notification_deliveries for audit history
    const testKey = `test_${userId}_EMAIL_${Date.now()}`;
    try {
      await db.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, provider, provider_message_id, attempts, last_attempt_at, delivered_at, error_message, payload_summary, created_at, updated_at)
              VALUES (NULL, ?, ?, 'TEST', ?, 'EMAIL', ?, 'TEST_NOTIFICATION', ?, ?, ?, ?, 1, ?, ?, ?, 'Diagnostic Test Email', ?, ?)`,
        args: [
          userId,
          params.contactId || null,
          recipientName,
          targetEmail,
          testKey,
          result.status,
          result.provider,
          result.providerMessageId || null,
          now,
          result.success ? now : null,
          result.error || null,
          now,
          now
        ]
      });
    } catch (e) {}

    if (!result.success) {
      throw new Error(result.error || 'Gmail dispatch failed. Please verify your Google account connection in Channel Configuration.');
    }

    return {
      success: true,
      channel: 'EMAIL',
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      status: result.status,
      message: `Test email successfully accepted by Gmail API for ${targetEmail}. Message ID: ${result.providerMessageId || 'N/A'}.`,
      details: result
    };
  }

  if (channel === 'TELEGRAM') {
    let targetChatId = params.destination;
    let recipientName = 'Trusted Contact';

    if (params.contactId) {
      const contactRes = await db.execute({
        sql: 'SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?',
        args: [params.contactId, userId]
      });
      if (contactRes.rows.length === 0) throw new Error('Trusted contact not found');
      const c = contactRes.rows[0];
      targetChatId = c.telegram_chat_id;
      recipientName = c.name;

      if (!targetChatId) {
        const err: any = new Error(
          `Contact "${c.name}" has not linked their Telegram account yet. Click "Connect Telegram" on the contact card to generate a linking link, and have them start the bot in Telegram first.`
        );
        err.code = 'NOT_LINKED';
        err.contactId = c.id;
        err.contactName = c.name;
        throw err;
      }
    } else if (!targetChatId) {
      const userRes = await db.execute({
        sql: 'SELECT telegram_chat_id, name FROM users WHERE id = ?',
        args: [userId]
      });
      targetChatId = userRes.rows[0]?.telegram_chat_id;
      recipientName = userRes.rows[0]?.name || 'Patient';

      if (!targetChatId) {
        const err: any = new Error(
          'No linked Telegram account found for this user. Please connect Telegram or select a linked trusted contact first.'
        );
        err.code = 'NOT_LINKED';
        throw err;
      }
    }

    const testText =
      `🔔 <b>MediTrack Diagnostic Test</b>\n\n` +
      `Hello <b>${recipientName}</b>,\n\n` +
      `This is a verified test message confirming that your <b>Telegram Health Alert</b> channel is active and operational for MediTrack.\n\n` +
      `Timestamp: <code>${new Date().toLocaleString()}</code>\n\n` +
      `<i>This is an authorized diagnostic notification. No medical alert was generated.</i>`;

    const result = await sendTelegramMessage(targetChatId, testText);

    // Record delivery attempt in notification_deliveries for audit history
    const testKey = `test_${userId}_TELEGRAM_${Date.now()}`;
    try {
      await db.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, provider, provider_message_id, attempts, last_attempt_at, delivered_at, error_message, payload_summary, created_at, updated_at)
              VALUES (NULL, ?, ?, 'TEST', ?, 'TELEGRAM', ?, 'TEST_NOTIFICATION', ?, ?, ?, ?, 1, ?, ?, ?, 'Diagnostic Test Telegram Message', ?, ?)`,
        args: [
          userId,
          params.contactId || null,
          recipientName,
          targetChatId,
          testKey,
          result.status,
          result.provider,
          result.providerMessageId || null,
          now,
          result.success ? now : null,
          result.error || null,
          now,
          now
        ]
      });
    } catch (e) {}

    if (!result.success) {
      const err: any = new Error(result.error || 'Telegram dispatch failed');
      if (result.error?.includes('not configured')) {
        err.code = 'NOT_CONFIGURED';
      } else {
        err.code = result.status || 'FAILED';
      }
      err.details = result.details;
      throw err;
    }

    return {
      success: true,
      channel: 'TELEGRAM',
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      status: result.status,
      message: `Test Telegram notification successfully dispatched to ${recipientName} (Chat: ${targetChatId}). Message ID: ${result.providerMessageId || 'N/A'}.`,
      details: result
    };
  }

  if (channel === 'SMS') {
    throw new Error('SMS notifications have been decommissioned and replaced with official Telegram Bot notifications. Please use Telegram.');
  }

  throw new Error(`Unsupported notification channel: ${channel}`);
}
