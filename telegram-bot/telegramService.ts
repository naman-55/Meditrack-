import crypto from 'crypto';
import { envConfig } from '../backend/config/env.js';
import { aiService } from '../backend/services/ai.service.js';
import { evaluateRiskAllDomains, MeasurementRecord } from '../riskEngine.js';

export interface TelegramSendResult {
  success: boolean;
  provider: 'TELEGRAM_BOT_API';
  providerMessageId?: string;
  chatId?: string;
  status: 'ACCEPTED' | 'FAILED' | 'SKIPPED';
  isTransient?: boolean;
  error?: string;
  details?: any;
}

export interface TelegramStatus {
  configured: boolean;
  botUsername: string | null;
  provider: 'TELEGRAM_BOT_API';
  userEnabled: boolean;
  linkedContactsCount: number;
  webhookConfigured: boolean;
  missingSetup: string[];
  webhookInfo?: any;
}

export interface TelegramIdentity {
  isLinked: boolean;
  type?: 'USER' | 'CONTACT';
  userId?: number;
  contactId?: number;
  userName?: string;
  patientId?: string;
  patientName?: string;
  relationship?: string;
  consentGranted?: boolean;
  telegramEnabled?: boolean;
}

export interface ClinicalContextData {
  patientId: string;
  patientName: string;
  relationship?: string;
  latestReports: Array<{ id: number; filename: string; report_date: string }>;
  measurements: Array<{ parameter: string; value: string; unit: string; reportDate: string; filename: string }>;
  recentAlerts: Array<{ id: number; severity: string; title: string; message: string; date: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string; timeOfDay?: string }>;
  risks: Array<{ domain: string; level: string; label: string; explanation: string; action: string }>;
  trends: Array<{ parameter: string; direction: string; details: string }>;
}

/**
 * Strips sensitive bot tokens from any error message or string before logging or returning.
 */
export function sanitizeTelegramLog(text: string): string {
  if (!text) return '';
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (token && token.length > 5) {
    return text.split(token).join('[REDACTED_BOT_TOKEN]');
  }
  return text.replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot[REDACTED_BOT_TOKEN]');
}

/**
 * Helper to escape HTML tags for Telegram HTML parse mode.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * In-memory sliding window rate limiter for incoming chat messages (25 msgs/min per chat).
 */
const chatRateLimits = new Map<string, number[]>();
function checkRateLimit(chatId: string, maxPerMinute = 25): boolean {
  const now = Date.now();
  const timestamps = chatRateLimits.get(chatId) || [];
  const windowStart = now - 60000;
  const recent = timestamps.filter(t => t > windowStart);
  if (recent.length >= maxPerMinute) {
    return false;
  }
  recent.push(now);
  chatRateLimits.set(chatId, recent);
  return true;
}

/**
 * Cached bot username to avoid repeated getMe calls.
 */
let cachedBotUsername: string | null = null;

/**
 * Retrieves the Telegram bot username, querying getMe if not statically configured.
 */
export async function getBotUsername(): Promise<string | null> {
  if (envConfig.TELEGRAM_BOT_USERNAME) {
    return envConfig.TELEGRAM_BOT_USERNAME;
  }
  if (cachedBotUsername) {
    return cachedBotUsername;
  }
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.ok && data.result?.username) {
        cachedBotUsername = data.result.username;
        return cachedBotUsername;
      }
    }
  } catch (err) {
    // Non-fatal, fallback to null
  }
  return null;
}

/**
 * Sends a real message using the official Telegram Bot API:
 * POST https://api.telegram.org/bot<TOKEN>/sendMessage
 * 
 * Bot token is strictly kept server-side and never leaked in logs, client responses, or errors.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
  }
): Promise<TelegramSendResult> {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return {
      success: false,
      provider: 'TELEGRAM_BOT_API',
      status: 'FAILED',
      isTransient: false,
      error: 'TELEGRAM_BOT_TOKEN is not configured on the server. Please set it in server environment.'
    };
  }

  const normalizedChatId = String(chatId).trim();
  if (!normalizedChatId) {
    return {
      success: false,
      provider: 'TELEGRAM_BOT_API',
      status: 'FAILED',
      isTransient: false,
      error: 'Destination Telegram chat ID is missing or invalid.'
    };
  }

  // Telegram message text limit is 4096 characters (RFC limit)
  let safeText = text;
  if (safeText.length > 4096) {
    safeText = safeText.substring(0, 4080) + '…\n\n<i>[Message truncated to fit Telegram limit]</i>';
  }

  const payload: Record<string, any> = {
    chat_id: normalizedChatId,
    text: safeText,
    parse_mode: options?.parseMode || 'HTML',
    disable_web_page_preview: options?.disableWebPagePreview ?? false
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData: any = await response.json();

    if (!response.ok || !responseData.ok) {
      const statusCode = response.status;
      const errorCode = responseData.error_code || statusCode;
      const description = responseData.description || `HTTP ${statusCode}`;
      const isBlocked = errorCode === 403;
      const isChatNotFound = errorCode === 400 && description.toLowerCase().includes('chat not found');
      const isRateLimited = errorCode === 429;
      const isTransient = isRateLimited || statusCode >= 500;

      let humanError = description;
      if (isBlocked) {
        humanError = 'Telegram bot was blocked by the contact or the conversation was stopped.';
      } else if (isChatNotFound) {
        humanError = 'Telegram chat not found. The contact must start the bot using their connection link first.';
      } else if (isRateLimited) {
        humanError = `Telegram API rate limit reached. Retry after ${responseData.parameters?.retry_after || 'a few'} seconds.`;
      }

      return {
        success: false,
        provider: 'TELEGRAM_BOT_API',
        chatId: normalizedChatId,
        status: 'FAILED',
        isTransient,
        error: sanitizeTelegramLog(humanError),
        details: {
          errorCode,
          description: sanitizeTelegramLog(description),
          retryAfter: responseData.parameters?.retry_after
        }
      };
    }

    // Success: Telegram accepted the message and assigned a message ID
    const msgId = String(responseData.result?.message_id);
    return {
      success: true,
      provider: 'TELEGRAM_BOT_API',
      providerMessageId: msgId,
      chatId: normalizedChatId,
      status: 'ACCEPTED',
      details: {
        messageId: msgId,
        chat: responseData.result?.chat
      }
    };
  } catch (netErr: any) {
    return {
      success: false,
      provider: 'TELEGRAM_BOT_API',
      chatId: normalizedChatId,
      status: 'FAILED',
      isTransient: true,
      error: `Network error connecting to Telegram Bot API: ${sanitizeTelegramLog(netErr.message || String(netErr))}`
    };
  }
}

/**
 * Resolves whether an incoming Telegram chat ID belongs to an authorized Patient User
 * or an authorized Trusted Contact.
 */
