import dotenv from 'dotenv';
dotenv.config({ quiet: true, override: true });
import http from 'http';
import { validateMeasurement } from './validationEngine.js';
import { detectContradictions } from './contradictionEngine.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { evaluateRiskAllDomains, MeasurementRecord } from './riskEngine.js';
import { SimpleLinearForecastModel, ForecastInputData, RobustForecastingEngine, ValidatedObservation, ExcludedObservation } from './forecastService.js';
import { normalizeParameterName, getParameterDisplayName } from './src/analytics/parameters.js';
import { convertToCanonicalUnit, CANONICAL_PARAMETERS } from './src/analytics/unitRegistry.js';
import { specialistsRouter } from './backend/routes/specialists.routes.js';
import { authenticateToken, requireRole, JWT_SECRET } from './backend/middleware/auth.middleware.js';
import { authRateLimiter, uploadRateLimiter, aiRateLimiter, chatRateLimiter, generalRateLimiter } from './backend/middleware/rateLimit.middleware.js';
import { securityHeadersMiddleware, apiErrorHandler } from './backend/middleware/security.middleware.js';
import { validateUploadedFile } from './backend/validators/fileUpload.validator.js';
import { runSoftwareValidationSuite } from './backend/services/validationRunner.service.js';
import { envConfig, getEnvironmentDiagnostics } from './backend/config/env.js';
import { authService, generateAccessToken } from './backend/services/auth.service.js';
import { db } from './backend/db/db.js';
import { aiService, GeminiAIError } from './backend/services/ai.service.js';
import { generateSpecialtyGuidance, calculateHealthSnapshot } from './backend/services/specialtyGuidance.service.js';
import { notificationsRouter } from './backend/routes/notifications.routes.js';
import { initNotificationSchema, validateDatabaseSchema } from './backend/services/notifications/dbSchema.js';
import { createAndDispatchHealthAlert } from './backend/services/notifications/dispatcher.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Headers (Phase 2)
app.use(securityHeadersMiddleware);

// Strict CORS (Phase 2)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('run.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
}));

// General API Rate Limiting (Phase 2)
app.use('/api', generalRateLimiter);

// System & Health Endpoints
app.get('/api/health', (req: any, res: any) => {
  res.json({
    status: 'HEALTHY',
    version: '3.1.0',
    timestamp: new Date().toISOString(),
    env: getEnvironmentDiagnostics(),
    ai: aiService.getHealth()
  });
});

app.get('/api/ai/health', (req: any, res: any) => {
  res.json(aiService.getHealth());
});

// --- LIGHTWEIGHT APP CACHE (PHASE 14 & 20) ---
function clearCache(key: string) {
  if (appCache[key]) {
    appCache[key].data = null;
    appCache[key].timestamp = 0;
  }
}

const appCache: Record<string, { data: any; timestamp: number }> = {
  facilities: { data: null, timestamp: 0 },
  specialtyRules: { data: null, timestamp: 0 }
};
const CACHE_TTL_MS = 60 * 1000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware: JSON parsing & cookie parser for HttpOnly refresh tokens
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/api/specialists', specialistsRouter);
app.use('/api/notifications', notificationsRouter);

// Initialize DB schema
async function initDb() {
  const resolvedDbPath = path.resolve(process.cwd(), 'meditrack_new.db');
  console.log(`[Database] Initializing database at: ${resolvedDbPath}`);
  try {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      hashed_password TEXT,
      name TEXT,
      phone TEXT,
      date_of_birth TEXT,
      role TEXT DEFAULT 'USER',
      status TEXT DEFAULT 'ACTIVE',
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 0,
      notification_push INTEGER DEFAULT 1,
      notification_health_reminders INTEGER DEFAULT 0,
      notification_lab_report_alerts INTEGER DEFAULT 0,
      notification_frequency TEXT DEFAULT 'instant'
    )
  `);
  
  try { await db.execute('ALTER TABLE users ADD COLUMN phone TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN date_of_birth TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN notification_email INTEGER DEFAULT 1'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN notification_sms INTEGER DEFAULT 0'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN notification_push INTEGER DEFAULT 1'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN notification_health_reminders INTEGER DEFAULT 0'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN notification_lab_report_alerts INTEGER DEFAULT 0'); } catch(e) {}
  try { await db.execute("ALTER TABLE users ADD COLUMN notification_frequency TEXT DEFAULT 'instant'"); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN gender TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN blood_group TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN height_cm REAL'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN weight_kg REAL'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN emergency_contact_name TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN emergency_contact_relationship TEXT'); } catch(e) {}
  try { await db.execute('ALTER TABLE users ADD COLUMN emergency_contact_phone TEXT'); } catch(e) {}

  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      frequency TEXT,
      time_of_day TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER,
      date TEXT,
      completed INTEGER,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      dosage TEXT,
      frequency TEXT,
      time_of_day TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER,
      date TEXT,
      taken INTEGER,
      FOREIGN KEY(medication_id) REFERENCES medications(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      report_type TEXT,
      report_date TEXT,
      upload_date TEXT,
      processing_status TEXT,
      file_path TEXT,
      file_hash TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      parameter TEXT,
      raw_value TEXT,
      normalized_value TEXT,
      unit TEXT,
      normalized_unit TEXT,
      source_page TEXT,
      source_text TEXT,
      extraction_confidence TEXT,
      validation_status TEXT,
      FOREIGN KEY(report_id) REFERENCES medical_reports(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contradictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      report_a INTEGER,
      report_b INTEGER,
      value_a TEXT,
      value_b TEXT,
      date_a TEXT,
      date_b TEXT,
      severity TEXT,
      reason TEXT,
      source_page_a TEXT,
      source_page_b TEXT,
      status TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      direction TEXT,
      valid_measurement_count INTEGER,
      start_date TEXT,
      end_date TEXT,
      evidence TEXT,
      data_quality TEXT,
      analysis_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS risk_assessment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      domain TEXT,
      level TEXT,
      label TEXT,
      evidence TEXT,
      data_quality TEXT,
      rule_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS future_outlook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      forecast_direction TEXT,
      forecast_range TEXT,
      confidence_category TEXT,
      limitations TEXT,
      model_version TEXT,
      input_data_version TEXT,
      data_quality TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS specialty_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT,
      specialty TEXT,
      rule_reference TEXT,
      version TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS specialty_guidance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      domain TEXT,
      suggested_specialty TEXT,
      evidence TEXT,
      rule_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Seed default specialty rules
  const rulesCheck = await db.execute('SELECT count(*) as count FROM specialty_rules');
  if (rulesCheck.rows[0].count === 0) {
    const now = new Date().toISOString();
    await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['cardiovascular', 'Internal Medicine / Cardiology', 'AHA/ACC Guidelines', '1.0', 1, now]
    });
    await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['metabolic', 'Internal Medicine / Endocrinology', 'ADA Standards of Care', '1.0', 1, now]
    });
    await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['kidney-related', 'Internal Medicine / Nephrology', 'KDIGO Guidelines', '1.0', 1, now]
    });
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS healthcare_facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      specialties TEXT,
      address TEXT,
      city TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      verification_status TEXT,
      last_verified TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);


  await db.execute(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      relationship TEXT,
      contact_method TEXT,
      contact_value TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS health_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      contact_id INTEGER,
      type TEXT,
      message TEXT,
      source TEXT,
      status TEXT,
      delivery_channel TEXT,
      event_key TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(contact_id) REFERENCES trusted_contacts(id)
    )
  `);


  await db.execute(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT,
      event_type TEXT,
      message TEXT,
      user_id INTEGER,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      request_ip TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      last_used_at TEXT,
      user_agent TEXT,
      ip_address TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS medical_analysis_cache (
      user_id INTEGER PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

    try { await db.execute('ALTER TABLE health_alerts ADD COLUMN is_read INTEGER DEFAULT 0'); } catch(e) {}
    try { await db.execute('ALTER TABLE health_alerts ADD COLUMN read_at TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE trusted_contacts ADD COLUMN updated_at TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE health_alerts ADD COLUMN delivery_channel TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE health_alerts ADD COLUMN event_key TEXT'); } catch(e) {}
    try {
      await db.execute(`UPDATE health_alerts SET status = 'RECORDED', delivery_channel = 'IN_APP'
                        WHERE status = 'DELIVERED' AND (delivery_channel IS NULL OR delivery_channel = '')`);
    } catch(e) {}

    // Future Outlook Schema Extensions (Phase 6)
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN status TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN display_name TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN canonical_unit TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN observation_count INTEGER'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN distinct_dates_count INTEGER'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN history_duration_days INTEGER'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN last_observed_value REAL'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN last_observed_date TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN forecast_target_date TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN forecast_value REAL'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN prediction_interval_json TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN backtest_metrics_json TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN reason_code TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN reason_message TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN excluded_count INTEGER DEFAULT 0'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN history_json TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE future_outlook ADD COLUMN run_id TEXT'); } catch(e) {}

    // Phase 18: Performance & Integrity Database Indexes
    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_hash ON password_reset_tokens(token_hash)',
      'CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_hash ON auth_sessions(refresh_token_hash)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_reports_user ON medical_reports(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_reports_hash ON medical_reports(file_hash)',
      'CREATE INDEX IF NOT EXISTS idx_reports_date ON medical_reports(report_date)',
      'CREATE INDEX IF NOT EXISTS idx_meas_report ON measurements(report_id)',
      'CREATE INDEX IF NOT EXISTS idx_contradictions_user ON contradictions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_trends_user ON trends(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_assessment(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_outlook_user ON future_outlook(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_specialty_guidance_user ON specialty_guidance(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_user ON health_alerts(user_id)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_event_user_key ON health_alerts(user_id, event_key)',
      'CREATE INDEX IF NOT EXISTS idx_meds_user ON medications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_cache_user ON medical_analysis_cache(user_id)'
    ];

    for (const stmt of indexStatements) {
      try { await db.execute(stmt); } catch(e) {}
    }

    // Initialize notification outbox, delivery tracking, and push subscription schema
    try {
      await initNotificationSchema(db);
      const schemaCheck = await validateDatabaseSchema(db);
      if (!schemaCheck.valid) {
        console.error('[Schema Warning] Missing database components:', schemaCheck.missing);
      } else {
        console.log(`[Schema Verified] Database schema v${schemaCheck.userVersion} verified successfully.`);
      }
    } catch(e) {
      console.warn('Notification schema migration notice:', e);
    }

    // Seed default demo facilities for local testing if table is empty (Phase 16)
    const facilitiesCheck = await db.execute('SELECT count(*) as count FROM healthcare_facilities');
    if (facilitiesCheck.rows[0].count === 0 && process.env.NODE_ENV !== 'production') {
      const now = new Date().toISOString();
      const demoFacilities = [
        { name: 'Raipur Heart Center (Demo)', specialties: 'Cardiology', address: '123 Main St', city: 'Raipur', lat: 21.2514, lng: 81.6296, phone: '555-0101' },
        { name: 'Endocrine Care Clinic (Demo)', specialties: 'Endocrinology', address: '456 Oak Rd', city: 'Raipur', lat: 21.2614, lng: 81.6396, phone: '555-0102' },
        { name: 'City Hospital (Demo)', specialties: 'Cardiology, Nephrology', address: '789 Pine Ave', city: 'Raipur', lat: 21.2414, lng: 81.6196, phone: '555-0103' }
      ];

      for (const f of demoFacilities) {
        await db.execute({
          sql: `INSERT INTO healthcare_facilities (name, specialties, address, city, latitude, longitude, phone, verification_status, last_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [f.name, f.specialties, f.address, f.city, f.lat, f.lng, f.phone, 'DEMO DATA', now, now, now]
        });
      }
    }

    // Seed default verified test and admin accounts
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const defaultAdminHash = await bcrypt.hash('admin123', 10);

    // 1. Patient / Demo user: test@meditrack.com
    const testUser = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: ['test@meditrack.com']
    });
    if (testUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status, date_of_birth, gender, blood_group, height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ['test@meditrack.com', defaultPasswordHash, 'Leo Martinez', 'USER', 'ACTIVE', '2003-08-15', 'Male', 'O+', 175, 70, 'Maria Martinez', 'Parent', '+1 555-892-1140']
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET hashed_password = ?, status = ? WHERE id = ?',
        args: [defaultPasswordHash, 'ACTIVE', testUser.rows[0].id]
      });
    }

    // 2. Admin user: admin@meditrack.com
    const adminUser = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: ['admin@meditrack.com']
    });
    if (adminUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status)
              VALUES (?, ?, ?, ?, ?)`,
        args: ['admin@meditrack.com', defaultAdminHash, 'System Administrator', 'ADMIN', 'ACTIVE']
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET hashed_password = ?, role = ?, status = ? WHERE id = ?',
        args: [defaultAdminHash, 'ADMIN', 'ACTIVE', adminUser.rows[0].id]
      });
    }

    // 3. User account: namanguptai095@gmail.com
    const namanUser = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: ['namanguptai095@gmail.com']
    });
    if (namanUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status)
              VALUES (?, ?, ?, ?, ?)`,
        args: ['namanguptai095@gmail.com', defaultPasswordHash, 'Naman Gupta', 'USER', 'ACTIVE']
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET hashed_password = ?, status = ? WHERE id = ?',
        args: [defaultPasswordHash, 'ACTIVE', namanUser.rows[0].id]
      });
    }
  } catch (initErr) {
    console.error('Database initialization warning:', initErr);
  }
}

// Helper for client IP tracking
function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// --- AUTH ROUTES (PHASE 2, 4, 5, 6, 8, 10) ---

app.post('/api/auth/register', authRateLimiter, async (req: any, res: any) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Full Name, email, and password are required', code: 'VALIDATION_FAILED' });
  }

  const normalizedEmail = email.toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email address format', code: 'INVALID_EMAIL' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long for security', code: 'WEAK_PASSWORD' });
  }

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: [normalizedEmail]
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists', code: 'USER_EXISTS' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const result = await db.execute({
      sql: 'INSERT INTO users (email, hashed_password, name, role, status) VALUES (?, ?, ?, ?, ?) RETURNING id',
      args: [normalizedEmail, hashedPassword, name.toString().trim(), 'USER', 'ACTIVE']
    });

    const newUserId = result.rows[0].id;
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['INFO', 'USER_REGISTERED', `New user registered: ${normalizedEmail}`, newUserId, now]
    });

    res.json({ message: 'User created successfully' });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user account', code: 'SERVER_ERROR' });
  }
});

app.post('/api/auth/login', authRateLimiter, async (req: any, res: any) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
  }

  const normalizedEmail = email.toString().trim().toLowerCase();
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
    args: [normalizedEmail]
  });
  
  const user = result.rows[0];
  if (!user) {
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['WARN', 'AUTH_LOGIN_FAILED', `Failed login attempt for unknown email: ${normalizedEmail} from ${clientIp}`, null, now]
    });
    return res.status(400).json({
      error: 'Invalid email or password. Please verify your credentials or register a new account.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  if (user.status === 'SUSPENDED' || user.status === 'DISABLED' || user.status === 'DELETED') {
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['WARN', 'AUTH_LOGIN_BLOCKED', `Blocked login attempt for suspended user ${user.id} (${normalizedEmail})`, user.id, now]
    });
    return res.status(403).json({
      error: 'Your account has been suspended or deactivated. Please contact an administrator.',
      code: 'ACCOUNT_SUSPENDED'
    });
  }
  
  const validPassword = await bcrypt.compare(password, user.hashed_password as string);
  if (!validPassword) {
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['WARN', 'AUTH_LOGIN_FAILED', `Failed login attempt (bad password) for user ${user.id} (${normalizedEmail})`, user.id, now]
    });
    return res.status(400).json({
      error: 'Invalid email or password. Please check your credentials.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Create persistent session with hashed refresh token (Phase 4)
  const session = await authService.createSession(db, Number(user.id), userAgent, clientIp);

  // Issue short-lived access token (15m) (Phase 4)
  const accessToken = generateAccessToken({
    id: Number(user.id),
    email: String(user.email),
    role: (user.role === 'ADMIN' ? 'ADMIN' : 'USER'),
    status: String(user.status)
  });

  // Set secure HttpOnly cookie for refresh token (Phase 5 & 6)
  res.cookie('refreshToken', session.rawRefreshToken, {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: envConfig.REFRESH_TOKEN_MS
  });

  await db.execute({
    sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['INFO', 'AUTH_LOGIN_SUCCESS', `User ${user.id} logged in from ${clientIp}`, user.id, now]
  });

  res.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: envConfig.ACCESS_TOKEN_EXPIRES_IN_SEC,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }
  });
});

// Silent token refresh using HttpOnly cookie session (Phase 4 & 5)
app.post('/api/auth/refresh', async (req: any, res: any) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    return res.status(401).json({
      error: 'Refresh token not provided or session expired.',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  const session = await authService.findSessionByRefreshToken(db, rawRefreshToken);
  if (!session) {
    return res.status(401).json({
      error: 'Invalid authentication session. Please log in again.',
      code: 'INVALID_SESSION'
    });
  }

  // Reuse detection: if a revoked session is presented, revoke all sessions for this user! (Phase 4)
  if (session.revoked_at) {
    await authService.revokeAllUserSessions(db, session.user_id);
    res.clearCookie('refreshToken', { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: 'lax', path: '/' });
    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['WARN', 'SECURITY_ALERT_TOKEN_REUSE', `Potential refresh token reuse detected for user ${session.user_id}. All sessions revoked.`, session.user_id, now]
    });
    return res.status(401).json({
      error: 'Security alert: Authentication token reuse detected. All sessions revoked for safety.',
      code: 'TOKEN_REUSE_DETECTED'
    });
  }

  // Expiration check
  if (new Date(session.expires_at) < new Date()) {
    await authService.revokeSession(db, session.id);
    res.clearCookie('refreshToken', { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: 'lax', path: '/' });
    return res.status(401).json({
      error: 'Refresh session expired. Please log in again.',
      code: 'SESSION_EXPIRED'
    });
  }

  // Live database user check
  const userRes = await db.execute({
    sql: 'SELECT id, email, name, role, status FROM users WHERE id = ?',
    args: [session.user_id]
  });

  if (userRes.rows.length === 0) {
    return res.status(401).json({ error: 'User no longer exists', code: 'USER_NOT_FOUND' });
  }

  const user = userRes.rows[0];
  if (user.status === 'SUSPENDED' || user.status === 'DISABLED' || user.status === 'DELETED') {
    await authService.revokeSession(db, session.id);
    res.clearCookie('refreshToken', { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: 'lax', path: '/' });
    return res.status(403).json({ error: 'Account has been suspended', code: 'ACCOUNT_SUSPENDED' });
  }

  // Rotate refresh token (Phase 4)
  const rotated = await authService.rotateSession(db, session.id, userAgent, clientIp);

  // Issue new access token
  const newAccessToken = generateAccessToken({
    id: Number(user.id),
    email: String(user.email),
    role: (user.role === 'ADMIN' ? 'ADMIN' : 'USER'),
    status: String(user.status)
  });

  // Set rotated HttpOnly cookie
  res.cookie('refreshToken', rotated.newRawRefreshToken, {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: envConfig.REFRESH_TOKEN_MS
  });

  res.json({
    access_token: newAccessToken,
    token_type: 'bearer',
    expires_in: envConfig.ACCESS_TOKEN_EXPIRES_IN_SEC,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }
  });
});

// Secure Password Reset Request (Enumeration Protection) (Phase 2)
app.post('/api/auth/request-reset', async (req: any, res: any) => {
  const { email } = req.body || {};
  const genericMessage = 'If an account exists for this email, a password reset link has been sent.';

  if (!email || typeof email !== 'string') {
    return res.json({ message: genericMessage });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const clientIp = getClientIp(req);
  const now = new Date().toISOString();

  const userRes = await db.execute({
    sql: 'SELECT id, email, status FROM users WHERE LOWER(email) = ?',
    args: [normalizedEmail]
  });

  if (userRes.rows.length === 0) {
    // Return identical message to avoid user enumeration
    return res.json({ message: genericMessage });
  }

  const user = userRes.rows[0];
  if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
    return res.json({ message: genericMessage });
  }

  // Generate cryptographically secure random token, stored only as SHA-256 hash (Phase 2)
  const { rawToken } = await authService.createPasswordResetToken(db, Number(user.id), clientIp);

  await db.execute({
    sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['INFO', 'PASSWORD_RESET_REQUESTED', `Password reset token generated for user ${user.id} (${normalizedEmail})`, user.id, now]
  });

  // Development-only reset mechanism (strictly disabled in production) (Phase 2)
  if (!envConfig.IS_PRODUCTION) {
    console.log(`\n======================================================`);
    console.log(`[DEV-ONLY RESET LINK] For: ${normalizedEmail}`);
    console.log(`Token: ${rawToken}`);
    console.log(`Reset URL: http://localhost:3000/login?reset_token=${rawToken}`);
    console.log(`======================================================\n`);

    return res.json({
      message: genericMessage,
      devResetToken: rawToken,
      devResetUrl: `/login?reset_token=${rawToken}`
    });
  }

  res.json({ message: genericMessage });
});

