import * as assert from 'assert';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { initNotificationSchema } from './backend/services/notifications/dbSchema.js';
import {
  generateTelegramLinkingToken,
  handleTelegramUpdate,
  disconnectTelegramContact,
  verifyTelegramWebhookSecret,
  resolveTelegramIdentity,
  getPatientClinicalContext,
  sanitizeTelegramLog
} from './backend/services/notifications/telegramService.js';
import {
  createAndDispatchHealthAlert
} from './backend/services/notifications/dispatcher.js';

const testDbPath = path.resolve(process.cwd(), 'test_telegram_assistant.db');
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
  console.log('Running MediTrack Intelligent Telegram Assistant Test Suite');
  console.log('====================================================');

  process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
  process.env.TELEGRAM_BOT_USERNAME = 'MediTrackHealthBot';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'secret_webhook_token_xyz_123';
  process.env.NOTIFICATION_MODE = 'gmail-and-telegram';

  // Base Schema Setup
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

  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      time_of_day TEXT
    );
  `);

  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS risk_assessment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      level TEXT NOT NULL,
      label TEXT,
      evidence TEXT,
      data_quality TEXT,
      rule_version TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await testDb.execute(`
    CREATE TABLE IF NOT EXISTS trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      parameter TEXT NOT NULL,
      direction TEXT NOT NULL,
      valid_measurement_count INTEGER,
      start_date TEXT,
      end_date TEXT,
      evidence TEXT,
      data_quality TEXT,
      analysis_version TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await initNotificationSchema(testDb);

  // Seed Patient 1 (Alice)
  await testDb.execute({
    sql: "INSERT INTO users (id, email, name, notification_telegram) VALUES (1, 'alice@meditrack.org', 'Alice Johnson', 1)"
  });

  // Seed Trusted Contact for Patient 1 (Bob, Caregiver)
  await testDb.execute({
    sql: `INSERT INTO trusted_contacts (id, user_id, name, relationship, email, telegram_chat_id, email_enabled, telegram_enabled, consent_status, status, created_at, updated_at)
          VALUES (1, 1, 'Bob Johnson', 'Caregiver', 'bob@care.net', '11223344', 1, 1, 'GRANTED', 'ACTIVE', datetime('now'), datetime('now'))`
  });

  // Seed Medical Reports & Measurements for Alice
  await testDb.execute({
    sql: "INSERT INTO medical_reports (id, user_id, filename, report_date) VALUES (10, 1, 'Metabolic_Panel_Oct2026.pdf', '2026-10-25')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'Blood Pressure', '168/102', 'mmHg')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'HbA1c', '9.2', '%')"
  });
  await testDb.execute({
    sql: "INSERT INTO measurements (report_id, parameter, normalized_value, unit) VALUES (10, 'Fasting Glucose', '185', 'mg/dL')"
  });

  // Seed Alert for Alice
  await testDb.execute({
    sql: `INSERT INTO health_alerts (id, user_id, severity, title, message, source, status, created_at)
          VALUES (100, 1, 'HIGH', 'Elevated Glycemic Marker', 'HbA1c elevated at 9.2%', 'Lab Processing', 'ACTIVE', '2026-10-25T14:30:00Z')`
  });

  // Seed Documented Medication for Alice
  await testDb.execute({
    sql: "INSERT INTO medications (id, user_id, name, dosage, frequency, time_of_day) VALUES (1, 1, 'Metformin', '500 mg', 'Twice daily', 'Morning and Evening')"
  });

  // Mock global fetch for Telegram API sendMessage
  let sentTelegramMessages: Array<{ chatId: string; text: string }> = [];
  const originalFetch = global.fetch;

  (global as any).fetch = async (url: any, init?: any): Promise<any> => {
    const urlStr = String(url);
    if (urlStr.includes('api.telegram.org') && urlStr.includes('/sendMessage')) {
      const body = JSON.parse(init.body);
      sentTelegramMessages.push({ chatId: String(body.chat_id), text: String(body.text) });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 1000 + sentTelegramMessages.length } })
      };
    }
    return originalFetch(url, init);
  };

  try {
    // --- Test 1: Webhook Secret Token Verification ---
    await runTest('Telegram webhook secret token verification enforces header security', async () => {
      assert.strictEqual(verifyTelegramWebhookSecret('secret_webhook_token_xyz_123'), true);
      assert.strictEqual(verifyTelegramWebhookSecret('invalid_secret'), false);
      assert.strictEqual(verifyTelegramWebhookSecret(undefined), false);
    });

    // --- Test 2: Token Sanitization in Logs ---
    await runTest('SanitizeTelegramLog redacts bot tokens from any log or error string', async () => {
      const leaked = 'Error calling https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/sendMessage failed';
      const clean = sanitizeTelegramLog(leaked);
      assert.ok(!clean.includes('123456789:ABCdefGHIjklMNOpqrsTUVwxyz'), 'Token was redacted');
      assert.ok(clean.includes('[REDACTED_BOT_TOKEN]'), 'Replaced with sanitized placeholder');
    });

    // --- Test 3: Identity Resolution for Linked Contact ---
    await runTest('ResolveTelegramIdentity correctly resolves linked trusted contact and patient permissions', async () => {
      const id = await resolveTelegramIdentity('11223344', testDb);
      assert.strictEqual(id.isLinked, true);
      assert.strictEqual(id.type, 'CONTACT');
      assert.strictEqual(id.userId, 1);
      assert.strictEqual(id.contactId, 1);
      assert.strictEqual(id.patientName, 'Alice Johnson');
      assert.strictEqual(id.userName, 'Bob Johnson');
      assert.strictEqual(id.consentGranted, true);
    });

    // --- Test 4: Unlinked Chat Rejection ---
    await runTest('Unlinked chat ID is safely identified as not linked without revealing patient existence', async () => {
      const id = await resolveTelegramIdentity('99999999', testDb);
      assert.strictEqual(id.isLinked, false);

      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 501,
        message: { chat: { id: 99999999 }, text: '/status' }
      }, testDb);

      assert.strictEqual(res.action, 'unauthorized_unlinked');
      assert.ok(sentTelegramMessages[0].text.includes('Account Not Linked'));
    });

    // --- Test 5: Command /status returns factual patient status ---
    await runTest('Command /status returns latest patient health alert and report status', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 502,
        message: { chat: { id: 11223344 }, text: '/status' }
      }, testDb);

      assert.strictEqual(res.action, 'status');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('Alice Johnson'));
      assert.ok(msg.includes('P-0001'));
      assert.ok(msg.includes('HIGH'));
      assert.ok(msg.includes('Metabolic_Panel_Oct2026.pdf'));
    });

    // --- Test 6: Command /alerts lists active alerts ---
    await runTest('Command /alerts lists recent clinical alerts with severity and rationale', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 503,
        message: { chat: { id: 11223344 }, text: '/alerts' }
      }, testDb);

      assert.strictEqual(res.action, 'alerts_listed');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('Elevated Glycemic Marker'));
      assert.ok(msg.includes('HbA1c elevated at 9.2%'));
    });

    // --- Test 7: Command /summary returns latest report and biomarkers ---
    await runTest('Command /summary returns latest laboratory findings accurately', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 504,
        message: { chat: { id: 11223344 }, text: '/summary' }
      }, testDb);

      assert.strictEqual(res.action, 'summary');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('Metabolic_Panel_Oct2026.pdf'));
      assert.ok(msg.includes('Blood Pressure'));
      assert.ok(msg.includes('168/102 mmHg'));
      assert.ok(msg.includes('HbA1c'));
    });

    // --- Test 8: Command /medications returns documented prescriptions ---
    await runTest('Command /medications lists documented medications and dosages', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 505,
        message: { chat: { id: 11223344 }, text: '/medications' }
      }, testDb);

      assert.strictEqual(res.action, 'medications_listed');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('Metformin'));
      assert.ok(msg.includes('500 mg'));
      assert.ok(msg.includes('Twice daily'));
    });

    // --- Test 9: Command /risk evaluates clinical risk domains ---
    await runTest('Command /risk evaluates cardiovascular and metabolic domains using riskEngine', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 506,
        message: { chat: { id: 11223344 }, text: '/risk' }
      }, testDb);

      assert.strictEqual(res.action, 'risk_evaluated');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('CARDIOVASCULAR RISK') || msg.includes('METABOLIC RISK'));
    });

    // --- Test 10: Natural-Language Question Handling ---
    await runTest('Natural-language Q&A answers clinical question using patient records', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 507,
        message: { chat: { id: 11223344 }, text: 'What medications is Alice currently taking?' }
      }, testDb);

      assert.strictEqual(res.action, 'chat_reply_sent');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('Metformin'));
      assert.ok(msg.includes('500 mg'));
    });

    // --- Test 11: Emergency Symptom Detection & Triage Warning ---
    await runTest('Emergency keyword triage prepends urgent medical emergency warning', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 508,
        message: { chat: { id: 11223344 }, text: 'The patient has severe chest pain and cannot breathe' }
      }, testDb);

      assert.strictEqual(res.action, 'chat_reply_sent');
      const msg = sentTelegramMessages[0].text;
      assert.ok(msg.includes('CRITICAL EMERGENCY WARNING'));
      assert.ok(msg.includes('911 / 112'));
    });

    // --- Test 12: Update ID Deduplication ---
    await runTest('Duplicate Telegram update_id is rejected and not reprocessed', async () => {
      sentTelegramMessages = [];
      // First submission
      const first = await handleTelegramUpdate({
        update_id: 777,
        message: { chat: { id: 11223344 }, text: '/help' }
      }, testDb);
      assert.strictEqual(first.action, 'help');
      assert.strictEqual(sentTelegramMessages.length, 1);

      // Replay identical update_id
      const second = await handleTelegramUpdate({
        update_id: 777,
        message: { chat: { id: 11223344 }, text: '/help' }
      }, testDb);
      assert.strictEqual(second.action, 'duplicate_skipped');
      assert.strictEqual(sentTelegramMessages.length, 1, 'No second message dispatched');
    });

    // --- Test 13: Command /stop stops notifications and disconnects ---
    await runTest('Command /stop revokes Telegram connection and disables alerts', async () => {
      sentTelegramMessages = [];
      const res = await handleTelegramUpdate({
        update_id: 509,
        message: { chat: { id: 11223344 }, text: '/stop' }
      }, testDb);

      assert.strictEqual(res.action, 'stop_disconnected');
      assert.ok(sentTelegramMessages.some(m => m.text.includes('Stopped') || m.text.includes('Disconnected')));

      // Check contact chat ID was cleared in database
      const c = await testDb.execute('SELECT telegram_chat_id, telegram_enabled FROM trusted_contacts WHERE id = 1');
      assert.strictEqual(c.rows[0].telegram_chat_id, null);
      assert.strictEqual(c.rows[0].telegram_enabled, 0);
    });

    console.log('\n====================================================');
    console.log(`ALL ${passedTests} / ${totalTests} INTELLIGENT ASSISTANT TESTS PASSED! ✓`);
    console.log('====================================================\n');
  } finally {
    (global as any).fetch = originalFetch;
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  }
}

main().catch(err => {
  console.error('\nFatal Test Failure:', err);
  process.exit(1);
});
