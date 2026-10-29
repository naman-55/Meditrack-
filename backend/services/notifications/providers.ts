import webpush from 'web-push';
import { envConfig } from '../../config/env.js';
import { sendGmailEmail } from './gmailService.js';

export interface ProviderDeliveryResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  threadId?: string;
  status: 'ACCEPTED' | 'DELIVERED' | 'SENT' | 'FAILED' | 'SKIPPED';
  isTransient?: boolean;
  error?: string;
  details?: any;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SmsPayload {
  to: string;
  body: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  subscription: PushSubscriptionData;
  title: string;
  body: string;
  data: Record<string, any>;
}

// Initialize web-push VAPID details if configured
if (envConfig.IS_PUSH_CONFIGURED) {
  try {
    webpush.setVapidDetails(
      envConfig.VAPID_SUBJECT,
      envConfig.VAPID_PUBLIC_KEY,
      envConfig.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error('Failed to initialize web-push VAPID configuration:', err);
  }
}

/**
 * Validates standard email address syntax according to RFC 5322.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Normalizes phone number to international E.164 format.
 * Returns null if invalid.
 */
export function normalizePhoneToE164(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  if (hasPlus) {
    return `+${digits}`;
  }

  // If 10 digits without country code, default to US/CA +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Otherwise assume user entered country code + number without +
  return `+${digits}`;
}

/**
 * Sends an email exclusively via Google Gmail API v1 using user-authorized OAuth 2.0.
 * In Gmail-only mode, third-party providers (Resend, SendGrid) are not called.
 */
export async function sendEmail(
  payload: EmailPayload,
  userId?: number,
  db?: any
): Promise<ProviderDeliveryResult> {
  const normalizedTo = payload.to.trim().toLowerCase();
  if (!isValidEmail(normalizedTo)) {
    return {
      success: false,
      provider: 'GMAIL_API',
      status: 'FAILED',
      isTransient: false,
      error: `Invalid destination email address: ${payload.to}`
    };
  }

  if (userId && db) {
    return await sendGmailEmail(userId, db, {
      to: normalizedTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    });
  }

  return {
    success: false,
    provider: 'GMAIL_API',
    status: 'FAILED',
    isTransient: false,
    error: 'User context and database instance required to dispatch via Gmail OAuth.'
  };
}

export { sendTelegramMessage } from './telegramService.js';

/**
 * SMS notifications are permanently removed and replaced with the official Telegram Bot API.
 * Twilio is never called; any invocation returns SKIPPED.
 */
export async function sendSms(payload: SmsPayload): Promise<ProviderDeliveryResult> {
  return {
    success: false,
    provider: 'twilio',
    status: 'SKIPPED',
    isTransient: false,
    error: 'SMS channel has been decommissioned and replaced with official Telegram Bot notifications.'
  };
}

/**
 * Browser push notifications are disabled.
 */
export async function sendPush(payload: PushPayload): Promise<ProviderDeliveryResult> {
  return {
    success: false,
    provider: 'web-push',
    status: 'SKIPPED',
    isTransient: false,
    error: 'Browser push notifications are currently inactive.'
  };
}
