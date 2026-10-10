export interface DirectionsResult {
  googleMapsUrl: string;
  appleMapsUrl: string;
  osmDirectionsUrl: string;
  distanceKm: number;
  estimatedDriveTimeMinutes?: number;
}

export class DirectionsService {
  /**
   * Calculate geographic distance in km using the standard Haversine formula
   */
  static calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Build navigation links for Google Maps, Apple Maps, and OpenStreetMap
   */
  static generateDirections(
    destLat: number,
    destLng: number,
    originLat?: number,
    originLng?: number,
    providerName?: string
  ): DirectionsResult {
    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    let appleMapsUrl = `https://maps.apple.com/?daddr=${destLat},${destLng}`;
    let osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${destLat}%2C${destLng}`;

    let distanceKm = 0;
    let estimatedDriveTimeMinutes: number | undefined;

    if (originLat !== undefined && originLng !== undefined && !isNaN(originLat) && !isNaN(originLng)) {
      distanceKm = this.calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
      googleMapsUrl += `&origin=${originLat},${originLng}`;
      appleMapsUrl += `&saddr=${originLat},${originLng}`;
      osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${destLat}%2C${destLng}`;
      
      // Estimated urban driving speed ~30 km/h + 3 mins parking/start buffer
      const drivingMinutes = Math.round((distanceKm / 30) * 60) + 3;
      estimatedDriveTimeMinutes = Math.max(3, drivingMinutes);
    }

    if (providerName) {
      googleMapsUrl += `&destination_place_id=${encodeURIComponent(providerName)}`;
    }

    return {
      googleMapsUrl,
      appleMapsUrl,
      osmDirectionsUrl,
      distanceKm,
      estimatedDriveTimeMinutes,
    };
  }
}