export async function resolveTelegramIdentity(chatId: string, db: any): Promise<TelegramIdentity> {
  const normalized = String(chatId).trim();
  if (!normalized) return { isLinked: false };

  // 1. Check if linked as an active Trusted Contact
  try {
    const contactRes = await db.execute({
      sql: `SELECT tc.id as contact_id, tc.user_id, tc.name as contact_name, tc.relationship, 
                   tc.status, tc.consent_status, tc.telegram_enabled, u.name as patient_name
            FROM trusted_contacts tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.telegram_chat_id = ?
            LIMIT 1`,
      args: [normalized]
    });

    if (contactRes.rows.length > 0) {
      const row = contactRes.rows[0];
      const userId = Number(row.user_id);
      return {
        isLinked: true,
        type: 'CONTACT',
        userId,
        contactId: Number(row.contact_id),
        userName: String(row.contact_name),
        patientId: `P-${String(userId).padStart(4, '0')}`,
        patientName: String(row.patient_name),
        relationship: String(row.relationship),
        consentGranted: row.consent_status !== 'REVOKED',
        telegramEnabled: row.telegram_enabled !== 0 && row.status === 'ACTIVE'
      };
    }
  } catch (e) {}

  // 2. Check if linked as a Patient User directly
  try {
    const userRes = await db.execute({
      sql: `SELECT id, name, email, notification_telegram 
            FROM users 
            WHERE telegram_chat_id = ? 
            LIMIT 1`,
      args: [normalized]
    });

    if (userRes.rows.length > 0) {
      const row = userRes.rows[0];
      const userId = Number(row.id);
      return {
        isLinked: true,
        type: 'USER',
        userId,
        userName: String(row.name),
        patientId: `P-${String(userId).padStart(4, '0')}`,
        patientName: String(row.name),
        relationship: 'Self',
        consentGranted: true,
        telegramEnabled: row.notification_telegram !== 0
      };
    }
  } catch (e) {}

  return { isLinked: false };
}

/**
 * Retrieves the permitted clinical data for an authorized patient, strictly parameterizing
 * all queries and enforcing patient boundary isolation.
 */
export async function getPatientClinicalContext(userId: number, db: any): Promise<ClinicalContextData> {
  const patientId = `P-${String(userId).padStart(4, '0')}`;
  let patientName = 'Patient';

  try {
    const uRes = await db.execute({ sql: 'SELECT name FROM users WHERE id = ?', args: [userId] });
    if (uRes.rows.length > 0 && uRes.rows[0].name) patientName = String(uRes.rows[0].name);
  } catch {}

  // 1. Latest medical reports (up to 3)
  const latestReports: ClinicalContextData['latestReports'] = [];
  try {
    const reportsRes = await db.execute({
      sql: 'SELECT id, filename, report_date FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC, id DESC LIMIT 3',
      args: [userId]
    });
    for (const r of reportsRes.rows) {
      latestReports.push({
        id: Number(r.id),
        filename: String(r.filename || 'Report.pdf'),
        report_date: String(r.report_date || 'Unknown')
      });
    }
  } catch {}

  // 2. Measurements / Biomarkers
  const measurements: ClinicalContextData['measurements'] = [];
  try {
    const measRes = await db.execute({
      sql: `SELECT m.parameter, m.normalized_value, m.raw_value, m.unit, r.filename, r.report_date
            FROM measurements m
            JOIN medical_reports r ON m.report_id = r.id
            WHERE r.user_id = ?
            ORDER BY r.report_date DESC, m.id DESC
            LIMIT 25`,
      args: [userId]
    });
    for (const m of measRes.rows) {
      measurements.push({
        parameter: String(m.parameter),
        value: String(m.normalized_value || m.raw_value || 'N/A'),
        unit: String(m.unit || ''),
        reportDate: String(m.report_date || ''),
        filename: String(m.filename || '')
      });
    }
  } catch {}

  // 3. Recent health alerts
  const recentAlerts: ClinicalContextData['recentAlerts'] = [];
  try {
    const alertsRes = await db.execute({
      sql: 'SELECT id, severity, title, message, created_at FROM health_alerts WHERE user_id = ? ORDER BY id DESC LIMIT 5',
      args: [userId]
    });
    for (const a of alertsRes.rows) {
      recentAlerts.push({
        id: Number(a.id),
        severity: String(a.severity || 'MODERATE'),
        title: String(a.title || 'Health Alert'),
        message: String(a.message || ''),
        date: String(a.created_at || '')
      });
    }
  } catch {}

  // 4. Documented medications
  const medications: ClinicalContextData['medications'] = [];
  try {
    const medsRes = await db.execute({
      sql: 'SELECT name, dosage, frequency, time_of_day FROM medications WHERE user_id = ?',
      args: [userId]
    });
    for (const m of medsRes.rows) {
      medications.push({
        name: String(m.name),
        dosage: String(m.dosage || 'Standard'),
        frequency: String(m.frequency || 'Daily'),
        timeOfDay: m.time_of_day ? String(m.time_of_day) : undefined
      });
    }
  } catch {}

  // 5. Risk Assessment (cardiovascular & metabolic)
  const risks: ClinicalContextData['risks'] = [];
  try {
    const riskRes = await db.execute({
      sql: 'SELECT domain, level, label, evidence, created_at FROM risk_assessment WHERE user_id = ? ORDER BY id DESC LIMIT 4',
      args: [userId]
    });
    if (riskRes.rows.length > 0) {
      for (const r of riskRes.rows) {
        let explanation = r.label || 'Assessment documented';
        let action = 'Consult your physician.';
        try {
          const parsed = JSON.parse(String(r.evidence));
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.action) action = parsed.action;
        } catch {}
        risks.push({
          domain: String(r.domain),
          level: String(r.level),
          label: String(r.label || r.level),
          explanation: String(explanation),
          action: String(action)
        });
      }
    } else if (measurements.length > 0) {
      // Evaluate dynamically with the existing risk engine
      const records: MeasurementRecord[] = measurements.map(m => ({
        parameter: m.parameter,
        normalized_value: m.value,
        validation_status: 'VALIDATED',
        report_date: m.reportDate,
        report: m.filename,
        page: '1'
      }));
      const evaluated = evaluateRiskAllDomains(records);
      for (const r of evaluated) {
        let exp = r.label;
        let act = 'Maintain routine checkups.';
        try {
          const p = JSON.parse(r.evidence);
          if (p.explanation) exp = p.explanation;
          if (p.action) act = p.action;
        } catch {}
        risks.push({
          domain: r.domain,
          level: r.level,
          label: r.label,
          explanation: exp,
          action: act
        });
      }
    }
  } catch {}

  // 6. Trends
  const trends: ClinicalContextData['trends'] = [];
  try {
    const trendsRes = await db.execute({
      sql: 'SELECT parameter, direction, evidence FROM trends WHERE user_id = ? ORDER BY id DESC LIMIT 6',
      args: [userId]
    });
    for (const t of trendsRes.rows) {
      trends.push({
        parameter: String(t.parameter),
        direction: String(t.direction),
        details: String(t.evidence || '')
      });
    }
  } catch {}

  return {
    patientId,
    patientName,
    latestReports,
    measurements,
    recentAlerts,
    medications,
    risks,
    trends
  };
}