// Verify reset token validity before password entry (Phase 2)
app.post('/api/auth/verify-reset-token', async (req: any, res: any) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, error: 'Reset token is required' });
  }

  const verify = await authService.verifyPasswordResetToken(db, token);
  if (!verify.valid) {
    return res.status(400).json({ valid: false, error: verify.error });
  }

  res.json({ valid: true, email: verify.user.email });
});

// Complete password reset with token verification (Phase 2)
// NOTE: Raw email + password WITHOUT cryptographic token is strictly rejected.
app.post('/api/auth/reset-password', async (req: any, res: any) => {
  const { token, newPassword } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      error: 'A valid password reset token is required to reset your password. Direct password reset without token verification is disabled for security.',
      code: 'TOKEN_REQUIRED'
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({
      error: 'New password must be at least 8 characters long for security.',
      code: 'WEAK_PASSWORD'
    });
  }

  const verify = await authService.verifyPasswordResetToken(db, token);
  if (!verify.valid) {
    return res.status(400).json({
      error: verify.error || 'Invalid or expired password reset token.',
      code: 'INVALID_RESET_TOKEN'
    });
  }

  const user = verify.user;
  const tokenRecord = verify.tokenRecord;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const now = new Date().toISOString();

  // 1. Update user password
  await db.execute({
    sql: 'UPDATE users SET hashed_password = ? WHERE id = ?',
    args: [hashedPassword, user.id]
  });

  // 2. Mark token as single-use consumed
  await db.execute({
    sql: 'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?',
    args: [now, tokenRecord.id]
  });

  // 3. Invalidate all existing sessions / tokens for this user (Phase 2 & 4)
  await authService.revokeAllUserSessions(db, user.id);
  res.clearCookie('refreshToken', { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: 'lax', path: '/' });

  // 4. Record security audit log
  await db.execute({
    sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
    args: ['INFO', 'PASSWORD_RESET_COMPLETED', `Password reset completed successfully for user ${user.id} (${user.email})`, user.id, now]
  });

  res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
});

// --- PATIENT PROFILE HELPER FUNCTIONS ---
function computeAge(dobString?: string | null): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 && age <= 125 ? age : null;
}

function computeBmiAndCategory(heightCm?: number | null, weightKg?: number | null): { bmi: number | null; bmiCategory: string | null } {
  if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) {
    return { bmi: null, bmiCategory: null };
  }
  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;
  let bmiCategory = 'Normal';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
  } else if (bmi < 25.0) {
    bmiCategory = 'Normal';
  } else if (bmi < 30.0) {
    bmiCategory = 'Overweight';
  } else {
    bmiCategory = 'Obesity';
  }
  return { bmi, bmiCategory };
}

function formatUserProfile(row: any) {
  if (!row) return null;
  const heightCm = row.height_cm != null && row.height_cm !== '' ? Number(row.height_cm) : null;
  const weightKg = row.weight_kg != null && row.weight_kg !== '' ? Number(row.weight_kg) : null;
  const age = computeAge(row.date_of_birth);
  const { bmi, bmiCategory } = computeBmiAndCategory(heightCm, weightKg);

  const emergencyContact = {
    name: row.emergency_contact_name || '',
    relationship: row.emergency_contact_relationship || '',
    phone: row.emergency_contact_phone || ''
  };

  return {
    ...row,
    fullName: row.name || '',
    dateOfBirth: row.date_of_birth || null,
    age,
    gender: row.gender || '',
    blood_group: row.blood_group || '',
    bloodGroup: row.blood_group || '',
    height_cm: heightCm,
    heightCm,
    weight_kg: weightKg,
    weightKg,
    bmi,
    bmiCategory,
    emergency_contact_name: emergencyContact.name,
    emergency_contact_relationship: emergencyContact.relationship,
    emergency_contact_phone: emergencyContact.phone,
    emergencyContact
  };
}

