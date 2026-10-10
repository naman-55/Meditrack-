import { apiClient } from './client';
import { User } from './auth';
import { HealthcareFacility } from './facilities';

export interface SpecialtyRule {
  id: number;
  domain: string;
  specialty: string;
  rule_reference: string;
  version: string;
}

export interface SystemLog {
  id: number;
  level: string;
  event_type: string;
  message: string;
  user_id?: number;
  created_at: string;
}

export const adminService = {
  // Users
  getUsers: async (): Promise<User[]> => {
    return apiClient.get('/api/admin/users');
  },
  updateUserStatus: async (id: number, status: string): Promise<User> => {
    return apiClient.put(`/api/admin/users/${id}/status`, { status });
  },

  // Facilities
  getFacilities: async (): Promise<HealthcareFacility[]> => {
    return apiClient.get('/api/admin/facilities');
  },
  addFacility: async (facility: Partial<HealthcareFacility>): Promise<HealthcareFacility> => {
    return apiClient.post('/api/admin/facilities', facility);
  },
  updateFacility: async (id: number, facility: Partial<HealthcareFacility>): Promise<HealthcareFacility> => {
    return apiClient.put(`/api/admin/facilities/${id}`, facility);
  },

  // Specialty Rules
  getSpecialtyRules: async (): Promise<SpecialtyRule[]> => {
    return apiClient.get('/api/admin/specialty_rules');
  },
  addSpecialtyRule: async (rule: Partial<SpecialtyRule>): Promise<SpecialtyRule> => {
    return apiClient.post('/api/admin/specialty_rules', rule);
  },
  updateSpecialtyRule: async (id: number, rule: Partial<SpecialtyRule>): Promise<SpecialtyRule> => {
    return apiClient.put(`/api/admin/specialty_rules/${id}`, rule);
  },

  // System Logs
  getSystemLogs: async (): Promise<SystemLog[]> => {
    return apiClient.get('/api/admin/logs');
  },
  createLog: async (log: Partial<SystemLog>): Promise<SystemLog> => {
    return apiClient.post('/api/admin/logs', log);
  }
};
