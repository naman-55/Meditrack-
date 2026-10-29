import jwt from 'jsonwebtoken';
import { envConfig, JWT_SECRET } from '../../config/env.js';

export interface GmailConnectionStatus {
  connected: boolean;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'EXPIRED' | 'REVOKED' | 'NOT_CONFIGURED' | 'ERROR';
  email: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  oauthConfigured: boolean;
  missingSetup: string[];
}

export interface GmailSendResult {
  success: boolean;
  provider: 'GMAIL_API';
  providerMessageId?: string;
  threadId?: string;
  status: 'ACCEPTED' | 'FAILED' | 'SKIPPED';
  isTransient?: boolean;
  error?: string;
  details?: any;
}

export interface SendGmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

/**
 * Validates that string contains no CRLF carriage return / newline characters
 * to strictly prevent email header injection.
 */
function sanitizeHeader(val: string, name: string): string {
  if (/[\r\n]/.test(val)) {
    throw new Error(`Invalid characters in header ${name}: Header injection attempt detected.`);
  }
  return val.trim();
}

/**
 * Encodes a header according to RFC 2047 if it contains non-ASCII characters.
 */
function encodeHeaderValue(val: string): string {
  if (/^[\x20-\x7E]*$/.test(val)) {
    return val;
  }
  return `=?UTF-8?B?${Buffer.from(val, 'utf-8').toString('base64')}?=`;
}

/**
 * Constructs an RFC 2822 compliant MIME message and converts it to base64url format.
 */