const handleGetProfile = async (req: any, res: any) => {
  try {
    const result = await db.execute({
      sql: `SELECT id, email, name, role, status, phone, date_of_birth, gender, blood_group,
                   height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                   notification_email, notification_sms, notification_telegram, notification_push,
                   notification_health_reminders, notification_lab_report_alerts, notification_frequency
            FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(formatUserProfile(result.rows[0]));
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

const handleUpdateProfile = async (req: any, res: any) => {
  const body = req.body || {};
  const name = body.fullName !== undefined ? body.fullName : (body.name !== undefined ? body.name : undefined);
  const phone = body.phone !== undefined ? body.phone : undefined;
  const date_of_birth = body.dateOfBirth !== undefined ? body.dateOfBirth : (body.date_of_birth !== undefined ? body.date_of_birth : undefined);
  const gender = body.gender !== undefined ? body.gender : undefined;
  const blood_group = body.bloodGroup !== undefined ? body.bloodGroup : (body.blood_group !== undefined ? body.blood_group : undefined);

  let height_cm = body.heightCm !== undefined ? body.heightCm : (body.height_cm !== undefined ? body.height_cm : undefined);
  let weight_kg = body.weightKg !== undefined ? body.weightKg : (body.weight_kg !== undefined ? body.weight_kg : undefined);

  const emContact = body.emergencyContact || {};
  const emName = emContact.name !== undefined ? emContact.name : body.emergency_contact_name;
  const emRel = emContact.relationship !== undefined ? emContact.relationship : body.emergency_contact_relationship;
  const emPhone = emContact.phone !== undefined ? emContact.phone : body.emergency_contact_phone;

  const notifEmail = body.notification_email;
  const notifSms = body.notification_sms;
  const notifTelegram = body.notification_telegram;
  const notifPush = body.notification_push;
  const notifHealthReminders = body.notification_health_reminders;
  const notifLabReportAlerts = body.notification_lab_report_alerts;
  const notifFrequency = body.notification_frequency;

  for (const [label, value] of [
    ['Email notifications', notifEmail],
    ['SMS notifications', notifSms],
    ['Telegram notifications', notifTelegram],
    ['Push notifications', notifPush],
    ['Health reminders', notifHealthReminders],
    ['Lab report alerts', notifLabReportAlerts]
  ] as const) {
    if (value !== undefined && ![0, 1, true, false].includes(value)) {
      return res.status(400).json({ error: `${label} must be enabled or disabled` });
    }
  }
  if (notifFrequency !== undefined && !['instant', 'daily', 'weekly'].includes(notifFrequency)) {
    return res.status(400).json({ error: 'Notification cadence must be instant, daily, or weekly' });
  }

  // Validation
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Full Name cannot be empty' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Full Name must be under 100 characters' });
    }
  }

  if (date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== '') {
    const parsedDob = new Date(date_of_birth);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({ error: 'Invalid Date of Birth format' });
    }
    const today = new Date();
    if (parsedDob > today) {
      return res.status(400).json({ error: 'Date of Birth cannot be in the future' });
    }
    const age = computeAge(date_of_birth);
    if (age !== null && age > 125) {
      return res.status(400).json({ error: 'Date of Birth exceeds realistic age limit (125 years)' });
    }
  }

  const allowedGenders = ['Male', 'Female', 'Other', 'Prefer not to say', ''];
  if (gender !== undefined && gender !== null && !allowedGenders.includes(gender)) {
    return res.status(400).json({ error: `Invalid gender option. Allowed: ${allowedGenders.filter(Boolean).join(', ')}` });
  }

  const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''];
  if (blood_group !== undefined && blood_group !== null && !allowedBloodGroups.includes(blood_group)) {
    return res.status(400).json({ error: `Invalid blood group. Allowed: ${allowedBloodGroups.filter(Boolean).join(', ')}` });
  }

  if (height_cm !== undefined && height_cm !== null && height_cm !== '') {
    const numHeight = Number(height_cm);
    if (isNaN(numHeight) || numHeight < 40 || numHeight > 260) {
      return res.status(400).json({ error: 'Height must be a valid number between 40 cm and 260 cm' });
    }
    height_cm = Math.round(numHeight * 10) / 10;
  } else if (height_cm === '') {
    height_cm = null;
  }

  if (weight_kg !== undefined && weight_kg !== null && weight_kg !== '') {
    const numWeight = Number(weight_kg);
    if (isNaN(numWeight) || numWeight < 15 || numWeight > 350) {
      return res.status(400).json({ error: 'Weight must be a valid number between 15 kg and 350 kg' });
    }
    weight_kg = Math.round(numWeight * 10) / 10;
  } else if (weight_kg === '') {
    weight_kg = null;
  }

  const allowedRelationships = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Relative', 'Guardian', 'Other', ''];
  if (emRel !== undefined && emRel !== null && !allowedRelationships.includes(emRel)) {
    return res.status(400).json({ error: `Invalid relationship. Allowed: ${allowedRelationships.filter(Boolean).join(', ')}` });
  }

  try {
    const currentRes = await db.execute({
      sql: `SELECT * FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const current = currentRes.rows[0];

    const finalName = name !== undefined ? name.trim() : current.name;
    const finalPhone = phone !== undefined ? (phone || null) : current.phone;
    const finalDob = date_of_birth !== undefined ? (date_of_birth || null) : current.date_of_birth;
    const finalGender = gender !== undefined ? (gender || null) : current.gender;
    const finalBlood = blood_group !== undefined ? (blood_group || null) : current.blood_group;
    const finalHeight = height_cm !== undefined ? height_cm : current.height_cm;
    const finalWeight = weight_kg !== undefined ? weight_kg : current.weight_kg;
    const finalEmName = emName !== undefined ? (emName ? emName.trim() : null) : current.emergency_contact_name;
    const finalEmRel = emRel !== undefined ? (emRel || null) : current.emergency_contact_relationship;
    const finalEmPhone = emPhone !== undefined ? (emPhone ? emPhone.trim() : null) : current.emergency_contact_phone;
    const finalEmailNotif = notifEmail !== undefined ? (notifEmail ? 1 : 0) : (current.notification_email ?? 1);
    const finalSmsNotif = notifSms !== undefined ? (notifSms ? 1 : 0) : (current.notification_sms ?? 0);
    const finalTelegramNotif = notifTelegram !== undefined ? (notifTelegram ? 1 : 0) : (current.notification_telegram ?? 1);
    const finalPushNotif = notifPush !== undefined ? (notifPush ? 1 : 0) : (current.notification_push ?? 1);
    const finalHealthReminders = notifHealthReminders !== undefined ? (notifHealthReminders ? 1 : 0) : (current.notification_health_reminders ?? 0);
    const finalLabReportAlerts = notifLabReportAlerts !== undefined ? (notifLabReportAlerts ? 1 : 0) : (current.notification_lab_report_alerts ?? 0);
    const finalNotificationFrequency = notifFrequency !== undefined ? notifFrequency : (current.notification_frequency || 'instant');

    await db.execute({
      sql: `UPDATE users SET 
              name = ?, 
              phone = ?, 
              date_of_birth = ?, 
              gender = ?,
              blood_group = ?,
              height_cm = ?,
              weight_kg = ?,
              emergency_contact_name = ?,
              emergency_contact_relationship = ?,
              emergency_contact_phone = ?,
              notification_email = ?, 
              notification_sms = ?, 
              notification_telegram = ?,
              notification_push = ?,
              notification_health_reminders = ?,
              notification_lab_report_alerts = ?,
              notification_frequency = ?
            WHERE id = ?`,
      args: [
        finalName,
        finalPhone,
        finalDob,
        finalGender,
        finalBlood,
        finalHeight,
        finalWeight,
        finalEmName,
        finalEmRel,
        finalEmPhone,
        finalEmailNotif,
        finalSmsNotif,
        finalTelegramNotif,
        finalPushNotif,
        finalHealthReminders,
        finalLabReportAlerts,
        finalNotificationFrequency,
        req.user.id
      ]
    });

    // If emergency contact provided, also update/insert in trusted_contacts for consistency (Phase 5)
    const emergencyContactWasUpdated = emName !== undefined || emRel !== undefined || emPhone !== undefined;
    if (emergencyContactWasUpdated && finalEmName && finalEmPhone) {
      try {
        const existingTc = await db.execute({
          sql: `SELECT id FROM trusted_contacts WHERE user_id = ? AND relationship = ? LIMIT 1`,
          args: [req.user.id, finalEmRel || 'Other']
        });
        if (existingTc.rows.length > 0) {
          await db.execute({
            sql: `UPDATE trusted_contacts SET name = ?, contact_value = ?, status = 'ACTIVE', updated_at = ? WHERE id = ?`,
            args: [finalEmName, finalEmPhone, new Date().toISOString(), existingTc.rows[0].id]
          });
        } else {
          await db.execute({
            sql: `INSERT INTO trusted_contacts (user_id, name, relationship, contact_method, contact_value, status, created_at, updated_at)
                  VALUES (?, ?, ?, 'PHONE', ?, 'ACTIVE', ?, ?)`,
            args: [req.user.id, finalEmName, finalEmRel || 'Other', finalEmPhone, new Date().toISOString(), new Date().toISOString()]
          });
        }
      } catch (tcErr) {
        console.warn('Trusted contact sync warning:', tcErr);
      }
    }

    const updatedRes = await db.execute({
      sql: `SELECT id, email, name, role, status, phone, date_of_birth, gender, blood_group,
                   height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                   notification_email, notification_sms, notification_push,
                   notification_health_reminders, notification_lab_report_alerts, notification_frequency
            FROM users WHERE id = ?`,
      args: [req.user.id]
    });

    res.json(formatUserProfile(updatedRes.rows[0]));
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

app.get('/api/auth/me', authenticateToken, handleGetProfile);
app.get('/api/profile', authenticateToken, handleGetProfile);
app.put('/api/auth/me', authenticateToken, handleUpdateProfile);
app.put('/api/profile', authenticateToken, handleUpdateProfile);

app.post('/api/auth/change-password', authenticateToken, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long for security' });
  }

  try {
    const userRes = await db.execute({
      sql: 'SELECT hashed_password, email FROM users WHERE id = ?',
      args: [req.user.id]
    });
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userRow = userRes.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, userRow.hashed_password as string);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await db.execute({
      sql: 'UPDATE users SET hashed_password = ? WHERE id = ?',
      args: [hashedNew, req.user.id]
    });

    // Invalidate existing sessions across other devices on password change (Phase 2 & 4)
    await authService.revokeAllUserSessions(db, req.user.id);
    res.clearCookie('refreshToken', { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: 'lax', path: '/' });

    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['INFO', 'AUTH_PASSWORD_CHANGED', `User ${req.user.id} (${userRow.email}) changed password`, req.user.id, now]
    });

    res.json({ message: 'Password updated successfully. Please log in with your new password.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/auth/logout', async (req: any, res: any) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (rawRefreshToken && typeof rawRefreshToken === 'string') {
    try {
      const session = await authService.findSessionByRefreshToken(db, rawRefreshToken);
      if (session) {
        await authService.revokeSession(db, session.id);
      }
    } catch (e) {
      console.warn('Logout session revocation note:', e);
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/'
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/sessions - retrieve active sessions
app.get('/api/auth/sessions', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const result = await db.execute({
      sql: `SELECT id, created_at, expires_at, last_used_at, user_agent, ip_address 
            FROM auth_sessions 
            WHERE user_id = ? AND revoked_at IS NULL AND expires_at > datetime('now')
            ORDER BY last_used_at DESC`,
      args: [userId]
    });
    res.json({ sessions: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/auth/revoke-session/:id
app.post('/api/auth/revoke-session/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);
    await db.execute({
      sql: `UPDATE auth_sessions SET revoked_at = datetime('now') WHERE id = ? AND user_id = ?`,
      args: [sessionId, userId]
    });
    res.json({ message: 'Session revoked successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// POST /api/auth/logout-all
app.post('/api/auth/logout-all', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await authService.revokeAllUserSessions(db, userId);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: envConfig.IS_PRODUCTION,
      sameSite: 'lax',
      path: '/'
    });
    res.json({ message: 'Successfully logged out of all active devices' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

// GET /api/user/export-data - Patient data export
app.get('/api/user/export-data', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const userRes = await db.execute({ sql: `SELECT id, name, email, role, status, created_at FROM users WHERE id = ?`, args: [userId] });
    const profileRes = await db.execute({ sql: `SELECT * FROM user_profiles WHERE user_id = ?`, args: [userId] });
    const measurementsRes = await db.execute({ sql: `SELECT * FROM measurements WHERE user_id = ?`, args: [userId] });
    const medicationsRes = await db.execute({ sql: `SELECT * FROM medications WHERE user_id = ?`, args: [userId] });
    const reportsRes = await db.execute({ sql: `SELECT id, filename, report_type, report_date, created_at FROM reports WHERE user_id = ?`, args: [userId] });
    const alertsRes = await db.execute({ sql: `SELECT * FROM health_alerts WHERE user_id = ?`, args: [userId] });

    const exportArchive = {
      app: 'MediTrack v2.0 Clinical Health Record',
      exported_at: new Date().toISOString(),
      user: userRes.rows[0] || null,
      profile: profileRes.rows[0] || null,
      measurements: measurementsRes.rows,
      medications: medicationsRes.rows,
      reports: reportsRes.rows,
      alerts: alertsRes.rows
    };
    res.json(exportArchive);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export health data' });
  }
});

// DELETE /api/user/account
app.delete('/api/user/account', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await authService.revokeAllUserSessions(db, userId);
    await db.execute({
      sql: `UPDATE users SET status = 'DELETED' WHERE id = ?`,
      args: [userId]
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: envConfig.IS_PRODUCTION,
      sameSite: 'lax',
      path: '/'
    });
    res.json({ message: 'Account deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// --- HABIT ROUTES ---
app.get('/api/habits', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM habits WHERE user_id = ?',
    args: [req.user.id]
  });
  res.json(result.rows);
});

app.post('/api/habits', authenticateToken, async (req: any, res) => {
  const { title, description, frequency, time_of_day } = req.body;
  const result = await db.execute({
    sql: 'INSERT INTO habits (user_id, title, description, frequency, time_of_day) VALUES (?, ?, ?, ?, ?) RETURNING *',
    args: [req.user.id, title, description || null, frequency, time_of_day || null]
  });
  res.json(result.rows[0]);
});

app.get('/api/habits/:habitId/logs', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE h.user_id = ? AND h.id = ?',
    args: [req.user.id, req.params.habitId]
  });
  res.json(result.rows);
});

app.post('/api/habits/:habitId/logs', authenticateToken, async (req: any, res) => {
  const { date, completed } = req.body;
  
  // Check if log exists
  const existing = await db.execute({
    sql: 'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?',
    args: [req.params.habitId, date]
  });
  
  if (existing.rows.length > 0) {
    const result = await db.execute({
      sql: 'UPDATE habit_logs SET completed = ? WHERE habit_id = ? AND date = ? RETURNING *',
      args: [completed ? 1 : 0, req.params.habitId, date]
    });
    res.json(result.rows[0]);
  } else {
    const result = await db.execute({
      sql: 'INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, ?) RETURNING *',
      args: [req.params.habitId, date, completed ? 1 : 0]
    });
    res.json(result.rows[0]);
  }
});

app.get('/api/habits/logs/today', authenticateToken, async (req: any, res) => {
  const date = new Date().toISOString().split('T')[0];
  const result = await db.execute({
    sql: 'SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE h.user_id = ? AND hl.date = ?',
    args: [req.user.id, date]
  });
  res.json(result.rows);
});


// --- MEDICATION ROUTES ---
app.get('/api/medications', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM medications WHERE user_id = ?',
    args: [req.user.id]
  });
  res.json(result.rows);
});

app.post('/api/medications', authenticateToken, async (req: any, res) => {
  const { name, dosage, frequency, time_of_day } = req.body;
  const result = await db.execute({
    sql: 'INSERT INTO medications (user_id, name, dosage, frequency, time_of_day) VALUES (?, ?, ?, ?, ?) RETURNING *',
    args: [req.user.id, name, dosage, frequency, time_of_day || null]
  });
  res.json(result.rows[0]);
});

app.get('/api/medications/:medicationId/logs', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT ml.* FROM medication_logs ml JOIN medications m ON ml.medication_id = m.id WHERE m.user_id = ? AND m.id = ?',
    args: [req.user.id, req.params.medicationId]
  });
  res.json(result.rows);
});

app.post('/api/medications/:medicationId/logs', authenticateToken, async (req: any, res) => {
  const { date, taken } = req.body;
  
  const existing = await db.execute({
    sql: 'SELECT * FROM medication_logs WHERE medication_id = ? AND date = ?',
    args: [req.params.medicationId, date]
  });
  
  if (existing.rows.length > 0) {
    const result = await db.execute({
      sql: 'UPDATE medication_logs SET taken = ? WHERE medication_id = ? AND date = ? RETURNING *',
      args: [taken ? 1 : 0, req.params.medicationId, date]
    });
    res.json(result.rows[0]);
  } else {
    const result = await db.execute({
      sql: 'INSERT INTO medication_logs (medication_id, date, taken) VALUES (?, ?, ?) RETURNING *',
      args: [req.params.medicationId, date, taken ? 1 : 0]
    });
    res.json(result.rows[0]);
  }
});

app.get('/api/medications/logs/today', authenticateToken, async (req: any, res) => {
  const date = new Date().toISOString().split('T')[0];
  const result = await db.execute({
    sql: 'SELECT ml.* FROM medication_logs ml JOIN medications m ON ml.medication_id = m.id WHERE m.user_id = ? AND ml.date = ?',
    args: [req.user.id, date]
  });
  res.json(result.rows);
});


// --- REPORT ROUTES ---
app.get('/api/reports', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM medical_reports WHERE user_id = ? ORDER BY created_at DESC',
    args: [req.user.id]
  });
  res.json(result.rows);
});

