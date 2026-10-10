import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SpecialistProvider } from '../../api/specialists';

interface SpecialistsMapProps {
  userLocation: { lat: number; lng: number } | null;
  searchCenter: { lat: number; lng: number };
  radiusKm: number;
  providers: SpecialistProvider[];
  selectedProvider: SpecialistProvider | null;
  onSelectProvider: (provider: SpecialistProvider) => void;
  onDirectionsClick: (provider: SpecialistProvider) => void;
  onViewDetailsClick: (provider: SpecialistProvider) => void;
  isLoading?: boolean;
}

// Marker style generator with Lucide-like SVG icons
function createCustomMarkerIcon(type: string, isSelected: boolean) {
  let colorClass = 'bg-blue-600 border-blue-400';
  let svgPath = '';

  if (type === 'hospital') {
    colorClass = isSelected ? 'bg-emerald-600 border-white ring-4 ring-emerald-300' : 'bg-emerald-600 border-emerald-300';
    // Building2 icon
    svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
  } else if (type === 'doctor') {
    colorClass = isSelected ? 'bg-indigo-600 border-white ring-4 ring-indigo-300' : 'bg-indigo-600 border-indigo-300';
    // Stethoscope icon
    svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`;
  } else if (type === 'diagnostic_center') {
    colorClass = isSelected ? 'bg-purple-600 border-white ring-4 ring-purple-300' : 'bg-purple-600 border-purple-300';
    // Activity/Lab icon
    svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
  } else {
    // Clinic / Default
    colorClass = isSelected ? 'bg-teal-600 border-white ring-4 ring-teal-300' : 'bg-teal-600 border-teal-300';
    // Plus/Cross icon
    svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
  }

  const html = `
    <div class="relative flex items-center justify-center transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
      <div class="w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center shadow-lg border-2">
        ${svgPath}
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${colorClass.split(' ')[0]}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-specialist-pin',
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -38]
  });
}

function createUserLocationIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
      <span class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
}

export default function SpecialistsMapLeaflet({
  userLocation,
  searchCenter,
  radiusKm,
  providers,
  selectedProvider,
  onSelectProvider,
  onDirectionsClick,
  onViewDetailsClick,
  isLoading
}: SpecialistsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [searchCenter.lat, searchCenter.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    // Add CartoDB Voyager tiles (clean, modern medical aesthetics)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Center & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }

    // Add semi-transparent search radius circle
    radiusCircleRef.current = L.circle([searchCenter.lat, searchCenter.lng], {
      radius: radiusKm * 1000,
      color: '#3b82f6',
      fillColor: '#93c5fd',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6'
    }).addTo(map);

    // Pan map to search center
    map.flyTo([searchCenter.lat, searchCenter.lng], radiusKm <= 5 ? 14 : radiusKm <= 10 ? 13 : 11, {
      duration: 1.2
    });
  }, [searchCenter.lat, searchCenter.lng, radiusKm]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserLocationIcon(),
        title: 'Your Location'
      }).addTo(map);

      userMarker.bindPopup(`
        <div class="text-xs font-sans p-1">
          <p class="font-bold text-blue-700 flex items-center gap-1">📍 You Are Here</p>
          <p class="text-slate-500 text-[11px] mt-0.5">GPS Geolocation center</p>
        </div>
      `);

      userMarkerRef.current = userMarker;
    }
  }, [userLocation]);

  // Update Specialist Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    providers.forEach((provider) => {
      const isSelected = selectedProvider?.id === provider.id;
      const marker = L.marker([provider.latitude, provider.longitude], {
        icon: createCustomMarkerIcon(provider.type, isSelected),
        title: provider.name
      });

      marker.on('click', () => {
        onSelectProvider(provider);
      });

      // Construct compact rich popup with live details
      const ratingBadge = provider.rating !== undefined ? `
        <div class="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          <span>★</span>
          <span>${provider.rating}</span>
          ${provider.reviewCount !== undefined ? `<span class="text-slate-400 font-normal text-[10px]">(${provider.reviewCount})</span>` : ''}
        </div>
      ` : '';

      const openStatusBadge = provider.openNow !== undefined ? `
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${provider.openNow ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
          ${provider.openNow ? 'Open Now' : 'Closed'}
        </span>
      ` : '';

      const phoneLink = provider.phone ? `
        <a href="tel:${provider.phone}" class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline">
          📞 ${provider.phone}
        </a>
      ` : '';

      const websiteLink = provider.website ? `
        <a href="${provider.website}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline">
          🌐 Visit Website
        </a>
      ` : '';

      const popupHtml = `
        <div class="font-sans min-w-[220px] max-w-[280px] p-1">
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span class="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded uppercase tracking-wider">
                ${provider.specialty}
              </span>
              <h4 class="font-bold text-slate-900 text-sm mt-1 leading-snug">${provider.name}</h4>
            </div>
            ${ratingBadge}
          </div>

          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold text-blue-600">📍 ${provider.distanceKm} km away</span>
            ${openStatusBadge}
          </div>

          <p class="text-[11px] text-slate-500 mb-2 line-clamp-2 leading-relaxed">
            ${provider.address}
          </p>

          ${phoneLink || websiteLink ? `
            <div class="flex flex-col gap-1 py-1.5 border-t border-slate-100 text-[11px]">
              ${phoneLink}
              ${websiteLink}
            </div>
          ` : ''}

          <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-1">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded shadow-sm transition-colors">
              Directions
            </a>
            <button id="view-details-btn-${provider.id.replace(/[^a-zA-Z0-9]/g, '-')}" class="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded transition-colors">
              Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'specialist-popup'
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-btn-${provider.id.replace(/[^a-zA-Z0-9]/g, '-')}`);
        if (btn) {
          btn.onclick = () => {
            onViewDetailsClick(provider);
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [providers, selectedProvider, userLocation]);

  // Pan to selected provider if selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedProvider) return;

    map.panTo([selectedProvider.latitude, selectedProvider.longitude], {
      animate: true,
      duration: 0.8
    });
  }, [selectedProvider]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 text-slate-700 text-sm font-medium">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching live healthcare providers...</span>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-medium text-slate-700 flex flex-wrap items-center gap-3">
        <span className="font-semibold text-slate-900 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Map:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white shadow-xs"></span>
          <span>Doctor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
          <span>Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600 border border-white shadow-xs"></span>
          <span>Clinic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600 border border-white shadow-xs"></span>
          <span>Diagnostic Center</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1.5 text-blue-600 font-semibold border-l border-slate-200 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
            <span>You</span>
          </div>
        )}
      </div>

      {/* Live Data Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-slate-800 font-semibold">{providers.length}</span>
        <span className="text-slate-500">Providers in {radiusKm} km radius</span>
      </div>
    </div>
  );
}