/**
 * Generates an opaque, single-use, cryptographically random linking token with a 15-minute expiration.
 * Deep link: https://t.me/<BotUsername>?start=<token>
 * 
 * Never contains patient IDs, database IDs, clinical data, or secrets.
 */
export async function generateTelegramLinkingToken(
  userId: number,
  contactId: number | undefined,
  db: any
): Promise<{ token: string; botUsername: string; deepLink: string; expiresAt: string }> {
  const tokenVal = crypto.randomBytes(24).toString('base64url'); // safe for Telegram start payload
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const now = new Date().toISOString();

  // Invalidate any existing unused tokens for this contact/user to prevent replay
  if (contactId) {
    await db.execute({
      sql: `UPDATE telegram_linking_tokens 
            SET consumed_at = ? 
            WHERE user_id = ? AND contact_id = ? AND consumed_at IS NULL`,
      args: [now, userId, contactId]
    });
  } else {
    await db.execute({
      sql: `UPDATE telegram_linking_tokens 
            SET consumed_at = ? 
            WHERE user_id = ? AND contact_id IS NULL AND consumed_at IS NULL`,
      args: [now, userId]
    });
  }

  await db.execute({
    sql: `INSERT INTO telegram_linking_tokens 
          (token, user_id, contact_id, type, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [tokenVal, userId, contactId || null, contactId ? 'CONTACT' : 'USER', expiresAt, now]
  });

  const botUsername = (await getBotUsername()) || 'MediTrackAlertsBot';
  const deepLink = `https://t.me/${botUsername}?start=${tokenVal}`;

  return {
    token: tokenVal,
    botUsername,
    deepLink,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

/**
 * Disconnects Telegram for a trusted contact, clearing chat ID and revoking linking.
 */
export async function disconnectTelegramContact(
  userId: number,
  contactId: number,
  db: any
): Promise<{ success: boolean; message: string }> {
  const contactRes = await db.execute({
    sql: 'SELECT telegram_chat_id, name FROM trusted_contacts WHERE id = ? AND user_id = ?',
    args: [contactId, userId]
  });

  if (contactRes.rows.length === 0) {
    return { success: false, message: 'Contact not found' };
  }

  const existingChatId = contactRes.rows[0].telegram_chat_id;
  if (existingChatId) {
    try {
      await sendTelegramMessage(
        existingChatId,
        `ℹ️ <b>MediTrack Disconnected</b>\n\n` +
        `Your Telegram account has been disconnected from receiving alerts for this contact in MediTrack. You will no longer receive notifications here.`
      );
    } catch {}
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE trusted_contacts 
          SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL, telegram_enabled = 0, updated_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [now, contactId, userId]
  });

  return { success: true, message: 'Telegram contact disconnected successfully.' };
}

/**
 * Disconnects a Patient User's personal Telegram account.
 */
export async function disconnectTelegramUser(
  userId: number,
  db: any
): Promise<{ success: boolean; message: string }> {
  const userRes = await db.execute({
    sql: 'SELECT telegram_chat_id FROM users WHERE id = ?',
    args: [userId]
  });

  const chatId = userRes.rows[0]?.telegram_chat_id;
  if (chatId) {
    try {
      await sendTelegramMessage(
        chatId,
        `ℹ️ <b>Personal Account Disconnected</b>\n\n` +
        `Your Telegram account has been unlinked from your personal MediTrack account. Alerts and assistant features have been stopped.`
      );
    } catch {}
  }

  await db.execute({
    sql: 'UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?',
    args: [userId]
  });

  return { success: true, message: 'Personal Telegram account disconnected.' };
}

/**
 * Formats a clean clinical context string for LLM grounding.
 */
function buildClinicalPromptContext(ctx: ClinicalContextData): string {
  const parts: string[] = [];
  parts.push(`Patient: ${ctx.patientName} (${ctx.patientId})`);

  if (ctx.latestReports.length > 0) {
    parts.push(`Recent Reports: ${ctx.latestReports.map(r => `${r.filename} (Date: ${r.report_date})`).join('; ')}`);
  } else {
    parts.push('Recent Reports: None available in record.');
  }

  if (ctx.measurements.length > 0) {
    const list = ctx.measurements.slice(0, 15).map(m => `${m.parameter}: ${m.value} ${m.unit} [Report: ${m.filename}, Date: ${m.reportDate}]`).join('\n  - ');
    parts.push(`Extracted Biomarkers:\n  - ${list}`);
  } else {
    parts.push('Extracted Biomarkers: No measurements available.');
  }

  if (ctx.recentAlerts.length > 0) {
    const aList = ctx.recentAlerts.map(a => `[${a.severity}] ${a.title}: ${a.message} (${a.date})`).join('\n  - ');
    parts.push(`Recent Health Alerts:\n  - ${aList}`);
  } else {
    parts.push('Recent Health Alerts: None on file.');
  }

  if (ctx.risks.length > 0) {
    const rList = ctx.risks.map(r => `${r.domain.toUpperCase()} Risk: Level ${r.level} (${r.label}) - ${r.explanation} Recommended Next Step: ${r.action}`).join('\n  - ');
    parts.push(`Risk Assessments:\n  - ${rList}`);
  }

  if (ctx.medications.length > 0) {
    const mList = ctx.medications.map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(', ');
    parts.push(`Documented Medications: ${mList}`);
  } else {
    parts.push('Documented Medications: No medications documented in current records.');
  }

  if (ctx.trends.length > 0) {
    const tList = ctx.trends.map(t => `${t.parameter}: ${t.direction}`).join('; ');
    parts.push(`Historical Trends: ${tList}`);
  }

  return parts.join('\n\n');
}

/**
 * Handles conversational natural-language queries using Gemini AI when configured,
 * with an intelligent, fact-grounded fallback synthesizer if AI is offline.
 */
async function handleNaturalLanguageQuery(
  chatId: string,
  userMessage: string,
  identity: TelegramIdentity,
  db: any
): Promise<string> {
  const userId = identity.userId!;
  const clinical = await getPatientClinicalContext(userId, db);

  // 1. Emergency Safety Filter
  const lowerMsg = userMessage.toLowerCase();
  const isEmergency = [
    'chest pain',
    'heart attack',
    'stroke',
    'cannot breathe',
    'cant breathe',
    'difficulty breathing',
    'unconscious',
    'severe bleeding',
    'overdose'
  ].some(term => lowerMsg.includes(term));

  let emergencyPrefix = '';
  if (isEmergency) {
    emergencyPrefix =
      `🚨 <b>CRITICAL EMERGENCY WARNING:</b>\n` +
      `If you or the patient are experiencing acute symptoms like severe chest pain or shortness of breath, ` +
      `<b>please contact emergency medical services immediately (e.g. 911 / 112)</b> or proceed to the nearest emergency room. ` +
      `Do not wait for messaging responses during a medical emergency.\n\n`;
  }

  // 2. Fetch recent conversation history
  const history: Array<{ role: string; content: string }> = [];
  try {
    const convRes = await db.execute({
      sql: 'SELECT role, content FROM telegram_conversations WHERE chat_id = ? ORDER BY id DESC LIMIT 6',
      args: [chatId]
    });
    for (const row of convRes.rows.reverse()) {
      history.push({ role: String(row.role), content: String(row.content) });
    }
  } catch {}

  const clinicalContextText = buildClinicalPromptContext(clinical);

  // 3. Try Google Gemini AI
  if (aiService.isConfigured()) {
    try {
      const aiReply = await aiService.generateChatResponse(userMessage, clinicalContextText, history);
      return emergencyPrefix + escapeHtml(aiReply);
    } catch (err: any) {
      // Fall through to deterministic synthesizer
    }
  }

  // 4. Deterministic Clinical Synthesizer Fallback
  let responseText = '';

  if (lowerMsg.includes('medication') || lowerMsg.includes('drug') || lowerMsg.includes('prescription')) {
    if (clinical.medications.length > 0) {
      const list = clinical.medications.map(m => `• <b>${escapeHtml(m.name)}:</b> ${escapeHtml(m.dosage)} (${escapeHtml(m.frequency)})`).join('\n');
      responseText = `💊 <b>Documented Medications for ${escapeHtml(clinical.patientName)}:</b>\n\n${list}\n\n<i>Note: Always verify with your prescribing physician.</i>`;
    } else {
      responseText = `ℹ️ <b>Medications:</b> No medications are currently documented in ${escapeHtml(clinical.patientName)}'s uploaded medical records.`;
    }
  } else if (lowerMsg.includes('risk') || lowerMsg.includes('cardio') || lowerMsg.includes('metabolic')) {
    if (clinical.risks.length > 0) {
      const rList = clinical.risks.map(r => `• <b>${escapeHtml(r.domain.toUpperCase())}:</b> Level <b>${escapeHtml(r.level)}</b> (${escapeHtml(r.label)})\n  <i>${escapeHtml(r.explanation)}</i>\n  👉 Recommended: ${escapeHtml(r.action)}`).join('\n\n');
      responseText = `📊 <b>Risk Assessment Summary:</b>\n\n${rList}`;
    } else {
      responseText = `ℹ️ <b>Risk Assessment:</b> Insufficient biomarker data to evaluate clinical risk domains. Please upload a comprehensive lab panel in MediTrack.`;
    }
  } else if (lowerMsg.includes('alert') || lowerMsg.includes('why was the latest alert') || lowerMsg.includes('history')) {
    if (clinical.recentAlerts.length > 0) {
      const aList = clinical.recentAlerts.map(a => `• <b>[${escapeHtml(a.severity)}]</b> ${escapeHtml(a.title)}: ${escapeHtml(a.message)} (<i>${new Date(a.date).toLocaleDateString()}</i>)`).join('\n\n');
      responseText = `🚨 <b>Recent Alert History for ${escapeHtml(clinical.patientName)}:</b>\n\n${aList}`;
    } else {
      responseText = `✅ <b>Alert History:</b> No health alerts have been recorded for ${escapeHtml(clinical.patientName)}.`;
    }
  } else if (lowerMsg.includes('trend') || lowerMsg.includes('change') || lowerMsg.includes('between the last two')) {
    if (clinical.trends.length > 0) {
      const tList = clinical.trends.map(t => `• <b>${escapeHtml(t.parameter)}:</b> ${escapeHtml(t.direction)}`).join('\n');
      responseText = `📈 <b>Historical Biomarker Trends:</b>\n\n${tList}`;
    } else {
      responseText = `ℹ️ <b>Historical Trends:</b> No multi-report trends are available yet. Upload at least two consecutive lab panels in MediTrack to compare trajectories.`;
    }
  } else if (lowerMsg.includes('report') || lowerMsg.includes('lab') || lowerMsg.includes('biomarker') || lowerMsg.includes('status')) {
    if (clinical.latestReports.length > 0) {
      const rep = clinical.latestReports[0];
      const meas = clinical.measurements.slice(0, 8).map(m => `• <b>${escapeHtml(m.parameter)}:</b> <code>${escapeHtml(m.value)} ${escapeHtml(m.unit)}</code>`).join('\n');
      responseText =
        `📋 <b>Latest Report Summary:</b>\n` +
        `• <b>File:</b> ${escapeHtml(rep.filename)}\n` +
        `• <b>Date:</b> ${escapeHtml(rep.report_date)}\n\n` +
        `<b>Key Biomarkers:</b>\n${meas || 'No measurements extracted yet.'}\n\n` +
        `<i>View the complete report securely in your MediTrack dashboard.</i>`;
    } else {
      responseText = `ℹ️ <b>Medical Reports:</b> No medical reports are currently uploaded for ${escapeHtml(clinical.patientName)}.`;
    }
  } else {
    responseText =
      `💬 <b>MediTrack Health Assistant</b>\n\n` +
      `I am linked to <b>${escapeHtml(clinical.patientName)}</b> (<code>${escapeHtml(clinical.patientId)}</code>).\n\n` +
      `You can ask me questions about:\n` +
      `• Latest report findings and extracted biomarkers\n` +
      `• Cardiovascular &amp; metabolic risk levels (/risk)\n` +
      `• Documented medications and dosages (/medications)\n` +
      `• Historical trends across reports (/trends)\n` +
      `• Recent health alerts and reasons (/alerts)\n\n` +
      `<i>Type /help to see all available commands.</i>`;
  }

  return emergencyPrefix + responseText;
}

/**
 * Processes incoming Telegram updates (via webhook or polling).
 * Handles all commands (/start, /link, /help, /status, /alerts, /summary, /reports, /trends, /risk, /medications, /contact, /stop)
 * and natural-language health queries.
 */
export async function handleTelegramUpdate(
  update: any,
  db: any
): Promise<{ handled: boolean; action?: string; details?: any; error?: string }> {
  // 1. Update ID deduplication
  const updateId = update?.update_id;
  if (updateId) {
    try {
      const dupRes = await db.execute({
        sql: 'SELECT update_id FROM telegram_processed_updates WHERE update_id = ?',
        args: [updateId]
      });
      if (dupRes.rows.length > 0) {
        return { handled: true, action: 'duplicate_skipped' };
      }
      await db.execute({
        sql: 'INSERT INTO telegram_processed_updates (update_id, processed_at) VALUES (?, ?)',
        args: [updateId, new Date().toISOString()]
      });
    } catch {}
  }

  const message = update?.message || update?.edited_message;
  if (!message || !message.chat) {
    return { handled: false };
  }

  const chatId = String(message.chat.id);
  const fromUsername = message.from?.username || message.chat?.username || null;
  const text = (message.text || '').trim();

  // Rate Limiting
  if (!checkRateLimit(chatId, 30)) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Rate Limit Exceeded</b>\n\nYou are sending messages too quickly. Please pause for a moment before trying again.`
    );
    return { handled: true, action: 'rate_limited' };
  }

  // --- COMMAND 1: /start (With or without linking token) ---
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/);
    const linkingToken = parts[1]?.trim();

    // /start without token: General welcome and instructions
    if (!linkingToken) {
      const identity = await resolveTelegramIdentity(chatId, db);
      if (identity.isLinked) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Welcome back to MediTrack Health Assistant!</b>\n\n` +
          `You are connected to <b>${escapeHtml(identity.patientName || 'Patient')}</b> (<code>${escapeHtml(identity.patientId || '')}</code>).\n\n` +
          `Commands:\n` +
          `• /status — Health status and alert overview\n` +
          `• /summary — Latest medical report summary\n` +
          `• /alerts — Recent health alerts\n` +
          `• /risk — Cardiovascular &amp; metabolic risk assessment\n` +
          `• /reports — List available medical reports\n` +
          `• /trends — Historical biomarker changes\n` +
          `• /medications — Documented medications\n` +
          `• /help — Full command manual\n\n` +
          `You can also ask me questions in plain English, such as: <i>"What was my blood pressure in the last report?"</i>`
        );
        return { handled: true, action: 'start_linked' };
      }

      await sendTelegramMessage(
        chatId,
        `👋 <b>Welcome to MediTrack Intelligent Health Assistant!</b>\n\n` +
        `This bot delivers real-time emergency clinical notifications and answers questions about authorized medical records.\n\n` +
        `<b>To connect this Telegram chat to a MediTrack account:</b>\n` +
        `1. Log into your MediTrack dashboard.\n` +
        `2. Go to <b>Family &amp; Alerts</b>.\n` +
        `3. Click <b>Connect Telegram</b> to generate your secure 15-minute connection link.\n` +
        `4. Tap the link to open this bot and activate alerts.\n\n` +
        `<i>No medical data is shared until an authorized linking link is validated.</i>`
      );
      return { handled: true, action: 'start_without_token' };
    }

    // /start <token>: Process single-use linking token
    const tokenRes = await db.execute({
      sql: 'SELECT * FROM telegram_linking_tokens WHERE token = ?',
      args: [linkingToken]
    });

    if (tokenRes.rows.length === 0) {
      await sendTelegramMessage(
        chatId,
        `❌ <b>Invalid Connection Link</b>\n\n` +
        `This MediTrack linking token is unrecognized or invalid.\n` +
        `Please return to the MediTrack Family &amp; Alerts page and generate a fresh connection link.`
      );
      return { handled: true, action: 'invalid_token', error: 'Token not found' };
    }

    const tokenRecord = tokenRes.rows[0];
    const now = Date.now();
    const nowIso = new Date().toISOString();

    if (tokenRecord.consumed_at) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Connection Link Already Used</b>\n\n` +
        `This single-use connection link has already been consumed.\n` +
        `If you need to link another contact or relink, please generate a new link in your MediTrack dashboard.`
      );
      return { handled: true, action: 'token_already_consumed', error: 'Token consumed' };
    }

    if (now > Number(tokenRecord.expires_at)) {
      await sendTelegramMessage(
        chatId,
        `⏳ <b>Connection Link Expired</b>\n\n` +
        `For your patient's security, this connection link expired after 15 minutes.\n` +
        `Please generate a new connection link in MediTrack Family &amp; Alerts.`
      );
      return { handled: true, action: 'token_expired', error: 'Token expired' };
    }

    // Consume token
    await db.execute({
      sql: 'UPDATE telegram_linking_tokens SET consumed_at = ? WHERE id = ?',
      args: [nowIso, tokenRecord.id]
    });

    const userId = Number(tokenRecord.user_id);
    const contactId = tokenRecord.contact_id ? Number(tokenRecord.contact_id) : null;

    const patientRes = await db.execute({ sql: 'SELECT id, name, email FROM users WHERE id = ?', args: [userId] });
    const patient = patientRes.rows[0] || { id: userId, name: 'Patient' };
    const patientId = `P-${String(userId).padStart(4, '0')}`;

    if (contactId) {
      const contactRes = await db.execute({
        sql: 'SELECT id, name, relationship FROM trusted_contacts WHERE id = ? AND user_id = ?',
        args: [contactId, userId]
      });

      if (contactRes.rows.length === 0) {
        await sendTelegramMessage(chatId, `❌ <b>Contact Record Not Found</b>\nThe contact record associated with this token was removed.`);
        return { handled: true, action: 'contact_not_found' };
      }

      const contact = contactRes.rows[0];
      await db.execute({
        sql: `UPDATE trusted_contacts 
              SET telegram_chat_id = ?, telegram_username = ?, telegram_linked_at = ?, telegram_enabled = 1, updated_at = ?
              WHERE id = ? AND user_id = ?`,
        args: [chatId, fromUsername, nowIso, nowIso, contactId, userId]
      });

      await sendTelegramMessage(
        chatId,
        `✅ <b>MediTrack Connected Successfully!</b>\n\n` +
        `Hello <b>${escapeHtml(contact.name)}</b> (${escapeHtml(contact.relationship)}),\n\n` +
        `Your Telegram account is now securely linked to receive real-time health alerts for patient <b>${escapeHtml(patient.name)}</b> (<code>${escapeHtml(patientId)}</code>).\n\n` +
        `You can also ask me questions about authorized reports, trends, and risk assessments. Send /help to see all commands.`
      );

      return { handled: true, action: 'contact_linked', details: { contactId, userId, chatId, username: fromUsername } };
    } else {
      await db.execute({
        sql: `UPDATE users 
              SET telegram_chat_id = ?, telegram_username = ?, notification_telegram = 1
              WHERE id = ?`,
        args: [chatId, fromUsername, userId]
      });

      await sendTelegramMessage(
        chatId,
        `✅ <b>Personal MediTrack Account Linked!</b>\n\n` +
        `Hello <b>${escapeHtml(patient.name)}</b>,\n\n` +
        `Your personal Telegram is now connected to receive health alerts for your account (<code>${escapeHtml(patientId)}</code>).\n\n` +
        `Send /help to see available health assistant commands.`
      );

      return { handled: true, action: 'user_linked', details: { userId, chatId, username: fromUsername } };
    }
  }

  // --- COMMAND 2: /link ---
  if (text === '/link') {
    const identity = await resolveTelegramIdentity(chatId, db);
    if (identity.isLinked) {
      await sendTelegramMessage(
        chatId,
        `ℹ️ <b>Already Linked</b>\n\n` +
        `This Telegram chat is already connected to <b>${escapeHtml(identity.patientName || 'Patient')}</b> (<code>${escapeHtml(identity.patientId || '')}</code>).\n\n` +
        `To disconnect or link a different contact, use /stop or manage connections in MediTrack Family &amp; Alerts.`
      );
      return { handled: true, action: 'link_already_connected' };
    }

    await sendTelegramMessage(
      chatId,
      `🔗 <b>Connect Your MediTrack Account:</b>\n\n` +
      `For your security, Telegram linking requires a single-use 15-minute token generated inside the MediTrack application.\n\n` +
      `1. Log into MediTrack at <code>${escapeHtml(envConfig.APP_BASE_URL || 'http://localhost:3000')}</code>\n` +
      `2. Open the <b>Family &amp; Alerts</b> page.\n` +
      `3. Click the <b>Connect Telegram</b> button.\n` +
      `4. Tap <b>Open in Telegram</b> to activate your connection.`
    );
    return { handled: true, action: 'link_guidance' };
  }

  // --- COMMAND 3: /help ---
  if (text === '/help') {
    await sendTelegramMessage(
      chatId,
      `📋 <b>MediTrack Telegram Bot Command Guide:</b>\n\n` +
      `<b>Clinical &amp; Health Commands:</b>\n` +
      `• /status — Latest patient health status and alert overview\n` +
      `• /summary — Summary of latest available medical assessment &amp; report\n` +
      `• /alerts — List recent authorized health alerts\n` +
      `• /reports — List available medical reports on file\n` +
      `• /trends — Historical biomarker trajectory comparisons\n` +
      `• /risk — Cardiovascular and metabolic risk assessment breakdown\n` +
      `• /medications — Prescribed and documented medications\n\n` +
      `<b>Account &amp; Management Commands:</b>\n` +
      `• /link — Instructions for connecting your account\n` +
      `• /contact — How to manage notification preferences\n` +
      `• /stop — Disconnect Telegram and disable alerts\n\n` +
      `<b>Natural-Language Assistant:</b>\n` +
      `You can also ask questions naturally! For example:\n` +
      `<i>"Why was the latest alert triggered?"</i>\n` +
      `<i>"What were my blood pressure and glucose in the latest test?"</i>\n` +
      `<i>"Has my cardiovascular risk changed?"</i>\n\n` +
      `<i>Notice: For medical emergencies, call 911 / emergency services immediately.</i>`
    );
    return { handled: true, action: 'help' };
  }

  // --- COMMAND 4: /stop ---
  if (text === '/stop') {
    const identity = await resolveTelegramIdentity(chatId, db);
    if (!identity.isLinked) {
      await sendTelegramMessage(chatId, `ℹ️ This Telegram chat is not currently linked to any MediTrack account.`);
      return { handled: true, action: 'stop_unlinked' };
    }

    if (identity.type === 'CONTACT' && identity.contactId) {
      await disconnectTelegramContact(identity.userId!, identity.contactId, db);
    } else if (identity.type === 'USER' && identity.userId) {
      await disconnectTelegramUser(identity.userId, db);
    }

    await sendTelegramMessage(
      chatId,
      `🛑 <b>Telegram Notifications Stopped</b>\n\n` +
      `Your Telegram account has been disconnected from MediTrack. You will no longer receive health alerts or assistant updates here.\n\n` +
      `To reconnect in the future, visit <b>Family &amp; Alerts</b> in your MediTrack dashboard.`
    );
    return { handled: true, action: 'stop_disconnected' };
  }

  // --- COMMAND 5: /contact ---
  if (text === '/contact') {
    await sendTelegramMessage(
      chatId,
      `👥 <b>Managing Your MediTrack Telegram Connection:</b>\n\n` +
      `• You can enable or disable alerts at any time in the <b>Family &amp; Alerts</b> portal.\n` +
      `• Designated trusted contacts receive urgent medical notifications via Gmail and Telegram.\n` +
      `• To permanently disconnect this bot, use /stop.\n` +
      `• To reach support or modify patient permissions, log in at <code>${escapeHtml(envConfig.APP_BASE_URL || 'http://localhost:3000')}</code>.`
    );
    return { handled: true, action: 'contact_info' };
  }

  // --- AUTHORIZATION GUARD FOR DATA COMMANDS & AI QUERIES ---
  const identity = await resolveTelegramIdentity(chatId, db);

  if (!identity.isLinked) {
    await sendTelegramMessage(
      chatId,
      `🔒 <b>Account Not Linked</b>\n\n` +
      `To protect patient health privacy, this Telegram account is not yet authorized to view medical records.\n\n` +
      `Please connect your Telegram account by navigating to <b>Family &amp; Alerts</b> in the MediTrack web portal and clicking <b>Connect Telegram</b>.`
    );
    return { handled: true, action: 'unauthorized_unlinked' };
  }

  if (identity.consentGranted === false) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Access Restricted</b>\n\n` +
      `Patient consent for this trusted contact has been revoked or paused. Medical summaries cannot be retrieved at this time.`
    );
    return { handled: true, action: 'consent_revoked' };
  }

  const userId = identity.userId!;

  // Log incoming interaction in audit table
  const auditCommand = text.startsWith('/') ? text.split(/\s+/)[0] : 'QUERY';
  try {
    await db.execute({
      sql: `INSERT INTO telegram_audit_logs (chat_id, user_id, contact_id, command, query_preview, status, response_type, created_at)
            VALUES (?, ?, ?, ?, ?, 'PROCESSING', 'TEXT', ?)`,
      args: [chatId, userId, identity.contactId || null, auditCommand, text.substring(0, 100), new Date().toISOString()]
    });
  } catch {}

  // --- COMMAND 6: /status ---
  if (text === '/status') {
    const clinical = await getPatientClinicalContext(userId, db);
    const lastAlert = clinical.recentAlerts[0];
    const alertLevel = lastAlert ? `${lastAlert.severity} (${new Date(lastAlert.date).toLocaleDateString()})` : 'Normal (No active alerts)';
    const lastReport = clinical.latestReports[0];
    const reportSummary = lastReport ? `${lastReport.filename} (${lastReport.report_date})` : 'No reports on file';

    await sendTelegramMessage(
      chatId,
      `📊 <b>MediTrack Patient Status:</b>\n\n` +
      `• <b>Patient:</b> ${escapeHtml(clinical.patientName)} (<code>${escapeHtml(clinical.patientId)}</code>)\n` +
      `• <b>Alert Status:</b> ${escapeHtml(alertLevel)}\n` +
      `• <b>Latest Report:</b> ${escapeHtml(reportSummary)}\n` +
      `• <b>Total Reports:</b> ${clinical.latestReports.length}\n` +
      `• <b>Telegram Alerts:</b> ${identity.telegramEnabled ? 'Active ✅' : 'Paused ⏸'}\n\n` +
      `<i>Use /summary for detailed lab results or /risk for clinical domain evaluations.</i>`
    );
    return { handled: true, action: 'status' };
  }

  // --- COMMAND 7: /alerts ---
  if (text === '/alerts') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.recentAlerts.length === 0) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>Alert History:</b>\n\nNo recent health alerts on record for patient <b>${escapeHtml(clinical.patientName)}</b>.`
      );
      return { handled: true, action: 'alerts_empty' };
    }

    const severityEmojis: Record<string, string> = { CRITICAL: '🚨', HIGH: '⚠️', MODERATE: 'ℹ️', LOW: '📋' };
    const alertItems = clinical.recentAlerts.map(a => {
      const emoji = severityEmojis[a.severity] || '⚠️';
      return `${emoji} <b>[${escapeHtml(a.severity)}] ${escapeHtml(a.title)}</b>\n<i>${escapeHtml(a.message)}</i>\nTimestamp: <code>${new Date(a.date).toLocaleString()}</code>`;
    }).join('\n\n');

    await sendTelegramMessage(
      chatId,
      `🚨 <b>Recent Alerts for ${escapeHtml(clinical.patientName)}:</b>\n\n${alertItems}`
    );
    return { handled: true, action: 'alerts_listed' };
  }

  // --- COMMAND 8: /summary ---
  if (text === '/summary') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.latestReports.length === 0) {
      await sendTelegramMessage(
        chatId,
        `ℹ️ <b>Medical Summary:</b> No medical reports have been uploaded yet for ${escapeHtml(clinical.patientName)}.`
      );
      return { handled: true, action: 'summary_empty' };
    }

    const rep = clinical.latestReports[0];
    const topBiomarkers = clinical.measurements.slice(0, 10).map(m => {
      return `• <b>${escapeHtml(m.parameter)}:</b> <code>${escapeHtml(m.value)} ${escapeHtml(m.unit)}</code>`;
    }).join('\n');

    await sendTelegramMessage(
      chatId,
      `📋 <b>Latest Assessment Summary:</b>\n\n` +
      `<b>Report:</b> ${escapeHtml(rep.filename)}\n` +
      `<b>Collection Date:</b> ${escapeHtml(rep.report_date)}\n\n` +
      `<b>Extracted Biomarkers:</b>\n${topBiomarkers || 'None extracted.'}\n\n` +
      `<i>Notice: For complete verified reports and reference ranges, view your MediTrack dashboard.</i>`
    );
    return { handled: true, action: 'summary' };
  }

  // --- COMMAND 9: /reports ---
  if (text === '/reports') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.latestReports.length === 0) {
      await sendTelegramMessage(chatId, `ℹ️ No medical reports found on file for ${escapeHtml(clinical.patientName)}.`);
      return { handled: true, action: 'reports_empty' };
    }

    const reportLines = clinical.latestReports.map((r, i) => {
      return `${i + 1}. 📄 <b>${escapeHtml(r.filename)}</b> — <i>Date: ${escapeHtml(r.report_date)}</i>`;
    }).join('\n\n');

    await sendTelegramMessage(
      chatId,
      `📁 <b>Medical Reports on File for ${escapeHtml(clinical.patientName)}:</b>\n\n` +
      `${reportLines}\n\n` +
      `<i>Access full PDFs and verified lab sheets in the MediTrack web app.</i>`
    );
    return { handled: true, action: 'reports_listed' };
  }

  // --- COMMAND 10: /trends ---
  if (text === '/trends') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.trends.length === 0) {
      await sendTelegramMessage(
        chatId,
        `📈 <b>Biomarker Trends:</b>\n\nNo multi-report trajectories calculated yet for ${escapeHtml(clinical.patientName)}. Trends are computed when at least two consecutive lab reports are available.`
      );
      return { handled: true, action: 'trends_empty' };
    }

    const trendLines = clinical.trends.map(t => {
      const arrow = t.direction.toLowerCase().includes('increase') || t.direction.toLowerCase().includes('up') ? '↗️' : '↘️';
      return `${arrow} <b>${escapeHtml(t.parameter)}:</b> ${escapeHtml(t.direction)}`;
    }).join('\n');

    await sendTelegramMessage(
      chatId,
      `📈 <b>Historical Biomarker Trends for ${escapeHtml(clinical.patientName)}:</b>\n\n${trendLines}`
    );
    return { handled: true, action: 'trends_listed' };
  }

  // --- COMMAND 11: /risk ---
  if (text === '/risk') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.risks.length === 0) {
      await sendTelegramMessage(
        chatId,
        `📊 <b>Risk Assessment:</b> Insufficient biomarker records to evaluate cardiovascular or metabolic risks.`
      );
      return { handled: true, action: 'risk_empty' };
    }

    const riskBadges: Record<string, string> = { RED: '🔴', ORANGE: '🟠', YELLOW: '🟡', GREEN: '🟢', GREY: '⚪' };
    const riskSections = clinical.risks.map(r => {
      const badge = riskBadges[r.level] || '⚪';
      return `${badge} <b>${escapeHtml(r.domain.toUpperCase())} RISK:</b> Level ${escapeHtml(r.level)}\n` +
             `<b>Finding:</b> ${escapeHtml(r.label)}\n` +
             `<b>Assessment:</b> ${escapeHtml(r.explanation)}\n` +
             `👉 <b>Action:</b> ${escapeHtml(r.action)}`;
    }).join('\n\n');

    await sendTelegramMessage(
      chatId,
      `📊 <b>Clinical Risk Engine Evaluation for ${escapeHtml(clinical.patientName)}:</b>\n\n` +
      `${riskSections}\n\n` +
      `<i>Automated clinical indicator engine (rule version 1.0.0). Not a clinical diagnosis.</i>`
    );
    return { handled: true, action: 'risk_evaluated' };
  }

  // --- COMMAND 12: /medications ---
  if (text === '/medications') {
    const clinical = await getPatientClinicalContext(userId, db);
    if (clinical.medications.length === 0) {
      await sendTelegramMessage(
        chatId,
        `💊 <b>Documented Medications:</b>\n\nNo medications are currently documented in ${escapeHtml(clinical.patientName)}'s authorized medical records.`
      );
      return { handled: true, action: 'medications_empty' };
    }

    const medLines = clinical.medications.map((m, i) => {
      return `${i + 1}. <b>${escapeHtml(m.name)}</b> — ${escapeHtml(m.dosage)} (${escapeHtml(m.frequency)}${m.timeOfDay ? `, ${escapeHtml(m.timeOfDay)}` : ''})`;
    }).join('\n');

    await sendTelegramMessage(
      chatId,
      `💊 <b>Documented Medications for ${escapeHtml(clinical.patientName)}:</b>\n\n` +
      `${medLines}\n\n` +
      `<i>Important: Never adjust prescribed medication dosages without consulting your physician.</i>`
    );
    return { handled: true, action: 'medications_listed' };
  }

  // --- NATURAL-LANGUAGE CONVERSATIONAL HEALTH QUESTIONS ---
  const reply = await handleNaturalLanguageQuery(chatId, text, identity, db);
  await sendTelegramMessage(chatId, reply);

  // Store in short-lived conversation context
  try {
    const nowIso = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO telegram_conversations (chat_id, role, content, created_at) VALUES (?, "user", ?, ?)',
      args: [chatId, text, nowIso]
    });
    await db.execute({
      sql: 'INSERT INTO telegram_conversations (chat_id, role, content, created_at) VALUES (?, "assistant", ?, ?)',
      args: [chatId, reply.replace(/<[^>]*>/g, ''), nowIso]
    });
  } catch {}

  return { handled: true, action: 'chat_reply_sent' };
}

