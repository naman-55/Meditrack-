import https from 'https';
import { DirectionsService } from './directions.service.js';

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

export interface NearbySearchParams {
  lat: number;
  lng: number;
  specialty?: string;
  radiusKm?: number;
  type?: 'all' | 'doctor' | 'hospital' | 'clinic' | 'diagnostic_center';
  openNow?: boolean;
  minRating?: number;
  sortBy?: 'nearest' | 'highest_rated' | 'relevance';
}

export class PlacesService {
  /**
   * Search nearby medical providers from live external APIs
   */
  static async searchNearbySpecialists(params: NearbySearchParams): Promise<SpecialistProvider[]> {
    const { lat, lng, specialty = 'all', radiusKm = 10, type = 'all', openNow, minRating, sortBy = 'nearest' } = params;

    let providers: SpecialistProvider[] = [];

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    // 1. Fetch from modern Google Places API (New)
    if (apiKey) {
      try {
        const googleResults = await this.fetchFromGooglePlaces(lat, lng, radiusKm, specialty, type);
        if (googleResults.length > 0) {
          providers.push(...googleResults);
        }
      } catch (err) {
        console.warn('Google Places API query error:', err);
      }
    }

    // 2. Supplement with OpenStreetMap to ensure comprehensive coverage
    try {
      const osmResults = await this.fetchFromOpenStreetMap(lat, lng, radiusKm, specialty, type);
      for (const osm of osmResults) {
        const isDuplicate = providers.some(p => 
          p.name.toLowerCase() === osm.name.toLowerCase() ||
          DirectionsService.calculateHaversineDistanceKm(p.latitude, p.longitude, osm.latitude, osm.longitude) < 0.1
        );
        if (!isDuplicate) {
          providers.push(osm);
        }
      }
    } catch (err) {
      console.error('OpenStreetMap fetch error:', err);
    }

    // 3. Filter by distance strictly within radiusKm
    providers = providers.filter(p => p.distanceKm <= radiusKm);

    // 4. Filter by provider type if specified
    if (type && type !== 'all') {
      providers = providers.filter(p => p.type === type);
    }

    // 5. Filter by specialty if specified
    if (specialty && specialty !== 'all') {
      const targetSpecialty = specialty.toLowerCase().replace(/ist$/, '').replace(/ian$/, '').replace(/ic$/, '');
      providers = providers.filter(p => {
        const pSpecialty = (p.specialty || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return pSpecialty.includes(targetSpecialty) || pName.includes(targetSpecialty);
      });
    }

    // 6. Filter by openNow if explicitly requested
    if (openNow === true) {
      providers = providers.filter(p => p.openNow === true);
    }

    // 7. Filter by minimum rating if requested and rating exists
    if (minRating !== undefined && minRating > 0) {
      providers = providers.filter(p => (p.rating !== undefined && p.rating >= minRating));
    }

    // 8. Sort results
    if (sortBy === 'highest_rated') {
      providers.sort((a, b) => {
        const rateA = a.rating ?? 0;
        const rateB = b.rating ?? 0;
        if (rateB !== rateA) return rateB - rateA;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'relevance') {
      providers.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, specialty);
        const scoreB = this.calculateRelevanceScore(b, specialty);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      // Default: nearest
      providers.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return providers;
  }

  /**
   * Fetch live healthcare POIs from OpenStreetMap using Nominatim bounded search
   */
  private static async fetchFromOpenStreetMap(
    lat: number,
    lng: number,
    radiusKm: number,
    specialty: string,
    type: string
  ): Promise<SpecialistProvider[]> {
    // Calculate bounding box for the search area
    const deltaLat = radiusKm / 111;
    const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const minLat = (lat - deltaLat).toFixed(4);
    const maxLat = (lat + deltaLat).toFixed(4);
    const minLng = (lng - deltaLng).toFixed(4);
    const maxLng = (lng + deltaLng).toFixed(4);

    // Prepare search terms based on specialty and type
    const searchTerms: string[] = [];
    if (specialty && specialty !== 'all') {
      searchTerms.push(specialty);
      if (specialty.toLowerCase().includes('cardio')) searchTerms.push('cardiac hospital', 'heart clinic');
      else if (specialty.toLowerCase().includes('neuro')) searchTerms.push('neurology hospital');
      else if (specialty.toLowerCase().includes('dent')) searchTerms.push('dental clinic');
      else if (specialty.toLowerCase().includes('derma')) searchTerms.push('skin clinic');
      else if (specialty.toLowerCase().includes('eye') || specialty.toLowerCase().includes('ophthal')) searchTerms.push('eye hospital');
    }

    if (type === 'hospital') {
      searchTerms.push('hospital');
    } else if (type === 'clinic') {
      searchTerms.push('clinic');
    } else if (type === 'doctor') {
      searchTerms.push('doctor', 'physician');
    } else if (type === 'diagnostic_center') {
      searchTerms.push('diagnostic center', 'pathology laboratory');
    } else {
      searchTerms.push('hospital', 'clinic', 'medical center');
    }

    const uniqueMap = new Map<string, SpecialistProvider>();

    // Query Nominatim with bounded viewbox for live POIs
    for (const term of searchTerms.slice(0, 3)) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&format=json&limit=25&addressdetails=1&extratags=1`;
      const items = await this.httpGetJson(url);

      if (Array.isArray(items)) {
        for (const item of items) {
          const itemLat = parseFloat(item.lat);
          const itemLng = parseFloat(item.lon);
          if (isNaN(itemLat) || isNaN(itemLng)) continue;

          const distanceKm = DirectionsService.calculateHaversineDistanceKm(lat, lng, itemLat, itemLng);
          const providerId = `osm-${item.osm_type || 'node'}-${item.osm_id || item.place_id}`;

          if (uniqueMap.has(providerId)) continue;

          const tags = item.extratags || {};
          const addr = item.address || {};

          const name = item.name || tags.name || tags['name:en'] || addr.amenity || 'Medical Facility';
          const detectedType = this.classifyProviderType(item.type, tags, name);
          const detectedSpecialty = this.classifySpecialty(tags, name, specialty);

          // Extract legitimate contact/operational details if provided by API
          const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || undefined;
          const website = tags.website || tags['contact:website'] || tags['url'] || undefined;
          const openingHours = tags.opening_hours || undefined;

          // Open status: only set if explicitly supported by real opening hours data
          let openNow: boolean | undefined = undefined;
          if (openingHours) {
            if (openingHours.includes('24/7') || openingHours.toLowerCase().includes('mo-su')) {
              openNow = true;
            }
          }

          // Build clean formatted address
          const addressParts = [
            addr.road,
            addr.neighbourhood || addr.suburb || addr.residential,
            addr.city_district || addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode
          ].filter(Boolean);
          const formattedAddress = addressParts.join(', ') || item.display_name;

          uniqueMap.set(providerId, {
            id: providerId,
            name,
            specialty: detectedSpecialty,
            type: detectedType,
            latitude: itemLat,
            longitude: itemLng,
            address: formattedAddress,
            distanceKm,
            openNow,
            openingHours,
            phone,
            website,
            source: 'OpenStreetMap'
          });
        }
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Fetch from modern Google Places API (New)
   */
  private static async fetchFromGooglePlaces(
    lat: number,
    lng: number,
    radiusKm: number,
    specialty: string,
    type: string
  ): Promise<SpecialistProvider[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    const radiusMeters = Math.min(50000, radiusKm * 1000);

    // Map requested type to Places API (New) place types
    let includedTypes: string[] = ['hospital', 'doctor'];
    if (type === 'hospital') includedTypes = ['hospital', 'general_hospital'];
    else if (type === 'doctor') includedTypes = ['doctor'];
    else if (type === 'clinic') includedTypes = ['medical_clinic', 'health_clinic'];
    else if (type === 'diagnostic_center') includedTypes = ['medical_lab', 'pharmacy', 'hospital'];
    else includedTypes = ['hospital', 'doctor', 'medical_clinic'];

    let placesList: any[] = [];

    // If a specific specialty is requested (e.g. Cardiologist), use Text Search for high precision
    if (specialty && specialty !== 'all') {
      const textQuery = `${specialty} hospital clinic doctor`;
      const searchPayload = JSON.stringify({
        textQuery,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        }
      });

      const textData = await this.httpPostJson(
        'https://places.googleapis.com/v1/places:searchText',
        searchPayload,
        {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.primaryType,places.types'
        }
      );

      if (textData && Array.isArray(textData.places)) {
        placesList = textData.places;
      }
    }

    // If no text search results or specialty is 'all', use searchNearby
    if (placesList.length === 0) {
      const nearbyPayload = JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        }
      });

      const nearbyData = await this.httpPostJson(
        'https://places.googleapis.com/v1/places:searchNearby',
        nearbyPayload,
        {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.primaryType,places.types'
        }
      );

      if (nearbyData && Array.isArray(nearbyData.places)) {
        placesList = nearbyData.places;
      }
    }

    if (!Array.isArray(placesList) || placesList.length === 0) return [];

    return placesList
      .filter((place: any) => {
        const placeLat = place.location?.latitude;
        const placeLng = place.location?.longitude;
        return typeof placeLat === 'number' && typeof placeLng === 'number' && !isNaN(placeLat) && !isNaN(placeLng);
      })
      .map((place: any) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      const distanceKm = DirectionsService.calculateHaversineDistanceKm(lat, lng, placeLat, placeLng);
      const name = place.displayName?.text || 'Medical Facility';

      const placeTypes: string[] = place.types || [];
      const primaryType = (place.primaryType || '').toLowerCase();
      let detectedType: 'doctor' | 'hospital' | 'clinic' | 'diagnostic_center' = 'clinic';

      if (primaryType.includes('hospital') || placeTypes.includes('hospital') || name.toLowerCase().includes('hospital')) {
        detectedType = 'hospital';
      } else if (primaryType.includes('doctor') || placeTypes.includes('doctor') || name.toLowerCase().includes('dr.')) {
        detectedType = 'doctor';
      } else if (name.toLowerCase().includes('diagnostic') || name.toLowerCase().includes('lab') || placeTypes.includes('medical_lab')) {
        detectedType = 'diagnostic_center';
      }

      return {
        id: `google-${place.id}`,
        name,
        specialty: this.classifySpecialty({}, name, specialty),
        type: detectedType,
        latitude: placeLat,
        longitude: placeLng,
        address: place.formattedAddress || '',
        distanceKm,
        rating: place.rating !== undefined ? parseFloat(place.rating) : undefined,
        reviewCount: place.userRatingCount !== undefined ? parseInt(place.userRatingCount, 10) : undefined,
        openNow: place.currentOpeningHours?.openNow,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        source: 'Google Places'
      };
    });
  }

  private static classifyProviderType(
    rawType: string,
    tags: Record<string, any>,
    name: string
  ): 'doctor' | 'hospital' | 'clinic' | 'diagnostic_center' {
    const lowerName = name.toLowerCase();
    const amenity = (tags.amenity || rawType || '').toLowerCase();
    const healthcare = (tags.healthcare || '').toLowerCase();

    if (
      lowerName.includes('hospital') ||
      amenity === 'hospital' ||
      healthcare === 'hospital'
    ) {
      return 'hospital';
    }

    if (
      lowerName.includes('diagnostic') ||
      lowerName.includes('pathology') ||
      lowerName.includes('lab') ||
      lowerName.includes('scan') ||
      healthcare === 'laboratory' ||
      healthcare === 'diagnostic_centre'
    ) {
      return 'diagnostic_center';
    }

    if (
      lowerName.includes('dr.') ||
      lowerName.includes('doctor') ||
      lowerName.includes('physician') ||
      amenity === 'doctors' ||
      healthcare === 'doctor'
    ) {
      return 'doctor';
    }

    return 'clinic';
  }

  private static classifySpecialty(tags: Record<string, any>, name: string, preferredSpecialty?: string): string {
    const text = `${name} ${tags.speciality || ''} ${tags['healthcare:speciality'] || ''}`.toLowerCase();

    if (text.includes('cardio') || text.includes('heart')) return 'Cardiologist';
    if (text.includes('neuro') || text.includes('brain') || text.includes('spine')) return 'Neurologist';
    if (text.includes('derma') || text.includes('skin')) return 'Dermatologist';
    if (text.includes('ortho') || text.includes('bone') || text.includes('joint')) return 'Orthopedic';
    if (text.includes('pediat') || text.includes('child') || text.includes('kid')) return 'Pediatrician';
    if (text.includes('gynec') || text.includes('maternity') || text.includes('women') || text.includes('obstet')) return 'Gynecologist';
    if (text.includes('dent') || text.includes('tooth') || text.includes('oral')) return 'Dentist';
    if (text.includes('ophthal') || text.includes('eye') || text.includes('vision')) return 'Ophthalmologist';
    if (text.includes('psych') || text.includes('mental')) return 'Psychiatrist';
    if (text.includes('ent') || text.includes('ear') || text.includes('throat')) return 'ENT Specialist';
    if (text.includes('endocrin') || text.includes('diabet') || text.includes('thyroid')) return 'Endocrinologist';
    if (text.includes('nephro') || text.includes('kidney') || text.includes('dialysis')) return 'Nephrologist';
    if (text.includes('oncol') || text.includes('cancer')) return 'Oncologist';

    if (preferredSpecialty && preferredSpecialty !== 'all') {
      return preferredSpecialty.charAt(0).toUpperCase() + preferredSpecialty.slice(1);
    }

    if (text.includes('hospital') || text.includes('multi')) return 'Multi-Specialty Medicine';
    return 'General Physician';
  }

  private static calculateRelevanceScore(provider: SpecialistProvider, querySpecialty: string): number {
    let score = 0;
    if (querySpecialty && querySpecialty !== 'all') {
      if (provider.specialty.toLowerCase() === querySpecialty.toLowerCase()) score += 10;
      else if (provider.name.toLowerCase().includes(querySpecialty.toLowerCase())) score += 8;
      else if (provider.type === 'hospital') score += 5;
    }
    if (provider.rating) score += provider.rating;
    if (provider.openNow) score += 2;
    return score;
  }

  private static httpGetJson(urlStr: string): Promise<any> {
    return new Promise((resolve) => {
      try {
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
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(body));
              } else {
                resolve([]);
              }
            } catch (e) {
              resolve([]);
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve([]);
        });

        req.on('error', () => {
          resolve([]);
        });
      } catch (err) {
        resolve([]);
      }
    });
  }

  private static async httpPostJson(urlStr: string, payload: string, headers: Record<string, string>): Promise<any> {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await PlacesService.singleHttpPostJson(urlStr, payload, headers);
      if (res !== null) return res;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 350));
      }
    }
    return null;
  }

  private static singleHttpPostJson(urlStr: string, payload: string, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(urlStr);
        const req = https.request({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 7000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(body));
              } else {
                console.warn('[Google Places API] Notice: HTTP response status', res.statusCode);
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(null);
        });

        req.on('error', (err) => {
          if (!req.destroyed) {
            console.warn('[Google Places API] Connection notice (service temporarily unavailable):', err.message);
          }
          resolve(null);
        });

        req.write(payload);
        req.end();
      } catch {
        resolve(null);
      }
    });
  }
}
