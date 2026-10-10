import https from 'https';

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  boundingbox?: [string, string, string, string];
}

interface CacheEntry {
  timestamp: number;
  data: GeocodeResult[];
}

const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class GeocodingService {
  /**
   * Geocode a free-form query (city, area, PIN code, address)
   */
  static async geocodeAddress(query: string): Promise<GeocodeResult[]> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const cacheKey = cleanQuery.toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&addressdetails=1`;
      const rawData = await this.httpGetJson(url);

      if (!Array.isArray(rawData)) {
        return [];
      }

      const results: GeocodeResult[] = rawData.map((item: any) => {
        const addr = item.address || {};
        return {
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county,
          state: addr.state,
          country: addr.country,
          postcode: addr.postcode,
          boundingbox: item.boundingbox,
        };
      }).filter((res) => !isNaN(res.latitude) && !isNaN(res.longitude));

      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: results });
      return results;
    } catch (err) {
      console.error('Geocoding service error:', err);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to human-readable address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const key = `rev-${lat.toFixed(3)}-${lng.toFixed(3)}`;
    const cached = geocodeCache.get(key);
    if (cached && cached.data.length > 0) {
      return cached.data[0].displayName;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const data = await this.httpGetJson(url);
      if (data && data.display_name) {
        const res: GeocodeResult = {
          displayName: data.display_name,
          latitude: lat,
          longitude: lng,
          city: data.address?.city || data.address?.town || data.address?.county,
          state: data.address?.state,
          country: data.address?.country,
          postcode: data.address?.postcode
        };
        geocodeCache.set(key, { timestamp: Date.now(), data: [res] });
        return data.display_name;
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  }

  private static httpGetJson(urlStr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(urlStr);
      const req = https.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'MediTrack-Health-Platform/1.0 (healthcare-navigator; support@meditrack.internal)',
          'Accept': 'application/json'
        },
        timeout: 7000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve([]);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });

      req.on('error', (err) => {
        console.warn('Geocoding request failed:', err.message);
        resolve([]);
      });
    });
  }
}