app.delete('/api/reports/:id', authenticateToken, async (req: any, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;

    // Verify ownership and get file path
    const existing = await db.execute({
      sql: 'SELECT id, file_path FROM medical_reports WHERE id = ? AND user_id = ?',
      args: [reportId, userId]
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }

    const filePath = existing.rows[0].file_path as string;

    // Delete measurements associated with this report
    await db.execute({
      sql: 'DELETE FROM measurements WHERE report_id = ?',
      args: [reportId]
    });

    // Delete the report itself
    await db.execute({
      sql: 'DELETE FROM medical_reports WHERE id = ?',
      args: [reportId]
    });

    // Invalidate cached medical analysis for user
    try {
      await db.execute({
        sql: 'DELETE FROM medical_analysis_cache WHERE user_id = ?',
        args: [userId]
      });
    } catch (cacheErr) {}

    // Attempt to delete the physical file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reports/upload', authenticateToken, uploadRateLimiter, upload.single('file'), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE_UPLOADED' });
  }

  // Security validation: extension, MIME, magic bytes, file size (Phase 3)
  const validation = validateUploadedFile(req.file.path, req.file.originalname, req.file.mimetype);
  if (!validation.isValid) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ error: validation.error, code: validation.code });
  }

  const { report_type, report_date } = req.body;
  
  // Hash file to detect duplicates (Phase 3 & 8)
  const fileBuffer = fs.readFileSync(req.file.path);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const file_hash = hashSum.digest('hex');

  // Check duplicate
  const existing = await db.execute({
    sql: 'SELECT * FROM medical_reports WHERE user_id = ? AND file_hash = ?',
    args: [req.user.id, file_hash]
  });

  if (existing.rows.length > 0) {
    console.log('Duplicate report detected, returning cached result.');
    try {
      fs.unlinkSync(req.file.path);
    } catch(err) { console.error('Cleanup error:', err); }
    return res.json(existing.rows[0]);
  }
  
  const now = new Date().toISOString();
  
  const result = await db.execute({
    sql: `INSERT INTO medical_reports 
           (user_id, filename, report_type, report_date, upload_date, processing_status, file_path, file_hash, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      req.user.id, 
      req.file.originalname, 
      report_type || 'General Lab Report', 
      report_date || now.split('T')[0], 
      now.split('T')[0], 
      'PROCESSING', // Start as processing
      req.file.path, 
      file_hash, 
      now, 
      now
    ]
  });
  
  const report = result.rows[0];

  try {
    const base64Data = fileBuffer.toString('base64');
    const extractedData = await aiService.extractMedicalReport(
      fileBuffer,
      req.file.mimetype || 'application/octet-stream',
      req.file.originalname
    );

    const parsedMeasurements = extractedData.measurements || [];
    const patientInfo = extractedData.patient_info || {};

    // Patient Matching check (Simulated basic check against req.user if we had full info, for now just flag if vastly different)
    // If mismatch detected, we could log it or flag the report.

    for (const m of parsedMeasurements) {
      // Deterministic validation
      const validationStatus = validateMeasurement(m.parameter, m.normalized_value, m.unit);

      await db.execute({
        sql: `INSERT INTO measurements (report_id, parameter, raw_value, normalized_value, unit, normalized_unit, source_page, source_text, extraction_confidence, validation_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          report.id,
          m.parameter,
          m.raw_value,
          m.normalized_value,
          m.unit,
          m.normalized_unit,
          m.source_page || "1",
          m.source_text,
          m.extraction_confidence,
          validationStatus
        ]
      });
    }

    // Run Contradiction Detection
    const measurementsRes = await db.execute({
      sql: `SELECT m.parameter, m.normalized_value, m.raw_value, m.source_page, r.report_date, r.id as r_id 
             FROM measurements m 
             JOIN medical_reports r ON m.report_id = r.id 
             WHERE r.user_id = ?`,
      args: [req.user.id]
    });
    
    const contradictions = detectContradictions(report.id as number, report.report_date as string, measurementsRes.rows as any);
    for (const c of contradictions) {
      await db.execute({
        sql: `INSERT INTO contradictions (user_id, parameter, report_a, report_b, value_a, value_b, date_a, date_b, severity, reason, source_page_a, source_page_b, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          req.user.id, c.parameter, c.report_a, c.report_b, c.value_a, c.value_b, c.date_a, c.date_b, c.severity, c.reason, c.source_page_a, c.source_page_b, c.status, new Date().toISOString()
        ]
      });
    }

    await db.execute({
      sql: "UPDATE medical_reports SET processing_status = 'COMPLETED' WHERE id = ?",
      args: [report.id]
    });
    report.processing_status = 'COMPLETED';

    // Evaluate extracted biomarkers to determine alert severity and create canonical alert
    try {
      let alertSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'MODERATE';
      let alertTitle = 'Medical Report Processed';
      let mainReason = `Medical report "${report.filename}" was successfully analyzed.`;
      const abnormalFlags: string[] = [];

      for (const m of parsedMeasurements) {
        const p = (m.parameter || '').toLowerCase();
        const v = (m.normalized_value || m.raw_value || '').trim();
        const num = parseFloat(v.replace(/,/g, ''));
        if (p.includes('blood pressure') || p.includes('bp')) {
          const parts = v.split('/');
          if (parts.length === 2) {
            const sys = parseInt(parts[0], 10);
            const dia = parseInt(parts[1], 10);
            if (sys >= 140 || dia >= 90) {
              const isCrit = sys >= 180 || dia >= 120;
              alertSeverity = isCrit ? 'CRITICAL' : 'HIGH';
              abnormalFlags.push(`BP ${v} mmHg (${isCrit ? 'Critical Stage 3' : 'Stage 2 Hypertension'})`);
            }
          }
        } else if (p === 'hba1c' || p.includes('glycated')) {
          if (!isNaN(num) && num >= 6.5) {
            if (num >= 9.0) alertSeverity = 'CRITICAL';
            else if (alertSeverity !== 'CRITICAL') alertSeverity = 'HIGH';
            abnormalFlags.push(`HbA1c ${num}% (Elevated)`);
          }
        } else if (p.includes('glucose') && (num >= 126 || num < 70)) {
          if (num >= 200 || num < 55) alertSeverity = 'CRITICAL';
          else if (alertSeverity !== 'CRITICAL') alertSeverity = 'HIGH';
          abnormalFlags.push(`Glucose ${num} mg/dL`);
        } else if (p === 'ldl' && num >= 160) {
          if (alertSeverity !== 'CRITICAL') alertSeverity = 'HIGH';
          abnormalFlags.push(`LDL ${num} mg/dL`);
        }
      }

      if (abnormalFlags.length > 0) {
        alertTitle = `${alertSeverity === 'CRITICAL' ? 'Critical' : 'High-Priority'} Health Alert`;
        mainReason = `Automated analysis of ${report.filename} identified: ${abnormalFlags.join(', ')}.`;
      }

      // Check for duplicate alert by event_key before inserting
      const eventKey = `report-processed:${report.id}`;
      const existingAlert = await db.execute({
        sql: 'SELECT id FROM health_alerts WHERE user_id = ? AND event_key = ?',
        args: [req.user.id, eventKey]
      });

      if (existingAlert.rows.length === 0) {
        await createAndDispatchHealthAlert(db, {
          userId: req.user.id,
          severity: alertSeverity,
          title: alertTitle,
          mainReason,
          source: 'Medical Report Processing',
          sourceReportId: Number(report.id),
          eventKey
        });
      }
    } catch (alertError) {
      console.warn('Could not record or dispatch the report processing notification:', alertError);
    }

    // Invalidate analysis cache and refresh specialty guidance for newly processed report
    try {
      await db.execute({
        sql: 'DELETE FROM medical_analysis_cache WHERE user_id = ?',
        args: [req.user.id]
      });
      await generateSpecialtyGuidance(req.user.id);
    } catch (cacheErr) {
      console.warn('Failed to invalidate/refresh medical analysis cache:', cacheErr);
    }

  } catch (error: any) {
    fs.writeFileSync("ocr_error.log", error.message || String(error));
    console.error("OCR Error:", error.message || error);
    await db.execute({
      sql: "UPDATE medical_reports SET processing_status = 'FAILED' WHERE id = ?",
      args: [report.id]
    });
    report.processing_status = 'FAILED';
    const status = error instanceof GeminiAIError ? error.status : 500;
    const errorCode = error instanceof GeminiAIError ? error.code : 'OCR_PROCESSING_FAILED';
    return res.status(status).json({
      error: error.message || "Failed to process report OCR",
      code: errorCode
    });
  }

  res.json(report);
});


async function ensureReportPdf(report: any, userId: number): Promise<string> {
  let filePathStr = String(report.file_path || '');
  if (!filePathStr) {
    filePathStr = `uploads/${Date.now()}-${String(report.filename || 'report.pdf').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  }
  
  const absPath = path.resolve(filePathStr);
  const exists = fs.existsSync(absPath);
  let isValid = false;

  if (exists) {
    try {
      const stat = fs.statSync(absPath);
      if (stat.size > 200) {
        if (!filePathStr.toLowerCase().endsWith('.pdf')) {
          isValid = true;
        } else {
          const head = Buffer.alloc(5);
          const fd = fs.openSync(absPath, 'r');
          fs.readSync(fd, head, 0, 5, 0);
          fs.closeSync(fd);
          if (head.toString('utf8').startsWith('%PDF')) {
            isValid = true;
          }
        }
      }
    } catch (e) {
      isValid = false;
    }
  }

  if (isValid) {
    return absPath;
  }

  // Auto-generate high-quality PDF report from database measurements
  const userRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
  const user = userRes.rows[0] || { name: 'Patient', email: '' };
  const measRes = await db.execute({ sql: 'SELECT * FROM measurements WHERE report_id = ? ORDER BY id ASC', args: [report.id] });
  const measurements = measRes.rows;

  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MediTrack Diagnostic Laboratory', margin, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Clinical Laboratory & Biomarker Analysis Report', margin, 55);

  // Metadata Card
  let yPos = 95;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 80, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', margin + 15, yPos + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(String(user.name || 'Patient'), margin + 95, yPos + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Document ID:', margin + 15, yPos + 48);
  doc.setFont('helvetica', 'normal');
  doc.text('MED-RPT-' + report.id, margin + 95, yPos + 48);

  const col2X = margin + (pageWidth - margin * 2) / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Report Type:', col2X, yPos + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(String(report.report_type || 'General Lab Report'), col2X + 80, yPos + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Collection Date:', col2X, yPos + 48);
  doc.setFont('helvetica', 'normal');
  doc.text(String(report.report_date || new Date().toISOString().split('T')[0]), col2X + 80, yPos + 48);

  yPos += 105;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Extracted Biomarkers & Clinical Measurements', margin, yPos);
  yPos += 15;

  const tableRows = measurements.length > 0 ? measurements.map(m => {
    let status = 'NORMAL';
    const sText = String(m.source_text || '').toUpperCase();
    if (sText.includes('HIGH') || sText.includes('ELEVATED')) status = 'HIGH';
    else if (sText.includes('LOW')) status = 'LOW';
    else if (sText.includes('BORDERLINE')) status = 'BORDERLINE';

    return [
      String(m.parameter || ''),
      String(m.raw_value || m.normalized_value || '-'),
      String(m.unit || m.normalized_unit || '-'),
      String(m.source_text || 'Standard clinical reference range observed'),
      status
    ];
  }) : [
    ['Clinical Record', 'Archived', '-', 'Report document processed and validated', 'NORMAL']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Biomarker / Parameter', 'Result', 'Unit', 'Reference / Lab Notes', 'Flag']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 9,
      cellPadding: 6
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const val = String(data.cell.raw || '');
        if (val === 'HIGH') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'LOW') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is an authorized medical report archive from MediTrack Health Systems. For clinical verification only.', margin, pageHeight - 20);
    doc.text('Page ' + i + ' of ' + pageCount, pageWidth - margin - 50, pageHeight - 20);
  }

  const uploadDir = path.dirname(absPath);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const pdfBuf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(absPath, pdfBuf);

  try {
    await db.execute({
      sql: 'UPDATE medical_reports SET file_path = ? WHERE id = ?',
      args: [filePathStr, report.id]
    });
  } catch(e) {}

  return absPath;
}

app.get('/api/reports/:id', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM medical_reports WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    const userRes = await db.execute({
      sql: 'SELECT id, name, email FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userRes.rows[0] || null;

    const measurementsRes = await db.execute({
      sql: 'SELECT * FROM measurements WHERE report_id = ? ORDER BY id ASC',
      args: [req.params.id]
    });

    res.json({
      report,
      user,
      measurements: measurementsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch report details' });
  }
});

app.get('/api/reports/:id/view', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM medical_reports WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    const filenameStr = String(report.filename);
    const absPath = await ensureReportPdf(report, req.user.id);

    // Determine content type
    let contentType = 'application/pdf';
    if (filenameStr.toLowerCase().endsWith('.jpg') || filenameStr.toLowerCase().endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filenameStr.toLowerCase().endsWith('.png')) contentType = 'image/png';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(filenameStr) + '"');
    res.sendFile(absPath);
  } catch (err: any) {
    console.error('Error serving report view:', err);
    res.status(500).send('Error viewing report: ' + (err.message || 'Unknown error'));
  }
});

app.get('/api/reports/:id/download', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM medical_reports WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    const absPath = await ensureReportPdf(report, req.user.id);
    res.download(absPath, String(report.filename));
  } catch (err: any) {
    console.error('Error downloading report:', err);
    res.status(500).send('Error downloading report: ' + (err.message || 'Unknown error'));
  }
});

// --- TIMELINE / MEASUREMENT ROUTES ---
app.get('/api/measurements', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: `SELECT m.*, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? AND m.validation_status = 'VALIDATED'
          ORDER BY r.report_date DESC`,
    args: [req.user.id]
  });
  res.json(result.rows);
});

app.get('/api/contradictions', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM contradictions WHERE user_id = ? ORDER BY created_at DESC',
    args: [req.user.id]
  });
  res.json(result.rows);
});

// --- TREND ROUTES ---
app.post('/api/trends/analyze', authenticateToken, aiRateLimiter, async (req: any, res) => {
  const result = await db.execute({
    sql: `SELECT m.parameter, m.normalized_value, r.report_date 
          FROM measurements m
          JOIN medical_reports r ON m.report_id = r.id
          WHERE r.user_id = ? AND m.validation_status = 'VALIDATED'
          ORDER BY m.parameter, r.report_date ASC`,
    args: [req.user.id]
  });

  const grouped = result.rows.reduce((acc: any, row: any) => {
    if (!acc[row.parameter]) acc[row.parameter] = [];
    acc[row.parameter].push(row);
    return acc;
  }, {});

  await db.execute({
    sql: 'DELETE FROM trends WHERE user_id = ?',
    args: [req.user.id]
  });

  const now = new Date().toISOString();
  const trends = [];

  for (const [parameter, data] of Object.entries(grouped)) {
    const points = data as any[];
    if (points.length < 2) continue;
    
    
    let firstVal = 0;
    let lastVal = 0;
    
    if (parameter === 'blood_pressure') {
      const firstParts = String(points[0].normalized_value).split('/');
      const lastParts = String(points[points.length - 1].normalized_value).split('/');
      if (firstParts.length >= 2 && lastParts.length >= 2) {
         firstVal = parseFloat(firstParts[0]); // Just use systolic for the main trend indication on backend
         lastVal = parseFloat(lastParts[0]);
      } else {
         continue;
      }
    } else {
      const firstMatch = String(points[0].normalized_value).match(/\d+(\.\d+)?/);
      const lastMatch = String(points[points.length - 1].normalized_value).match(/\d+(\.\d+)?/);
      if (!firstMatch || !lastMatch) continue;
      firstVal = parseFloat(firstMatch[0]);
      lastVal = parseFloat(lastMatch[0]);
    }
  
    
    let direction = 'STABLE';
    const pctChange = Math.abs((lastVal - firstVal) / firstVal);
    if (pctChange > 0.01) {
        if (lastVal > firstVal) direction = 'INCREASING';
        if (lastVal < firstVal) direction = 'DECREASING';
    }
    
    const evidence = `Changed from ${firstVal} to ${lastVal} over ${points.length} measurements.`;
    
    const insertRes = await db.execute({
      sql: `INSERT INTO trends (user_id, parameter, direction, valid_measurement_count, start_date, end_date, evidence, data_quality, analysis_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        req.user.id, 
        parameter, 
        direction, 
        points.length, 
        points[0].report_date, 
        points[points.length - 1].report_date, 
        evidence, 
        'HIGH', 
        '1.0', 
        now
      ]
    });
    
    trends.push(insertRes.rows[0]);
  }

  res.json({ message: 'Trend analysis completed successfully', trends });
});

app.get('/api/trends', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM trends WHERE user_id = ? ORDER BY created_at DESC',
    args: [req.user.id]
  });
  res.json(result.rows);
});

app.get('/api/trends/chart/:parameter', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: `SELECT m.normalized_value, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? AND m.parameter = ? AND m.validation_status = 'VALIDATED'
          ORDER BY r.report_date ASC`,
    args: [req.user.id, req.params.parameter]
  });

  const chartData = result.rows.map(r => {
    let value = 0;
    let systolic = undefined;
    let diastolic = undefined;
    
    if (req.params.parameter === 'blood_pressure') {
       const parts = (r.normalized_value as string).split('/');
       if (parts.length >= 2) {
         systolic = parseFloat(parts[0]);
         diastolic = parseFloat(parts[1]);
         value = systolic;
       }
    } else {
       const match = (r.normalized_value as string).match(/\d+(\.\d+)?/);
       value = match ? parseFloat(match[0]) : 0;
    }
    return {
      date: r.report_date,
      value: value,
      systolic,
      diastolic,
      raw_value: r.normalized_value
    };
  });

  res.json(chartData);
});

// --- RISK ASSESSMENT ROUTES ---
app.post('/api/risk/analyze', authenticateToken, aiRateLimiter, async (req: any, res) => {
  // Get all measurements for the user
  const result = await db.execute({
    sql: `SELECT m.parameter, m.normalized_value, m.validation_status, m.source_page as page, r.report_date, r.filename as report 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? 
          ORDER BY r.report_date DESC`,
    args: [req.user.id]
  });

  const measurements = result.rows as unknown as MeasurementRecord[];

  // Run the explicit risk rules engine
  const riskResults = evaluateRiskAllDomains(measurements);

  const now = new Date().toISOString();

  // Clear previous risk assessments
  await db.execute({
    sql: 'DELETE FROM risk_assessment WHERE user_id = ?',
    args: [req.user.id]
  });

  const assessmentsCreated = [];

  for (const risk of riskResults) {
    const insertResult = await db.execute({
      sql: `INSERT INTO risk_assessment (user_id, domain, level, label, evidence, data_quality, rule_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [req.user.id, risk.domain, risk.level, risk.label, risk.evidence, risk.data_quality, risk.rule_version, now]
    });
    assessmentsCreated.push(insertResult.rows[0]);
  }

  // Automatically trigger qualifying health alert if RED or ORANGE risk detected
  const highRisks = riskResults.filter(r => r.level === 'RED' || r.level === 'ORANGE');
  if (highRisks.length > 0) {
    try {
      const worstLevel = highRisks.some(r => r.level === 'RED') ? 'CRITICAL' : 'HIGH';
      const domainNames = highRisks.map(r => r.domain).join(' & ');
      const todayDate = now.split('T')[0];
      const riskKey = `risk-alert:${req.user.id}:${worstLevel}:${todayDate}`;

      const existingAlert = await db.execute({
        sql: 'SELECT id FROM health_alerts WHERE user_id = ? AND event_key = ?',
        args: [req.user.id, riskKey]
      });

      if (existingAlert.rows.length === 0) {
        await createAndDispatchHealthAlert(db, {
          userId: req.user.id,
          severity: worstLevel,
          title: `${worstLevel === 'CRITICAL' ? 'Critical' : 'Elevated'} Clinical Risk (${domainNames})`,
          mainReason: `Risk assessment calculated ${worstLevel.toLowerCase()} priority indicators in ${domainNames} domain.`,
          source: 'Clinical Risk Assessment',
          eventKey: riskKey
        });
      }
    } catch (riskAlertErr) {
      console.warn('Risk alert dispatch notice:', riskAlertErr);
    }
  }

  res.json({ message: 'Risk assessment complete', risks: assessmentsCreated });
});

app.get('/api/risk', authenticateToken, async (req: any, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM risk_assessment WHERE user_id = ? ORDER BY created_at DESC',
    args: [req.user.id]
  });
  res.json(result.rows);
});

