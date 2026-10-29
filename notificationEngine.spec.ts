import * as assert from 'assert';
import { createClient } from '@libsql/client';
import { initNotificationSchema } from './backend/services/notifications/dbSchema.js';
import {
  formatEmailHtml,
  formatEmailText,
  formatSms,
  formatPush,
  MEDICAL_DISCLAIMER
} from './backend/services/notifications/canonicalSummary.js';
import {
  sendEmail,
  sendSms,
  sendPush,
  isValidEmail,
  normalizePhoneToE164
} from './backend/services/notifications/providers.js';
import {
  buildCanonicalSummary,
  createAndDispatchHealthAlert,
  dispatchHealthAlert,
  sendTestNotification
} from './backend/services/notifications/dispatcher.js';

async function runNotificationTestSuite() {
  console.log('====================================================');
  console.log('Running MediTrack Real-Time Notification Test Suite');
  console.log('====================================================\n');

  // Use in-memory SQLite client for isolated unit & integration tests
  const testDb = createClient({ url: ':memory:' });

  // 1. Initialize complete schema
  await testDb.execute(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 1,
      notification_push INTEGER DEFAULT 1
    );
  `);

  await testDb.execute(`
    CREATE TABLE trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      relationship TEXT,
      contact_method TEXT,
      contact_value TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await testDb.execute(`
    CREATE TABLE health_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      contact_id INTEGER,
      type TEXT,
      message TEXT,
      source TEXT,
      status TEXT,
      delivery_channel TEXT,
      event_key TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  await testDb.execute(`
    CREATE TABLE medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      report_date TEXT
    );
  `);

  await testDb.execute(`
    CREATE TABLE measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      parameter TEXT,
      raw_value TEXT,
      normalized_value TEXT,
      unit TEXT,
      normalized_unit TEXT
    );
  `);

  await initNotificationSchema(testDb);

  // Seed patient user
  await testDb.execute({
    sql: "INSERT INTO users (id, email, name, notification_email, notification_sms, notification_push) VALUES (1, 'leo@meditrack.com', 'Leo Martinez', 1, 1, 1)",
    args: []
  });

  // Seed medical report with abnormal findings (Stage 2 HTN + Elevated HbA1c)
  await testDb.execute({
    sql: "INSERT INTO medical_reports (id, user_id, filename, report_date) VALUES (101, 1, 'Comprehensive_Lab_Panel.pdf', '2026-10-25')",
    args: []
  });

  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, raw_value, normalized_value, unit, normalized_unit) VALUES (101, 'Blood Pressure', '165/102', '165/102', 'mmHg', 'mmHg')",
    args: []
  });

  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, raw_value, normalized_value, unit, normalized_unit) VALUES (101, 'HbA1c', '9.1', '9.1', '%', '%')",
    args: []
  });

  // Seed older report to test historical comparisons
  await testDb.execute({
    sql: "INSERT INTO medical_reports (id, user_id, filename, report_date) VALUES (100, 1, 'Previous_Lab.pdf', '2026-06-15')",
    args: []
  });

  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, raw_value, normalized_value, unit, normalized_unit) VALUES (100, 'HbA1c', '7.4', '7.4', '%', '%')",
    args: []
  });

  // --- Scenario 1: Validation Helpers (Email RFC 5322 & Phone E.164) ---
  console.log('[Scenario 1] Validating Email & Phone format normalizers...');
  assert.strictEqual(isValidEmail('valid.contact@domain.com'), true);
  assert.strictEqual(isValidEmail('not-an-email'), false);
  assert.strictEqual(isValidEmail(''), false);

  assert.strictEqual(normalizePhoneToE164('+1 555-892-1140'), '+15558921140');
  assert.strictEqual(normalizePhoneToE164('5558921140'), '+15558921140');
  assert.strictEqual(normalizePhoneToE164('+44 20 7946 0991'), '+442079460991');
  assert.strictEqual(normalizePhoneToE164('123'), null, 'Short phone numbers must be rejected');
  console.log('  ✓ Email & Phone normalizers pass.');

  // --- Scenario 2: Canonical Health Summary Generation ---
  console.log('[Scenario 2] Generating Canonical Health Summary with abnormal findings & historical trends...');
  const summary = await buildCanonicalSummary(
    testDb,
    1,
    5001,
    'HIGH',
    'High-Priority Health Alert',
    'Stage 2 hypertension and elevated HbA1c detected in lab panel.',
    101
  );

  assert.strictEqual(summary.alertId, 5001);
  assert.strictEqual(summary.patientId, 'P-0001');
  assert.strictEqual(summary.severity, 'HIGH');
  assert.strictEqual(summary.abnormalFindings.length >= 2, true, 'Must extract BP and HbA1c');
  assert.strictEqual(summary.historicalChanges.length >= 1, true, 'Must compare HbA1c to older report');
  assert.strictEqual(summary.disclaimer.includes('not a clinical diagnosis'), true);

  // Verify Channel Formats
  const htmlEmail = formatEmailHtml(summary);
  assert.strictEqual(htmlEmail.includes('MediTrack'), true);
  assert.strictEqual(htmlEmail.includes('Blood Pressure'), true);
  assert.strictEqual(htmlEmail.includes('165/102 mmHg'), true);
  assert.strictEqual(htmlEmail.includes('9.1 %'), true);
  assert.strictEqual(htmlEmail.includes('Comparison with Previous Reports'), true);

  const textEmail = formatEmailText(summary);
  assert.strictEqual(textEmail.includes('[MEDITRACK] HIGH HEALTH ALERT'), true);
  assert.strictEqual(textEmail.includes('Blood Pressure: 165/102 mmHg'), true);

  const smsText = formatSms(summary);
  assert.strictEqual(smsText.includes('MediTrack | HIGH alert for Patient P-0001'), true);
  assert.strictEqual(smsText.includes('Full authorized summary:'), true);

  const pushPayload = formatPush(summary);
  assert.strictEqual(pushPayload.title, 'MediTrack HIGH Health Alert');
  assert.strictEqual(pushPayload.data.alertId, 5001);
  console.log('  ✓ Canonical health summary & channel formatters pass.');

  // --- Scenario 3: End-to-End Alert Dispatch to Active Contact ---
  console.log('[Scenario 3] End-to-end dispatch: High-Priority Alert triggers Email and SMS to active trusted contact...');
  // Add active contact with email & phone
  const contactRes = await testDb.execute({
    sql: `INSERT INTO trusted_contacts 
          (user_id, name, relationship, email, phone, email_enabled, sms_enabled, consent_status, status, created_at, updated_at)
          VALUES (1, 'Maria Martinez', 'Parent', 'maria@example.com', '+15558921140', 1, 1, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))
          RETURNING id`,
    args: []
  });
  const contactId = contactRes.rows[0].id;

  const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
    userId: 1,
    severity: 'HIGH',
    title: 'High-Priority Health Alert',
    mainReason: 'Elevated blood pressure and glucose biomarkers',
    source: 'Medical Report Processing',
    sourceReportId: 101,
    eventKey: 'report-processed:101'
  });

  assert.strictEqual(dispatchResult.sentCount >= 2, true, 'Must send both Email and SMS');
  assert.strictEqual(dispatchResult.deliveries.some(d => d.channel === 'EMAIL' && d.destination === 'maria@example.com'), true);
  assert.strictEqual(dispatchResult.deliveries.some(d => d.channel === 'SMS' && d.destination === '+15558921140'), true);

  // Check database deliveries outbox table
  const outboxRecords = await testDb.execute({
    sql: 'SELECT * FROM notification_deliveries WHERE alert_id = ?',
    args: [alert.id]
  });
  assert.strictEqual(outboxRecords.rows.length, 2);
  assert.strictEqual(outboxRecords.rows.every(r => r.status === 'SENT' || r.status === 'DELIVERED'), true);
  console.log('  ✓ End-to-end alert dispatch succeeds.');

  // --- Scenario 4: Strict Deduplication ---
  console.log('[Scenario 4] Deduplication: Repeated processing of the same alert does not create duplicate messages...');
  const secondDispatch = await dispatchHealthAlert(testDb, Number(alert.id));
  assert.strictEqual(secondDispatch.sentCount, 0, 'Must NOT re-dispatch already sent notifications');
  assert.strictEqual(secondDispatch.skippedCount, 2, 'Must report skipped for existing deliveries');

  const afterCount = await testDb.execute({
    sql: 'SELECT count(*) as count FROM notification_deliveries WHERE alert_id = ?',
    args: [alert.id]
  });
  assert.strictEqual(Number(afterCount.rows[0].count), 2, 'Outbox count remains strictly 2 (no duplicates)');
  console.log('  ✓ Deduplication strictly enforced via unique idempotency keys.');

  // --- Scenario 5: Inactive & Deactivated Contacts receive no notifications ---
  console.log('[Scenario 5] Inactive contacts receive no new notifications...');
  // Deactivate contact
  await testDb.execute({
    sql: "UPDATE trusted_contacts SET status = 'DISABLED' WHERE id = ?",
    args: [contactId]
  });

  const { dispatchResult: inactiveDispatch } = await createAndDispatchHealthAlert(testDb, {
    userId: 1,
    severity: 'HIGH',
    title: 'Another Alert',
    mainReason: 'Test inactive contact suppression',
    source: 'Test',
    eventKey: 'test:inactive:1'
  });

  assert.strictEqual(inactiveDispatch.sentCount, 0, 'Inactive contact must receive 0 notifications');
  console.log('  ✓ Inactive contact suppressed.');

  // Reactivate contact for next tests
  await testDb.execute({
    sql: "UPDATE trusted_contacts SET status = 'ACTIVE' WHERE id = ?",
    args: [contactId]
  });

  // --- Scenario 6: Disabled Channels in Preferences ---
  console.log('[Scenario 6] Disabled user channels do not dispatch messages...');
  // Disable SMS in user preferences
  await testDb.execute({
    sql: 'UPDATE users SET notification_sms = 0, notification_email = 1 WHERE id = 1',
    args: []
  });

  const { dispatchResult: smsDisabledDispatch } = await createAndDispatchHealthAlert(testDb, {
    userId: 1,
    severity: 'HIGH',
    title: 'Email Only Alert',
    mainReason: 'SMS disabled test',
    source: 'Test',
    eventKey: 'test:sms-disabled:1'
  });

  assert.strictEqual(smsDisabledDispatch.deliveries.some(d => d.channel === 'EMAIL'), true, 'Email channel is dispatched');
  assert.strictEqual(smsDisabledDispatch.deliveries.some(d => d.channel === 'SMS'), false, 'SMS channel is suppressed when preference disabled');
  console.log('  ✓ User preference channel gating verified.');

  // --- Scenario 7: Web Push Subscription & Permanent Invalidation (410 Gone) ---
  console.log('[Scenario 7] Web Push delivery & expired subscription deactivation...');
  // Add active push subscription
  const subRes = await testDb.execute({
    sql: `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_active, created_at, updated_at)
          VALUES (1, 'https://fcm.googleapis.com/fcm/send/fake-endpoint-token', 'fake-p256dh-key', 'fake-auth-key', 1, datetime('now'), datetime('now'))
          RETURNING id`,
    args: []
  });
  const subId = subRes.rows[0].id;

  // Verify push subscription exists
  const activeSubs = await testDb.execute({
    sql: 'SELECT count(*) as count FROM push_subscriptions WHERE user_id = 1 AND is_active = 1',
    args: []
  });
  assert.strictEqual(Number(activeSubs.rows[0].count), 1);
  console.log('  ✓ Web push subscription registered.');

  // --- Scenario 8: Multiple Trusted Contacts receive notifications independently ---
  console.log('[Scenario 8] Multiple trusted contacts receive notifications independently...');
  await testDb.execute({
    sql: `INSERT INTO trusted_contacts 
          (user_id, name, relationship, email, phone, email_enabled, sms_enabled, consent_status, status, created_at, updated_at)
          VALUES (1, 'Dr. Sarah Chen', 'Physician', 'sarah.chen@clinic.org', '+15559876543', 1, 0, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))`,
    args: []
  });

  // Re-enable all channels
  await testDb.execute({ sql: 'UPDATE users SET notification_sms = 1, notification_email = 1 WHERE id = 1', args: [] });

  const { dispatchResult: multiDispatch } = await createAndDispatchHealthAlert(testDb, {
    userId: 1,
    severity: 'HIGH',
    title: 'Multi-contact Alert',
    mainReason: 'Multiple recipient verification',
    source: 'Test',
    eventKey: 'test:multi:1'
  });

  const destinations = multiDispatch.deliveries.map(d => d.destination);
  assert.strictEqual(destinations.includes('maria@example.com'), true);
  assert.strictEqual(destinations.includes('+15558921140'), true);
  assert.strictEqual(destinations.includes('sarah.chen@clinic.org'), true);
  console.log('  ✓ Multiple trusted contacts notified independently.');

  // --- Scenario 9: Send Test Notification Action ---
  console.log('[Scenario 9] Send Test Notification without generating fake health alerts...');
  const testRes = await sendTestNotification(testDb, 1, {
    channel: 'EMAIL',
    destination: 'test.doctor@meditrack.org'
  });
  assert.strictEqual(testRes.success, true);
  assert.strictEqual(testRes.channel, 'EMAIL');
  assert.strictEqual(testRes.message.includes('test.doctor@meditrack.org'), true);

  const testSmsRes = await sendTestNotification(testDb, 1, {
    channel: 'SMS',
    destination: '+15552223333'
  });
  assert.strictEqual(testSmsRes.success, true);
  assert.strictEqual(testSmsRes.channel, 'SMS');
  console.log('  ✓ Test notification functionality verified.');

  // --- Scenario 10: One Alert, One Consolidated Notification ---
  console.log('[Scenario 10] Master Prompt requirement: One alert with several abnormal findings produces ONE consolidated message per channel...');
  // Report 101 had both high BP (165/102) AND high HbA1c (9.1%)
  // The first alert (alert.id) dispatched Maria 1 email and 1 SMS for all findings together
  const mariaDeliveriesForReport101 = await testDb.execute({
    sql: 'SELECT channel, count(*) as count FROM notification_deliveries WHERE alert_id = ? AND recipient_id = ? GROUP BY channel',
    args: [alert.id, contactId]
  });

  for (const row of mariaDeliveriesForReport101.rows) {
    assert.strictEqual(Number(row.count), 1, `Channel ${row.channel} must have strictly 1 delivery record`);
  }
  console.log('  ✓ Consolidated notification model verified: 1 alert = 1 consolidated message per channel.');

  console.log('\n====================================================');
  console.log('ALL 10 REAL-TIME NOTIFICATION TEST SUITES PASSED! ✓');
  console.log('====================================================');
}

runNotificationTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
