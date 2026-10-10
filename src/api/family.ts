import { apiClient } from './client';

export interface TrustedContact {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  contact_method: string;
  contact_value: string;
  status: string;
  created_at: string;
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
  deleteContact: async (id: number): Promise<void> => {
    return apiClient.delete(`/api/contacts/${id}`);
  },
  getAlerts: async (): Promise<HealthAlert[]> => {
    return apiClient.get('/api/alerts');
  }
};
