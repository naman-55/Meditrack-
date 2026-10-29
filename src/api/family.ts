import { apiClient } from './client';

export interface TrustedContactValues {
  name: string;
  relationship: string;
  contact_method: string;
  contact_value: string;
  email?: string;
  phone?: string;
  email_enabled?: number;
  sms_enabled?: number;
  telegram_enabled?: number;
  consent_status?: 'GRANTED' | 'REVOKED' | 'PENDING';
  status?: string;
}

export interface TrustedContact {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  contact_method: string;
  contact_value: string;
  email?: string | null;
  phone?: string | null;
  is_emergency?: number;
  email_enabled?: number;
  sms_enabled?: number;
  consent_email?: number;
  consent_sms?: number;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_enabled?: number;
  telegram_linked_at?: string | null;
  consent_status?: 'GRANTED' | 'REVOKED' | 'PENDING';
  consent_date?: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'INACTIVE' | string;
  created_at: string;
  updated_at?: string | null;
}

export interface AbnormalFinding {
  parameter: string;
  measuredValue: string | number;
  unit: string;
  referenceRange: string;
  status: 'High' | 'Low' | 'Critical' | 'Borderline';
  clinicalNote?: string;
}

export interface HistoricalComparison {
  parameter: string;
  previousDate: string;
  previousValue: string;
  currentValue: string;
  changeDirection: 'increased' | 'decreased' | 'stable';
}

export interface HealthSummaryPayload {
  alertId: number | string;
  patientId: string;
  patientName: string;
  timestamp: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  mainReason: string;
  abnormalFindings: AbnormalFinding[];
  historicalChanges: HistoricalComparison[];
  documentedRiskFactors: string[];
  explanation: string;
  limitations: string;
  recommendedActions: string[];
  secureLink: string;
  disclaimer: string;
}

export interface NotificationDelivery {
  id: number;
  alert_id: number;
  channel: 'EMAIL' | 'SMS' | 'TELEGRAM' | 'IN_APP' | string;
  recipient?: string;
  destination?: string;
  provider?: string;
  provider_message_id?: string | null;
  delivery_status?: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED' | string;
  status?: string;
  attempt_count?: number;
  attempts?: number;
  error_message?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type NotificationDeliveryRecord = NotificationDelivery;

export interface HealthAlert {
  id: number;
  user_id: number;
  contact_id: number | null;
  contact_name?: string;
  type: string;
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INFORMATIONAL' | 'WARNING' | 'HIGH_PRIORITY' | string;
  title?: string;
  message: string;
  source: string;
  status: string;
  delivery_channel?: string | null;
  summary_json?: string | null;
  abnormal_findings_json?: string | null;
  recommendations_json?: string | null;
  trigger_source?: string | null;
  parameter?: string;
  measured_value?: string;
  reference_range?: string;
  source_report_id?: number | null;
  idempotency_key?: string | null;
  action_url?: string | null;
  details_json?: string | null;
  is_read?: number;
  read_at?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
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
  deleteContact: async (id: number, permanent = false): Promise<{ success: boolean; contact?: TrustedContact; deletedPermanently?: boolean }> => {
    return apiClient.delete(`/api/contacts/${id}${permanent ? '?permanent=true' : ''}`);
  },
  getAlerts: async (): Promise<HealthAlert[]> => {
    return apiClient.get('/api/alerts');
  },
  acknowledgeAlert: async (id: number): Promise<{ success: boolean; alert: HealthAlert }> => {
    return apiClient.put(`/api/notifications/alerts/${id}/acknowledge`, {});
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
