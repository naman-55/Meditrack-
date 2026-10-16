/**
 * MediTrack Real SMS Delivery Service
 * Delivers urgent emergency alerts to configured trusted contacts via:
 * - Twilio REST API (Native fetch with HTTP Basic Auth)
 * - Strict phone number validation (E.164)
 * - Transparent unconfigured failure reporting
 */

import { envConfig } from '../config/env.js';
import { ClassifiedAlert } from './alertClassification.service.js';

export interface SmsDeliveryResult {
  success: boolean;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  providerMessageId?: string;
  errorMessage?: string;
  provider: string;
}

export interface EmergencySmsPayload {
  toPhone: string;
  recipientName: string;
  patientName?: string;
  alert: ClassifiedAlert;
  isTest?: boolean;
}

/**
 * Standardize and validate phone number into E.164 format
 */
export function validateAndFormatE164(phone: string): { isValid: boolean; formatted: string; error?: string } {
  if (!phone) {
    return { isValid: false, formatted: '', error: 'Phone number is empty' };
  }

  // Remove spaces, hyphens, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // If number doesn't start with '+', add '+' if 10-12 digits and valid
  if (!cleaned.startsWith('+')) {
    // If 10 digits (US/India local), or standard number
    if (cleaned.length === 10) {
      // Default to user's country code or assume international prefix required
      cleaned = `+1${cleaned}`; // Note: E.164 standard recommends explicit country code
    } else {
      cleaned = `+${cleaned}`;
    }
  }

  // E.164 format: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      isValid: false,
      formatted: cleaned,
      error: `Invalid phone format '${phone}'. Must follow international format with country code (e.g. +1234567890 or +919876543210).`
    };
  }

  return { isValid: true, formatted: cleaned };
}

/**
 * Format concise, high-priority emergency SMS content.
 */
function buildEmergencySmsText(payload: EmergencySmsPayload): string {
  const { recipientName, patientName, alert, isTest } = payload;

  if (isTest) {
    return `[TEST ALERT - NO ACTION NEEDED] MediTrack emergency alert system verification for ${recipientName}. Your SMS contact channel is operational.`;
  }

  const patientText = patientName ? ` for ${patientName}` : '';
  const findingText = alert.displayName || alert.parameter;
  const valText = alert.measuredValue ? ` (${alert.measuredValue})` : '';

  return `MEDITRACK CRITICAL ALERT: Concerning clinical finding${patientText}. ${findingText}${valText}. ${alert.recommendedAction.slice(0, 90)}. Open MediTrack to view verified report.`;
}

export const smsDeliveryService = {
  /**
   * Check if SMS provider is properly configured
   */
  isConfigured(): boolean {
    return envConfig.IS_SMS_CONFIGURED;
  },

  /**
   * Send an emergency SMS alert
   */
  async sendEmergencyAlert(payload: EmergencySmsPayload): Promise<SmsDeliveryResult> {
    const phoneCheck = validateAndFormatE164(payload.toPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        deliveryStatus: 'FAILED',
        provider: 'none',
        errorMessage: phoneCheck.error
      };
    }

    const formattedRecipient = phoneCheck.formatted;
    const messageBody = buildEmergencySmsText(payload);

    // 1. Check Twilio configuration
    if (
      !envConfig.TWILIO_ACCOUNT_SID || 
      !envConfig.TWILIO_AUTH_TOKEN || 
      !envConfig.TWILIO_FROM_NUMBER ||
      envConfig.TWILIO_ACCOUNT_SID.includes('your-')
    ) {
      console.warn(`[SmsDeliveryService] Twilio SMS credentials not configured in .env. Skipping external dispatch for ${formattedRecipient}.`);
      return {
        success: false,
        deliveryStatus: 'FAILED',
        provider: 'twilio',
        errorMessage: 'TWILIO_NOT_CONFIGURED: Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER in environment.'
      };
    }

    // 2. Dispatch via Twilio REST API
    try {
      const accountSid = envConfig.TWILIO_ACCOUNT_SID;
      const authToken = envConfig.TWILIO_AUTH_TOKEN;
      const fromNumber = envConfig.TWILIO_FROM_NUMBER;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', formattedRecipient);
      params.append('From', fromNumber);
      params.append('Body', messageBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = resJson?.message || `Twilio HTTP ${response.status}: ${response.statusText}`;
        console.error(`[SmsDeliveryService] Twilio rejected dispatch:`, errorMsg);
        return {
          success: false,
          deliveryStatus: 'FAILED',
          provider: 'twilio',
          errorMessage: errorMsg
        };
      }

      console.log(`[SmsDeliveryService] Twilio accepted SMS. SID: ${resJson.sid}`);
      return {
        success: true,
        deliveryStatus: 'SENT',
        provider: 'twilio',
        providerMessageId: resJson.sid
      };
    } catch (err: any) {
      console.error(`[SmsDeliveryService] Network or dispatch error:`, err);
      return {
        success: false,
        deliveryStatus: 'FAILED',
        provider: 'twilio',
        errorMessage: err.message || 'Twilio connection failure'
      };
    }
  }
};
