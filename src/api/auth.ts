import { apiClient, setAccessToken } from './client';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  fullName?: string;
  role: string;
  status: string;
  phone?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  age?: number | null;
  gender?: string;
  blood_group?: string;
  bloodGroup?: string;
  height_cm?: number | null;
  heightCm?: number | null;
  weight_kg?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bmiCategory?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergencyContact?: EmergencyContact;
  notification_email?: number;
  notification_sms?: number;
  notification_push?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface RequestResetResponse {
  message: string;
  devResetToken?: string;
  devResetUrl?: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
  error?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    if (res.access_token) {
      setAccessToken(res.access_token);
    }
    return res;
  },
  register: async (credentials: RegisterCredentials) => {
    return apiClient.post('/api/auth/register', credentials);
  },
  refreshSession: async () => {
    const res = await apiClient.post('/api/auth/refresh', {});
    if (res.access_token) {
      setAccessToken(res.access_token);
    }
    return res;
  },
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get('/api/auth/me');
  },
  getProfile: async (): Promise<User> => {
    return apiClient.get('/api/profile');
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiClient.put('/api/profile', data);
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  },
  requestReset: async (email: string): Promise<RequestResetResponse> => {
    return apiClient.post('/api/auth/forgot-password', { email });
  },
  forgotPassword: async (email: string): Promise<RequestResetResponse> => {
    return apiClient.post('/api/auth/forgot-password', { email });
  },
  verifyResetToken: async (token: string): Promise<VerifyResetTokenResponse> => {
    return apiClient.post('/api/auth/verify-reset-token', { token });
  },
  resetPasswordWithToken: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post('/api/auth/reset-password', { token, newPassword });
  },
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout', {});
    } finally {
      setAccessToken(null);
    }
  }
};
