import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { envConfig, JWT_SECRET } from '../config/env.js';

export interface UserTokenPayload {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  status: string;
}

export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

export const generateSecureRandomToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateAccessToken = (user: UserTokenPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      type: 'access'
    },
    JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: envConfig.JWT_ISSUER,
      audience: envConfig.JWT_AUDIENCE
    }
  );
};

export interface SessionRecord {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

export const authService = {
  createSession: async (
    db: any,
    userId: number,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ rawRefreshToken: string; sessionId: number; expiresAt: string }> => {
    const rawRefreshToken = generateSecureRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + envConfig.REFRESH_TOKEN_MS).toISOString();
    const createdAt = now.toISOString();

    const result = await db.execute({
      sql: `INSERT INTO auth_sessions (user_id, refresh_token_hash, created_at, expires_at, last_used_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [userId, tokenHash, createdAt, expiresAt, createdAt, userAgent || null, ipAddress || null]
    });

    const sessionId = result.rows[0].id as number;
    return { rawRefreshToken, sessionId, expiresAt };
  },

  findSessionByRefreshToken: async (db: any, rawRefreshToken: string): Promise<SessionRecord | null> => {
    const tokenHash = hashToken(rawRefreshToken);
    const result = await db.execute({
      sql: `SELECT * FROM auth_sessions WHERE refresh_token_hash = ?`,
      args: [tokenHash]
    });

    if (result.rows.length === 0) return null;
    return result.rows[0] as unknown as SessionRecord;
  },

  rotateSession: async (
    db: any,
    sessionId: number,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ newRawRefreshToken: string; expiresAt: string }> => {
    const newRawRefreshToken = generateSecureRandomToken(40);
    const newTokenHash = hashToken(newRawRefreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + envConfig.REFRESH_TOKEN_MS).toISOString();
    const lastUsedAt = now.toISOString();

    await db.execute({
      sql: `UPDATE auth_sessions 
            SET refresh_token_hash = ?, expires_at = ?, last_used_at = ?, user_agent = ?, ip_address = ?
            WHERE id = ?`,
      args: [newTokenHash, expiresAt, lastUsedAt, userAgent || null, ipAddress || null, sessionId]
    });

    return { newRawRefreshToken, expiresAt };
  },

  revokeSession: async (db: any, sessionId: number): Promise<void> => {
    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE auth_sessions SET revoked_at = ? WHERE id = ?`,
      args: [now, sessionId]
    });
  },

  revokeAllUserSessions: async (db: any, userId: number): Promise<void> => {
    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
      args: [now, userId]
    });
  },

  createPasswordResetToken: async (
    db: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ rawToken: string; expiresAt: string }> => {
    // Invalidate existing active tokens for this user
    await db.execute({
      sql: `UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL`,
      args: [userId]
    });

    const rawToken = generateSecureRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    // Configurable expiration from envConfig (e.g. 30 minutes)
    const expiryMinutes = envConfig.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || 30;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString();
    const createdAt = now.toISOString();

    await db.execute({
      sql: `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at, request_ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, tokenHash, expiresAt, createdAt, ipAddress || null, userAgent || null]
    });

    return { rawToken, expiresAt };
  },

  verifyPasswordResetToken: async (
    db: any,
    rawToken: string
  ): Promise<{ valid: boolean; tokenRecord?: any; user?: any; error?: string }> => {
    if (!rawToken || typeof rawToken !== 'string') {
      return { valid: false, error: 'Token is required' };
    }

    const tokenHash = hashToken(rawToken);
    const result = await db.execute({
      sql: `SELECT * FROM password_reset_tokens WHERE token_hash = ?`,
      args: [tokenHash]
    });

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid or unrecognized reset token' };
    }

    const tokenRecord = result.rows[0];
    if (tokenRecord.used_at) {
      return { valid: false, error: 'This reset token has already been used' };
    }

    const now = new Date();
    const expiry = new Date(tokenRecord.expires_at as string);
    if (now > expiry) {
      return { valid: false, error: 'This reset token has expired. Please request a new one.' };
    }

    const userResult = await db.execute({
      sql: `SELECT id, email, name, role, status FROM users WHERE id = ?`,
      args: [tokenRecord.user_id]
    });

    if (userResult.rows.length === 0) {
      return { valid: false, error: 'User account not found' };
    }

    const user = userResult.rows[0];
    if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      return { valid: false, error: 'Account is suspended or deactivated.' };
    }

    return { valid: true, tokenRecord, user };
  }
};
