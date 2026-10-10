import { Router } from 'express';
import { SpecialistsController } from '../controllers/specialists.controller.js';

export const specialistsRouter = Router();

// Endpoint for finding nearby specialists with radius, specialty, type, openNow filters
specialistsRouter.get('/nearby', SpecialistsController.getNearbySpecialists);

// Endpoint for manual location geocoding (city, area, PIN code, address)
specialistsRouter.get('/geocode', SpecialistsController.geocodeLocation);

// Endpoint for directions links and travel estimates
specialistsRouter.get('/directions', SpecialistsController.getDirections);

// Endpoint for list of supported medical specialties
specialistsRouter.get('/specialties', SpecialistsController.getSupportedSpecialties);
