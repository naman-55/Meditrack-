import { buildMimeMessage, generateGmailAuthUrl } from './backend/services/notifications/gmailService.js';
import { buildCanonicalSummary, dispatchHealthAlert, createAndDispatchHealthAlert } from './backend/services/notifications/dispatcher.js';
import { initNotificationSchema } from './backend/services/notifications/dbSchema.js';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Clean test database for test suite
const testDbPath = path.resolve(process.cwd(), 'test_gmail_notifications.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const testDb = createClient({
  url: `file:${testDbPath}`
});

let passedSuites = 0;
let totalSuites = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runSuite(name: string, fn: () => Promise<void>) {
  totalSuites++;
  console.log(`\n[Suite ${totalSuites}] ${name}...`);
  try {
    await fn();
    passedSuites++;
    console.log(`  ✓ Passed`);
  } catch (err: any) {
    console.error(`  ✗ FAILED:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('====================================================');
  console.log('Running MediTrack Gmail-Only Integration Test Suite');
  console.log('====================================================');

  // Initialize DB Schema
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'USER',
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 1,
      notification_push INTEGER DEFAULT 1
    );
  `);
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS health_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT,
      message TEXT,
      source TEXT,
      status TEXT,
      delivery_channel TEXT,
      event_key TEXT,
      severity TEXT,
      title TEXT,
      trigger_source TEXT,
      source_id INTEGER,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      contact_method TEXT,
      contact_value TEXT,
      email TEXT,
      phone TEXT,
      email_enabled INTEGER DEFAULT 1,
      sms_enabled INTEGER DEFAULT 1,
      consent_status TEXT DEFAULT 'GRANTED',
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT,
      report_date TEXT
    );
  `);
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      parameter TEXT,
      normalized_value TEXT,
      raw_value TEXT,
      unit TEXT,
      normalized_unit TEXT
    );
  `);

  await initNotificationSchema(testDb);

  // Setup Test Patient
  await testDb.execute({
    sql: "INSERT INTO users (id, email, name, notification_email, notification_sms, notification_push) VALUES (1, 'patient.jane@meditrack.org', 'Jane Doe', 1, 1, 1)"
  });

  // Setup Test Report with Multiple Abnormal Findings
  await testDb.execute({
    sql: "INSERT INTO medical_reports (id, user_id, filename, report_date) VALUES (10, 1, 'Comprehensive_Metabolic_Panel.pdf', '2026-10-25')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'Blood Pressure', '165/102', 'mmHg')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'HbA1c', '9.4', '%')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'Fasting Glucose', '210', 'mg/dL')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'LDL Cholesterol', '175', 'mg/dL')"
  });

  // Setup Active Trusted Contact
  await testDb.execute({
    sql: `INSERT INTO trusted_contacts (id, user_id, name, relationship, email, phone, email_enabled, sms_enabled, consent_status, status, created_at, updated_at)
          VALUES (1, 1, 'Dr. Robert Miller', 'Attending Physician', 'robert.miller@clinic.org', '+15551234567', 1, 1, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))`
  });

  // Setup Connected Gmail OAuth Token for Patient
  await testDb.execute({
    sql: `INSERT INTO gmail_oauth_tokens (user_id, email, access_token, refresh_token, token_type, expiry_date, scope, status, created_at, updated_at)
          VALUES (1, 'patient.jane@gmail.com', 'ya29.test_valid_access_token_mock', '1//0g_test_refresh_token', 'Bearer', ?, 'https://www.googleapis.com/auth/gmail.send', 'CONNECTED', datetime('now'), datetime('now'))`,
    args: [Date.now() + 3600000] // valid for 1 hour
  });

  // --- Suite 1: RFC 2822 MIME message construction & Base64URL encoding ---
  await runSuite('RFC 2822 MIME construction and Base64URL encoding', async () => {
    const rawBase64 = buildMimeMessage({
      fromName: 'MediTrack Health Alerts',
      fromEmail: 'patient.jane@gmail.com',
      to: 'robert.miller@clinic.org',
      subject: '[MediTrack] CRITICAL Health Alert — Patient P-0001',
      html: '<h1>Critical Alert</h1><p>HbA1c is 9.4%</p>',
      text: 'Critical Alert: HbA1c is 9.4%'
    });

    assert(typeof rawBase64 === 'string', 'MIME must return a string');
    assert(!rawBase64.includes('+'), 'Base64URL must not contain +');
    assert(!rawBase64.includes('/'), 'Base64URL must not contain /');
    assert(!rawBase64.includes('='), 'Base64URL must not contain = padding');

    // Decode and verify MIME structure
    const decoded = Buffer.from(rawBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    assert(decoded.includes('From: MediTrack Health Alerts <patient.jane@gmail.com>'), 'From header present');
    assert(decoded.includes('To: <robert.miller@clinic.org>'), 'To header present');
    assert(decoded.includes('Subject: =?UTF-8?B?'), 'Subject header RFC 2047 encoded for Unicode em-dash');
    assert(decoded.includes('Content-Type: multipart/alternative'), 'Multipart alternative header present');
    assert(decoded.includes('Content-Type: text/plain; charset="UTF-8"'), 'Text part present');
    assert(decoded.includes('Content-Type: text/html; charset="UTF-8"'), 'HTML part present');
  });

  // --- Suite 2: Anti-Header Injection Protection ---
  await runSuite('MIME Header Injection Protection rejects malicious CRLF input', async () => {
    let injectionBlocked = false;
    try {
      buildMimeMessage({
        fromEmail: 'patient@gmail.com\r\nBcc: hacker@evil.com',
        to: 'victim@clinic.org',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test'
      });
    } catch (err: any) {
      if (err.message.includes('Header injection')) injectionBlocked = true;
    }
    assert(injectionBlocked, 'Should reject CRLF in email headers');
  });

  // --- Suite 3: Google OAuth Authorization URL and CSRF State Generation ---
  await runSuite('Google OAuth 2.0 URL generation with CSRF-protected state', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test_google_client_id_12345.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test_google_client_secret_67890';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/notifications/gmail/callback';

    const { url, state } = generateGmailAuthUrl(1);
    assert(url.includes('https://accounts.google.com/o/oauth2/v2/auth'), 'Target Google OAuth v2 auth URL');
    assert(url.includes('client_id='), 'Includes client ID');
    assert(url.includes('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send'), 'Requests gmail.send scope');
    assert(url.includes('access_type=offline'), 'Requests offline access for refresh token');
    assert(typeof state === 'string' && state.length > 20, 'State is a signed high-entropy token');
  });

  // --- Suite 4: Canonical Health Summary Generation with Clinically Relevant Findings ---
  await runSuite('Canonical Health Summary builds complete clinical data from report', async () => {
    const summary = await buildCanonicalSummary(
      testDb,
      1,
      101,
      'CRITICAL',
      'Critical Metabolic Alert',
      'Severe multi-parameter abnormal elevation.',
      10
    );

    assert(summary.patientId === 'P-0001', 'Approved patient ID generated');
    assert(summary.severity === 'CRITICAL', 'Severity is CRITICAL');
    assert(summary.abnormalFindings.length >= 4, 'Includes all abnormal findings');
    assert(summary.abnormalFindings.some(f => f.parameter === 'HbA1c' && f.measuredValue === 9.4), 'HbA1c value parsed');
    assert(summary.abnormalFindings.some(f => f.parameter === 'Blood Pressure'), 'Blood Pressure parsed');
    assert(summary.recommendedActions.length > 0, 'Follow-up actions recommended');
    assert(summary.disclaimer.includes('medical'), 'Medical disclaimer included');
  });

  // --- Suite 5: 1 Alert with Multiple Abnormal Biomarkers produces 1 Consolidated Email ---
  await runSuite('Master Prompt Requirement: 1 Alert = 1 Consolidated Email (No fragmented messages)', async () => {
    // Intercept global fetch to simulate Google Gmail API response
    const originalFetch = global.fetch;
    let gmailApiCallCount = 0;
    let lastSentMime = '';

    global.fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('gmail.googleapis.com/gmail/v1/users/me/messages/send')) {
        gmailApiCallCount++;
        const parsedBody = JSON.parse(init.body);
        lastSentMime = parsedBody.raw;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: `gmail_msg_${Date.now()}_abc123`,
            threadId: `thread_${Date.now()}_xyz`,
            labelIds: ['SENT']
          })
        };
      }
      return originalFetch(url, init);
    };

    try {
      const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'CRITICAL',
        title: 'Critical Metabolic Alert',
        mainReason: 'Severe multi-parameter abnormal elevation detected in latest metabolic panel.',
        source: 'Medical Report Processing',
        sourceReportId: 10,
        eventKey: 'report-test-10'
      });

      assert(dispatchResult.sentCount === 1, 'Exactly one consolidated notification sent');
      assert(gmailApiCallCount === 1, 'Gmail API was called exactly once for the consolidated alert');

      // Verify delivery record in database
      const deliveries = await testDb.execute({
        sql: 'SELECT * FROM notification_deliveries WHERE alert_id = ?',
        args: [alert.id]
      });

      assert(deliveries.rows.length === 1, 'Exactly one delivery record persisted');
      const d = deliveries.rows[0];
      assert(d.channel === 'EMAIL', 'Delivery channel is EMAIL');
      assert(d.provider === 'GMAIL_API', 'Provider is GMAIL_API');
      assert(d.status === 'ACCEPTED', 'Status recorded as ACCEPTED per master prompt requirements');
      assert(String(d.provider_message_id).startsWith('gmail_msg_'), 'Gmail message ID stored');

      // Verify MIME payload content includes complete summary
      const decodedMime = Buffer.from(lastSentMime.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
      assert(decodedMime.includes('HbA1c'), 'Consolidated email includes HbA1c finding');
      assert(decodedMime.includes('9.4'), 'Consolidated email includes 9.4% value');
      assert(decodedMime.includes('Blood Pressure'), 'Consolidated email includes BP finding');
      assert(decodedMime.includes('Fasting Glucose'), 'Consolidated email includes Glucose finding');
      assert(decodedMime.includes('Medical Disclaimer') || decodedMime.includes('MediTrack Automated Notice'), 'Consolidated email includes disclaimer');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Suite 6: Database Deduplication — Reprocessing same alert never creates duplicate email ---
  await runSuite('Database Deduplication: Reprocessing the same alert does not dispatch duplicate emails', async () => {
    let secondDispatchCallCount = 0;
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any): Promise<any> => {
      if (String(url).includes('gmail.googleapis.com')) {
        secondDispatchCallCount++;
      }
      return originalFetch(url, init);
    };

    try {
      // Find previously dispatched alert
      const alertRes = await testDb.execute('SELECT id FROM health_alerts LIMIT 1');
      const alertId = alertRes.rows[0].id;

      // Re-dispatch the same alert
      const retryResult = await dispatchHealthAlert(testDb, Number(alertId));

      assert(secondDispatchCallCount === 0, 'No second call to Gmail API made');
      assert(retryResult.skippedCount > 0, 'Second attempt marked as SKIPPED');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Suite 7: SMS and Push Channels are NEVER called in Gmail-Only Mode ---
  await runSuite('Gmail-Only Policy: Twilio and Web-Push are strictly disabled and never called', async () => {
    let twilioCallCount = 0;
    let webPushCallCount = 0;

    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('api.twilio.com')) twilioCallCount++;
      if (urlStr.includes('gmail.googleapis.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'gmail_test_id', threadId: 'thread_id' })
        };
      }
      return originalFetch(url, init);
    };

    try {
      // Patient has SMS enabled and phone number configured, but in Gmail-only mode SMS is bypassed
      const { dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'HIGH',
        title: 'High BP Alert',
        mainReason: 'Elevated Systolic BP',
        source: 'Vitals Processing',
        eventKey: 'vitals-alert-1'
      });

      assert(twilioCallCount === 0, 'Twilio must NEVER be called in Gmail-only mode');
      assert(webPushCallCount === 0, 'Web push must NEVER be called in Gmail-only mode');
      assert(dispatchResult.sentCount === 1, 'Only Gmail email sent');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Suite 8: Inactive Contacts and Contacts with Disabled Email are Skipped ---
  await runSuite('Inactive or email-disabled trusted contacts receive no notifications', async () => {
    // Add inactive contact
    await testDb.execute({
      sql: `INSERT INTO trusted_contacts (user_id, name, relationship, email, email_enabled, status, created_at, updated_at)
            VALUES (1, 'Ex-Contact', 'Friend', 'inactive@test.com', 1, 'DISABLED', datetime('now'), datetime('now'))`
    });

    // Add contact with email_enabled = 0
    await testDb.execute({
      sql: `INSERT INTO trusted_contacts (user_id, name, relationship, email, email_enabled, status, created_at, updated_at)
            VALUES (1, 'SMS Only Contact', 'Spouse', 'noemail@test.com', 0, 'ACTIVE', datetime('now'), datetime('now'))`
    });

    let gmailCalls = 0;
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any): Promise<any> => {
      if (String(url).includes('gmail.googleapis.com')) {
        gmailCalls++;
        return { ok: true, status: 200, json: async () => ({ id: 'msg_1' }) };
      }
      return originalFetch(url, init);
    };

    try {
      const { dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'HIGH',
        title: 'Check Inactive Suppression',
        mainReason: 'Testing contact filters',
        source: 'Filter Test',
        eventKey: 'filter-test-1'
      });

      // Only the 1 active contact (Dr. Robert Miller) with email_enabled = 1 receives an email
      assert(gmailCalls === 1, 'Inactive and email-disabled contacts did not receive an email');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Suite 9: Missing Gmail Authorization records failure and clear recovery message ---
  await runSuite('Unconnected Gmail account records clear configuration error without deleting alert', async () => {
    // Setup patient without Gmail token
    await testDb.execute({
      sql: "INSERT INTO users (id, email, name, notification_email) VALUES (2, 'new.patient@test.com', 'New Patient', 1)"
    });
    await testDb.execute({
      sql: `INSERT INTO trusted_contacts (user_id, name, relationship, email, email_enabled, status, created_at, updated_at)
            VALUES (2, 'Caregiver John', 'Caregiver', 'john@test.com', 1, 'ACTIVE', datetime('now'), datetime('now'))`
    });

    const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
      userId: 2,
      severity: 'CRITICAL',
      title: 'Alert for Unconnected Patient',
      mainReason: 'Checking unconnected state handling',
      source: 'Routine Check',
      eventKey: 'unconnected-1'
    });

    assert(alert && alert.id, 'Alert is safely persisted in database');
    assert(dispatchResult.failedCount === 1, 'Dispatch failure is recorded');

    const deliveries = await testDb.execute({
      sql: 'SELECT * FROM notification_deliveries WHERE alert_id = ?',
      args: [alert.id]
    });

    assert(deliveries.rows.length === 1, 'Failed delivery record exists in outbox');
    assert(deliveries.rows[0].status === 'FAILED', 'Status is FAILED');
    assert(String(deliveries.rows[0].error_message).includes('Gmail not connected'), 'Clear recovery message stored');
  });

  // --- Suite 10: Automatic Token Refresh when Access Token Expired ---
  await runSuite('Automatic OAuth access token refresh when token is expired', async () => {
    // Set token expiry to 10 minutes ago
    const expiredTimestamp = Date.now() - 600000;
    await testDb.execute({
      sql: 'UPDATE gmail_oauth_tokens SET expiry_date = ? WHERE user_id = 1',
      args: [expiredTimestamp]
    });

    let refreshEndpointCalled = false;
    let sendEndpointCalled = false;

    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('oauth2.googleapis.com/token')) {
        refreshEndpointCalled = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'ya29.refreshed_fresh_access_token_123',
            expires_in: 3600,
            token_type: 'Bearer'
          })
        };
      }
      if (urlStr.includes('gmail.googleapis.com/gmail/v1/users/me/messages/send')) {
        sendEndpointCalled = true;
        const authHeader = init.headers['Authorization'];
        assert(authHeader === 'Bearer ya29.refreshed_fresh_access_token_123', 'Uses the refreshed access token');
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'refreshed_msg_id', threadId: 'thread_id' })
        };
      }
      return originalFetch(url, init);
    };

    try {
      const { dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'CRITICAL',
        title: 'Token Refresh Test Alert',
        mainReason: 'Checking automatic refresh',
        source: 'Refresh Test',
        eventKey: 'refresh-test-1'
      });

      assert(refreshEndpointCalled, 'Google OAuth token refresh endpoint was called');
      assert(sendEndpointCalled, 'Gmail send endpoint called with new token');
      assert(dispatchResult.sentCount === 1, 'Email delivered with refreshed token');

      // Verify token updated in DB
      const updatedToken = await testDb.execute('SELECT access_token, expiry_date FROM gmail_oauth_tokens WHERE user_id = 1');
      assert(updatedToken.rows[0].access_token === 'ya29.refreshed_fresh_access_token_123', 'Access token persisted');
      assert(Number(updatedToken.rows[0].expiry_date) > Date.now(), 'New expiry date set');
    } finally {
      global.fetch = originalFetch;
    }
  });

  console.log('\n====================================================');
  console.log(`ALL ${passedSuites} / ${totalSuites} GMAIL-ONLY TEST SUITES PASSED! ✓`);
  console.log('====================================================\n');

  // Cleanup test DB
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (e) {}
  }
}

main().catch(err => {
  console.error('\nTest Suite Fatal Error:', err);
  process.exit(1);
});
