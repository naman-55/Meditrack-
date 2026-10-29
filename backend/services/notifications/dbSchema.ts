/**
 * MediTrack Safe, Versioned, Idempotent Database Schema & Migrations
 * Supports SQLite / LibSQL with PRAGMA table_info introspection and PRAGMA user_version.
 * Preserves all existing data (patients, contacts, alerts, tokens, reports).
 */

async function getTableColumns(db: any, tableName: string): Promise<Set<string>> {
  try {
    const res = await db.execute(`PRAGMA table_info(${tableName})`);
    return new Set(res.rows.map((r: any) => String(r.name).toLowerCase()));
  } catch {
    return new Set();
  }
}

async function getExistingTables(db: any): Promise<Set<string>> {
  try {
    const res = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
    return new Set(res.rows.map((r: any) => String(r.name).toLowerCase()));
  } catch {
    return new Set();
  }
}

async function ensureColumn(
  db: any,
  tableName: string,
  columnName: string,
  definition: string,
  existingColumns: Set<string>
): Promise<boolean> {
  if (existingColumns.has(columnName.toLowerCase())) {
    return false;
  }
  try {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    existingColumns.add(columnName.toLowerCase());
    return true;
  } catch (err: any) {
    if (!err?.message?.includes('duplicate column name')) {
      console.warn(`[Migration] Notice adding column ${tableName}.${columnName}:`, err.message);
    }
    return false;
  }
}