// Add basic health endpoint

// --- DASHBOARD ROUTE (PHASE 16 / DASHBOARD FIX) ---


// --- OUTLOOK ROUTES (PHASE 2 & 6: ROBUST FORECASTING ENGINE) ---
app.post('/api/outlook/analyze', authenticateToken, aiRateLimiter, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // 1. Retrieve all measurements strictly owned by the authenticated user and joined to verified reports
    const rawResult = await db.execute({
      sql: `SELECT m.id, m.report_id, m.parameter, m.raw_value, m.normalized_value, 
                   m.unit, m.normalized_unit, m.validation_status, r.report_date 
            FROM measurements m 
            JOIN medical_reports r ON m.report_id = r.id 
            WHERE r.user_id = ? 
            ORDER BY r.report_date ASC, m.id ASC`,
      args: [userId]
    });

    const observationsByParam = new Map<string, ValidatedObservation[]>();
    const exclusionsByParam = new Map<string, ExcludedObservation[]>();

    const addObservation = (param: string, obs: ValidatedObservation) => {
      if (!observationsByParam.has(param)) observationsByParam.set(param, []);
      observationsByParam.get(param)!.push(obs);
    };

    const addExclusion = (param: string, excl: ExcludedObservation) => {
      if (!exclusionsByParam.has(param)) exclusionsByParam.set(param, []);
      exclusionsByParam.get(param)!.push(excl);
    };

    for (const row of rawResult.rows) {
      const rawParam = String(row.parameter || '').trim();
      const rawVal = row.raw_value;
      const normVal = row.normalized_value;
      const rawUnit = String(row.unit || row.normalized_unit || '');
      const status = row.validation_status;
      const dateStr = String(row.report_date || '');
      const reportId = Number(row.report_id);

      // Rule: Accept only VALIDATED measurements
      if (status !== 'VALIDATED') {
        const canonical = normalizeParameterName(rawParam);
        addExclusion(canonical, {
          parameter: rawParam,
          rawReportId: reportId,
          date: dateStr,
          rawValue: rawVal,
          rawUnit,
          reason: `Measurement not validated (status: ${status || 'UNVALIDATED'})`
        });
        continue;
      }

      // Rule: Date validation
      if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        const canonical = normalizeParameterName(rawParam);
        addExclusion(canonical, {
          parameter: rawParam,
          rawReportId: reportId,
          date: dateStr,
          rawValue: rawVal,
          rawUnit,
          reason: 'Invalid or missing measurement timestamp'
        });
        continue;
      }

      const timestamp = new Date(dateStr).getTime();
      const canonicalParam = normalizeParameterName(rawParam);

      // Rule: Special handling for blood pressure (must split into Systolic & Diastolic)
      const valString = String(normVal || rawVal || '').trim();
      const isBpParameter = canonicalParam === 'blood_pressure' || 
                            canonicalParam === 'blood_pressure_systolic' || 
                            canonicalParam === 'blood_pressure_diastolic' ||
                            rawParam.toLowerCase().includes('blood pressure') ||
                            valString.includes('/');

      if (isBpParameter && valString.includes('/')) {
        const parts = valString.split('/');
        if (parts.length >= 2) {
          const sysMatch = parts[0].trim().match(/\d+(\.\d+)?/);
          const diaMatch = parts[1].trim().match(/\d+(\.\d+)?/);

          if (sysMatch && diaMatch) {
            const sysNum = parseFloat(sysMatch[0]);
            const diaNum = parseFloat(diaMatch[0]);

            if (isFinite(sysNum) && sysNum > 30 && sysNum < 300) {
              addObservation('blood_pressure_systolic', {
                value: sysNum,
                date: dateStr,
                timestamp,
                rawReportId: reportId,
                originalValue: parts[0].trim(),
                originalUnit: rawUnit || 'mmHg',
                canonicalUnit: 'mmHg'
              });
            } else {
              addExclusion('blood_pressure_systolic', {
                parameter: 'Systolic Blood Pressure',
                rawReportId: reportId,
                date: dateStr,
                rawValue: parts[0],
                rawUnit,
                reason: 'Systolic value out of plausible physiological range'
              });
            }

            if (isFinite(diaNum) && diaNum > 20 && diaNum < 200) {
              addObservation('blood_pressure_diastolic', {
                value: diaNum,
                date: dateStr,
                timestamp,
                rawReportId: reportId,
                originalValue: parts[1].trim(),
                originalUnit: rawUnit || 'mmHg',
                canonicalUnit: 'mmHg'
              });
            } else {
              addExclusion('blood_pressure_diastolic', {
                parameter: 'Diastolic Blood Pressure',
                rawReportId: reportId,
                date: dateStr,
                rawValue: parts[1],
                rawUnit,
                reason: 'Diastolic value out of plausible physiological range'
              });
            }
          } else {
            addExclusion('blood_pressure', {
              parameter: rawParam,
              rawReportId: reportId,
              date: dateStr,
              rawValue: valString,
              rawUnit,
              reason: 'Malformed blood pressure format (expected SYS/DIA)'
            });
          }
        }
        continue;
      }

      // Standard biomarker numeric extraction
      // Use normalized_value first if clean numeric, else raw_value
      const cleanStr = String(normVal || rawVal || '').replace(/,/g, '');
      const numMatch = cleanStr.match(/-?\d+(\.\d+)?/);

      if (!numMatch) {
        addExclusion(canonicalParam, {
          parameter: rawParam,
          rawReportId: reportId,
          date: dateStr,
          rawValue: valString,
          rawUnit,
          reason: 'No finite numeric measurement extractable'
        });
        continue;
      }

      const numVal = parseFloat(numMatch[0]);
      if (!isFinite(numVal)) {
        addExclusion(canonicalParam, {
          parameter: rawParam,
          rawReportId: reportId,
          date: dateStr,
          rawValue: valString,
          rawUnit,
          reason: 'Non-finite numeric value'
        });
        continue;
      }

      // Unit harmonization via centralized clinical unit conversion registry
      const conversion = convertToCanonicalUnit(canonicalParam, numVal, rawUnit);
      if (!conversion.success || conversion.convertedValue === null) {
        addExclusion(canonicalParam, {
          parameter: rawParam,
          rawReportId: reportId,
          date: dateStr,
          rawValue: numVal,
          rawUnit,
          reason: conversion.error || `Unsupported unit '${rawUnit}'`
        });
        continue;
      }

      addObservation(canonicalParam, {
        value: conversion.convertedValue,
        date: dateStr,
        timestamp,
        rawReportId: reportId,
        originalValue: numVal,
        originalUnit: rawUnit,
        canonicalUnit: conversion.canonicalUnit
      });
    }

    // Include all standard registry clinical parameters so none are silently missing
    const standardParams = [
      'hemoglobin',
      'fasting_glucose',
      'total_cholesterol',
      'ldl',
      'hdl',
      'triglycerides',
      'creatinine',
      'alt',
      'ast',
      'hematocrit',
      'platelets',
      'wbc',
      'rbc',
      'blood_pressure_systolic',
      'blood_pressure_diastolic'
    ];

    const allParams = new Set([...standardParams, ...observationsByParam.keys()]);

    const engine = new RobustForecastingEngine();
    const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const computedForecasts = [];

    for (const param of allParams) {
      const obs = observationsByParam.get(param) || [];
      const excl = exclusionsByParam.get(param) || [];

      // Deduplicate only genuine identical records (same date and same value)
      const dedupedObs: ValidatedObservation[] = [];
      const seenKey = new Set<string>();
      for (const o of obs) {
        const k = `${o.date}-${o.value}-${o.canonicalUnit}`;
        if (!seenKey.has(k)) {
          seenKey.add(k);
          dedupedObs.push(o);
        }
      }

      const forecast = engine.forecast({
        parameter: param,
        observations: dedupedObs,
        excludedRecords: excl,
        forecastHorizonDays: 90
      });

      computedForecasts.push(forecast);
    }

    // Atomic persistence: Clear existing records for this user and insert new validated run
    await db.execute({
      sql: 'DELETE FROM future_outlook WHERE user_id = ?',
      args: [userId]
    });

    for (const f of computedForecasts) {
      await db.execute({
        sql: `INSERT INTO future_outlook (
                user_id, parameter, forecast_direction, forecast_range, confidence_category, 
                limitations, model_version, input_data_version, data_quality, created_at,
                status, display_name, canonical_unit, observation_count, distinct_dates_count,
                history_duration_days, last_observed_value, last_observed_date, forecast_target_date,
                forecast_value, prediction_interval_json, backtest_metrics_json, reason_code,
                reason_message, excluded_count, history_json, run_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          f.parameter,
          f.trendDirection,
          f.forecastRange,
          f.confidenceCategory,
          f.limitations,
          f.modelVersion,
          f.inputDataFingerprint,
          f.dataQuality,
          now,
          f.status,
          f.displayName,
          f.canonicalUnit,
          f.observationCount,
          f.distinctDatesCount,
          f.historyDurationDays,
          f.lastObservedValue,
          f.lastObservedDate,
          f.forecastTargetDate,
          f.forecastValue,
          f.predictionInterval ? JSON.stringify(f.predictionInterval) : null,
          f.backtestMetrics ? JSON.stringify(f.backtestMetrics) : null,
          f.reasonCode,
          f.reasonMessage,
          f.excludedCount,
          JSON.stringify(f.history),
          runId
        ]
      });
    }

    // Retrieve fresh persisted records
    const persisted = await db.execute({
      sql: 'SELECT * FROM future_outlook WHERE user_id = ? ORDER BY display_name ASC',
      args: [userId]
    });

    res.json({
      message: 'Future Outlook analysis completed successfully',
      run_id: runId,
      timestamp: now,
      forecasts: persisted.rows
    });
  } catch (err: any) {
    console.error('Future Outlook analysis error:', err);
    res.status(500).json({ error: 'Failed to execute Future Outlook analysis. Please verify your reports and try again.' });
  }
});

app.get('/api/outlook', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM future_outlook WHERE user_id = ? ORDER BY display_name ASC, parameter ASC',
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (err: any) {
    console.error('Future Outlook fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve Future Outlook forecasts.' });
  }
});

// --- SPECIALTY GUIDANCE ROUTES ---
app.post('/api/specialty/analyze', authenticateToken, aiRateLimiter, async (req: any, res) => {
  try {
    const guidances = await generateSpecialtyGuidance(req.user.id);
    const snapshot = await calculateHealthSnapshot(req.user.id);
    res.json({ message: 'Specialty analysis complete', guidances, snapshot });
  } catch (error: any) {
    console.error('Error analyzing specialty guidance:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze specialty guidance' });
  }
});

app.get('/api/specialty/snapshot', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = await calculateHealthSnapshot(req.user.id);
    res.json(snapshot);
  } catch (error: any) {
    console.error('Error calculating health snapshot:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate snapshot' });
  }
});

app.get('/api/specialty', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM specialty_guidance WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching specialty guidance:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve specialty guidance' });
  }
});

// --- AI ASSISTANT CONTEXT, CACHE & CHAT PIPELINE ---

interface MedicalContextData {
  user: any;
  reports: any[];
  pendingReports: any[];
  measurements: any[];
  risks: any[];
  guidances: any[];
  outlooks: any[];
  hasData: boolean;
}

class MedicalContextDatabaseError extends Error {
  constructor() {
    super('Medical context could not be retrieved.');
    this.name = 'MedicalContextDatabaseError';
  }
}

async function getUserMedicalAnalysisContext(userId: number): Promise<{ contextData: MedicalContextData; fromCache: boolean; fingerprint: string }> {
  try {
    // report_date belongs to medical_reports; measurements only references that row via report_id.
    const [reportsMetaRes, measMetaRes] = await Promise.all([
      db.execute({
        sql: `SELECT id, filename, report_date, updated_at, processing_status, file_hash
              FROM medical_reports WHERE user_id = ? ORDER BY id ASC`,
        args: [userId]
      }),
      db.execute({
        sql: `SELECT count(*) as count, max(m.id) as max_id
              FROM measurements m
              JOIN medical_reports r ON m.report_id = r.id
              WHERE r.user_id = ?`,
        args: [userId]
      })
    ]);

    const rawFingerprint = 'validated-context-v2|' + reportsMetaRes.rows.map((r: any) => `${r.id}:${r.report_date}:${r.updated_at}:${r.processing_status}:${r.file_hash}`).join('|')
      + `_m:${measMetaRes.rows[0]?.count || 0}_max:${measMetaRes.rows[0]?.max_id || 0}`;
    const currentFingerprint = crypto.createHash('sha256').update(rawFingerprint).digest('hex');

    // 2. Check persistent analysis cache
    try {
      const cacheRes = await db.execute({
        sql: 'SELECT fingerprint, data FROM medical_analysis_cache WHERE user_id = ?',
        args: [userId]
      });
      if (cacheRes.rows.length > 0 && cacheRes.rows[0].fingerprint === currentFingerprint) {
        const parsed = JSON.parse(cacheRes.rows[0].data as string);
        return { contextData: parsed, fromCache: true, fingerprint: currentFingerprint };
      }
    } catch (err) {
      console.warn('[AI Cache] Error reading cache, rebuilding context:', err);
    }

    // 3. Cache miss or invalidated: Retrieve authorized clinical records safely
    let userRes: any = { rows: [] };
    let completedReportsRes: any = { rows: [] };
    let pendingReportsRes: any = { rows: [] };
    let measurementsRes: any = { rows: [] };
    let risksRes: any = { rows: [] };
    let guidanceRes: any = { rows: [] };
    let outlookRes: any = { rows: [] };

    try {
      userRes = await db.execute({
        sql: 'SELECT id, name, email, date_of_birth, gender FROM users WHERE id = ?',
        args: [userId]
      });
    } catch (e) {
      console.warn('[AI Context] User query error:', e);
    }

    completedReportsRes = await db.execute({
      sql: `SELECT id, filename, report_type, report_date, upload_date
            FROM medical_reports
            WHERE user_id = ? AND processing_status = 'COMPLETED'
            ORDER BY report_date DESC, id DESC`,
      args: [userId]
    });

    try {
      pendingReportsRes = await db.execute({
        sql: `SELECT id, filename, processing_status
              FROM medical_reports
              WHERE user_id = ? AND processing_status != 'COMPLETED'
              ORDER BY id DESC`,
        args: [userId]
      });
    } catch (e) {
      console.warn('[AI Context] Pending reports query error:', e);
    }

    measurementsRes = await db.execute({
      sql: `SELECT m.parameter, m.raw_value, m.normalized_value, m.unit, m.normalized_unit,
                   r.report_date, r.filename, m.source_page, m.validation_status
            FROM measurements m
            JOIN medical_reports r ON m.report_id = r.id
            WHERE r.user_id = ? AND r.processing_status = 'COMPLETED'
              AND m.validation_status = 'VALIDATED'
            ORDER BY r.report_date DESC, m.id ASC`,
      args: [userId]
    });

    try {
      risksRes = await db.execute({
        sql: 'SELECT domain, level, label, evidence FROM risk_assessment WHERE user_id = ? ORDER BY id ASC',
        args: [userId]
      });
    } catch (e) {
      console.warn('[AI Context] Risk assessment query error:', e);
    }

    try {
      guidanceRes = await db.execute({
        sql: 'SELECT domain, suggested_specialty, evidence FROM specialty_guidance WHERE user_id = ? ORDER BY id ASC',
        args: [userId]
      });
    } catch (e) {
      console.warn('[AI Context] Specialty guidance query error:', e);
    }

    try {
      outlookRes = await db.execute({
        sql: 'SELECT parameter, display_name, forecast_direction, forecast_range, confidence_category, limitations FROM future_outlook WHERE user_id = ? ORDER BY id ASC',
        args: [userId]
      });
    } catch (e) {
      console.warn('[AI Context] Future outlook query error:', e);
    }

    const guidances = guidanceRes.rows;

    const rawUser = userRes.rows[0];
    let calculatedAge: number | null = null;
    if (rawUser && rawUser.date_of_birth) {
      const dob = new Date(String(rawUser.date_of_birth));
      if (!isNaN(dob.getTime())) {
        const diffMs = Date.now() - dob.getTime();
        calculatedAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const contextData: MedicalContextData = {
      user: rawUser ? { ...rawUser, age: calculatedAge } : null,
      reports: completedReportsRes.rows,
      pendingReports: pendingReportsRes.rows,
      measurements: measurementsRes.rows,
      risks: risksRes.rows,
      guidances,
      outlooks: outlookRes.rows,
      hasData: completedReportsRes.rows.length > 0 || measurementsRes.rows.length > 0
    };

    // 4. Persist newly compiled context into medical_analysis_cache
    const now = new Date().toISOString();
    try {
      await db.execute({
        sql: `INSERT INTO medical_analysis_cache (user_id, fingerprint, data, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET fingerprint = excluded.fingerprint, data = excluded.data, updated_at = excluded.updated_at`,
        args: [userId, currentFingerprint, JSON.stringify(contextData), now, now]
      });
    } catch (err) {
      console.warn('[AI Cache] Failed to persist medical_analysis_cache:', err);
    }

    return { contextData, fromCache: false, fingerprint: currentFingerprint };
  } catch (outerErr) {
    console.error('[AI Context] Unexpected error compiling medical context:', outerErr);
    throw new MedicalContextDatabaseError();
  }
}

function formatClinicalContext(ctx: MedicalContextData): string {
  if (!ctx.hasData) {
    let msg = 'Patient Medical Records: No validated reports or laboratory measurements on file.';
    if (ctx.pendingReports && ctx.pendingReports.length > 0) {
      msg += `\nUnprocessed Reports: ${ctx.pendingReports.map(p => `${p.filename} (${p.processing_status})`).join(', ')}`;
    }
    return msg;
  }

  const userLine = ctx.user ? `Patient: ${ctx.user.name || 'Anonymous'}${ctx.user.age ? `, Age: ${ctx.user.age}` : ''}${ctx.user.gender ? `, Gender: ${ctx.user.gender}` : ''}` : '';
  const reportsList = ctx.reports.map((r: any) => `- ${r.filename} (Collection Date: ${r.report_date || 'Unknown'}, Type: ${r.report_type || 'General Lab'})`).join('\n');
  const measurementsList = ctx.measurements.slice(0, 40).map((m: any) => `- ${m.parameter}: ${m.normalized_value || m.raw_value} ${m.unit || ''} [Date: ${m.report_date}, Report: ${m.filename}, Status: ${m.validation_status || 'EXTRACTED'}]`).join('\n');
  const risksList = ctx.risks.length > 0
    ? ctx.risks.map((r: any) => `- ${r.domain}: ${r.level} (${r.label}) - ${r.evidence}`).join('\n')
    : 'None recorded';
  const guidanceList = ctx.guidances.length > 0
    ? ctx.guidances.map((g: any) => `- ${g.suggested_specialty} (${g.domain}) - ${typeof g.evidence === 'string' && !g.evidence.startsWith('{') ? g.evidence : 'Validated laboratory findings'}`).join('\n')
    : 'None recorded';
  const outlooksList = ctx.outlooks.length > 0
    ? ctx.outlooks.map((o: any) => `- ${o.display_name || o.parameter}: Trend ${o.forecast_direction} (${o.forecast_range}), Confidence: ${o.confidence_category}`).join('\n')
    : 'None recorded';

  let pendingNote = '';
  if (ctx.pendingReports && ctx.pendingReports.length > 0) {
    pendingNote = `\nPending Reports (Data not yet extracted): ${ctx.pendingReports.map(p => `${p.filename} [Status: ${p.processing_status}]`).join(', ')}`;
  }

  return `
${userLine}
Verified Medical Reports (${ctx.reports.length} total):
${reportsList || 'None'}
${pendingNote}

Validated Biomarkers & Measurements (${ctx.measurements.length} total):
${measurementsList || 'None'}

Active Clinical Risk Assessments:
${risksList}

Specialty Consultations Suggested:
${guidanceList}

Future Outlook Projections:
${outlooksList}
`.trim();
}

function generateGroundedRuleResponse(message: string, ctx: MedicalContextData): string {
  const cleanMsg = message.trim();
  const lower = cleanMsg.toLowerCase();

  // 1. Natural greeting handling (works whether user has medical records or not)
  const isGreeting = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy)\b/i.test(cleanMsg);
  if (isGreeting) {
    if (ctx.hasData) {
      return `Hello! I am your MediTrack clinical assistant. I have access to your **${ctx.reports.length}** verified report(s) and **${ctx.measurements.length}** validated biomarker measurement(s).\n\nYou can ask me to explain your blood report, check specific test readings (such as hemoglobin, cholesterol, glucose, or kidney function), compare historical dates, or clarify why specific medical specialties were recommended. How can I help you today?`;
    }
    return `Hello! I am your MediTrack clinical assistant.\n\nYou do not have any uploaded medical reports in your account yet. You can upload laboratory reports (PDF or image) in the **Reports** tab. Once processed, I can help you analyze biomarker values, track historical progressions, and provide evidence-grounded insights.\n\nHow can I help you today?`;
  }

  // 2. User has no medical records and asked a medical question
  if (!ctx.hasData) {
    let reply = `**Answer:** You currently do not have any uploaded medical reports or laboratory measurements in your MediTrack profile.\n\n` +
      `**Limitations:** Without verified clinical documentation, I cannot analyze your biomarker levels, explain blood test results, or formulate specialty guidance.\n\n` +
      `**Next Steps:** Please navigate to the **Reports** tab and upload your laboratory reports (PDF or image). Once processed, I can explain your results and track longitudinal trends.`;
    if (ctx.pendingReports && ctx.pendingReports.length > 0) {
      reply += `\n\n*Note: You have ${ctx.pendingReports.length} report(s) currently in progress: ${ctx.pendingReports.map(p => `\`${p.filename}\` (${p.processing_status})`).join(', ')}. Once complete, their data will appear here automatically.*`;
    }
    return reply;
  }

  // 3. Latest blood report explanation
  if (lower.includes('latest blood report') || lower.includes('blood report') || (lower.includes('explain') && !lower.includes('why') && !lower.includes('cardio') && !lower.includes('cholesterol') && !lower.includes('glucose') && !lower.includes('hemoglobin'))) {
    const latestReport = ctx.reports[0];
    const reportMeas = ctx.measurements.filter(m => m.filename === latestReport?.filename);
    const displayMeas = reportMeas.length > 0 ? reportMeas.slice(0, 8) : ctx.measurements.slice(0, 8);

    if (displayMeas.length === 0) {
      return `**Answer:** Your latest report on file is **${latestReport?.filename || 'recent report'}** (collected on ${latestReport?.report_date || 'recorded date'}), but no individual biomarker measurements have been extracted from it yet.\n\n` +
        `**Limitations:** If this was an image or scanned document, please verify that it was clear and legible.\n\n` +
        `**Sources:** Report: ${latestReport?.filename || 'Unknown'}`;
    }

    return `**Answer:** Here is a summary of your validated laboratory parameters from your latest medical report:\n\n` +
      `**Your medical data:**\n` +
      displayMeas.map(m => `• **${m.parameter}**: ${m.normalized_value || m.raw_value} ${m.unit} [Observed: ${m.report_date}]`).join('\n') +
      `\n\n**Explanation:** These laboratory biomarkers reflect your metabolic and physiological status on ${latestReport?.report_date || 'the test date'}. Longitudinal consistency across these parameters is essential for tracking ongoing health.\n\n` +
      `**Limitations:** Clinical evaluation requires interpreting these findings alongside your overall symptoms, physical exam, and complete health history.\n\n` +
      `**Sources:** ${latestReport?.filename || 'Recent report'} (${latestReport?.report_date || 'N/A'}).`;
  }

  // 4. Hemoglobin / CBC / Blood count questions
  if (lower.includes('hemoglobin') || lower.includes('hb') || lower.includes('cbc') || lower.includes('platelet') || lower.includes('wbc') || lower.includes('rbc') || lower.includes('hematocrit')) {
    const hb = ctx.measurements.find(m => {
      const p = String(m.parameter).toLowerCase();
      return p.includes('hemoglobin') || p === 'hb';
    });
    const wbc = ctx.measurements.find(m => {
      const p = String(m.parameter).toLowerCase();
      return p.includes('wbc') || p.includes('leukocyte');
    });
    const plt = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('platelet'));
    const rbc = ctx.measurements.find(m => {
      const p = String(m.parameter).toLowerCase();
      return p.includes('rbc') || p.includes('erythrocyte');
    });

    const items: string[] = [];
    if (hb) items.push(`• **Hemoglobin**: ${hb.normalized_value || hb.raw_value} ${hb.unit} (Report: ${hb.filename}, Date: ${hb.report_date})`);
    if (rbc) items.push(`• **RBC Count**: ${rbc.normalized_value || rbc.raw_value} ${rbc.unit} (Report: ${rbc.filename}, Date: ${rbc.report_date})`);
    if (wbc) items.push(`• **WBC Count**: ${wbc.normalized_value || wbc.raw_value} ${wbc.unit} (Report: ${wbc.filename}, Date: ${wbc.report_date})`);
    if (plt) items.push(`• **Platelets**: ${plt.normalized_value || plt.raw_value} ${plt.unit} (Report: ${plt.filename}, Date: ${plt.report_date})`);

    if (items.length === 0) {
      return `**Answer:** No hemoglobin or complete blood count (CBC) measurements were found in your uploaded records.\n\n` +
        `**Limitations:** Your ${ctx.reports.length} uploaded report(s) (${ctx.reports.map(r => r.filename).join(', ')}) do not contain tested hemoglobin or CBC records.\n\n` +
        `**Next Steps:** Please upload your Complete Blood Count (CBC) report under the **Reports** tab to review hemoglobin and cell counts.`;
    }

    return `**Answer:** Here are the hematologic parameters extracted from your validated laboratory results:\n\n` +
      `**Your medical data:**\n` +
      items.join('\n') +
      `\n\n**Explanation:** Hemoglobin is an iron-containing oxygen transport protein in red blood cells. Adult reference ranges are generally ~13.8–17.2 g/dL for adult males and ~12.1–15.1 g/dL for adult females, though lab-specific calibration ranges apply.\n\n` +
      `**Limitations:** Hydration status and nutritional factors can alter hemoglobin concentration. Consult your physician for personalized evaluation.\n\n` +
      `**Sources:** Verified laboratory records (${[...new Set([hb?.filename, rbc?.filename, wbc?.filename, plt?.filename].filter(Boolean))].join(', ')}).`;
  }

  // 5. Cardiology / Cholesterol / Heart questions
  if (lower.includes('cardiology') || lower.includes('cholesterol') || lower.includes('heart') || lower.includes('lipid') || lower.includes('ldl') || lower.includes('blood pressure') || lower.includes('hypertension')) {
    const ldl = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('ldl'));
    const tc = ctx.measurements.find(m => {
      const p = String(m.parameter).toLowerCase();
      return p.includes('cholesterol') && !p.includes('ldl') && !p.includes('hdl');
    });
    const hdl = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('hdl'));
    const bp = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('pressure') || String(m.parameter).toLowerCase().includes('bp'));
    const cardioGuidance = ctx.guidances.find(g => g.domain === 'cardiovascular' || String(g.suggested_specialty).toLowerCase().includes('cardio'));

    const dataItems: string[] = [];
    if (ldl) dataItems.push(`• **LDL Cholesterol**: ${ldl.normalized_value || ldl.raw_value} ${ldl.unit} (Report: ${ldl.filename}, Date: ${ldl.report_date})`);
    if (tc) dataItems.push(`• **Total Cholesterol**: ${tc.normalized_value || tc.raw_value} ${tc.unit} (Report: ${tc.filename}, Date: ${tc.report_date})`);
    if (hdl) dataItems.push(`• **HDL Cholesterol**: ${hdl.normalized_value || hdl.raw_value} ${hdl.unit} (Report: ${hdl.filename}, Date: ${hdl.report_date})`);
    if (bp) dataItems.push(`• **Blood Pressure**: ${bp.normalized_value || bp.raw_value} ${bp.unit} (Report: ${bp.filename}, Date: ${bp.report_date})`);

    if (dataItems.length === 0) {
      return `**Answer:** No cardiovascular biomarkers (such as LDL, HDL, Total Cholesterol, or Blood Pressure) were found in your uploaded records.\n\n` +
        `**Limitations:** You have ${ctx.reports.length} report(s) on file, but none contain documented lipid or blood pressure readings.\n\n` +
        `**Next Steps:** Upload a comprehensive metabolic panel or lipid profile report to review cardiovascular indicators.`;
    }

    let answerText = cardioGuidance
      ? `Cardiology consultation was recommended to evaluate your cardiovascular risk markers.`
      : `Here are the cardiovascular parameters documented in your medical records:`;

    let explanationText = `Cardiovascular markers such as LDL cholesterol and blood pressure provide quantitative insight into arterial health and long-term cardiovascular risk.`;
    if (cardioGuidance && cardioGuidance.evidence) {
      explanationText += ` Clinical guidance reasoning: ${cardioGuidance.evidence}`;
    }

    return `**Answer:** ${answerText}\n\n` +
      `**Your medical data:**\n` +
      dataItems.join('\n') +
      `\n\n**Explanation:** ${explanationText}\n\n` +
      `**Limitations:** Laboratory indicators should be evaluated in context of lifestyle, family history, and cardiovascular risk scores by a physician.\n\n` +
      `**Sources:** Verified laboratory records (${[...new Set([ldl?.filename, tc?.filename, hdl?.filename, bp?.filename].filter(Boolean))].join(', ')}).`;
  }

  // 6. Glucose / Diabetes / Metabolic questions
  if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('diabetes') || lower.includes('hba1c') || lower.includes('a1c') || lower.includes('metabolic')) {
    const glu = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('glucose') || String(m.parameter).toLowerCase().includes('sugar'));
    const a1c = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('hba1c') || String(m.parameter).toLowerCase().includes('a1c'));
    const metabGuidance = ctx.guidances.find(g => g.domain === 'metabolic' || String(g.suggested_specialty).toLowerCase().includes('endocrin'));

    const items: string[] = [];
    if (glu) items.push(`• **Fasting/Random Glucose**: ${glu.normalized_value || glu.raw_value} ${glu.unit} (Date: ${glu.report_date}, Report: ${glu.filename})`);
    if (a1c) items.push(`• **HbA1c**: ${a1c.normalized_value || a1c.raw_value} ${a1c.unit} (Date: ${a1c.report_date}, Report: ${a1c.filename})`);

    if (items.length === 0) {
      return `**Answer:** No blood glucose or HbA1c measurements were identified in your uploaded medical reports.\n\n` +
        `**Limitations:** Your current records do not include glycemic laboratory panels.\n\n` +
        `**Next Steps:** Upload a diabetic panel or fasting metabolic test report if you wish to analyze blood sugar regulation.`;
    }

    return `**Answer:** Here are your metabolic biomarkers extracted from your laboratory results:\n\n` +
      `**Your medical data:**\n` +
      items.join('\n') +
      `\n\n**Explanation:** Blood glucose measures circulating blood sugar, while HbA1c provides an estimate of average glycemic control over the preceding 2 to 3 months.${metabGuidance ? ` Specialty guidance: ${metabGuidance.suggested_specialty} (${metabGuidance.evidence || 'Metabolic monitoring'})` : ''}\n\n` +
      `**Limitations:** Fasting status at the time of specimen collection affects glucose interpretations.\n\n` +
      `**Sources:** ${[...new Set([glu?.filename, a1c?.filename].filter(Boolean))].join(', ')}.`;
  }

  // 7. Kidney / Renal / Creatinine / eGFR questions
  if (lower.includes('kidney') || lower.includes('creatinine') || lower.includes('egfr') || lower.includes('renal') || lower.includes('nephro')) {
    const cr = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('creatinine'));
    const egfr = ctx.measurements.find(m => String(m.parameter).toLowerCase().includes('egfr'));

    const items: string[] = [];
    if (cr) items.push(`• **Creatinine**: ${cr.normalized_value || cr.raw_value} ${cr.unit} (Date: ${cr.report_date}, Report: ${cr.filename})`);
    if (egfr) items.push(`• **eGFR**: ${egfr.normalized_value || egfr.raw_value} ${egfr.unit} (Date: ${egfr.report_date}, Report: ${egfr.filename})`);

    if (items.length === 0) {
      return `**Answer:** No renal function markers (such as Creatinine or eGFR) were found in your uploaded records.\n\n` +
        `**Limitations:** Renal indicators were not detected in your ${ctx.reports.length} uploaded report(s).\n\n` +
        `**Next Steps:** Upload a Comprehensive Metabolic Panel (CMP) or Renal Function Panel to review kidney markers.`;
    }

    return `**Answer:** Here are the renal function values documented in your validated records:\n\n` +
      `**Your medical data:**\n` +
      items.join('\n') +
      `\n\n**Explanation:** Serum creatinine and estimated glomerular filtration rate (eGFR) evaluate the filtration efficiency of the kidneys.\n\n` +
      `**Limitations:** Muscle mass, hydration, and acute illness can influence serum creatinine levels.\n\n` +
      `**Sources:** ${[...new Set([cr?.filename, egfr?.filename].filter(Boolean))].join(', ')}.`;
  }

  // 8. Generic parameter match (e.g. user asks about any other specific test on file)
  const queryTokens = lower.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !['what', 'does', 'mean', 'result', 'test', 'level', 'latest', 'show', 'value', 'have', 'from', 'about', 'explain', 'tell'].includes(w));
  const matchedParams = ctx.measurements.filter(m => {
    const p = String(m.parameter).toLowerCase();
    return queryTokens.some(tok => p.includes(tok));
  });

  if (matchedParams.length > 0 && queryTokens.length > 0) {
    const uniqueMatched = matchedParams.slice(0, 6);
    return `**Answer:** Here are the matching measurements found in your medical records for your query:\n\n` +
      `**Your medical data:**\n` +
      uniqueMatched.map(m => `• **${m.parameter}**: ${m.normalized_value || m.raw_value} ${m.unit} (Report: ${m.filename}, Date: ${m.report_date})`).join('\n') +
      `\n\n**Explanation:** These are your recorded laboratory results. Please consult with your healthcare provider to discuss how these values align with your clinical context.\n\n` +
      `**Limitations:** Single laboratory values should be considered in longitudinal context.\n\n` +
      `**Sources:** ${[...new Set(uniqueMatched.map(m => m.filename))].join(', ')}.`;
  }

  // 9. Compare results across dates
  if (lower.includes('compare') || lower.includes('previous') || lower.includes('trend') || lower.includes('history')) {
    if (ctx.reports.length < 2) {
      const single = ctx.reports[0];
      return `**Answer:** Longitudinal trend comparison requires at least two medical reports collected on different dates.\n\n` +
        `**Your medical data:** You currently have 1 verified report on file (**${single?.filename}**, dated **${single?.report_date || 'N/A'}**).\n\n` +
        `**Next Steps:** Upload your historical or recent follow-up lab tests in the **Reports** tab to generate longitudinal comparison curves.`;
    }

    const distinctDates = [...new Set(ctx.reports.map(r => r.report_date).filter(Boolean))];
    const multiDateParams: string[] = [];

    const paramMap: Record<string, any[]> = {};
    for (const m of ctx.measurements) {
      const p = m.parameter;
      if (!paramMap[p]) paramMap[p] = [];
      paramMap[p].push(m);
    }

    for (const p in paramMap) {
      const uniqueObsDates = new Set(paramMap[p].map(x => x.report_date));
      if (uniqueObsDates.size >= 2) {
        const sorted = paramMap[p].sort((a, b) => String(a.report_date).localeCompare(String(b.report_date)));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        multiDateParams.push(`• **${p}**: ${first.normalized_value || first.raw_value} ${first.unit} (${first.report_date}) → ${last.normalized_value || last.raw_value} ${last.unit} (${last.report_date})`);
      }
    }

    return `**Answer:** Comparing your health measurements across your ${ctx.reports.length} uploaded reports (${distinctDates.join(', ')}):\n\n` +
      `**Your medical data:**\n` +
      (multiDateParams.length > 0 ? multiDateParams.slice(0, 6).join('\n') : `• Measurements were collected across dates: ${distinctDates.join(', ')}.`) +
      `\n\n**Explanation:** Longitudinal tracking highlights physiological stability or trends over time. You can view full interactive trend graphs and future outlook forecasts under the **Trends** and **Future Outlook** tabs.\n\n` +
      `**Limitations:** Differing reference laboratories or assay methodologies between reports can introduce minor variations.\n\n` +
      `**Sources:** Reports: ${ctx.reports.map(r => `${r.filename} (${r.report_date})`).join(', ')}.`;
  }

  // 10. Lifestyle / Improve test results
  if (lower.includes('improve') || lower.includes('lifestyle') || lower.includes('diet') || lower.includes('exercise')) {
    return `**Answer:** General evidence-based lifestyle strategies to discuss with your healthcare provider:\n\n` +
      `• **Cardiovascular Support:** Prioritize heart-healthy dietary patterns (e.g. rich in soluble fiber and omega-3s) alongside routine moderate aerobic activity (e.g. 150 min/week).\n` +
      `• **Metabolic Regulation:** Balance complex carbohydrates with lean protein and stay consistently hydrated.\n` +
      `• **Follow-Up:** Schedule periodic re-testing with your physician to monitor biomarkers that require longitudinal follow-up.\n\n` +
      `**Limitations:** Lifestyle adjustments should always be personalized in consultation with your primary physician.\n\n` +
      `**Sources:** MediTrack Evidence-Based Clinical Guidance Guidelines.`;
  }

  // 11. General overview fallback
  const uniqueParams = [...new Set(ctx.measurements.map(m => m.parameter))];
  const specialties = ctx.guidances.map(g => g.suggested_specialty).filter(Boolean);

  return `**Answer:** I am your MediTrack clinical assistant. I have access to your **${ctx.reports.length}** verified report(s) and **${ctx.measurements.length}** validated measurement(s).\n\n` +
    `**Your medical data:**\n` +
    `• **Active Biomarkers Tracked (${uniqueParams.length}):** ${uniqueParams.slice(0, 7).join(', ')}${uniqueParams.length > 7 ? '...' : ''}\n` +
    (specialties.length > 0 ? `• **Recommended Consultations:** ${[...new Set(specialties)].join(', ')}\n` : '') +
    `\n**Explanation:** You can ask me to explain your blood report, review specific biomarkers (e.g. cholesterol, hemoglobin, glucose, kidney function), or compare historical test dates.\n\n` +
    `**Limitations:** This assistant provides educational insights based strictly on your uploaded records and does not substitute for licensed clinical diagnosis.\n\n` +
    `**Sources:** Authorized patient medical records.`;
}

// --- AI ASSISTANT CHAT HISTORY ROUTES ---
app.get('/api/ai/chat/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await db.execute({
      sql: `SELECT id, role, content, created_at as timestamp FROM (
              SELECT id, role, content, created_at FROM chat_messages
              WHERE user_id = ? ORDER BY id DESC LIMIT 50
            ) ORDER BY id ASC`,
      args: [userId]
    });
    res.json(result.rows.map(r => ({
      id: String(r.id),
      role: r.role,
      content: r.content,
      timestamp: r.timestamp
    })));
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});

app.delete('/api/ai/chat/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    await db.execute({
      sql: 'DELETE FROM chat_messages WHERE user_id = ?',
      args: [userId]
    });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error: any) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// --- AI ASSISTANT CHAT ROUTE ---
app.post('/api/ai/chat', authenticateToken, chatRateLimiter, async (req: any, res) => {
  try {
    const message = req.body?.message;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.', code: 'REQUEST_INVALID' });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message is too long (maximum 2000 characters).', code: 'REQUEST_INVALID' });
    }

    const userId = req.user.id;
    let history: Array<{ role: string; content: string }> = [];
    try {
      const historyResult = await db.execute({
        sql: `SELECT role, content FROM (
                SELECT id, role, content FROM chat_messages
                WHERE user_id = ? ORDER BY id DESC LIMIT 6
              ) ORDER BY id ASC`,
        args: [userId]
      });
      history = historyResult.rows
        .filter((row: any) => (row.role === 'user' || row.role === 'assistant') && typeof row.content === 'string')
        .map((row: any) => ({ role: row.role, content: row.content }));
    } catch (historyError) {
      console.warn('[AI Chat] Prior conversation unavailable; continuing without it.');
    }

    // Medical context is mandatory for medical answers. Never turn a retrieval failure into an empty record.
    let contextData: MedicalContextData;
    try {
      const ctxResult = await getUserMedicalAnalysisContext(userId);
      contextData = ctxResult.contextData;
    } catch (contextError) {
      return res.status(500).json({
        error: 'We could not retrieve your medical information. Please try again.',
        code: 'DATABASE_ERROR'
      });
    }
    const clinicalContext = formatClinicalContext(contextData);

    if (!aiService.isConfigured()) {
      return res.status(503).json({
        error: 'The AI assistant is temporarily unavailable.',
        code: 'AI_PROVIDER_UNAVAILABLE'
      });
    }

    let reply: string;
    try {
      reply = await aiService.generateChatResponse(message.trim(), clinicalContext, history);
    } catch (providerError: any) {
      if (providerError instanceof GeminiAIError) {
        const status = providerError.status === 429 ? 503 : providerError.status;
        return res.status(status).json({
          error: 'The AI assistant is temporarily unavailable.',
          code: 'AI_PROVIDER_UNAVAILABLE'
        });
      }
      console.error('[AI Chat] Unexpected provider error.');
      return res.status(503).json({
        error: 'The AI assistant is temporarily unavailable.',
        code: 'AI_PROVIDER_UNAVAILABLE'
      });
    }

    // Persist only completed exchanges so failed requests can be retried without orphaned user turns.
    const now = new Date().toISOString();
    try {
      await db.batch([
        {
          sql: 'INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)',
          args: [userId, 'user', message.trim(), now]
        },
        {
          sql: 'INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)',
          args: [userId, 'assistant', reply, new Date().toISOString()]
        }
      ], 'write');
    } catch (historyWriteError) {
      console.warn('[AI Chat] Could not persist completed conversation exchange.');
    }

    return res.json({ message: reply });
  } catch (error: any) {
    console.error('[AI Chat] Unexpected request failure.');
    res.status(500).json({
      error: 'The AI assistant is temporarily unavailable. Please try again.',
      code: 'INTERNAL_ERROR'
    });
  }
});


// --- HEALTHCARE FACILITIES ROUTES (PHASE 11) ---

const facilityCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

app.get('/api/facilities', authenticateToken, async (req: any, res: any) => {
  try {
    const city = (req.query.city || '').toString().trim().toLowerCase();
    const specialty = (req.query.specialty || '').toString().trim().toLowerCase();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);

    if (!city && (!userLat || !userLng)) {
      return res.status(400).json({ error: "City or coordinates required" });
    }

    // Cache key based on city and specialty
    const cacheKey = `${city}-${specialty}`;
    
    let facilities = [];

    // Check cache
    if (facilityCache.has(cacheKey)) {
      const cached = facilityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        facilities = cached.data;
      } else {
        facilityCache.delete(cacheKey);
      }
    }

    // DB fetch if not cached
    if (facilities.length === 0) {
      let query = 'SELECT * FROM healthcare_facilities WHERE active = 1';
      const args = [];

      // We will fetch all active facilities and filter by city/specialty in code for flexibility, 
      // or we can do it in SQL. Doing it in SQL is better.
      query = 'SELECT * FROM healthcare_facilities WHERE verification_status = "VERIFIED"';
      
      if (city) {
        query += ' AND LOWER(city) = ?';
        args.push(city);
      }

      const result = await db.execute({ sql: query, args });
      facilities = result.rows;

      if (specialty) {
        facilities = facilities.filter(f => f.specialties.toLowerCase().includes(specialty));
      }

      // Store in cache
      facilityCache.set(cacheKey, { timestamp: Date.now(), data: facilities });
    }

    // Distance calculation and sorting
    let results = [...facilities];
    if (!isNaN(userLat) && !isNaN(userLng)) {
      results = results.map(f => {
        const distance = getDistanceFromLatLonInKm(userLat, userLng, f.latitude, f.longitude);
        return { ...f, distance: parseFloat(distance.toFixed(2)) };
      });
      // Sort by distance
      results.sort((a, b) => a.distance - b.distance);
    }

    res.json(results);
  } catch (error) {
    console.error('Facilities Error:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// Admin Support Routes
app.post('/api/admin/facilities', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { name, specialties, address, city, latitude, longitude, phone, verification_status } = req.body;
  const now = new Date().toISOString();
  
  const result = await db.execute({
    sql: `INSERT INTO healthcare_facilities (name, specialties, address, city, latitude, longitude, phone, verification_status, last_verified, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [name, specialties, address, city, latitude, longitude, phone, verification_status || 'PENDING', now, now, now]
  });
  
  // Invalidate cache
  facilityCache.clear();
  clearCache('facilities'); clearCache('specialtyRules'); res.json(result.rows[0]);
});

app.put('/api/admin/facilities/:id', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { name, specialties, address, city, latitude, longitude, phone, verification_status } = req.body;
  const now = new Date().toISOString();
  
  const result = await db.execute({
    sql: `UPDATE healthcare_facilities SET name=?, specialties=?, address=?, city=?, latitude=?, longitude=?, phone=?, verification_status=?, last_verified=?, updated_at=? WHERE id=? RETURNING *`,
    args: [name, specialties, address, city, latitude, longitude, phone, verification_status, now, now, req.params.id]
  });
  
  facilityCache.clear();
  clearCache('facilities'); clearCache('specialtyRules'); res.json(result.rows[0]);
});


