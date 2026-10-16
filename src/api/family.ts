import { apiClient } from './client';

export interface TrustedContact {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  contact_method: string;
  contact_value: string;
  email?: string;
  phone?: string;
  is_emergency?: number;
  consent_email?: number;
  consent_sms?: number;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

export interface NotificationDelivery {
  id: number;
  alert_id: number;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  recipient: string;
  provider_message_id?: string | null;
  delivery_status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  attempt_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthAlert {
  id: number;
  user_id: number;
  contact_id: number | null;
  contact_name?: string;
  type: string;
  severity?: 'INFORMATIONAL' | 'WARNING' | 'HIGH_PRIORITY' | 'CRITICAL';
  title?: string;
  message: string;
  source: string;
  status: string;
  parameter?: string;
  measured_value?: string;
  reference_range?: string;
  source_report_id?: number | null;
  idempotency_key?: string | null;
  action_url?: string | null;
  details_json?: string | null;
  is_read?: number;
  read_at?: string | null;
  created_at: string;
  deliveries?: NotificationDelivery[];
}

export const familyService = {
  getContacts: async (): Promise<TrustedContact[]> => {
    return apiClient.get('/api/contacts');
  },
  addContact: async (contact: Partial<TrustedContact>): Promise<TrustedContact> => {
    return apiClient.post('/api/contacts', contact);
  },
  updateContact: async (id: number, contact: Partial<TrustedContact>): Promise<TrustedContact> => {
    return apiClient.put(`/api/contacts/${id}`, contact);
  },
  deleteContact: async (id: number): Promise<{ success: boolean; contact: TrustedContact }> => {
    return apiClient.delete(`/api/contacts/${id}`);
  },
  getAlerts: async (): Promise<HealthAlert[]> => {
    return apiClient.get('/api/alerts');
  },
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiClient.get('/api/alerts/unread-count');
  },
  markAlertRead: async (id: number): Promise<{ success: boolean }> => {
    return apiClient.put(`/api/alerts/${id}/read`, {});
  },
  markAllAlertsRead: async (): Promise<{ success: boolean }> => {
    return apiClient.put('/api/alerts/read-all', {});
  },
  getAlertDeliveries: async (id: number): Promise<NotificationDelivery[]> => {
    return apiClient.get(`/api/alerts/${id}/deliveries`);
  },
  sendTestEmergencyAlert: async (contactId?: number): Promise<{ success: boolean; alert: HealthAlert; deliveries: NotificationDelivery[] }> => {
    return apiClient.post('/api/alerts/test-emergency', { contact_id: contactId });
  }
};
