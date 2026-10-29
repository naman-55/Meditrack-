import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from workspace root
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env'),
  quiet: true,
  override: true
});

export interface AppEnvConfig {
  NODE_ENV: string;
  IS_PRODUCTION: boolean;
  PORT: number;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ACCESS_TOKEN_TTL: string;
  ACCESS_TOKEN_EXPIRES_IN_SEC: number;
  REFRESH_TOKEN_DAYS: number;
  REFRESH_TOKEN_MS: number;
  ALLOWED_ORIGINS: string[];
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: number;
  PASSWORD_RESET_RATE_LIMIT: number;
  FRONTEND_URL: string;
  EMAIL_PROVIDER: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  EMAIL_FROM: string;
  IS_EMAIL_CONFIGURED: boolean;
  SMS_PROVIDER: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  IS_SMS_CONFIGURED: boolean;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  IS_PUSH_CONFIGURED: boolean;
  GEMINI_API_KEY?: string;
  IS_GEMINI_CONFIGURED: boolean;
  GOOGLE_MAPS_API_KEY?: string;
  IS_MAPS_CONFIGURED: boolean;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI: string;
  IS_GMAIL_OAUTH_CONFIGURED: boolean;
  NOTIFICATION_MODE: 'gmail-only' | 'gmail-and-telegram' | 'all';
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_WEBHOOK_URL?: string;
  APP_BASE_URL: string;
  IS_TELEGRAM_CONFIGURED: boolean;
}