// --- TRUSTED CONTACTS & ALERTS ROUTES (PHASE 12, 13 & REAL NOTIFICATION INTEGRATION) ---

function buildTrustedContactValues(body: any, current?: any) {
  const nameRaw = body.name !== undefined ? body.name : current?.name;
  const relationshipRaw = body.relationship !== undefined ? body.relationship : current?.relationship;
  const methodRaw = body.contact_method !== undefined ? body.contact_method : current?.contact_method;
  const valueRaw = body.contact_value !== undefined ? body.contact_value : current?.contact_value;
  const statusRaw = body.status !== undefined ? body.status : (current?.status || 'ACTIVE');

  const emailRaw = body.email !== undefined ? body.email : (current?.email || (methodRaw === 'EMAIL' ? valueRaw : ''));
  const phoneRaw = body.phone !== undefined ? body.phone : (current?.phone || (['SMS', 'PHONE'].includes(methodRaw) ? valueRaw : ''));
  const emailEnabledRaw = body.email_enabled !== undefined ? body.email_enabled : (current?.email_enabled !== undefined ? current.email_enabled : 1);
  const smsEnabledRaw = body.sms_enabled !== undefined ? body.sms_enabled : (current?.sms_enabled !== undefined ? current.sms_enabled : 1);
  const consentStatusRaw = body.consent_status !== undefined ? body.consent_status : (current?.consent_status || 'GRANTED');

  const errors: Record<string, string> = {};
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
  const relationship = typeof relationshipRaw === 'string' ? relationshipRaw.trim() : '';
  let contactMethod = typeof methodRaw === 'string' ? methodRaw.trim().toUpperCase() : '';
  const status = typeof statusRaw === 'string' ? statusRaw.trim().toUpperCase() : 'ACTIVE';

  if (contactMethod === 'PHONE') contactMethod = 'SMS';

  if (!name) errors.name = 'Enter the contact’s full name.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (!relationship) errors.relationship = 'Enter the relationship.';
  else if (relationship.length > 80) errors.relationship = 'Relationship must be 80 characters or fewer.';
  if (!['ACTIVE', 'DISABLED', 'INACTIVE'].includes(status)) errors.status = 'Choose a valid contact status.';

  let email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
  let phone = typeof phoneRaw === 'string' ? phoneRaw.trim() : '';

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      errors.email = 'Enter a valid email address.';
    }
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = 'Enter a valid phone number with 7 to 15 digits.';
    } else {
      phone = phone.startsWith('+') ? `+${digits}` : `+${digits}`;
    }
  }

  // Legacy fallback if valueRaw provided but email/phone empty
  if (!email && !phone) {
    const val = typeof valueRaw === 'string' ? valueRaw.trim() : '';
    if (contactMethod === 'EMAIL') {
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.email = 'Enter a valid email address.';
      else email = val.toLowerCase();
    } else {
      const digits = val.replace(/\D/g, '');
      if (!val || digits.length < 7 || digits.length > 15) errors.phone = 'Enter a valid phone number with 7 to 15 digits.';
      else phone = val.startsWith('+') ? `+${digits}` : `+${digits}`;
    }
  }

  if (!email && !phone) {
    errors.contact_value = 'Provide at least a valid email address or phone number.';
  }

  const primaryValue = email || phone || '';
  const primaryMethod = email ? 'EMAIL' : 'SMS';
  const telegramEnabledRaw = body.telegram_enabled !== undefined ? body.telegram_enabled : (current?.telegram_enabled !== undefined ? current.telegram_enabled : 1);

  return {
    errors,
    values: {
      name,
      relationship,
      contact_method: contactMethod || primaryMethod,
      contact_value: primaryValue,
      email: email || null,
      phone: phone || null,
      email_enabled: emailEnabledRaw ? 1 : 0,
      sms_enabled: 0,
      telegram_enabled: telegramEnabledRaw !== undefined ? (telegramEnabledRaw ? 1 : 0) : (current?.telegram_enabled ?? 1),
      consent_status: consentStatusRaw === 'REVOKED' ? 'REVOKED' : 'GRANTED',
      status: ['DISABLED', 'INACTIVE'].includes(status) ? 'DISABLED' : 'ACTIVE'
    }
  };
}