export async function initNotificationSchema(db: any): Promise<void> {
  const SCHEMA_TARGET_VERSION = 4;

  // 1. Core Tables Creation (Idempotent)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      email TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT DEFAULT 'Bearer',
      expiry_date INTEGER,
      scope TEXT,
      status TEXT NOT NULL DEFAULT 'CONNECTED',
      last_used_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER,
      user_id INTEGER NOT NULL,
      recipient_id INTEGER,
      recipient_type TEXT NOT NULL,
      recipient_name TEXT,
      channel TEXT NOT NULL,
      destination TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'HEALTH_ALERT',
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      provider TEXT,
      provider_message_id TEXT,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_retry_at TEXT,
      last_attempt_at TEXT,
      delivered_at TEXT,
      error_message TEXT,
      payload_summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(alert_id) REFERENCES health_alerts(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS telegram_linking_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      contact_id INTEGER,
      type TEXT NOT NULL DEFAULT 'CONTACT',
      expires_at INTEGER NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS telegram_processed_updates (
      update_id INTEGER PRIMARY KEY,
      processed_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS telegram_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      user_id INTEGER,
      contact_id INTEGER,
      command TEXT,
      query_preview TEXT,
      status TEXT NOT NULL,
      response_type TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS telegram_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 2. Health Alerts Schema Extensions (Introspect PRAGMA table_info)
  const alertCols = await getTableColumns(db, 'health_alerts');
  await ensureColumn(db, 'health_alerts', 'severity', "TEXT DEFAULT 'MODERATE'", alertCols);
  await ensureColumn(db, 'health_alerts', 'title', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'summary_json', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'abnormal_findings_json', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'recommendations_json', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'trigger_source', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'source_id', 'INTEGER', alertCols);
  await ensureColumn(db, 'health_alerts', 'acknowledged_at', 'TEXT', alertCols);
  await ensureColumn(db, 'health_alerts', 'acknowledged_by', 'TEXT', alertCols);

  // 3. Trusted Contacts Schema Extensions (Introspect PRAGMA table_info)
  const contactCols = await getTableColumns(db, 'trusted_contacts');
  await ensureColumn(db, 'trusted_contacts', 'email', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'phone', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'email_enabled', 'INTEGER DEFAULT 1', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'sms_enabled', 'INTEGER DEFAULT 0', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'telegram_chat_id', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'telegram_username', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'telegram_enabled', 'INTEGER DEFAULT 1', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'telegram_linked_at', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'consent_status', "TEXT DEFAULT 'GRANTED'", contactCols);
  await ensureColumn(db, 'trusted_contacts', 'consent_date', 'TEXT', contactCols);
  await ensureColumn(db, 'trusted_contacts', 'verified_at', 'TEXT', contactCols);

  // 4. Users Schema Extensions (Introspect PRAGMA table_info)
  const userCols = await getTableColumns(db, 'users');
  await ensureColumn(db, 'users', 'notification_telegram', 'INTEGER DEFAULT 1', userCols);
  await ensureColumn(db, 'users', 'telegram_chat_id', 'TEXT', userCols);
  await ensureColumn(db, 'users', 'telegram_username', 'TEXT', userCols);

  // 5. Populate email/phone from contact_method / contact_value for existing records if null
  try {
    await db.execute(`
      UPDATE trusted_contacts 
      SET email = contact_value, email_enabled = 1
      WHERE (contact_method = 'EMAIL' OR contact_method = 'email') AND (email IS NULL OR email = '')
    `);
    await db.execute(`
      UPDATE trusted_contacts 
      SET phone = contact_value, sms_enabled = 0
      WHERE (contact_method = 'SMS' OR contact_method = 'PHONE') AND (phone IS NULL OR phone = '')
    `);
  } catch {}

  // 6. Performance and Integrity Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_notif_deliveries_alert ON notification_deliveries(alert_id)',
    'CREATE INDEX IF NOT EXISTS idx_notif_deliveries_user ON notification_deliveries(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_deliveries_idempotency ON notification_deliveries(idempotency_key)',
    'CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_push_sub_endpoint ON push_subscriptions(endpoint)',
    'CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user ON gmail_oauth_tokens(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_linking_token ON telegram_linking_tokens(token)',
    'CREATE INDEX IF NOT EXISTS idx_tg_linking_user ON telegram_linking_tokens(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_contacts_tg_chat ON trusted_contacts(telegram_chat_id)',
    'CREATE INDEX IF NOT EXISTS idx_tg_audit_chat ON telegram_audit_logs(chat_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_tg_conv_chat ON telegram_conversations(chat_id, created_at)'
  ];

  for (const idx of indexes) {
    try {
      await db.execute(idx);
    } catch {}
  }

  // 7. Update user_version pragma
  try {
    const verRes = await db.execute('PRAGMA user_version');
    const curVer = Number(verRes.rows[0]?.user_version || 0);
    if (curVer < SCHEMA_TARGET_VERSION) {
      await db.execute(`PRAGMA user_version = ${SCHEMA_TARGET_VERSION}`);
    }
  } catch {}
}

/**
 * Validates the database schema at runtime and returns diagnostic information.
 */
export async function validateDatabaseSchema(db: any): Promise<{
  valid: boolean;
  userVersion: number;
  tables: Record<string, boolean>;
  missing: string[];
}> {
  const requiredTables = [
    'users',
    'trusted_contacts',
    'health_alerts',
    'notification_deliveries',
    'gmail_oauth_tokens',
    'telegram_linking_tokens',
    'telegram_processed_updates',
    'telegram_audit_logs',
    'telegram_conversations'
  ];

  const existingTables = await getExistingTables(db);
  const tablesReport: Record<string, boolean> = {};
  const missing: string[] = [];

  for (const t of requiredTables) {
    const exists = existingTables.has(t.toLowerCase());
    tablesReport[t] = exists;
    if (!exists) missing.push(`Missing table: ${t}`);
  }

  // Check required columns on critical tables
  const contactCols = await getTableColumns(db, 'trusted_contacts');
  const requiredContactCols = ['telegram_chat_id', 'telegram_username', 'telegram_enabled', 'status', 'email'];
  for (const col of requiredContactCols) {
    if (!contactCols.has(col.toLowerCase())) {
      missing.push(`Missing column trusted_contacts.${col}`);
    }
  }

  const userCols = await getTableColumns(db, 'users');
  const requiredUserCols = ['notification_telegram', 'telegram_chat_id'];
  for (const col of requiredUserCols) {
    if (!userCols.has(col.toLowerCase())) {
      missing.push(`Missing column users.${col}`);
    }
  }

  let userVersion = 0;
  try {
    const vRes = await db.execute('PRAGMA user_version');
    userVersion = Number(vRes.rows[0]?.user_version || 0);
  } catch {}

  return {
    valid: missing.length === 0,
    userVersion,
    tables: tablesReport,
    missing
  };
}
