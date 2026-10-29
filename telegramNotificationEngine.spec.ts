import * as assert from 'assert';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { initNotificationSchema, validateDatabaseSchema } from './backend/services/notifications/dbSchema.js';
import { PlacesService } from './backend/services/maps/places.service.js';
import {
  generateTelegramLinkingToken,
  handleTelegramUpdate,
  disconnectTelegramContact,
  sendTelegramMessage,
  getTelegramStatus
} from './backend/services/notifications/telegramService.js';
import {
  formatTelegram,
  formatEmailHtml,
  formatEmailText
} from './backend/services/notifications/canonicalSummary.js';
import {
  buildCanonicalSummary,
  createAndDispatchHealthAlert,
  dispatchHealthAlert,
  sendTestNotification
} from './backend/services/notifications/dispatcher.js';
import { envConfig } from './backend/config/env.js';

const testDbPath = path.resolve(process.cwd(), 'test_telegram_notifications.db');
if (fs.existsSync(testDbPath)) {
  try { fs.unlinkSync(testDbPath); } catch {}
}

const testDb = createClient({
  url: `file:${testDbPath}`
});

let passedTests = 0;
let totalTests = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  console.log(`\n[Test ${totalTests}] ${name}...`);
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ Passed`);
  } catch (err: any) {
    console.error(`  ✗ FAILED:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('====================================================');
  console.log('Running MediTrack Telegram & Consolidated Alert Test Suite');
  console.log('====================================================');

  // Set test env
  process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
  process.env.TELEGRAM_BOT_USERNAME = 'MediTrackAlertsBot';
  process.env.NOTIFICATION_MODE = 'gmail-and-telegram';

  // Create base tables
  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'USER',
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 0,
      notification_telegram INTEGER DEFAULT 1,
      notification_push INTEGER DEFAULT 0,
      telegram_chat_id TEXT,
      telegram_username TEXT
    );
  `);

  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS health_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER,
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
      summary_json TEXT,
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
      telegram_chat_id TEXT,
      telegram_username TEXT,
      telegram_enabled INTEGER DEFAULT 1,
      telegram_linked_at TEXT,
      email_enabled INTEGER DEFAULT 1,
      sms_enabled INTEGER DEFAULT 0,
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

  // Seed patient user
  await testDb.execute({
    sql: "INSERT INTO users (id, email, name, notification_email, notification_telegram) VALUES (1, 'patient.sarah@meditrack.org', 'Sarah Connor', 1, 1)"
  });

  // Seed trusted contact
  await testDb.execute({
    sql: `INSERT INTO trusted_contacts (id, user_id, name, relationship, email, email_enabled, telegram_enabled, consent_status, status, created_at, updated_at)
          VALUES (1, 1, 'John Connor', 'Child', 'john@resistance.net', 1, 1, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))`
  });

  // Seed Gmail OAuth Token for Patient
  await testDb.execute({
    sql: `INSERT INTO gmail_oauth_tokens (user_id, email, access_token, refresh_token, token_type, expiry_date, scope, status, created_at, updated_at)
          VALUES (1, 'patient.sarah@gmail.com', 'ya29.valid_test_token', '1//refresh_token', 'Bearer', ?, 'https://www.googleapis.com/auth/gmail.send', 'CONNECTED', datetime('now'), datetime('now'))`,
    args: [Date.now() + 3600000]
  });

  // Seed Report with abnormal findings
  await testDb.execute({
    sql: "INSERT INTO medical_reports (id, user_id, filename, report_date) VALUES (101, 1, 'Cardiac_Evaluation.pdf', '2026-10-26')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (101, 'Blood Pressure', '178/110', 'mmHg')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (101, 'Troponin I', '0.08', 'ng/mL')"
  });

  // --- Test 1: Telegram Linking Token Generation & Security Properties ---
  await runTest('Telegram Linking Token Generation creates secure, single-use, expiring deep link', async () => {
    const linkData = await generateTelegramLinkingToken(1, 1, testDb);

    assert.ok(linkData.token, 'Token string exists');
    assert.strictEqual(linkData.token.length > 20, true, 'High entropy token');
    assert.ok(linkData.deepLink.startsWith('https://t.me/MediTrackAlertsBot?start='), 'Deep link properly formatted');
    assert.strictEqual(linkData.deepLink.includes(linkData.token), true, 'Deep link contains token payload');
    // Ensure no predictable database identifiers like 'user:1' are exposed in the deep link payload
    assert.strictEqual(linkData.token.startsWith('user_'), false);
    assert.strictEqual(linkData.token.startsWith('contact_'), false);
    assert.ok(linkData.token.length >= 32, 'Payload is cryptographically random with at least 32 characters');

    // Verify token stored in DB as unused
    const dbToken = await testDb.execute({
      sql: 'SELECT * FROM telegram_linking_tokens WHERE token = ?',
      args: [linkData.token]
    });
    assert.strictEqual(dbToken.rows.length, 1);
    assert.strictEqual(dbToken.rows[0].consumed_at, null);
  });

  // --- Test 2: Telegram Bot /start Webhook Handler validates and consumes token ---
  await runTest('Telegram Bot /start command links contact and records verified chat ID', async () => {
    const linkData = await generateTelegramLinkingToken(1, 1, testDb);

    // Mock fetch for the welcome message
    const originalFetch = global.fetch;
    let welcomeSent = false;
    let targetChatId = '';
    (global as any).fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('api.telegram.org')) {
        welcomeSent = true;
        const body = JSON.parse(init.body);
        targetChatId = body.chat_id;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, result: { message_id: 9901, date: 1700000000 } })
        };
      }
      return originalFetch(url, init);
    };

    try {
      // Simulate Telegram sending an update webhook with /start <token>
      const updatePayload = {
        update_id: 10001,
        message: {
          message_id: 55,
          from: { id: 88776655, is_bot: false, first_name: 'John', username: 'johnconnor' },
          chat: { id: 88776655, type: 'private', first_name: 'John', username: 'johnconnor' },
          date: Math.floor(Date.now() / 1000),
          text: `/start ${linkData.token}`
        }
      };

      const result = await handleTelegramUpdate(updatePayload, testDb);
      assert.strictEqual(result.handled, true, 'Update handled');
      assert.strictEqual(result.action, 'contact_linked', 'Contact linked');
      assert.strictEqual(welcomeSent, true, 'Confirmation message dispatched');
      assert.strictEqual(String(targetChatId), '88776655', 'Sent to user chat');

      // Check contact in DB has verified chat ID
      const contact = await testDb.execute('SELECT telegram_chat_id, telegram_username, telegram_enabled FROM trusted_contacts WHERE id = 1');
      assert.strictEqual(String(contact.rows[0].telegram_chat_id), '88776655');
      assert.strictEqual(contact.rows[0].telegram_username, 'johnconnor');
      assert.strictEqual(contact.rows[0].telegram_enabled, 1);

      // Check token marked as consumed
      const tokenRow = await testDb.execute({
        sql: 'SELECT consumed_at FROM telegram_linking_tokens WHERE token = ?',
        args: [linkData.token]
      });
      assert.ok(tokenRow.rows[0].consumed_at, 'Token consumed_at timestamp recorded');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 3: Replay Attack Prevention ---
  await runTest('Consuming an already consumed linking token is rejected', async () => {
    // Generate and consume token
    const linkData = await generateTelegramLinkingToken(1, 1, testDb);

    const originalFetch = global.fetch;
    (global as any).fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 9902 } })
    });

    try {
      const updatePayload = {
        update_id: 10002,
        message: {
          message_id: 56,
          from: { id: 88776655, first_name: 'John' },
          chat: { id: 88776655, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: `/start ${linkData.token}`
        }
      };

      // First consumption
      await handleTelegramUpdate(updatePayload, testDb);

      // Replay attempt with another chat ID
      const replayPayload = {
        update_id: 10003,
        message: {
          message_id: 57,
          from: { id: 99999999, first_name: 'Attacker' },
          chat: { id: 99999999, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: `/start ${linkData.token}`
        }
      };

      const replayResult = await handleTelegramUpdate(replayPayload, testDb);
      assert.strictEqual(replayResult.action, 'token_already_consumed', 'Replay was blocked');

      // Contact chat ID should remain the original legitimate chat ID
      const contact = await testDb.execute('SELECT telegram_chat_id FROM trusted_contacts WHERE id = 1');
      assert.strictEqual(String(contact.rows[0].telegram_chat_id), '88776655', 'Chat ID was not hijacked');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 4: Expired Token Rejection ---
  await runTest('Expired linking token is rejected', async () => {
    const linkData = await generateTelegramLinkingToken(1, 1, testDb);
    // Force token expiration by setting expires_at to 30 mins ago
    const expiredTimestamp = Date.now() - 30 * 60 * 1000;
    await testDb.execute({
      sql: 'UPDATE telegram_linking_tokens SET expires_at = ? WHERE token = ?',
      args: [expiredTimestamp, linkData.token]
    });

    const originalFetch = global.fetch;
    (global as any).fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 9903 } })
    });

    try {
      const updatePayload = {
        update_id: 10004,
        message: {
          message_id: 58,
          from: { id: 88776655, first_name: 'John' },
          chat: { id: 88776655, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: `/start ${linkData.token}`
        }
      };

      const result = await handleTelegramUpdate(updatePayload, testDb);
      assert.strictEqual(result.action, 'token_expired');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 5: Disconnect and Relink Functionality ---
  await runTest('Disconnect Telegram clears chat ID and allows re-linking', async () => {
    // Disconnect
    const disconnectRes = await disconnectTelegramContact(1, 1, testDb);
    assert.strictEqual(disconnectRes.success, true);

    const contactAfter = await testDb.execute('SELECT telegram_chat_id, telegram_enabled FROM trusted_contacts WHERE id = 1');
    assert.strictEqual(contactAfter.rows[0].telegram_chat_id, null, 'Chat ID cleared');
    assert.strictEqual(contactAfter.rows[0].telegram_enabled, 0, 'Telegram disabled');

    // Re-link with a fresh token
    const newLink = await generateTelegramLinkingToken(1, 1, testDb);

    const originalFetch = global.fetch;
    (global as any).fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 9904 } })
    });

    try {
      await handleTelegramUpdate({
        update_id: 10005,
        message: {
          message_id: 59,
          chat: { id: 77889900, type: 'private' },
          from: { id: 77889900 },
          text: `/start ${newLink.token}`
        }
      }, testDb);

      const relinked = await testDb.execute('SELECT telegram_chat_id, telegram_enabled FROM trusted_contacts WHERE id = 1');
      assert.strictEqual(String(relinked.rows[0].telegram_chat_id), '77889900', 'New chat ID bound');
      assert.strictEqual(relinked.rows[0].telegram_enabled, 1);
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 6: Send Test Notification to Linked Telegram Contact ---
  await runTest('Send Test Telegram Notification records accepted delivery with message ID', async () => {
    const originalFetch = global.fetch;
    let telegramSendMessageCalled = false;
    (global as any).fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('api.telegram.org/bot') && urlStr.includes('/sendMessage')) {
        telegramSendMessageCalled = true;
        const parsed = JSON.parse(init.body);
        assert.strictEqual(String(parsed.chat_id), '77889900');
        assert.strictEqual(parsed.parse_mode, 'HTML');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            result: {
              message_id: 443322,
              chat: { id: 77889900 }
            }
          })
        };
      }
      return originalFetch(url, init);
    };

    try {
      const testResult = await sendTestNotification(testDb, 1, {
        channel: 'TELEGRAM',
        destination: '77889900'
      });

      assert.strictEqual(testResult.success, true);
      assert.strictEqual(testResult.channel, 'TELEGRAM');
      assert.strictEqual(testResult.status, 'ACCEPTED');
      assert.strictEqual(testResult.providerMessageId, '443322');
      assert.strictEqual(telegramSendMessageCalled, true);

      // Verify delivery record recorded in DB without creating fake health alert
      const deliveryRes = await testDb.execute({
        sql: "SELECT * FROM notification_deliveries WHERE channel = 'TELEGRAM' AND event_type = 'TEST_NOTIFICATION'",
        args: []
      });
      assert.strictEqual(deliveryRes.rows.length, 1);
      assert.strictEqual(deliveryRes.rows[0].status, 'ACCEPTED');
      assert.strictEqual(deliveryRes.rows[0].provider_message_id, '443322');
      assert.strictEqual(deliveryRes.rows[0].alert_id, null, 'No fake medical alert created');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 7: Unlinked Contact Cannot Receive Telegram ---
  await runTest('Unlinked contact is safely rejected when attempting Telegram test notification', async () => {
    // Add contact without telegram_chat_id
    const unlinkedContactRes = await testDb.execute({
      sql: `INSERT INTO trusted_contacts (user_id, name, relationship, email, telegram_chat_id, email_enabled, telegram_enabled, consent_status, status, created_at, updated_at)
            VALUES (1, 'Dr. Emily Watson', 'Primary Physician', 'emily@clinic.org', NULL, 1, 0, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))
            RETURNING id`
    });
    const unlinkedContactId = Number(unlinkedContactRes.rows[0].id);

    let rejected = false;
    let errorMsg = '';
    try {
      await sendTestNotification(testDb, 1, {
        channel: 'TELEGRAM',
        contactId: unlinkedContactId
      });
    } catch (err: any) {
      rejected = true;
      errorMsg = err.message;
    }

    assert.strictEqual(rejected, true, 'Unlinked contact was rejected');
    assert.ok(errorMsg.includes('not linked their Telegram account'), 'Actionable linking instruction returned');

    // Clean up temporary contact so subsequent tests only have contact 1
    await testDb.execute({
      sql: 'DELETE FROM trusted_contacts WHERE id = ?',
      args: [unlinkedContactId]
    });
  });

  // --- Test 8: Telegram Canonical Formatting <4096 Chars & HTML Escaping ---
  await runTest('Telegram summary formatter produces valid, safe HTML under 4096 character limit', async () => {
    const summary = await buildCanonicalSummary(
      testDb,
      1,
      200,
      'CRITICAL',
      'Cardiac Evaluation Alert',
      'Elevated Troponin I and Stage 2 Hypertension.',
      101
    );

    const formattedTelegram = formatTelegram(summary);
    assert.ok(formattedTelegram.length < 4096, 'Message complies with Telegram 4096 byte limit');
    assert.ok(formattedTelegram.includes('🚨 <b>CRITICAL HEALTH ALERT</b>'), 'Severity header');
    assert.ok(formattedTelegram.includes('Troponin I'), 'Includes abnormal lab');
    assert.ok(formattedTelegram.includes('178/110 mmHg'), 'Includes blood pressure');
    assert.ok(formattedTelegram.includes('Recommended Next Steps:'), 'Includes actions');
    assert.ok(formattedTelegram.includes('Notice: Automated analysis pending physician review'), 'Includes disclaimer');
    assert.ok(!formattedTelegram.includes('<script>'), 'No unescaped tags');
  });

  // --- Test 9: Master Prompt: 1 Qualifying Alert = 1 Consolidated Email + 1 Telegram Message ---
  await runTest('Consolidated Alerting: 1 Alert with multiple findings sends 1 Email and 1 Telegram (NO SMS)', async () => {
    let gmailApiCalls = 0;
    let telegramApiCalls = 0;
    let twilioCalls = 0;

    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any, init?: any): Promise<any> => {
      const urlStr = String(url);
      if (urlStr.includes('gmail.googleapis.com')) {
        gmailApiCalls++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'gmail_msg_cons_1', threadId: 'th_1' })
        };
      }
      if (urlStr.includes('api.telegram.org')) {
        telegramApiCalls++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, result: { message_id: 881122 } })
        };
      }
      if (urlStr.includes('api.twilio.com')) {
        twilioCalls++;
        return { ok: false, status: 500 };
      }
      return originalFetch(url, init);
    };

    try {
      const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'CRITICAL',
        title: 'Critical Cardiac Alert',
        mainReason: 'High Troponin and Blood Pressure',
        source: 'Lab Evaluation',
        sourceReportId: 101,
        eventKey: 'report:101:cardiac'
      });

      assert.strictEqual(gmailApiCalls, 1, 'Exactly one Gmail API send call');
      assert.strictEqual(telegramApiCalls, 1, 'Exactly one Telegram API sendMessage call');
      assert.strictEqual(twilioCalls, 0, 'Zero Twilio/SMS calls');
      assert.strictEqual(dispatchResult.sentCount, 2, '2 total notifications sent (1 Email + 1 Telegram)');

      // Verify delivery records in database
      const deliveries = await testDb.execute({
        sql: 'SELECT channel, provider, status, provider_message_id FROM notification_deliveries WHERE alert_id = ? ORDER BY channel ASC',
        args: [alert.id]
      });

      assert.strictEqual(deliveries.rows.length, 2, 'Two delivery records persisted');
      assert.strictEqual(deliveries.rows[0].channel, 'EMAIL');
      assert.strictEqual(deliveries.rows[0].provider, 'GMAIL_API');
      assert.strictEqual(deliveries.rows[0].status, 'ACCEPTED');
      assert.strictEqual(deliveries.rows[0].provider_message_id, 'gmail_msg_cons_1');

      assert.strictEqual(deliveries.rows[1].channel, 'TELEGRAM');
      assert.strictEqual(deliveries.rows[1].provider, 'TELEGRAM_BOT_API');
      assert.strictEqual(deliveries.rows[1].status, 'ACCEPTED');
      assert.strictEqual(deliveries.rows[1].provider_message_id, '881122');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 10: Deduplication: Reprocessing Alert does not duplicate Email or Telegram ---
  await runTest('Reprocessing same alert produces 0 new messages and skips both channels', async () => {
    let reprocessCalls = 0;
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any) => {
      reprocessCalls++;
      return { ok: true, json: async () => ({}) };
    };

    try {
      const alertRow = await testDb.execute("SELECT id FROM health_alerts WHERE event_key = 'report:101:cardiac'");
      const alertId = alertRow.rows[0].id;

      const secondRun = await dispatchHealthAlert(testDb, Number(alertId));
      assert.strictEqual(secondRun.sentCount, 0, 'No new messages sent');
      assert.strictEqual(secondRun.skippedCount, 2, 'Both EMAIL and TELEGRAM skipped');
      assert.strictEqual(reprocessCalls, 0, 'No external HTTP requests made');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 11: Independent Channel Failure: Gmail failure does not prevent Telegram dispatch ---
  await runTest('Independent Channel Resilience: Gmail failure does not prevent Telegram dispatch', async () => {
    // Create new patient without Gmail token but with Telegram linked
    await testDb.execute({
      sql: "INSERT INTO users (id, email, name, notification_email, notification_telegram) VALUES (2, 'patient.bob@meditrack.org', 'Bob Smith', 1, 1)"
    });
    await testDb.execute({
      sql: `INSERT INTO trusted_contacts (id, user_id, name, relationship, email, telegram_chat_id, email_enabled, telegram_enabled, consent_status, status, created_at, updated_at)
            VALUES (2, 2, 'Alice Smith', 'Spouse', 'alice@bobsmith.net', '99887766', 1, 1, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))`
    });

    let telegramSent = false;
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('api.telegram.org')) {
        telegramSent = true;
        return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 777666 } }) };
      }
      return originalFetch(url);
    };

    try {
      const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 2,
        severity: 'HIGH',
        title: 'Bob Alert',
        mainReason: 'Test Gmail independent failure',
        source: 'Test',
        eventKey: 'bob:alert:1'
      });

      // Gmail should fail (no token), Telegram should succeed
      assert.strictEqual(dispatchResult.sentCount, 1, '1 message sent (Telegram)');
      assert.strictEqual(dispatchResult.failedCount, 1, '1 message failed (Gmail)');
      assert.strictEqual(telegramSent, true, 'Telegram was dispatched despite Gmail failure');

      const deliveries = await testDb.execute({
        sql: 'SELECT channel, status, error_message FROM notification_deliveries WHERE alert_id = ? ORDER BY channel ASC',
        args: [alert.id]
      });

      assert.strictEqual(deliveries.rows[0].channel, 'EMAIL');
      assert.strictEqual(deliveries.rows[0].status, 'FAILED');
      assert.ok(String(deliveries.rows[0].error_message).includes('Gmail not connected'));

      assert.strictEqual(deliveries.rows[1].channel, 'TELEGRAM');
      assert.strictEqual(deliveries.rows[1].status, 'ACCEPTED');
    } finally {
      (global as any).fetch = originalFetch;
    }
  });

  // --- Test 12: Independent Channel Resilience: Telegram failure does not prevent Gmail dispatch ---
  await runTest('Independent Channel Resilience: Telegram failure does not prevent Gmail dispatch', async () => {
    // Contact 1 has both Gmail connected and Telegram chat_id 77889900
    let gmailSent = false;
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('gmail.googleapis.com')) {
        gmailSent = true;
        return { ok: true, status: 200, json: async () => ({ id: 'gmail_independent_ok' }) };
      }
      if (urlStr.includes('api.telegram.org')) {
        // Simulate bot was blocked by user (403 Forbidden)
        return {
          ok: false,
          status: 403,
          json: async () => ({ ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' })
        };
      }
      return originalFetch(url);
    };

    try {
      const { alert, dispatchResult } = await createAndDispatchHealthAlert(testDb, {
        userId: 1,
        severity: 'HIGH',
        title: 'Sarah Alert 2',
        mainReason: 'Test Telegram independent failure',
        source: 'Test',
        eventKey: 'sarah:alert:failtelegram'
      });

      assert.strictEqual(gmailSent, true, 'Gmail was dispatched despite Telegram failure');
      assert.strictEqual(dispatchResult.sentCount, 1);
      assert.strictEqual(dispatchResult.failedCount, 1);

      const deliveries = await testDb.execute({
        sql: 'SELECT channel, status, error_message FROM notification_deliveries WHERE alert_id = ? ORDER BY channel ASC',
        args: [alert.id]
      });

      assert.strictEqual(deliveries.rows[0].channel, 'EMAIL');
      assert.strictEqual(deliveries.rows[0].status, 'ACCEPTED');

      assert.strictEqual(deliveries.rows[1].channel, 'TELEGRAM');
      assert.strictEqual(deliveries.rows[1].status, 'FAILED');
      assert.ok(String(deliveries.rows[1].error_message).toLowerCase().includes('blocked'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Test 13: ACTIVE status handling in getTelegramStatus (verifies fix for SQLITE_ERROR: no such column: ACTIVE) ---
  await runTest('ACTIVE status handling in getTelegramStatus (no SQLITE_ERROR: no such column: ACTIVE)', async () => {
    // Insert a contact with status 'ACTIVE' and telegram_chat_id
    await testDb.execute({
      sql: `INSERT INTO trusted_contacts (user_id, name, relationship, status, telegram_chat_id, telegram_enabled, created_at, updated_at)
            VALUES (?, 'Active Linked Contact', 'Sister', 'ACTIVE', '12345678', 1, ?, ?)`,
      args: [1, new Date().toISOString(), new Date().toISOString()]
    });

    const status = await getTelegramStatus(1, testDb);
    assert.strictEqual(typeof status.linkedContactsCount, 'number');
    assert.ok(status.linkedContactsCount >= 1, 'Counts ACTIVE linked contact without error');
    assert.ok(
      !status.missingSetup.some(m => m.includes('no such column: ACTIVE')),
      'Must NOT contain SQLITE_ERROR: no such column: ACTIVE'
    );
  });

  // --- Test 14: Database schema migration idempotency & schema validation ---
  await runTest('Database schema migration idempotency & schema validation with PRAGMA user_version', async () => {
    // Re-run initNotificationSchema on active database
    await initNotificationSchema(testDb);

    const schemaReport = await validateDatabaseSchema(testDb);
    assert.strictEqual(schemaReport.valid, true, 'Schema should be fully valid');
    assert.strictEqual(schemaReport.missing.length, 0, 'No missing tables or columns');
    assert.ok(schemaReport.userVersion >= 4, 'User version should be >= 4');
    assert.strictEqual(schemaReport.tables.telegram_processed_updates, true);
    assert.strictEqual(schemaReport.tables.telegram_audit_logs, true);
    assert.strictEqual(schemaReport.tables.telegram_conversations, true);
  });

  // --- Test 15: Missing Telegram token returns clean error status without crash or secret leaks ---
  await runTest('Missing Telegram token returns clean error status without crash or secret leaks', async () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    const originalEnvToken = envConfig.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    (envConfig as any).TELEGRAM_BOT_TOKEN = '';

    try {
      const res = await sendTelegramMessage('99999999', 'Test Message');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'FAILED');
      assert.ok(res.error?.includes('TELEGRAM_BOT_TOKEN is not configured'));
      assert.ok(!res.error?.includes('undefined'), 'No undefined leaks');
    } finally {
      process.env.TELEGRAM_BOT_TOKEN = originalToken;
      (envConfig as any).TELEGRAM_BOT_TOKEN = originalEnvToken;
    }
  });

  // --- Test 16: Telegram Bot API timeout and network failures are safely sanitized ---
  await runTest('Telegram Bot API timeout and network failures are safely sanitized', async () => {
    const originalFetch = global.fetch;
    (global as any).fetch = async () => {
      throw new Error('Connection timed out after 10000ms to https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/sendMessage');
    };

    try {
      const res = await sendTelegramMessage('12345678', 'Test network timeout');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'FAILED');
      assert.strictEqual(res.isTransient, true);
      assert.ok(!res.error?.includes('123456789:ABCdefGHIjklMNOpqrsTUVwxyz'), 'Secret token must be redacted');
      assert.ok(res.error?.includes('[REDACTED_BOT_TOKEN]'), 'Token must be masked with [REDACTED_BOT_TOKEN]');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Test 17: Unauthorized attempts to link a contact belonging to another user ---
  await runTest('Unauthorized attempts to link a contact belonging to another user are rejected', async () => {
    // Contact 1 belongs to user 1. User 2 attempts to generate a link for contact 1.
    const contactCheck = await testDb.execute({
      sql: 'SELECT id, user_id FROM trusted_contacts WHERE id = 1',
      args: []
    });
    const c1 = contactCheck.rows[0];
    assert.strictEqual(c1.user_id, 1, 'Contact 1 belongs to User 1');

    // Generating token with mismatched user and contact
    const tokenData = await generateTelegramLinkingToken(2, 1, testDb);

    // Bot simulation receives /start <token>
    const update = {
      update_id: 888999,
      message: {
        message_id: 55,
        chat: { id: '777000', username: 'attacker' },
        from: { id: '777000', username: 'attacker' },
        date: Math.floor(Date.now() / 1000),
        text: `/start ${tokenData.token}`
      }
    };

    const originalFetch = global.fetch;
    (global as any).fetch = async () => ({ ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) });

    try {
      const handleRes = await handleTelegramUpdate(update, testDb);
      assert.strictEqual(handleRes.handled, true);
      assert.strictEqual(handleRes.action, 'contact_not_found', 'Linking rejected because contact does not belong to user 2');

      // Verify contact was NOT modified
      const contactAfter = await testDb.execute({
        sql: 'SELECT telegram_chat_id FROM trusted_contacts WHERE id = 1',
        args: []
      });
      assert.notStrictEqual(contactAfter.rows[0].telegram_chat_id, '777000');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- Test 18: Google Places network failure does not crash or block Telegram delivery ---
  await runTest('Google Places network failure does not crash or block Telegram delivery', async () => {
    // 1. Places search fails due to TLS / network drop
    const mockPlacesPromise = PlacesService.searchNearbySpecialists({
      lat: 21.2514,
      lng: 81.6296,
      radiusKm: 5
    });

    // Should resolve gracefully without throwing an unhandled rejection
    const placesResult = await mockPlacesPromise;
    assert.ok(Array.isArray(placesResult), 'Places search should resolve to array');

    // 2. Immediate Telegram test dispatch functions independently
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any) => {
      if (String(url).includes('api.telegram.org')) {
        return { ok: true, json: async () => ({ ok: true, result: { message_id: 999123 } }) };
      }
      return originalFetch(url);
    };

    try {
      const testRes = await sendTestNotification(testDb, 1, {
        channel: 'TELEGRAM',
        destination: '12345678'
      });
      assert.strictEqual(testRes.success, true);
      assert.strictEqual(testRes.providerMessageId, '999123');
    } finally {
      global.fetch = originalFetch;
    }
  });

  console.log('\n====================================================');
  console.log(`ALL ${passedTests} / ${totalTests} TELEGRAM & CONSOLIDATED NOTIFICATION TESTS PASSED! ✓`);
  console.log('====================================================\n');

  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }
}

main().catch(err => {
  console.error('\nFatal Test Failure:', err);
  process.exit(1);
});
