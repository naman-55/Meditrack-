import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message: string;
  code: string;
}

function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitRecord>();

  // Background cleanup every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
    const userId = (req as any).user?.id ? `user_${(req as any).user.id}` : '';
    const key = userId || `ip_${clientIp}`;

    const now = Date.now();
    const record = store.get(key) || { count: 0, resetAt: now + options.windowMs };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + options.windowMs;
    } else {
      record.count++;
    }

    store.set(key, record);

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > options.maxRequests) {
      return res.status(429).json({
        error: options.message,
        code: options.code,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000)
      });
    }

    next();
  };
}

// Authentication rate limiter removed per user request: unlimited attempts allowed
export const authRateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

// File upload: 10 uploads per 10 minutes
export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  message: 'Upload frequency exceeded. Please wait a few minutes before uploading more documents.',
  code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
});

// AI Processing & OCR: 15 requests per 10 minutes per user/IP
export const aiRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 15,
  message: 'AI document analysis limit reached. Please wait a few minutes to protect system resources.',
  code: 'AI_RATE_LIMIT_EXCEEDED'
});

// Conversational Chat Assistant: 60 requests per 5 minutes per user/IP
export const chatRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many messages sent. Please wait a moment before sending another message.',
  code: 'CHAT_RATE_LIMIT_EXCEEDED'
});

// General API: 300 requests per 5 minutes
export const generalRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 300,
  message: 'Too many requests. Please slow down.',
  code: 'RATE_LIMIT_EXCEEDED'
});

/**
 * Dedicated Password Reset Rate Limiter
 * Enforces dual constraints:
 * - Max 3 requests per email per hour
 * - Max 5 requests per IP per hour
 */
interface ResetAttemptStore {
  count: number;
  resetAt: number;
}

const emailResetStore = new Map<string, ResetAttemptStore>();
const ipResetStore = new Map<string, ResetAttemptStore>();

// Background cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of emailResetStore.entries()) {
    if (now > record.resetAt) emailResetStore.delete(key);
  }
  for (const [key, record] of ipResetStore.entries()) {
    if (now > record.resetAt) ipResetStore.delete(key);
  }
}, 10 * 60 * 1000).unref();

export const passwordResetRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxEmailRequests = 3;
  const maxIpRequests = 5;
  const now = Date.now();

  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
  const rawEmail = req.body?.email;
  const normalizedEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  // Check IP limit
  const ipKey = `ip_${clientIp}`;
  const ipRecord = ipResetStore.get(ipKey) || { count: 0, resetAt: now + windowMs };
  if (now > ipRecord.resetAt) {
    ipRecord.count = 1;
    ipRecord.resetAt = now + windowMs;
  } else {
    ipRecord.count++;
  }
  ipResetStore.set(ipKey, ipRecord);

  if (ipRecord.count > maxIpRequests) {
    return res.status(429).json({
      error: 'Too many password reset requests from this IP address. Please wait an hour before trying again.',
      code: 'PASSWORD_RESET_IP_LIMIT_EXCEEDED',
      retryAfterSeconds: Math.ceil((ipRecord.resetAt - now) / 1000)
    });
  }

  // Check Email limit if email provided
  if (normalizedEmail) {
    const emailKey = `email_${normalizedEmail}`;
    const emailRecord = emailResetStore.get(emailKey) || { count: 0, resetAt: now + windowMs };
    if (now > emailRecord.resetAt) {
      emailRecord.count = 1;
      emailRecord.resetAt = now + windowMs;
    } else {
      emailRecord.count++;
    }
    emailResetStore.set(emailKey, emailRecord);

    if (emailRecord.count > maxEmailRequests) {
      return res.status(429).json({
        error: 'Too many password reset requests for this email address. Please check your inbox or wait an hour before requesting another link.',
        code: 'PASSWORD_RESET_EMAIL_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.ceil((emailRecord.resetAt - now) / 1000)
      });
    }
  }

  next();
};

