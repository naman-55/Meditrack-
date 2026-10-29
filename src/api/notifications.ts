import { apiClient } from './client';

export interface GmailChannelInfo {
  configured: boolean;
  connected: boolean;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'EXPIRED' | 'REVOKED' | 'NOT_CONFIGURED' | 'ERROR';
  email: string | null;
  provider: string;
  userEnabled: boolean;
  lastUsedAt?: string | null;
  lastError?: string | null;
  missingSetup: string[];
}

export interface TelegramChannelInfo {
  configured: boolean;
  botUsername: string | null;
  provider: string;
  userEnabled: boolean;
  linkedContactsCount: number;
  webhookConfigured: boolean;
  missingSetup: string[];
  userChatId?: string | null;
  userUsername?: string | null;
  userLinked?: boolean;
}

export interface ChannelInfo {
  configured: boolean;
  provider: string;
  userEnabled: boolean;
  mode?: string;
  message?: string;
  status?: string;
  fromAddress?: string;
  phoneNumber?: string | null;
  missingSetup?: string[];
}

export interface NotificationChannelsStatus {
  mode?: string;
  email: GmailChannelInfo;
  telegram: TelegramChannelInfo;
  sms: ChannelInfo;
  push?: ChannelInfo;
}

export interface SendTestPayload {
  channel: 'EMAIL' | 'TELEGRAM' | 'SMS' | 'PUSH';
  destination?: string;
  contactId?: number;
}

export interface TestNotificationResponse {
  success: boolean;
  channel: string;
  provider: string;
  providerMessageId?: string;
  status?: string;
  message: string;
  details?: any;
}

export interface TelegramLinkingResponse {
  success: boolean;
  token: string;
  botUsername: string;
  deepLink: string;
  expiresAt: string;
}

export const notificationService = {
  getChannelsStatus: async (): Promise<NotificationChannelsStatus> => {
    return apiClient.get('/api/notifications/channels');
  },

  getGmailAuthUrl: async (): Promise<{ url: string; state: string }> => {
    return apiClient.get('/api/notifications/gmail/auth-url');
  },

  disconnectGmail: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post('/api/notifications/gmail/disconnect', {});
  },

  getGmailStatus: async (): Promise<GmailChannelInfo> => {
    return apiClient.get('/api/notifications/gmail/status');
  },

  getTelegramConnectLink: async (contactId?: number): Promise<TelegramLinkingResponse> => {
    return apiClient.post('/api/notifications/telegram/connect-link', { contactId });
  },

  disconnectTelegram: async (contactId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.post('/api/notifications/telegram/disconnect', { contactId });
  },

  sendTestNotification: async (payload: SendTestPayload): Promise<TestNotificationResponse> => {
    return apiClient.post('/api/notifications/test', payload);
  },

  triggerInAppTestAlert: async (data?: { title?: string; message?: string; severity?: string }): Promise<{ success: boolean; alert: any }> => {
    return apiClient.post('/api/notifications/in-app/test', data || {});
  }
};
