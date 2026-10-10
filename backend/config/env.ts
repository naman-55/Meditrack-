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
  GEMINI_API_KEY?: string;
  IS_GEMINI_CONFIGURED: boolean;
  GOOGLE_MAPS_API_KEY?: string;
  IS_MAPS_CONFIGURED: boolean;
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
    EMAIL_PROVIDER: emailProvider,
    GEMINI_API_KEY: isGeminiConfigured ? rawGeminiKey : undefined,
    IS_GEMINI_CONFIGURED: isGeminiConfigured,
    GOOGLE_MAPS_API_KEY: isMapsConfigured ? rawMapsKey : undefined,
    IS_MAPS_CONFIGURED: isMapsConfigured
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
    emailProvider: envConfig.EMAIL_PROVIDER
  };
}