export function buildMimeMessage(options: {
  fromName?: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const safeTo = sanitizeHeader(options.to, 'To');
  const safeFromEmail = sanitizeHeader(options.fromEmail, 'From Email');
  const safeFromName = sanitizeHeader(options.fromName || 'MediTrack Health Alerts', 'From Name');
  const safeSubject = sanitizeHeader(options.subject, 'Subject');

  const boundary = `====_MediTrack_Boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}====`;

  const mimeLines = [
    `From: ${encodeHeaderValue(safeFromName)} <${safeFromEmail}>`,
    `To: <${safeTo}>`,
    `Subject: ${encodeHeaderValue(safeSubject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    options.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    options.html,
    '',
    `--${boundary}--`
  ];

  const rawMime = mimeLines.join('\r\n');

  // Convert to Base64URL (RFC 4648 §5)
  return Buffer.from(rawMime, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates Google OAuth 2.0 Authorization URL with cryptographic state for CSRF protection.
 */
export function generateGmailAuthUrl(userId: number): { url: string; state: string } {
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = envConfig.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/notifications/gmail/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in server environment.');
  }

  const state = jwt.sign(
    {
      userId,
      purpose: 'gmail_oauth_connect',
      nonce: Math.random().toString(36).substring(2)
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: `${GMAIL_SEND_SCOPE} ${USERINFO_EMAIL_SCOPE}`,
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state
  };
}

/**
 * Handles the Google OAuth callback, verifies state, exchanges authorization code for tokens,
 * fetches authenticated Gmail address, and securely persists credentials in the database.
 */
export async function handleGmailOAuthCallback(
  code: string,
  state: string,
  db: any
): Promise<{ success: boolean; email: string; userId: number }> {
  // 1. Verify CSRF state token
  let decodedState: any;
  try {
    decodedState = jwt.verify(state, JWT_SECRET);
    if (decodedState.purpose !== 'gmail_oauth_connect' || !decodedState.userId) {
      throw new Error('Invalid state token purpose');
    }
  } catch (err: any) {
    throw new Error(`OAuth state validation failed: ${err.message || 'Malformed or expired state token.'}`);
  }

  const userId = Number(decodedState.userId);

  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = envConfig.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || '';

  // 2. Exchange authorization code for tokens
  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  const tokenData: any = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenData.error_description || tokenData.error || tokenRes.status}`);
  }

  const { access_token, refresh_token, expires_in, scope, token_type } = tokenData;
  const expiryDate = Date.now() + (Number(expires_in) || 3600) * 1000;

  // 3. Resolve authenticated sender email address with graceful fallbacks
  let gmailAddress: string | null = null;
  try {
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (userinfoRes.ok) {
      const userinfoData: any = await userinfoRes.json();
      if (userinfoData && userinfoData.email) {
        gmailAddress = String(userinfoData.email).trim().toLowerCase();
      }
    }
  } catch (e) {}

  // Fallback 1: Query Google tokeninfo endpoint
  if (!gmailAddress) {
    try {
      const tokeninfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(access_token)}`);
      if (tokeninfoRes.ok) {
        const tokeninfoData: any = await tokeninfoRes.json();
        if (tokeninfoData && tokeninfoData.email) {
          gmailAddress = String(tokeninfoData.email).trim().toLowerCase();
        }
      }
    } catch (e) {}
  }

  // Fallback 2: MediTrack patient account email from database
  if (!gmailAddress) {
    try {
      const userRes = await db.execute({
        sql: 'SELECT email FROM users WHERE id = ?',
        args: [userId]
      });
      if (userRes.rows[0]?.email) {
        gmailAddress = String(userRes.rows[0].email).trim().toLowerCase();
      }
    } catch (e) {}
  }

  if (!gmailAddress) {
    gmailAddress = 'authorized-sender@gmail.com';
  }

  // 4. Upsert credentials in gmail_oauth_tokens
  const now = new Date().toISOString();
  const existingToken = await db.execute({
    sql: 'SELECT id, refresh_token FROM gmail_oauth_tokens WHERE user_id = ?',
    args: [userId]
  });

  // Preserve existing refresh token if Google didn't return a new one on re-authorization
  const finalRefreshToken = refresh_token || existingToken.rows[0]?.refresh_token || null;

  if (existingToken.rows.length > 0) {
    await db.execute({
      sql: `UPDATE gmail_oauth_tokens 
            SET email = ?, access_token = ?, refresh_token = ?, token_type = ?, expiry_date = ?, scope = ?, status = 'CONNECTED', last_error = NULL, updated_at = ?
            WHERE user_id = ?`,
      args: [
        gmailAddress,
        access_token,
        finalRefreshToken,
        token_type || 'Bearer',
        expiryDate,
        scope || '',
        now,
        userId
      ]
    });
  } else {
    await db.execute({
      sql: `INSERT INTO gmail_oauth_tokens 
            (user_id, email, access_token, refresh_token, token_type, expiry_date, scope, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'CONNECTED', ?, ?)`,
      args: [
        userId,
        gmailAddress,
        access_token,
        finalRefreshToken,
        token_type || 'Bearer',
        expiryDate,
        scope || '',
        now,
        now
      ]
    });
  }

  return { success: true, email: gmailAddress, userId };
}

/**
 * Retrieves a valid, unexpired access token for the given user, automatically refreshing it if needed.
 */
export async function getValidGmailAccessToken(
  userId: number,
  db: any
): Promise<{ accessToken: string; senderEmail: string }> {
  const tokenRes = await db.execute({
    sql: 'SELECT * FROM gmail_oauth_tokens WHERE user_id = ?',
    args: [userId]
  });

  const tokenRecord = tokenRes.rows[0];
  if (!tokenRecord) {
    throw new Error('Gmail not connected. Please connect your Gmail account in Channel Configuration to send trusted contact emails.');
  }

  if (tokenRecord.status === 'REVOKED') {
    throw new Error('Gmail authorization was revoked. Please reconnect your Gmail account.');
  }

  const now = Date.now();
  const expiryDate = Number(tokenRecord.expiry_date) || 0;
  const isExpiringSoon = now > (expiryDate - 60000); // refresh if expiring in under 60 seconds

  // Return active token if still valid
  if (!isExpiringSoon && tokenRecord.access_token) {
    return {
      accessToken: tokenRecord.access_token,
      senderEmail: tokenRecord.email
    };
  }

  // Token is expired; attempt refresh using refresh_token
  if (!tokenRecord.refresh_token) {
    await db.execute({
      sql: `UPDATE gmail_oauth_tokens SET status = 'EXPIRED', last_error = 'Missing refresh token. Reconnect required.', updated_at = ? WHERE user_id = ?`,
      args: [new Date().toISOString(), userId]
    });
    throw new Error('Gmail session expired and no refresh token is stored. Please reconnect your Gmail account.');
  }

  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are missing from server environment to refresh Gmail token.');
  }

  try {
    const refreshParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRecord.refresh_token,
      grant_type: 'refresh_token'
    });

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: refreshParams.toString()
    });

    const refreshData: any = await refreshRes.json();
    if (!refreshRes.ok) {
      const isRevoked = refreshData.error === 'invalid_grant';
      const newStatus = isRevoked ? 'REVOKED' : 'ERROR';
      const errMsg = `Google token refresh failed: ${refreshData.error_description || refreshData.error}`;

      await db.execute({
        sql: `UPDATE gmail_oauth_tokens SET status = ?, last_error = ?, updated_at = ? WHERE user_id = ?`,
        args: [newStatus, errMsg, new Date().toISOString(), userId]
      });

      throw new Error(isRevoked ? 'Gmail authorization was revoked or expired. Please reconnect your account.' : errMsg);
    }

    const newAccessToken = refreshData.access_token;
    const updatedRefreshToken = refreshData.refresh_token || tokenRecord.refresh_token;
    const newExpiry = Date.now() + (Number(refreshData.expires_in) || 3600) * 1000;
    const nowIso = new Date().toISOString();

    await db.execute({
      sql: `UPDATE gmail_oauth_tokens SET access_token = ?, refresh_token = ?, expiry_date = ?, status = 'CONNECTED', last_error = NULL, updated_at = ? WHERE user_id = ?`,
      args: [newAccessToken, updatedRefreshToken, newExpiry, nowIso, userId]
    });

    return {
      accessToken: newAccessToken,
      senderEmail: tokenRecord.email
    };
  } catch (err: any) {
    throw new Error(`Failed to refresh Gmail access token: ${err.message || String(err)}`);
  }
}

/**
 * Sends a real email via the official Google Gmail API:
 * POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
 */
export async function sendGmailEmail(
  userId: number,
  db: any,
  options: SendGmailOptions
): Promise<GmailSendResult> {
  const { to, subject, html, text } = options;

  // 1. Validate destination email address
  const normalizedTo = (to || '').trim().toLowerCase();
  if (!normalizedTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTo) || normalizedTo.length > 254) {
    return {
      success: false,
      provider: 'GMAIL_API',
      status: 'FAILED',
      isTransient: false,
      error: `Invalid destination email address: ${to}`
    };
  }

  // 2. Obtain valid OAuth access token and authenticated sender email
  let credentials: { accessToken: string; senderEmail: string };
  try {
    credentials = await getValidGmailAccessToken(userId, db);
  } catch (authErr: any) {
    return {
      success: false,
      provider: 'GMAIL_API',
      status: 'FAILED',
      isTransient: false,
      error: authErr.message || 'Gmail authorization is required to send notifications.'
    };
  }

  // 3. Construct RFC-compliant MIME message and base64url encode it
  let rawBase64Url: string;
  try {
    rawBase64Url = buildMimeMessage({
      fromName: 'MediTrack Health Alerts',
      fromEmail: credentials.senderEmail,
      to: normalizedTo,
      subject,
      html,
      text
    });
  } catch (mimeErr: any) {
    return {
      success: false,
      provider: 'GMAIL_API',
      status: 'FAILED',
      isTransient: false,
      error: `MIME message encoding error: ${mimeErr.message}`
    };
  }

  // 4. Dispatch via Gmail API
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawBase64Url })
    });

    const responseData: any = await response.json();
    const nowIso = new Date().toISOString();

    if (!response.ok) {
      const statusCode = response.status;
      const isQuotaError = statusCode === 403 && (responseData.error?.message?.includes('Quota') || responseData.error?.message?.includes('rate'));
      const isAuthError = statusCode === 401;
      const isTransient = statusCode >= 500 || statusCode === 429 || isQuotaError;

      const errorMessage = responseData.error?.message || `Gmail API returned HTTP ${statusCode}`;

      // Update last_error in token storage for diagnostics
      try {
        await db.execute({
          sql: `UPDATE gmail_oauth_tokens SET last_error = ?, status = ?, updated_at = ? WHERE user_id = ?`,
          args: [errorMessage, isAuthError ? 'EXPIRED' : 'ERROR', nowIso, userId]
        });
      } catch (e) {}

      return {
        success: false,
        provider: 'GMAIL_API',
        status: 'FAILED',
        isTransient,
        error: `Gmail API error (${statusCode}): ${errorMessage}`,
        details: responseData
      };
    }

    // Success: Update token usage timestamp
    try {
      await db.execute({
        sql: `UPDATE gmail_oauth_tokens SET last_used_at = ?, last_error = NULL, updated_at = ? WHERE user_id = ?`,
        args: [nowIso, nowIso, userId]
      });
    } catch (e) {}

    // Record acceptance by Gmail API
    return {
      success: true,
      provider: 'GMAIL_API',
      providerMessageId: responseData.id,
      threadId: responseData.threadId,
      status: 'ACCEPTED',
      details: responseData
    };
  } catch (netErr: any) {
    return {
      success: false,
      provider: 'GMAIL_API',
      status: 'FAILED',
      isTransient: true,
      error: `Network failure connecting to Gmail API: ${netErr.message || String(netErr)}`
    };
  }
}

/**
 * Returns the current Gmail connection status and diagnostics for a user.
 */
export async function getGmailConnectionStatus(userId: number, db: any): Promise<GmailConnectionStatus> {
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const oauthConfigured = Boolean(clientId && clientSecret);
  const missingSetup: string[] = [];

  if (!clientId) {
    missingSetup.push('Set GOOGLE_CLIENT_ID in server environment (Google Cloud Console OAuth 2.0 Web Client).');
  }
  if (!clientSecret) {
    missingSetup.push('Set GOOGLE_CLIENT_SECRET in server environment.');
  }

  try {
    const tokenRes = await db.execute({
      sql: 'SELECT email, status, last_used_at, last_error, expiry_date FROM gmail_oauth_tokens WHERE user_id = ?',
      args: [userId]
    });

    if (tokenRes.rows.length === 0) {
      return {
        connected: false,
        status: oauthConfigured ? 'NOT_CONNECTED' : 'NOT_CONFIGURED',
        email: null,
        lastUsedAt: null,
        lastError: null,
        oauthConfigured,
        missingSetup: oauthConfigured ? ['Connect your Google Account to authorize Gmail email notifications.'] : missingSetup
      };
    }

    const row: any = tokenRes.rows[0];
    const isConnected = row.status === 'CONNECTED';

    return {
      connected: isConnected,
      status: row.status as any,
      email: row.email,
      lastUsedAt: row.last_used_at,
      lastError: row.last_error,
      oauthConfigured,
      missingSetup: isConnected ? [] : [row.last_error || 'Gmail connection expired or revoked. Please reconnect.']
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'ERROR',
      email: null,
      lastUsedAt: null,
      lastError: err.message,
      oauthConfigured,
      missingSetup
    };
  }
}

/**
 * Disconnects the user's Gmail account and revokes stored tokens.
 */
export async function disconnectGmailAccount(
  userId: number,
  db: any
): Promise<{ success: boolean; message: string }> {
  try {
    const tokenRes = await db.execute({
      sql: 'SELECT access_token, refresh_token FROM gmail_oauth_tokens WHERE user_id = ?',
      args: [userId]
    });

    const token = tokenRes.rows[0]?.access_token || tokenRes.rows[0]?.refresh_token;
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch (revokeErr) {
        // Continue even if remote revocation network call fails
      }
    }

    await db.execute({
      sql: 'DELETE FROM gmail_oauth_tokens WHERE user_id = ?',
      args: [userId]
    });

    return { success: true, message: 'Gmail account successfully disconnected.' };
  } catch (err: any) {
    throw new Error(`Failed to disconnect Gmail account: ${err.message || String(err)}`);
  }
}
