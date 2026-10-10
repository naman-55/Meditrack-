import { apiClient } from './client';

export interface SpecialistProvider {
  id: string;
  name: string;
  specialty: string;
  type: 'doctor' | 'hospital' | 'clinic' | 'diagnostic_center';
  latitude: number;
  longitude: number;
  address: string;
  distanceKm: number;
  rating?: number;
  reviewCount?: number;
  openNow?: boolean;
  openingHours?: string;
  phone?: string;
  website?: string;
  source: string;
}

export interface NearbySpecialistsResponse {
  results: SpecialistProvider[];
  total: number;
  center: { lat: number; lng: number };
  radiusKm: number;
  cached?: boolean;
}

export interface GeocodeItem {
  displayName: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface GeocodeResponse {
  query: string;
  results: GeocodeItem[];
}

export interface DirectionsResponse {
  googleMapsUrl: string;
  appleMapsUrl: string;
  osmDirectionsUrl: string;
  distanceKm: number;
  estimatedDriveTimeMinutes?: number;
}

export interface SpecialtyItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const specialistsService = {
  getNearbySpecialists: async (params: {
    lat: number;
    lng: number;
    specialty?: string;
    radius?: number;
    type?: string;
    openNow?: boolean;
    minRating?: number;
    sortBy?: 'nearest' | 'highest_rated' | 'relevance';
  }): Promise<NearbySpecialistsResponse> => {
    const query = new URLSearchParams();
    query.set('lat', params.lat.toString());
    query.set('lng', params.lng.toString());
    if (params.specialty && params.specialty !== 'all') query.set('specialty', params.specialty);
    if (params.radius) query.set('radius', params.radius.toString());
    if (params.type && params.type !== 'all') query.set('type', params.type);
    if (params.openNow) query.set('openNow', 'true');
    if (params.minRating) query.set('minRating', params.minRating.toString());
    if (params.sortBy) query.set('sortBy', params.sortBy);

    return apiClient.get(`/api/specialists/nearby?${query.toString()}`);
  },

  geocodeLocation: async (q: string): Promise<GeocodeResponse> => {
    return apiClient.get(`/api/specialists/geocode?q=${encodeURIComponent(q)}`);
  },

  getDirections: async (params: {
    destLat: number;
    destLng: number;
    originLat?: number;
    originLng?: number;
    name?: string;
  }): Promise<DirectionsResponse> => {
    const query = new URLSearchParams();
    query.set('destLat', params.destLat.toString());
    query.set('destLng', params.destLng.toString());
    if (params.originLat !== undefined) query.set('originLat', params.originLat.toString());
    if (params.originLng !== undefined) query.set('originLng', params.originLng.toString());
    if (params.name) query.set('name', params.name);

    return apiClient.get(`/api/specialists/directions?${query.toString()}`);
  },

  getSupportedSpecialties: async (): Promise<SpecialtyItem[]> => {
    return apiClient.get('/api/specialists/specialties');
  }
};
