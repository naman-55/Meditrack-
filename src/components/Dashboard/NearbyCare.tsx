import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Compass, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { specialistsService, SpecialistProvider } from '../../api/specialists';

export default function NearbyCare() {
  const [providers, setProviders] = useState<SpecialistProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'granted' | 'denied'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchLiveProviders = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await specialistsService.getNearbySpecialists({
        lat,
        lng,
        radius: 10000,
        specialty: 'all',
        sortBy: 'nearest'
      });
      setProviders(data.results.slice(0, 3));
    } catch (err: any) {
      console.error('Failed to load dashboard nearby providers:', err);
      setError('Unable to load live healthcare providers.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus('granted');
        fetchLiveProviders(coords.lat, coords.lng);
      },
      (err) => {
        console.warn('Geolocation permission denied or timed out:', err.message);
        setLocationStatus('denied');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Check if permission was already granted previously
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((res) => {
        if (res.state === 'granted') {
          requestLocation();
        }
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5EC] shadow-2xs flex flex-col h-full min-h-[200px]">
      <div className="p-5 border-b border-[#DCE5EC] flex items-center justify-between">
        <div>
          <h4 className="font-bold text-[#071B49] text-base">Nearby Care</h4>
          <p className="text-xs text-[#64748B] mt-0.5">Live medical facilities & specialists</p>
        </div>
        <Link 
          to="/care-near-me" 
          className="text-xs font-bold text-[#00A884] hover:text-[#008F72] transition-colors flex items-center gap-1"
        >
          <span>Open Map</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        {locationStatus === 'idle' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8FAF4] text-[#00A884] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#071B49]">Enable Location</p>
              <p className="text-xs text-[#64748B] max-w-[220px] mt-0.5">
                Enable location or search manually to view real nearby hospitals and clinics.
              </p>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00A884] hover:bg-[#008F72] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Locate Nearby Care</span>
            </button>
          </div>
        )}

        {locationStatus === 'detecting' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-5 h-5 border-2 border-[#00A884] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-[#64748B]">Detecting nearby clinical facilities...</p>
          </div>
        )}

        {locationStatus === 'denied' && (
          <div className="py-5 flex flex-col items-center justify-center text-center space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F3] text-[#EF476F] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#071B49]">Location Access Unavailable</p>
              <p className="text-xs text-[#64748B] max-w-[220px] mt-0.5">
                Search medical specialists manually by city, district, or pin code.
              </p>
            </div>
            <Link
              to="/care-near-me"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE5EC] hover:bg-slate-100 text-[#071B49] text-xs font-semibold rounded-lg transition-colors"
            >
              <span>Search Manually</span>
              <ExternalLink className="w-3 h-3 text-[#64748B]" />
            </Link>
          </div>
        )}

        {locationStatus === 'granted' && (
          <>
            {isLoading ? (
              <div className="space-y-3 animate-pulse py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-4 text-center space-y-2">
                <AlertCircle className="w-5 h-5 text-[#EF476F] mx-auto" />
                <p className="text-xs text-[#64748B]">{error}</p>
                <button
                  type="button"
                  onClick={() => userLocation && fetchLiveProviders(userLocation.lat, userLocation.lng)}
                  className="text-xs font-semibold text-[#00A884] hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : providers.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-bold text-[#071B49]">No healthcare providers found within 10 km</p>
                <p className="text-xs text-[#64748B]">Try expanding search radius on the Care Near Me page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/60 hover:bg-[#F8FAFC] transition-colors flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#071B49] truncate leading-tight">{p.name}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                        {p.specialty || 'General Medical Facility'} &middot; <span className="font-semibold text-[#2563EB]">{p.distanceKm} km</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#DCE5EC] text-[#64748B]">
                      {p.source || 'OpenStreetMap'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="pt-3 border-t border-[#DCE5EC] mt-3">
          <Link 
            to="/care-near-me" 
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors flex items-center justify-between"
          >
            <span>Explore all providers & specialties</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