app.get('/api/contacts', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM trusted_contacts WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (error) {
    console.error('Trusted contacts retrieval failed:', error);
    res.status(500).json({ error: 'Unable to retrieve trusted contacts' });
  }
});

app.post('/api/contacts', authenticateToken, async (req: any, res: any) => {
  try {
    const { errors, values } = buildTrustedContactValues(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the contact details and try again.', fields: errors });

    const existing = await db.execute({
      sql: "SELECT id, email, phone, contact_value FROM trusted_contacts WHERE user_id = ? AND status != 'DISABLED'",
      args: [req.user.id]
    });

    const duplicate = existing.rows.some((contact: any) => {
      const emailMatch = values.email && contact.email && contact.email.toLowerCase() === values.email.toLowerCase();
      const phoneMatch = values.phone && contact.phone && contact.phone.replace(/\D/g, '') === values.phone.replace(/\D/g, '');
      return emailMatch || phoneMatch;
    });

    if (duplicate) return res.status(409).json({ error: 'An active contact with this email address or phone number already exists.' });

    const now = new Date().toISOString();
    const result = await db.execute({
      sql: `INSERT INTO trusted_contacts 
            (user_id, name, relationship, contact_method, contact_value, email, phone, email_enabled, sms_enabled, telegram_enabled, consent_status, consent_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        req.user.id,
        values.name,
        values.relationship,
        values.contact_method,
        values.contact_value,
        values.email,
        values.phone,
        values.email_enabled,
        values.telegram_enabled,
        values.consent_status,
        now,
        values.status,
        now,
        now
      ]
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Trusted contact creation failed:', error);
    res.status(500).json({ error: 'Unable to save the trusted contact' });
  }
});

app.put('/api/contacts/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const contactId = Number(req.params.id);
    if (!Number.isSafeInteger(contactId) || contactId <= 0) return res.status(400).json({ error: 'Invalid contact ID' });

    const currentResult = await db.execute({
      sql: 'SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?',
      args: [contactId, req.user.id]
    });
    const current = currentResult.rows[0];
    if (!current) return res.status(404).json({ error: 'Contact not found' });

    const { errors, values } = buildTrustedContactValues(req.body || {}, current);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the contact details and try again.', fields: errors });

    const existing = await db.execute({
      sql: "SELECT id, email, phone, contact_value FROM trusted_contacts WHERE user_id = ? AND id != ? AND status != 'DISABLED'",
      args: [req.user.id, contactId]
    });

    const duplicate = existing.rows.some((contact: any) => {
      const emailMatch = values.email && contact.email && contact.email.toLowerCase() === values.email.toLowerCase();
      const phoneMatch = values.phone && contact.phone && contact.phone.replace(/\D/g, '') === values.phone.replace(/\D/g, '');
      return emailMatch || phoneMatch;
    });

    if (duplicate) return res.status(409).json({ error: 'Another active contact with this email address or phone number already exists.' });

    const now = new Date().toISOString();
    const result = await db.execute({
      sql: `UPDATE trusted_contacts 
            SET name = ?, relationship = ?, contact_method = ?, contact_value = ?, email = ?, phone = ?, email_enabled = ?, telegram_enabled = ?, consent_status = ?, status = ?, updated_at = ?
            WHERE id = ? AND user_id = ? RETURNING *`,
      args: [
        values.name,
        values.relationship,
        values.contact_method,
        values.contact_value,
        values.email,
        values.phone,
        values.email_enabled,
        values.telegram_enabled,
        values.consent_status,
        values.status,
        now,
        contactId,
        req.user.id
      ]
    });

    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Trusted contact update failed:', error);
    res.status(500).json({ error: 'Unable to update the trusted contact' });
  }
});

app.delete('/api/contacts/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const contactId = Number(req.params.id);
    if (!Number.isSafeInteger(contactId) || contactId <= 0) return res.status(400).json({ error: 'Invalid contact ID' });

    const isPermanent = req.query.permanent === 'true';

    if (isPermanent) {
      // Detach contact from health alerts to preserve alert history integrity
      await db.execute({
        sql: 'UPDATE health_alerts SET contact_id = NULL WHERE contact_id = ? AND user_id = ?',
        args: [contactId, req.user.id]
      });

      const delResult = await db.execute({
        sql: 'DELETE FROM trusted_contacts WHERE id = ? AND user_id = ? RETURNING *',
        args: [contactId, req.user.id]
      });

      if (delResult.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });
      return res.json({ success: true, contact: delResult.rows[0], deletedPermanently: true });
    }

    // Default: deactivation preserves record and stops all future alerts
    const result = await db.execute({
      sql: `UPDATE trusted_contacts SET status = 'DISABLED', updated_at = ? WHERE id = ? AND user_id = ? RETURNING *`,
      args: [new Date().toISOString(), contactId, req.user.id]
    });

    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true, contact: result.rows[0] });
  } catch (error) {
    console.error('Trusted contact deletion failed:', error);
    res.status(500).json({ error: 'Unable to remove or deactivate the trusted contact' });
  }
});

app.get('/api/alerts', authenticateToken, async (req: any, res: any) => {
  try {
    const alertsRes = await db.execute({
      sql: `SELECT a.*, c.name as contact_name
            FROM health_alerts a
            LEFT JOIN trusted_contacts c ON a.contact_id = c.id
            WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 100`,
      args: [req.user.id]
    });

    // Join notification deliveries to return one consolidated alert with nested channel delivery statuses
    const deliveriesRes = await db.execute({
      sql: `SELECT id, alert_id, channel, status, destination, provider, provider_message_id, attempts, delivered_at, error_message, created_at
            FROM notification_deliveries 
            WHERE user_id = ? ORDER BY id ASC`,
      args: [req.user.id]
    });

    const deliveriesByAlert: Record<number, any[]> = {};
    for (const d of deliveriesRes.rows) {
      const aid = Number(d.alert_id);
      if (!deliveriesByAlert[aid]) deliveriesByAlert[aid] = [];
      deliveriesByAlert[aid].push(d);
    }

    const consolidatedAlerts = alertsRes.rows.map((alert: any) => ({
      ...alert,
      deliveries: deliveriesByAlert[Number(alert.id)] || []
    }));

    res.json(consolidatedAlerts);
  } catch (error) {
    console.error('Alert history retrieval failed:', error);
    res.status(500).json({ error: 'Unable to retrieve alert history' });
  }
});

// Mark single alert as read (Phase 15)
app.put('/api/alerts/:id/read', authenticateToken, async (req: any, res: any) => {
  const alertId = req.params.id;
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE health_alerts SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?`,
    args: [now, alertId, req.user.id]
  });
  res.json({ success: true });
});

// Mark all user alerts as read (Phase 15)
app.put('/api/alerts/read-all', authenticateToken, async (req: any, res: any) => {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE health_alerts SET is_read = 1, read_at = ? WHERE user_id = ?`,
    args: [now, req.user.id]
  });
  res.json({ success: true });
});

// --- GLOBAL SEARCH ROUTE (PHASE 14) ---
app.get('/api/search', authenticateToken, async (req: any, res: any) => {
  const query = (req.query.q || '').toString().trim();
  if (!query || query.length < 2) {
    return res.json({ reports: [], measurements: [], medications: [], specialists: [] });
  }

  const likePattern = `%${query}%`;
  const userId = req.user.id;

  try {
    // 1. User's reports
    const reportsRes = await db.execute({
      sql: `SELECT id, filename, report_type, report_date 
            FROM medical_reports 
            WHERE user_id = ? AND (filename LIKE ? OR report_type LIKE ?)
            ORDER BY report_date DESC LIMIT 5`,
      args: [userId, likePattern, likePattern]
    });

    // 2. User's validated measurements
    const measurementsRes = await db.execute({
      sql: `SELECT m.id, m.parameter, m.raw_value, m.unit, r.report_date 
            FROM measurements m 
            JOIN medical_reports r ON m.report_id = r.id 
            WHERE r.user_id = ? AND m.parameter LIKE ?
            ORDER BY r.report_date DESC LIMIT 5`,
      args: [userId, likePattern]
    });

    // 3. User's medications
    const medicationsRes = await db.execute({
      sql: `SELECT id, name, dosage, frequency 
            FROM medications 
            WHERE user_id = ? AND name LIKE ?
            LIMIT 5`,
      args: [userId, likePattern]
    });

    // 4. Healthcare facilities
    const facilitiesRes = await db.execute({
      sql: `SELECT id, name, specialties as specialty, city 
            FROM healthcare_facilities 
            WHERE name LIKE ? OR specialties LIKE ? OR city LIKE ?
            LIMIT 5`,
      args: [likePattern, likePattern, likePattern]
    });

    res.json({
      reports: reportsRes.rows,
      measurements: measurementsRes.rows,
      medications: medicationsRes.rows,
      specialists: facilitiesRes.rows
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to execute global search' });
  }
});

// --- ADMIN ROUTES (PHASE 4 & 16) ---

// 1. USERS
app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const result = await db.execute('SELECT id, email, name, role, status, phone, date_of_birth FROM users ORDER BY id DESC');
  res.json(result.rows);
});

app.put('/api/admin/users/:id/status', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { status } = req.body;
  const result = await db.execute({
    sql: 'UPDATE users SET status = ? WHERE id = ? RETURNING id, email, name, role, status, phone',
    args: [status, req.params.id]
  });
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  
  // If user is suspended/disabled/deleted, immediately revoke all active sessions (Phase 8)
  if (status === 'SUSPENDED' || status === 'DISABLED' || status === 'DELETED') {
    await authService.revokeAllUserSessions(db, Number(req.params.id));
  }

  // Log the action
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['INFO', 'USER_STATUS_CHANGED', `User ${req.params.id} status changed to ${status} by ADMIN ${req.user.id}`, req.user.id, now]
  });
  
  res.json(result.rows[0]);
});

// 2. HEALTHCARE FACILITIES
app.get('/api/admin/facilities', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const now = Date.now();
  if (appCache.facilities.data && (now - appCache.facilities.timestamp < CACHE_TTL_MS)) {
    return res.json(appCache.facilities.data);
  }
  
  const result = await db.execute('SELECT * FROM healthcare_facilities ORDER BY id DESC');
  appCache.facilities = { data: result.rows, timestamp: now };
  res.json(result.rows);
});

// 3. SPECIALTY RULES
app.get('/api/admin/specialty_rules', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const now = Date.now();
  if (appCache.specialtyRules.data && (now - appCache.specialtyRules.timestamp < CACHE_TTL_MS)) {
    return res.json(appCache.specialtyRules.data);
  }
  
  const result = await db.execute('SELECT * FROM specialty_rules ORDER BY id DESC');
  appCache.specialtyRules = { data: result.rows, timestamp: now };
  res.json(result.rows);
});

app.post('/api/admin/specialty_rules', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { domain, specialty, rule_reference, version } = req.body;
  const result = await db.execute({
    sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [domain, specialty, rule_reference, version]
  });
  clearCache('specialtyRules');
  res.json(result.rows[0]);
});

app.put('/api/admin/specialty_rules/:id', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { domain, specialty, rule_reference, version } = req.body;
  const result = await db.execute({
    sql: `UPDATE specialty_rules SET domain = ?, specialty = ?, rule_reference = ?, version = ? WHERE id = ? RETURNING *`,
    args: [domain, specialty, rule_reference, version, req.params.id]
  });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
  clearCache('specialtyRules');
  res.json(result.rows[0]);
});

// --- PHASE 17: REAL SOFTWARE VALIDATION FRAMEWORK ---
app.get('/api/admin/validation', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  try {
    const report = await runSoftwareValidationSuite();
    res.json(report);
  } catch (error: any) {
    console.error('Validation runner error:', error);
    res.status(500).json({ error: 'Failed to generate validation report: ' + (error.message || 'Unknown error') });
  }
});

// 4. SYSTEM LOGS
app.get('/api/admin/logs', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const result = await db.execute('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

app.post('/api/admin/logs', authenticateToken, requireRole('ADMIN'), async (req: any, res: any) => {
  const { level, event_type, message } = req.body;
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *`,
    args: [level || 'INFO', event_type, message, req.user ? req.user.id : null, now]
  });
  res.json(result.rows[0]);
});

async function startServer() {
  await initDb();

  const httpServer = http.createServer(app);

  // Vite middleware for development
  app.use('/api', (req, res, next) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}`, code: 'NOT_FOUND' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler (Phase 19 Security)
  app.use(apiErrorHandler);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
