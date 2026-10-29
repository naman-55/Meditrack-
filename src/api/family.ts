import { apiClient } from './client';

export interface NotificationDeliveryRecord {
  id: number;
  alert_id: number;
  channel: 'EMAIL' | 'TELEGRAM' | 'SMS' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'ACCEPTED' | 'FAILED' | 'SKIPPED';
  destination: string;
  provider?: string | null;
  provider_message_id?: string | null;
  attempts: number;
  delivered_at?: string | null;
  error_message?: string | null;
  created_at: string;
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
  email_enabled?: number;
  sms_enabled?: number;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_enabled?: number;
  telegram_linked_at?: string | null;
  consent_status?: 'GRANTED' | 'REVOKED' | 'PENDING';
  consent_date?: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'INACTIVE';
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

export interface HealthAlert {
  id: number;
  user_id: number;
  contact_id: number | null;
  contact_name?: string;
  type: string;
  message: string;
  source: string;
  status: string;
  delivery_channel?: string | null;
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title?: string;
  summary_json?: string | null;
  abnormal_findings_json?: string | null;
  recommendations_json?: string | null;
  trigger_source?: string | null;
  deliveries?: NotificationDeliveryRecord[];
  is_read?: number;
  read_at?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  created_at: string;
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
  }
};
