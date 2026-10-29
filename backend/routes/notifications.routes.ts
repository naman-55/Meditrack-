import { Router } from 'express';
import { db } from '../db/db.js';
import { envConfig } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { sendTestNotification } from '../services/notifications/dispatcher.js';
import {
  generateGmailAuthUrl,
  handleGmailOAuthCallback,
  getGmailConnectionStatus,
  disconnectGmailAccount
} from '../services/notifications/gmailService.js';
import {
  getTelegramStatus,
  generateTelegramLinkingToken,
  handleTelegramUpdate,
  disconnectTelegramContact,
  verifyTelegramWebhookSecret,
  setTelegramWebhook,
  getTelegramWebhookInfo,
  pollTelegramUpdates
} from '../services/notifications/telegramService.js';
import { initNotificationSchema } from '../services/notifications/dbSchema.js';

export const notificationsRouter = Router();

/**
 * Returns the real-time configuration status of active notification channels (Gmail and Telegram).
 * SMS is permanently marked as disabled/replaced by Telegram.
 */
notificationsRouter.get('/channels', authenticateToken, async (req: any, res: any) => {
  try {
    // Ensure notification schema is initialized defensively
    try {
      await initNotificationSchema(db);
    } catch (e) {}

    const userRes = await db.execute({
      sql: 'SELECT notification_email, notification_sms, notification_telegram, notification_push, telegram_chat_id, telegram_username FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user: any = userRes.rows[0] || {};

    const [gmailStatus, telegramStatus] = await Promise.all([
      getGmailConnectionStatus(req.user.id, db),
      getTelegramStatus(req.user.id, db)
    ]);

    res.json({
      mode: 'gmail-and-telegram',
      email: {
        configured: gmailStatus.oauthConfigured,
        connected: gmailStatus.connected,
        status: gmailStatus.status,
        email: gmailStatus.email,
        provider: 'GMAIL_API',
        userEnabled: user.notification_email !== 0,
        lastUsedAt: gmailStatus.lastUsedAt,
        lastError: gmailStatus.lastError,
        missingSetup: gmailStatus.missingSetup
      },
      telegram: {
        configured: telegramStatus.configured,
        botUsername: telegramStatus.botUsername,
        provider: 'TELEGRAM_BOT_API',
        userEnabled: user.notification_telegram !== 0,
        linkedContactsCount: telegramStatus.linkedContactsCount,
        webhookConfigured: telegramStatus.webhookConfigured,
        missingSetup: telegramStatus.missingSetup,
        userChatId: user.telegram_chat_id || null,
        userUsername: user.telegram_username || null,
        userLinked: Boolean(user.telegram_chat_id)
      },
      sms: {
        configured: false,
        provider: 'disabled',
        status: 'REPLACED_BY_TELEGRAM',
        userEnabled: false,
        phoneNumber: null,
        message: 'SMS channel decommissioned. Replaced with official Telegram Bot notifications.'
      },
      push: {
        configured: false,
        provider: 'disabled',
        status: 'INACTIVE',
        userEnabled: user.notification_push === 1,
        message: 'Browser push notifications are currently inactive.'
      }
    });
  } catch (error: any) {
    console.error('Failed to get notification channels status:', error);
    res.status(500).json({ error: 'Failed to retrieve notification channel status' });
  }
});

// ==========================================
// GMAIL INTEGRATION ROUTES (OAuth 2.0 & API)
// ==========================================

/**
 * Generates the Google OAuth 2.0 authorization URL for connecting Gmail.
 */
notificationsRouter.get('/gmail/auth-url', authenticateToken, async (req: any, res: any) => {
  try {
    const { url, state } = generateGmailAuthUrl(req.user.id);
    res.json({ url, state });
  } catch (err: any) {
    console.error('Failed to generate Gmail auth URL:', err);
    res.status(400).json({ error: err.message || 'Unable to generate Gmail authorization URL' });
  }
});

/**
 * OAuth 2.0 redirect callback endpoint for Google Gmail authorization.
 * Accessible by Google redirect; state contains cryptographically verified userId.
 */
notificationsRouter.get('/gmail/callback', async (req: any, res: any) => {
  const code = (req.query.code || '').toString();
  const state = (req.query.state || '').toString();
  const error = (req.query.error || '').toString();

  const frontendUrl = envConfig.FRONTEND_URL || 'http://localhost:3000';

  if (error) {
    console.warn('Google OAuth denied or returned error:', error);
    return res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent(`Google authorization denied: ${error}`)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent('Missing authorization code or state parameter.')}`);
  }

  try {
    const result = await handleGmailOAuthCallback(code, state, db);
    console.log(`[GMAIL OAUTH] User #${result.userId} successfully connected Gmail: ${result.email}`);
    res.redirect(`${frontendUrl}/family-alerts?gmail_connected=true&email=${encodeURIComponent(result.email)}`);
  } catch (err: any) {
    console.error('Gmail OAuth callback error:', err);
    res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent(err.message || 'OAuth verification failed')}`);
  }
});

/**
 * Disconnects the user's connected Gmail account and revokes stored tokens.
 */
notificationsRouter.post('/gmail/disconnect', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await disconnectGmailAccount(req.user.id, db);
    res.json(result);
  } catch (err: any) {
    console.error('Gmail disconnect error:', err);
    res.status(500).json({ error: err.message || 'Failed to disconnect Gmail account' });
  }
});

/**
 * Retrieves current Gmail connection diagnostics for the user.
 */
notificationsRouter.get('/gmail/status', authenticateToken, async (req: any, res: any) => {
  try {
    const status = await getGmailConnectionStatus(req.user.id, db);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve Gmail status' });
  }
});

// ==========================================
// TELEGRAM BOT INTEGRATION ROUTES
// ==========================================

/**
 * Generates an opaque, single-use, 15-minute expiring linking token and Telegram deep link
 * for a trusted contact or user to link their Telegram chat ID.
 */
notificationsRouter.post('/telegram/connect-link', authenticateToken, async (req: any, res: any) => {
  try {
    const contactId = req.body?.contactId ? Number(req.body.contactId) : undefined;

    if (contactId) {
      const contactRes = await db.execute({
        sql: 'SELECT id, name FROM trusted_contacts WHERE id = ? AND user_id = ?',
        args: [contactId, req.user.id]
      });
      if (contactRes.rows.length === 0) {
        return res.status(404).json({ error: 'Trusted contact not found.' });
      }
    }

    const linkingData = await generateTelegramLinkingToken(req.user.id, contactId, db);
    res.json({
      success: true,
      ...linkingData
    });
  } catch (err: any) {
    console.error('Failed to generate Telegram connect link:', err);
    res.status(500).json({ error: err.message || 'Failed to generate Telegram linking link.' });
  }
});

/**
 * Disconnects a contact's linked Telegram chat.
 */
notificationsRouter.post('/telegram/disconnect', authenticateToken, async (req: any, res: any) => {
  const contactId = req.body?.contactId ? Number(req.body.contactId) : undefined;
  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required to disconnect Telegram.' });
  }

  try {
    const result = await disconnectTelegramContact(req.user.id, contactId, db);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to disconnect Telegram contact:', err);
    res.status(500).json({ error: err.message || 'Failed to disconnect Telegram contact.' });
  }
});

/**
 * Official Telegram Webhook endpoint.
 * Validates Telegram secret header, processes /start <token> command, and saves verified chat IDs.
 */
notificationsRouter.post('/telegram/webhook', async (req: any, res: any) => {
  const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (!verifyTelegramWebhookSecret(incomingSecret)) {
    console.warn('[TELEGRAM WEBHOOK] Rejected unauthorized request: Invalid or missing secret token header.');
    return res.status(403).json({ error: 'Unauthorized webhook secret token' });
  }

  try {
    const result = await handleTelegramUpdate(req.body, db);
    res.status(200).json({ ok: true, handled: result.handled });
  } catch (err: any) {
    console.error('[TELEGRAM WEBHOOK ERROR]', err);
    // Always respond 200 to Telegram so it doesn't indefinitely retry malformed updates
    res.status(200).json({ ok: true, error: err.message });
  }
});

/**
 * Retrieves current Telegram webhook registration info.
 */
notificationsRouter.get('/telegram/webhook-info', authenticateToken, async (req: any, res: any) => {
  try {
    const info = await getTelegramWebhookInfo();
    res.json({ success: true, info });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch webhook info.' });
  }
});

/**
 * Registers an HTTPS webhook URL with Telegram.
 */
notificationsRouter.post('/telegram/set-webhook', authenticateToken, async (req: any, res: any) => {
  const { url, secretToken } = req.body || {};
  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'A valid HTTPS webhook URL is required by Telegram.' });
  }

  try {
    const result = await setTelegramWebhook(url, secretToken);
    res.json({ success: result.ok, description: result.description });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register Telegram webhook.' });
  }
});

/**
 * Development helper: Polls Telegram updates manually when public HTTPS webhook is not active.
 */
notificationsRouter.post('/telegram/poll-updates', authenticateToken, async (req: any, res: any) => {
  try {
    const count = await pollTelegramUpdates(db);
    res.json({ success: true, processedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to poll Telegram updates.' });
  }
});

/**
 * Development & Testing helper: Simulates receiving a /start <token> update from a Telegram chat.
 * Binds the simulated chat ID to the contact matching the token.
 */
notificationsRouter.post('/telegram/simulate-link', authenticateToken, async (req: any, res: any) => {
  const { token, chatId, username } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Linking token is required.' });

  try {
    const simulatedUpdate = {
      update_id: Date.now(),
      message: {
        message_id: 1,
        chat: { id: chatId || '987654321', first_name: 'TestContact', username: username || 'test_contact' },
        from: { id: chatId || '987654321', first_name: 'TestContact', username: username || 'test_contact' },
        date: Math.floor(Date.now() / 1000),
        text: `/start ${token}`
      }
    };

    const result = await handleTelegramUpdate(simulatedUpdate, db);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Simulate link failed.' });
  }
});

// ==========================================
// TEST & DIAGNOSTIC DISPATCH ACTIONS
// ==========================================

/**
 * Dispatches a genuine test notification through the requested provider (Gmail or Telegram).
 * Records actual provider response in database and displays message ID and request status.
 */
notificationsRouter.post('/test', authenticateToken, async (req: any, res: any) => {
  const { channel, destination, contactId } = req.body || {};
  const normalizedChannel = (channel || 'EMAIL').toUpperCase() as 'EMAIL' | 'TELEGRAM';

  if (normalizedChannel !== 'EMAIL' && normalizedChannel !== 'TELEGRAM') {
    return res.status(400).json({
      error: `Unsupported test channel "${normalizedChannel}". Active channels are EMAIL (via Gmail API) and TELEGRAM (via Telegram Bot API). SMS is decommissioned.`,
      channel: normalizedChannel
    });
  }

  try {
    const result = await sendTestNotification(db, req.user.id, {
      channel: normalizedChannel,
      destination,
      contactId: contactId ? Number(contactId) : undefined
    });
    res.json(result);
  } catch (error: any) {
    console.error('Test notification failed:', error);
    const code = error.code || (error.message?.includes('not linked') ? 'NOT_LINKED' : error.message?.includes('not configured') ? 'NOT_CONFIGURED' : 'FAILED');
    res.status(400).json({
      success: false,
      status: code,
      error: error.message || 'Unable to send test notification',
      channel: normalizedChannel,
      contactId: error.contactId || (contactId ? Number(contactId) : undefined),
      contactName: error.contactName,
      details: error.details
    });
  }
});

/**
 * Triggers an authentic in-app health alert for the signed-in patient so they can verify in-app notifications.
 */
notificationsRouter.post('/in-app/test', authenticateToken, async (req: any, res: any) => {
  try {
    const now = new Date().toISOString();
    const eventKey = `in-app-test:${req.user.id}:${Date.now()}`;
    const title = req.body?.title || 'Elevated Blood Pressure Alert';
    const message = req.body?.message || 'Systolic blood pressure reading of 148/92 mmHg detected. Stage 2 hypertension threshold exceeded.';
    const severity = req.body?.severity || 'HIGH';

    const insertResult = await db.execute({
      sql: `INSERT INTO health_alerts 
            (user_id, type, message, source, status, delivery_channel, event_key, severity, title, trigger_source, is_read, created_at)
            VALUES (?, 'HIGH_ALERT', ?, 'In-App Clinical Monitor', 'RECORDED', 'IN_APP', ?, ?, ?, 'In-App Test', 0, ?)
            RETURNING *`,
      args: [req.user.id, message, eventKey, severity, title, now]
    });

    const alert = insertResult.rows[0];
    res.json({ success: true, message: 'In-app notification generated successfully', alert });
  } catch (error: any) {
    console.error('In-app test alert error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate in-app alert' });
  }
});

/**
 * Web Push subscription endpoints (Kept as inactive).
 */
notificationsRouter.post('/push/subscribe', authenticateToken, async (req: any, res: any) => {
  res.status(403).json({ error: 'Browser push notifications are currently inactive.' });
});

notificationsRouter.post('/push/unsubscribe', authenticateToken, async (req: any, res: any) => {
  res.json({ success: true, message: 'Push notifications are currently inactive.' });
});

/**
 * Gets delivery details for a specific health alert.
 */
notificationsRouter.get('/alerts/:id/deliveries', authenticateToken, async (req: any, res: any) => {
  const alertId = Number(req.params.id);
  try {
    const alertRes = await db.execute({
      sql: 'SELECT id, user_id FROM health_alerts WHERE id = ? AND user_id = ?',
      args: [alertId, req.user.id]
    });
    if (alertRes.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    const deliveriesRes = await db.execute({
      sql: `SELECT * FROM notification_deliveries WHERE alert_id = ? ORDER BY created_at ASC`,
      args: [alertId]
    });

    res.json(deliveriesRes.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch alert delivery history' });
  }
});

/**
 * Acknowledges a health alert.
 */
notificationsRouter.put('/alerts/:id/acknowledge', authenticateToken, async (req: any, res: any) => {
  const alertId = Number(req.params.id);
  const now = new Date().toISOString();

  try {
    const result = await db.execute({
      sql: `UPDATE health_alerts 
            SET acknowledged_at = ?, acknowledged_by = ?, is_read = 1, read_at = ?
            WHERE id = ? AND user_id = ?
            RETURNING *`,
      args: [now, req.user.name || 'User', now, alertId, req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to acknowledge alert' });
  }
});