function getValidatedConfig(): AppEnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  let jwtSecret = process.env.JWT_SECRET;

  if (isProduction && (!jwtSecret || jwtSecret.trim().length < 32 || jwtSecret.includes('your-strong-random-jwt-secret-here'))) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be explicitly configured with at least 32 characters in production.');
  }

  if (!jwtSecret || jwtSecret.trim().length < 32) {
    // Robust high-entropy key for dev/cloud preview when .env is omitted or in dev mode
    jwtSecret = process.env.JWT_SECRET || 'meditrack-sec-vault-jwt-9f82b71e843c0a52d71e9841f238b0e';
  }

  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000';
  const allowedOrigins = allowedOriginsRaw.split(',').map((o) => o.trim()).filter(Boolean);

  const tokenExpiryMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || '30', 10);
  const resetRateLimit = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT || '3', 10);
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const emailProvider = process.env.EMAIL_PROVIDER || (isProduction ? 'smtp' : 'console');

  const rawGeminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isGeminiConfigured = rawGeminiKey.length > 0 && !rawGeminiKey.includes('your-');

  const rawMapsKey = (process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const isMapsConfigured = rawMapsKey.length > 0 && !rawMapsKey.includes('your-');

  // Notification Providers Config
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const sendgridApiKey = (process.env.SENDGRID_API_KEY || '').trim();
  const emailFrom = process.env.EMAIL_FROM || 'MediTrack Health Alerts <alerts@meditrack.health>';
  const isEmailConfigured = (resendApiKey.length > 10 && !resendApiKey.includes('your-')) ||
                            (sendgridApiKey.length > 10 && !sendgridApiKey.includes('your-'));

  const smsProvider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
  const twilioAccountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioAuthToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioPhoneNumber = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || '').trim();
  const isSmsConfigured = twilioAccountSid.startsWith('AC') && twilioAuthToken.length > 10 && twilioPhoneNumber.length > 5;

  // Web Push VAPID Configuration
  const vapidPublicKey = (process.env.VAPID_PUBLIC_KEY || 'BLIBxJOLLsQgUWbPBZ_wN57YKWusriSo9vH5uI3n4JPq2BttdjuUuhn8Lelm6EUhzc39oASBMTqNQP3qDtch6G0').trim();
  const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '0bZT9N8NwIMcLipvYogo0vJIqrLR0AQqiGluRqXORNo').trim();
  const vapidSubject = (process.env.VAPID_SUBJECT || 'mailto:support@meditrack.health').trim();
  const isPushConfigured = vapidPublicKey.length > 20 && vapidPrivateKey.length > 20;

  // Google OAuth Configuration for Gmail Integration
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const googleRedirectUri = (process.env.GOOGLE_REDIRECT_URI || `${frontendUrl}/api/notifications/gmail/callback`).trim();
  const isGmailOAuthConfigured = googleClientId.length > 5 && googleClientSecret.length > 5;
  const notificationMode = (process.env.NOTIFICATION_MODE || 'gmail-and-telegram') as 'gmail-only' | 'gmail-and-telegram' | 'all';

  // Telegram Bot Configuration
  const telegramBotToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const telegramBotUsername = (process.env.TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '');
  const telegramWebhookSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  const telegramWebhookUrl = (process.env.TELEGRAM_WEBHOOK_URL || '').trim();
  const appBaseUrl = (process.env.APP_BASE_URL || frontendUrl || 'http://localhost:3000').trim();
  const isTelegramConfigured = telegramBotToken.length > 10;

  return {
    NODE_ENV: nodeEnv,
    IS_PRODUCTION: isProduction,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: process.env.JWT_ISSUER || 'meditrack-api',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'meditrack-client',
    ACCESS_TOKEN_TTL: '15m',
    ACCESS_TOKEN_EXPIRES_IN_SEC: 15 * 60, // 900 seconds
    REFRESH_TOKEN_DAYS: 7,
    REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    ALLOWED_ORIGINS: allowedOrigins,
    PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: isNaN(tokenExpiryMinutes) ? 30 : tokenExpiryMinutes,
    PASSWORD_RESET_RATE_LIMIT: isNaN(resetRateLimit) ? 3 : resetRateLimit,
    FRONTEND_URL: frontendUrl,
    EMAIL_PROVIDER: 'gmail',
    RESEND_API_KEY: resendApiKey || undefined,
    SENDGRID_API_KEY: sendgridApiKey || undefined,
    EMAIL_FROM: emailFrom,
    IS_EMAIL_CONFIGURED: isGmailOAuthConfigured,
    SMS_PROVIDER: 'disabled',
    TWILIO_ACCOUNT_SID: undefined,
    TWILIO_AUTH_TOKEN: undefined,
    TWILIO_PHONE_NUMBER: undefined,
    IS_SMS_CONFIGURED: false, // SMS replaced with Telegram
    VAPID_PUBLIC_KEY: vapidPublicKey,
    VAPID_PRIVATE_KEY: vapidPrivateKey,
    VAPID_SUBJECT: vapidSubject,
    IS_PUSH_CONFIGURED: false,
    GEMINI_API_KEY: isGeminiConfigured ? rawGeminiKey : undefined,
    IS_GEMINI_CONFIGURED: isGeminiConfigured,
    GOOGLE_MAPS_API_KEY: isMapsConfigured ? rawMapsKey : undefined,
    IS_MAPS_CONFIGURED: isMapsConfigured,
    GOOGLE_CLIENT_ID: googleClientId || undefined,
    GOOGLE_CLIENT_SECRET: googleClientSecret || undefined,
    GOOGLE_REDIRECT_URI: googleRedirectUri,
    IS_GMAIL_OAUTH_CONFIGURED: isGmailOAuthConfigured,
    NOTIFICATION_MODE: notificationMode,
    TELEGRAM_BOT_TOKEN: telegramBotToken || undefined,
    TELEGRAM_BOT_USERNAME: telegramBotUsername || undefined,
    TELEGRAM_WEBHOOK_SECRET: telegramWebhookSecret || undefined,
    TELEGRAM_WEBHOOK_URL: telegramWebhookUrl || undefined,
    APP_BASE_URL: appBaseUrl,
    IS_TELEGRAM_CONFIGURED: isTelegramConfigured
  };
}

export const envConfig = getValidatedConfig();
export const JWT_SECRET = envConfig.JWT_SECRET;

export function getEnvironmentDiagnostics() {
  return {
    environment: envConfig.NODE_ENV,
    port: envConfig.PORT,
    corsOriginsCount: envConfig.ALLOWED_ORIGINS.length,
    authConfigured: !!envConfig.JWT_SECRET,
    geminiConfigured: envConfig.IS_GEMINI_CONFIGURED,
    mapsConfigured: envConfig.IS_MAPS_CONFIGURED,
    gmailOAuthConfigured: envConfig.IS_GMAIL_OAUTH_CONFIGURED,
    notificationMode: envConfig.NOTIFICATION_MODE,
    emailConfigured: envConfig.IS_EMAIL_CONFIGURED,
    emailProvider: 'gmail',
    telegramConfigured: envConfig.IS_TELEGRAM_CONFIGURED,
    telegramBot: envConfig.TELEGRAM_BOT_USERNAME ? `@${envConfig.TELEGRAM_BOT_USERNAME}` : (envConfig.IS_TELEGRAM_CONFIGURED ? 'Configured' : 'Missing Token'),
    smsConfigured: false,
    smsProvider: 'disabled (replaced with Telegram Bot)',
    pushConfigured: false
  };
}