/**
 * Returns the Telegram channel status and diagnostic setup info.
 */
export async function getTelegramStatus(userId: number, db: any): Promise<TelegramStatus> {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const isConfigured = Boolean(token && token.length > 10);
  const botUsername = await getBotUsername();
  const missingSetup: string[] = [];

  if (!isConfigured) {
    missingSetup.push('Set TELEGRAM_BOT_TOKEN in server environment (create bot via @BotFather on Telegram).');
  }

  try {
    const userRes = await db.execute({
      sql: 'SELECT notification_telegram FROM users WHERE id = ?',
      args: [userId]
    });
    const userEnabled = userRes.rows[0]?.notification_telegram !== 0;

    const contactsRes = await db.execute({
      sql: 'SELECT count(*) as count FROM trusted_contacts WHERE user_id = ? AND telegram_chat_id IS NOT NULL AND (status = ? OR status IS NULL)',
      args: [userId, 'ACTIVE']
    });
    const linkedContactsCount = Number(contactsRes.rows[0]?.count || 0);

    return {
      configured: isConfigured,
      botUsername,
      provider: 'TELEGRAM_BOT_API',
      userEnabled,
      linkedContactsCount,
      webhookConfigured: Boolean(envConfig.TELEGRAM_WEBHOOK_SECRET),
      missingSetup
    };
  } catch (err: any) {
    return {
      configured: isConfigured,
      botUsername,
      provider: 'TELEGRAM_BOT_API',
      userEnabled: true,
      linkedContactsCount: 0,
      webhookConfigured: false,
      missingSetup: [err.message || 'Error checking Telegram status']
    };
  }
}

