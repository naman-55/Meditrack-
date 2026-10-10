import { Request, Response } from 'express';
import { MapsService } from '../services/maps/maps.service.js';

export const SUPPORTED_SPECIALTIES = [
  { id: 'all', name: 'All Specialists', icon: 'Stethoscope', description: 'Comprehensive medical specialists and facilities' },
  { id: 'cardiologist', name: 'Cardiologist', icon: 'HeartPulse', description: 'Heart, blood vessels, and cardiovascular systems' },
  { id: 'neurologist', name: 'Neurologist', icon: 'Brain', description: 'Brain, spinal cord, and nervous system disorders' },
  { id: 'dermatologist', name: 'Dermatologist', icon: 'Sparkles', description: 'Skin, hair, nails, and cutaneous health' },
  { id: 'orthopedic', name: 'Orthopedic', icon: 'Bone', description: 'Bones, joints, ligaments, tendons, and musculoskeletal' },
  { id: 'pediatrician', name: 'Pediatrician', icon: 'Baby', description: 'Infant, child, and adolescent healthcare' },
  { id: 'gynecologist', name: 'Gynecologist', icon: 'Users', description: 'Women\'s health, reproductive wellness, and obstetrics' },
  { id: 'dentist', name: 'Dentist', icon: 'Smile', description: 'Oral healthcare, dental procedures, and teeth hygiene' },
  { id: 'ophthalmologist', name: 'Ophthalmologist', icon: 'Eye', description: 'Vision care, ocular health, and ophthalmic surgeries' },
  { id: 'psychiatrist', name: 'Psychiatrist', icon: 'Activity', description: 'Mental health, behavioral wellness, and clinical psychiatry' },
  { id: 'ent', name: 'ENT Specialist', icon: 'Headphones', description: 'Ear, nose, throat, head and neck conditions' },
  { id: 'general_physician', name: 'General Physician', icon: 'Stethoscope', description: 'Primary care, clinical checkups, and general internal medicine' }
];

export class SpecialistsController {
  /**
   * GET /api/specialists/nearby
   */
  static async getNearbySpecialists(req: Request, res: Response) {
    try {
      const latStr = req.query.lat as string;
      const lngStr = req.query.lng as string;

      if (!latStr || !lngStr) {
        return res.status(400).json({
          error: 'Latitude and longitude coordinates are required.',
          example: '/api/specialists/nearby?lat=23.2599&lng=77.4126&specialty=cardiologist&radius=10'
        });
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' });
      }

      const radiusKm = Math.min(50, Math.max(1, parseFloat(req.query.radius as string || '10')));
      const specialty = (req.query.specialty as string || 'all').trim();
      const type = (req.query.type as any || 'all');
      const openNow = req.query.openNow === 'true';
      const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
      const sortBy = (req.query.sortBy as any || 'nearest');

      const data = await MapsService.getNearbySpecialists({
        lat,
        lng,
        radiusKm,
        specialty,
        type,
        openNow,
        minRating,
        sortBy
      });

      return res.json({
        results: data.results,
        total: data.total,
        center: data.center,
        radiusKm: data.radiusKm,
        cached: data.cached
      });
    } catch (error: any) {
      console.error('Error fetching nearby specialists:', error);
      return res.status(500).json({
        error: 'Failed to retrieve nearby healthcare specialists.',
        details: error.message
      });
    }
  }

  /**
   * GET /api/specialists/geocode
   */
  static async geocodeLocation(req: Request, res: Response) {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required for geocoding.' });
      }

      const results = await MapsService.geocodeQuery(query);
      return res.json({
        query,
        results
      });
    } catch (error: any) {
      console.error('Geocoding controller error:', error);
      return res.status(500).json({ error: 'Geocoding failed.' });
    }
  }

  /**
   * GET /api/specialists/directions
   */
  static async getDirections(req: Request, res: Response) {
    try {
      const destLat = parseFloat(req.query.destLat as string);
      const destLng = parseFloat(req.query.destLng as string);
      const originLat = req.query.originLat ? parseFloat(req.query.originLat as string) : undefined;
      const originLng = req.query.originLng ? parseFloat(req.query.originLng as string) : undefined;
      const name = req.query.name as string;

      if (isNaN(destLat) || isNaN(destLng)) {
        return res.status(400).json({ error: 'Destination coordinates (destLat, destLng) are required.' });
      }

      const directions = MapsService.getDirections(destLat, destLng, originLat, originLng, name);
      return res.json(directions);
    } catch (error: any) {
      console.error('Directions error:', error);
      return res.status(500).json({ error: 'Failed to compute directions.' });
    }
  }

  /**
   * GET /api/specialists/specialties
   */
  static getSupportedSpecialties(req: Request, res: Response) {
    return res.json(SUPPORTED_SPECIALTIES);
  }
}
