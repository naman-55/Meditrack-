import { PlacesService, SpecialistProvider, NearbySearchParams } from './places.service.js';
import { GeocodingService, GeocodeResult } from './geocoding.service.js';
import { DirectionsService, DirectionsResult } from './directions.service.js';

interface CacheEntry {
  timestamp: number;
  data: SpecialistProvider[];
}

const nearbySearchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export class MapsService {
  /**
   * Find nearby specialists with coordinate rounding and in-memory TTL caching
   */
  static async getNearbySpecialists(params: NearbySearchParams): Promise<{
    results: SpecialistProvider[];
    total: number;
    center: { lat: number; lng: number };
    radiusKm: number;
    cached: boolean;
  }> {
    // Round coordinates to 2 decimal places (~1.1km) so slight GPS jitter hits the cache
    const roundedLat = parseFloat(params.lat.toFixed(2));
    const roundedLng = parseFloat(params.lng.toFixed(2));
    const specialtyKey = (params.specialty || 'all').toLowerCase();
    const typeKey = (params.type || 'all').toLowerCase();
    const radiusKey = params.radiusKm || 10;
    const sortKey = params.sortBy || 'nearest';
    const openNowKey = params.openNow ? '1' : '0';
    const ratingKey = params.minRating || 0;

    const cacheKey = `${roundedLat},${roundedLng}_${specialtyKey}_${typeKey}_${radiusKey}_${sortKey}_${openNowKey}_${ratingKey}`;

    const cached = nearbySearchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        results: cached.data,
        total: cached.data.length,
        center: { lat: params.lat, lng: params.lng },
        radiusKm: radiusKey,
        cached: true,
      };
    }

    const results = await PlacesService.searchNearbySpecialists(params);

    nearbySearchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: results,
    });

    return {
      results,
      total: results.length,
      center: { lat: params.lat, lng: params.lng },
      radiusKm: radiusKey,
      cached: false,
    };
  }

  /**
   * Geocode a manual address/city/PIN code query
   */
  static async geocodeQuery(query: string): Promise<GeocodeResult[]> {
    return GeocodingService.geocodeAddress(query);
  }

  /**
   * Reverse geocode a latitude/longitude pair
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    return GeocodingService.reverseGeocode(lat, lng);
  }

  /**
   * Calculate navigation links and distance
   */
  static getDirections(
    destLat: number,
    destLng: number,
    originLat?: number,
    originLng?: number,
    providerName?: string
  ): DirectionsResult {
    return DirectionsService.generateDirections(destLat, destLng, originLat, originLng, providerName);
  }

  /**
   * Clear all map caches (for maintenance or tests)
   */
  static clearCache() {
    nearbySearchCache.clear();
  }
}