/**
 * Validates Telegram webhook secret token header.
 */
export function verifyTelegramWebhookSecret(headerSecret?: string): boolean {
  const expectedSecret = envConfig.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) return true; // Secret not enforced if not configured
  return headerSecret === expectedSecret;
}

/**
 * Registers the Telegram bot webhook with Telegram API.
 */
export async function setTelegramWebhook(
  webhookUrl: string,
  secretToken?: string
): Promise<{ ok: boolean; description?: string }> {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured.');

  const secret = secretToken || envConfig.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  const params: Record<string, any> = { url: webhookUrl };
  if (secret) params.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data: any = await res.json();
  return { ok: data.ok, description: sanitizeTelegramLog(data.description || '') };
}

/**
 * Retrieves the current webhook status from Telegram Bot API.
 */
export async function getTelegramWebhookInfo(): Promise<any> {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { configured: false, error: 'TELEGRAM_BOT_TOKEN not configured' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data: any = await res.json();
    return data.result || data;
  } catch (err: any) {
    return { error: sanitizeTelegramLog(err.message || String(err)) };
  }
}

/**
 * In development without a public HTTPS webhook URL, polls Telegram for recent updates.
 */
export async function pollTelegramUpdates(db: any): Promise<number> {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return 0;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20&timeout=0`);
    if (!res.ok) return 0;
    const data: any = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return 0;

    let processed = 0;
    let maxUpdateId = 0;

    for (const update of data.result) {
      if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
      const res = await handleTelegramUpdate(update, db);
      if (res.handled) processed++;
    }

    // Acknowledge updates by setting offset to maxUpdateId + 1
    if (maxUpdateId > 0) {
      await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${maxUpdateId + 1}&limit=1&timeout=0`);
    }

    return processed;
  } catch (err) {
    return 0;
  }
}
