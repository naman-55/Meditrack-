import React, { useEffect, useState, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { SpecialistProvider } from '../../api/specialists';
import { ErrorBoundary } from '../ErrorBoundary';
import { useSettings } from '../../context/SettingsContext';
import { 
  Building2, 
  Stethoscope, 
  Plus, 
  Activity, 
  Navigation, 
  Star, 
  Phone, 
  Globe, 
  AlertTriangle,
  RefreshCw,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface SpecialistsGoogleMapProps {
  apiKey?: string;
  userLocation: { lat: number; lng: number } | null;
  searchCenter: { lat: number; lng: number };
  radiusKm: number;
  providers: SpecialistProvider[];
  selectedProvider: SpecialistProvider | null;
  onSelectProvider: (provider: SpecialistProvider | null) => void;
  onDirectionsClick: (provider: SpecialistProvider) => void;
  onViewDetailsClick: (provider: SpecialistProvider) => void;
  isLoading?: boolean;
}

// Inner component for controlling Google Map camera and search radius circle
function MapController({
  searchCenter,
  radiusKm,
  selectedProvider,
  userLocation
}: {
  searchCenter: { lat: number; lng: number };
  radiusKm: number;
  selectedProvider: SpecialistProvider | null;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Pan to search center when it updates
  useEffect(() => {
    if (!map) return;
    if (!isFinite(searchCenter.lat) || !isFinite(searchCenter.lng)) return;

    try {
      map.panTo({ lat: searchCenter.lat, lng: searchCenter.lng });
      const zoom = radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 11;
      map.setZoom(zoom);
    } catch (e) {
      console.warn('Map panTo error:', e);
    }
  }, [map, searchCenter.lat, searchCenter.lng, radiusKm]);

  // Pan to selected provider
  useEffect(() => {
    if (!map || !selectedProvider) return;
    if (!isFinite(selectedProvider.latitude) || !isFinite(selectedProvider.longitude)) return;

    try {
      map.panTo({ lat: selectedProvider.latitude, lng: selectedProvider.longitude });
    } catch (e) {
      console.warn('Map select pan error:', e);
    }
  }, [map, selectedProvider]);

  // Render and update search radius circle
  useEffect(() => {
    if (!map) return;
    if (typeof google === 'undefined' || !google.maps || !google.maps.Circle) return;
    if (!isFinite(searchCenter.lat) || !isFinite(searchCenter.lng)) return;

    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    try {
      circleRef.current = new google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: '#3B82F6',
        fillOpacity: 0.12,
        map,
        center: { lat: searchCenter.lat, lng: searchCenter.lng },
        radius: Math.max(100, radiusKm * 1000)
      });
    } catch (err) {
      console.warn('Circle overlay init notice:', err);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, searchCenter.lat, searchCenter.lng, radiusKm]);

  return null;
}

// Marker Icon renderer based on provider type
function ProviderMarkerIcon({ 
  type, 
  isSelected 
}: { 
  type: string; 
  isSelected: boolean 
}) {
  if (type === 'hospital') {
    return (
      <div className={`relative flex items-center justify-center transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}>
        <div className={`w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-white ring-4 ring-emerald-300' : 'border-white'}`}>
          <Building2 className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="absolute -bottom-1 w-2.5 h-2.5 rotate-45 bg-emerald-600"></div>
      </div>
    );
  }

  if (type === 'doctor') {
    return (
      <div className={`relative flex items-center justify-center transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}>
        <div className={`w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-white ring-4 ring-indigo-300' : 'border-white'}`}>
          <Stethoscope className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="absolute -bottom-1 w-2.5 h-2.5 rotate-45 bg-indigo-600"></div>
      </div>
    );
  }

  if (type === 'diagnostic_center') {
    return (
      <div className={`relative flex items-center justify-center transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}>
        <div className={`w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-white ring-4 ring-purple-300' : 'border-white'}`}>
          <Activity className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="absolute -bottom-1 w-2.5 h-2.5 rotate-45 bg-purple-600"></div>
      </div>
    );
  }

  // Clinic
  return (
    <div className={`relative flex items-center justify-center transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}>
      <div className={`w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-white ring-4 ring-teal-300' : 'border-white'}`}>
        <Plus className="w-4 h-4 stroke-[3]" />
      </div>
      <div className="absolute -bottom-1 w-2.5 h-2.5 rotate-45 bg-teal-600"></div>
    </div>
  );
}

export default function SpecialistsGoogleMap({
  apiKey,
  userLocation,
  searchCenter,
  radiusKm,
  providers,
  selectedProvider,
  onSelectProvider,
  onDirectionsClick,
  onViewDetailsClick,
  isLoading
}: SpecialistsGoogleMapProps) {
  const [mapLoadError, setMapLoadError] = useState(false);
  const { preferences } = useSettings();
  const mapColorScheme = preferences.appearance.theme === 'Dark'
    ? 'DARK'
    : preferences.appearance.theme === 'Light'
      ? 'LIGHT'
      : 'FOLLOW_SYSTEM';

  const activeKey = apiKey || 
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 
    'AIzaSyB9U9L4NVKuonru_l4vnyG6J2_rLkDzReM';

  // Filter providers to only include ones with valid numeric coordinates
  const validProviders = providers.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && 
           isFinite(p.latitude) && isFinite(p.longitude)
  );

  const isUserLocationValid = userLocation && 
    typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' &&
    isFinite(userLocation.lat) && isFinite(userLocation.lng);

  const isSearchCenterValid = typeof searchCenter.lat === 'number' && typeof searchCenter.lng === 'number' &&
    isFinite(searchCenter.lat) && isFinite(searchCenter.lng);

  const fallbackUI = (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-900 text-white p-6 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
          <MapPin className="w-5 h-5" />
          <span>Interactive Map Navigation Active</span>
        </div>
        <h3 className="text-xl font-bold">
          {validProviders.length} Nearby Healthcare Facilities Found
        </h3>
        <p className="text-xs text-slate-300 max-w-md leading-relaxed">
          Search center: {typeof searchCenter?.lat === 'number' ? searchCenter.lat.toFixed(4) : '0.0000'}° N, {typeof searchCenter?.lng === 'number' ? searchCenter.lng.toFixed(4) : '0.0000'}° E (Radius: {radiusKm} km).
          You can inspect facilities in the list beside the map or launch Google Maps directions directly.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div className="text-emerald-400 font-bold text-lg">
            {validProviders.filter(p => p.type === 'hospital').length}
          </div>
          <div className="text-[11px] text-slate-400">Hospitals Located</div>
        </div>
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div className="text-indigo-400 font-bold text-lg">
            {validProviders.filter(p => p.type === 'doctor').length}
          </div>
          <div className="text-[11px] text-slate-400">Doctors Located</div>
        </div>
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div className="text-teal-400 font-bold text-lg">
            {validProviders.filter(p => p.type === 'clinic').length}
          </div>
          <div className="text-[11px] text-slate-400">Clinics Located</div>
        </div>
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div className="text-purple-400 font-bold text-lg">
            {validProviders.filter(p => p.type === 'diagnostic_center').length}
          </div>
          <div className="text-[11px] text-slate-400">Diagnostics Located</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
        <a
          href={`https://www.google.com/maps/search/hospitals/@${searchCenter.lat},${searchCenter.lng},13z`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Google Maps</span>
        </a>
        <button
          onClick={() => setMapLoadError(false)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Map Canvas</span>
        </button>
      </div>
    </div>
  );

  if (mapLoadError) {
    return fallbackUI;
  }

  return (
    <ErrorBoundary fallback={fallbackUI}>
      <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
        <APIProvider
          apiKey={activeKey}
          language="en"
          libraries={['places', 'marker']}
          onError={(err) => {
            console.warn('APIProvider load error:', err);
            setMapLoadError(true);
          }}
        >
          <Map
            mapId="DEMO_MAP_ID"
            colorScheme={mapColorScheme}
            defaultCenter={{ 
              lat: isSearchCenterValid ? searchCenter.lat : 23.2599, 
              lng: isSearchCenterValid ? searchCenter.lng : 77.4126 
            }}
            defaultZoom={radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 11}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            style={{ width: '100%', height: '100%', minHeight: '440px' }}
          >
            {/* Map camera controller & search radius circle */}
            {isSearchCenterValid && (
              <MapController
                searchCenter={searchCenter}
                radiusKm={radiusKm}
                selectedProvider={selectedProvider}
                userLocation={isUserLocationValid ? userLocation : null}
              />
            )}

            {/* User Location Marker ("You Are Here") */}
            {isUserLocationValid && userLocation && (
              <AdvancedMarker
                position={{ lat: userLocation.lat, lng: userLocation.lng }}
                title="Your Current Location"
                zIndex={100}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-blue-500 opacity-75 animate-ping" />
                  <span className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-300" />
                </div>
              </AdvancedMarker>
            )}

            {/* All Hospital and Specialist Markers */}
            {validProviders.map((provider) => {
              const isSelected = selectedProvider?.id === provider.id;
              return (
                <AdvancedMarker
                  key={provider.id}
                  position={{ lat: provider.latitude, lng: provider.longitude }}
                  title={provider.name}
                  onClick={() => onSelectProvider(provider)}
                  zIndex={isSelected ? 50 : 10}
                >
                  <ProviderMarkerIcon type={provider.type} isSelected={isSelected} />
                </AdvancedMarker>
              );
            })}

            {/* Interactive InfoWindow on Click */}
            {selectedProvider && 
             typeof selectedProvider.latitude === 'number' && 
             typeof selectedProvider.longitude === 'number' && 
             isFinite(selectedProvider.latitude) && 
             isFinite(selectedProvider.longitude) && (
              <InfoWindow
                position={{ lat: selectedProvider.latitude, lng: selectedProvider.longitude }}
                onCloseClick={() => onSelectProvider(null)}
                pixelOffset={[0, -36]}
              >
                <div className="font-sans max-w-[280px] p-1 text-slate-800">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                        selectedProvider.type === 'hospital'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedProvider.type === 'doctor'
                          ? 'bg-indigo-100 text-indigo-800'
                          : selectedProvider.type === 'diagnostic_center'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedProvider.specialty}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                        {selectedProvider.name}
                      </h4>
                    </div>

                    {selectedProvider.rating !== undefined && (
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{selectedProvider.rating}</span>
                        {selectedProvider.reviewCount !== undefined && (
                          <span className="text-slate-400 font-normal text-[10px]">({selectedProvider.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="font-bold text-blue-600">📍 {selectedProvider.distanceKm} km away</span>
                    {selectedProvider.openNow !== undefined && (
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        selectedProvider.openNow
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {selectedProvider.openNow ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2 line-clamp-2 leading-relaxed">
                    {selectedProvider.address}
                  </p>

                  {(selectedProvider.phone || selectedProvider.website) && (
                    <div className="flex flex-col gap-1 py-1.5 border-t border-slate-100 text-[11px]">
                      {selectedProvider.phone && (
                        <a href={`tel:${selectedProvider.phone}`} className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline">
                          <Phone className="w-3 h-3" />
                          <span>{selectedProvider.phone}</span>
                        </a>
                      )}
                      {selectedProvider.website && (
                        <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                          <Globe className="w-3 h-3" />
                          <span>Visit Website</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-1">
                    <button
                      type="button"
                      onClick={() => onDirectionsClick(selectedProvider)}
                      className="flex-1 text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewDetailsClick(selectedProvider)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 text-slate-700 text-sm font-medium">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Locating hospitals & specialists on Google Maps...</span>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-medium text-slate-700 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-900 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Google Maps:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white shadow-xs"></span>
            <span>Doctor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-600 border border-white shadow-xs"></span>
            <span>Clinic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 border border-white shadow-xs"></span>
            <span>Diagnostic Center</span>
          </div>
          {isUserLocationValid && (
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold border-l border-slate-200 pl-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
              <span>You</span>
            </div>
          )}
        </div>

        {/* Provider Count Badge */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-900 font-bold">{validProviders.length}</span>
          <span className="text-slate-500">Hospitals & Providers located</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
