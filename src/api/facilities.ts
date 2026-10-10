import { apiClient } from './client';

export interface HealthcareFacility {
  id: number;
  name: string;
  specialties: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  verification_status: string;
  last_verified: string;
  distance?: number;
}

export const facilitiesService = {
  getNearbyFacilities: async (params: { city?: string, lat?: number, lng?: number, specialty?: string }): Promise<HealthcareFacility[]> => {
    const query = new URLSearchParams();
    if (params.city) query.append('city', params.city);
    if (params.lat) query.append('lat', params.lat.toString());
    if (params.lng) query.append('lng', params.lng.toString());
    if (params.specialty) query.append('specialty', params.specialty);
    
    return apiClient.get(`/api/facilities?${query.toString()}`);
  }
};
