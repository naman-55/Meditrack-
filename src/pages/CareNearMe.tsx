import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Stethoscope, 
  Building2, 
  Cross, 
  Activity, 
  Phone, 
  Globe, 
  ExternalLink, 
  Filter, 
  SlidersHorizontal, 
  Star, 
  Clock, 
  Compass, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Share2, 
  Copy,
  Info,
  ShieldCheck,
  Eye
} from 'lucide-react';
import SpecialistsGoogleMap from '../components/Map/SpecialistsGoogleMap';
import { 
  specialistsService, 
  SpecialistProvider, 
  GeocodeItem, 
  SpecialtyItem 
} from '../api/specialists';

const SPECIALTY_OPTIONS = [
  { id: 'all', name: 'All Specialists', icon: Stethoscope },
  { id: 'cardiologist', name: 'Cardiologist', icon: Activity },
  { id: 'neurologist', name: 'Neurologist', icon: Activity },
  { id: 'dermatologist', name: 'Dermatologist', icon: Stethoscope },
  { id: 'orthopedic', name: 'Orthopedic', icon: Stethoscope },
  { id: 'pediatrician', name: 'Pediatrician', icon: Stethoscope },
  { id: 'gynecologist', name: 'Gynecologist', icon: Stethoscope },
  { id: 'dentist', name: 'Dentist', icon: Stethoscope },
  { id: 'ophthalmologist', name: 'Ophthalmologist', icon: Eye },
  { id: 'psychiatrist', name: 'Psychiatrist', icon: Activity },
  { id: 'ent', name: 'ENT Specialist', icon: Stethoscope },
  { id: 'general_physician', name: 'General Physician', icon: Stethoscope }
];

const RADIUS_OPTIONS = [
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' }
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'All Providers' },
  { id: 'doctor', label: 'Doctors' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'clinic', label: 'Clinics' },
  { id: 'diagnostic_center', label: 'Diagnostic Centers' }
];

export default function CareNearMe() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>({
    lat: 23.2599, // Default: Bhopal / central medical hub
    lng: 77.4126
  });
  const [locationName, setLocationName] = useState<string>('Bhopal, MP');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'granted' | 'denied' | 'manual'>('idle');
  const [manualQuery, setManualQuery] = useState('');
  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodeItem[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Filters State
  const initialSpecialty = searchParams.get('specialty') || 'all';
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty);
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest_rated' | 'relevance'>('nearest');
  const [keywordQuery, setKeywordQuery] = useState('');

  // Providers & UI State
  const [providers, setProviders] = useState<SpecialistProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<SpecialistProvider | null>(null);
  const [detailsModalProvider, setDetailsModalProvider] = useState<SpecialistProvider | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Auto-request Geolocation on Mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  // Update query params when specialty changes
  useEffect(() => {
    if (selectedSpecialty !== 'all') {
      setSearchParams({ specialty: selectedSpecialty });
    } else {
      setSearchParams({});
    }
  }, [selectedSpecialty, setSearchParams]);

  // Request browser location
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setSearchCenter(coords);
        setLocationStatus('granted');
        setLocationName('Your Current Location');
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err.message);
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Fetch Providers whenever Center, Specialty, Radius, Type, OpenNow, or SortBy changes
  const fetchNearbyProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await specialistsService.getNearbySpecialists({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
        specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
        radius: selectedRadius,
        type: selectedType !== 'all' ? selectedType : undefined,
        openNow: openNowOnly || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy
      });

      setProviders(response.results || []);
    } catch (err: any) {
      console.error('Failed to load specialists:', err);
      setError('Unable to load live healthcare specialists. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchCenter, selectedSpecialty, selectedRadius, selectedType, openNowOnly, minRating, sortBy]);

  useEffect(() => {
    fetchNearbyProviders();
  }, [fetchNearbyProviders]);

  // Handle Manual Geocode Search
  const handleGeocodeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualQuery.trim()) return;

    setIsGeocoding(true);
    try {
      const res = await specialistsService.geocodeLocation(manualQuery.trim());
      if (res.results && res.results.length > 0) {
        setGeocodeSuggestions(res.results);
        if (res.results.length === 1) {
          applyLocation(res.results[0]);
        }
      } else {
        setGeocodeSuggestions([]);
        setError(`No location found matching "${manualQuery}". Try city name or postal code.`);
      }
    } catch (err) {
      console.error('Geocode search error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const applyLocation = (item: GeocodeItem) => {
    const coords = { lat: item.latitude, lng: item.longitude };
    setSearchCenter(coords);
    setLocationName(item.city || item.displayName.split(',')[0] || item.displayName);
    setLocationStatus('manual');
    setGeocodeSuggestions([]);
    setManualQuery('');
  };

  // Filter providers in memory by keyword query if user enters text in search box
  const filteredProviders = useMemo(() => {
    if (!keywordQuery.trim()) return providers;
    const term = keywordQuery.toLowerCase();
    return providers.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.specialty.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term)
    );
  }, [providers, keywordQuery]);

  // Directions Click
  const handleDirectionsClick = (provider: SpecialistProvider) => {
    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}${origin}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy Address
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Live Source Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Find Nearby Specialists & Hospitals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Directory
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time medical care navigation, verified facilities, and clinical directions near your location.
          </p>
        </div>

        {/* View Mode Controls (Desktop) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium text-slate-600">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              List Only
            </button>
          </div>

          <button
            onClick={fetchNearbyProviders}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
            title="Refresh nearby results"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geolocation Status Bar / Manual Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Location status badge & Quick button */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Search Center:</span>
                <span className="text-sm font-bold text-slate-900">{locationName}</span>
                {userLocation && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    GPS Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Coordinates: {typeof searchCenter?.lat === 'number' ? searchCenter.lat.toFixed(4) : '0.0000'}° N, {typeof searchCenter?.lng === 'number' ? searchCenter.lng.toFixed(4) : '0.0000'}° E &bull; Radius: {selectedRadius} km
              </p>
            </div>
          </div>

          {/* Action: Use My Location + Manual Location Field */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={locationStatus === 'detecting'}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-xl border border-blue-200 transition-colors shrink-0 disabled:opacity-60"
            >
              <Navigation className={`w-3.5 h-3.5 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
              {locationStatus === 'detecting' ? 'Locating GPS...' : 'Use My GPS Location'}
            </button>

            {/* Manual Location Form */}
            <form onSubmit={handleGeocodeSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search city, area or PIN code..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-16 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <button
                type="submit"
                disabled={isGeocoding || !manualQuery.trim()}
                className="absolute right-1.5 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                {isGeocoding ? '...' : 'Search'}
              </button>
            </form>
          </div>
        </div>

        {/* Location Permission Denied Warning */}
        {locationStatus === 'denied' && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>GPS Location Unavailable:</strong> Browser permission was denied or timed out. Defaulted to Bhopal medical hub. Use the search box above to enter your city, area, or PIN code.
              </span>
            </div>
            <button
              onClick={requestUserLocation}
              className="text-amber-800 underline font-semibold hover:text-amber-950 ml-2 shrink-0"
            >
              Retry GPS
            </button>
          </div>
        )}

        {/* Autocomplete Suggestions Drawer */}
        {geocodeSuggestions.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-2 pb-1">
              <span>Select Location:</span>
              <button onClick={() => setGeocodeSuggestions([])} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {geocodeSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyLocation(item)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-white hover:text-blue-700 hover:shadow-xs rounded-lg transition-all flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{item.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Specialty Selector & Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Horizontal Specialty Scroll / Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              Specialist Category
            </label>
            {selectedSpecialty !== 'all' && (
              <button
                onClick={() => setSelectedSpecialty('all')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset to All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {SPECIALTY_OPTIONS.map((spec) => {
              const isSelected = selectedSpecialty.toLowerCase() === spec.id.toLowerCase();
              return (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(spec.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <spec.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{spec.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Secondary Filters: Distance, Type, Open Now, Rating, Sort */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Radius Pills */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
                <Compass className="w-3 h-3 text-slate-400" /> Radius:
              </span>
              {RADIUS_OPTIONS.map((rad) => (
                <button
                  key={rad.value}
                  onClick={() => setSelectedRadius(rad.value)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    selectedRadius === rad.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rad.label}
                </button>
              ))}
            </div>

            {/* Provider Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Open Now Toggle */}
            <button
              onClick={() => setOpenNowOnly(!openNowOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                openNowOnly
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Open Now</span>
            </button>

            {/* Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Rating: Any</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
            </select>
          </div>

          {/* Sort By & Text filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="Filter results..."
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="font-semibold bg-transparent text-slate-800 border-0 focus:ring-0 cursor-pointer text-xs"
              >
                <option value="nearest">Nearest</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Map & Specialist Cards */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left Side: Specialists Cards List (if split or list mode) */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-5' : 'w-full'} space-y-4`}>
            {/* Results Counter & Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Found <strong className="text-slate-900">{filteredProviders.length}</strong> specialists & facilities
              </span>
              <span>Sorted by {sortBy.replace('_', ' ')}</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={fetchNearbyProviders}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Skeleton Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 w-3/4">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-5 bg-slate-200 rounded w-4/5"></div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-12"></div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            )}

            {/* No Specialists Found */}
            {!isLoading && filteredProviders.length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Specialists Found in this Radius</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  We couldn't find verified specialists within {selectedRadius} km of this location. Try expanding the search radius or choosing "All Specialists".
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => setSelectedRadius(25)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Expand Radius to 25 km
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSpecialty('all');
                      setSelectedType('all');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Specialist Cards List */}
            {!isLoading && filteredProviders.length > 0 && (
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredProviders.map((provider) => {
                  const isSelected = selectedProvider?.id === provider.id;
                  return (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-500 shadow-md ring-2 ring-blue-100 bg-blue-50/20'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Card Header: Category & Rating */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            provider.type === 'hospital'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : provider.type === 'doctor'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : provider.type === 'diagnostic_center'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {provider.specialty}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize">&bull; {provider.type.replace('_', ' ')}</span>
                        </div>

                        {/* Rating (Only shown when supplied by real API) */}
                        {provider.rating !== undefined && (
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{provider.rating}</span>
                            {provider.reviewCount !== undefined && (
                              <span className="text-slate-400 font-normal text-[10px]">({provider.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Provider Title */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition-colors">
                        {provider.name}
                      </h3>

                      {/* Distance & Opening Status */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> {provider.distanceKm} km away
                        </span>
                        {provider.openNow !== undefined && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            provider.openNow
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {provider.openNow ? 'Open Now' : 'Closed'}
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {provider.address}
                      </p>

                      {/* Direct Phone & Website if provided */}
                      {(provider.phone || provider.website) && (
                        <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-100 text-xs">
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{provider.phone}</span>
                            </a>
                          )}
                          {provider.website && (
                            <a
                              href={provider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectionsClick(provider);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsModalProvider(provider);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Side: Interactive Google Map (if split or map mode) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-7 h-[680px]' : 'w-full h-[720px]'} sticky top-6`}>
            <SpecialistsGoogleMap
              userLocation={userLocation}
              searchCenter={searchCenter}
              radiusKm={selectedRadius}
              providers={filteredProviders}
              selectedProvider={selectedProvider}
              onSelectProvider={(prov) => setSelectedProvider(prov)}
              onDirectionsClick={handleDirectionsClick}
              onViewDetailsClick={(prov) => setDetailsModalProvider(prov)}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Emergency & Medical Disclaimer Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Clinical Safety Disclaimer:</strong> MediTrack locates healthcare facilities using Google Maps Platform and verified medical registries. In acute emergencies, immediately dial your local emergency services (911 / 112 / 102).
          </p>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0">
          Powered by Google Maps Platform &bull; Live Hospital Directory
        </div>
      </div>

      {/* Detailed Information Modal / Drawer */}
      {detailsModalProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    detailsModalProvider.type === 'hospital'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {detailsModalProvider.specialty}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{detailsModalProvider.type.replace('_', ' ')}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {detailsModalProvider.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailsModalProvider(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-sm">
              {/* Rating and Distance Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Distance from Search</span>
                  <span className="text-base font-bold text-blue-600">
                    {detailsModalProvider.distanceKm} km away
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Verified Rating</span>
                  {detailsModalProvider.rating !== undefined ? (
                    <span className="text-base font-bold text-amber-500 flex items-center gap-1">
                      ★ {detailsModalProvider.rating}
                      {detailsModalProvider.reviewCount !== undefined && (
                        <span className="text-xs text-slate-400 font-normal">({detailsModalProvider.reviewCount} reviews)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Not supplied by registry</span>
                  )}
                </div>
              </div>

              {/* Status */}
              {detailsModalProvider.openNow !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">Operating Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    detailsModalProvider.openNow ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {detailsModalProvider.openNow ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              )}

              {/* Address with Copy Button */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Address & Location</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{detailsModalProvider.address}</span>
                  </div>
                  <button
                    onClick={() => handleCopyAddress(detailsModalProvider.address)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shrink-0"
                    title="Copy Address"
                  >
                    {copiedAddress ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Direct Contacts */}
              {(detailsModalProvider.phone || detailsModalProvider.website) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Contact</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailsModalProvider.phone && (
                      <a
                        href={`tel:${detailsModalProvider.phone}`}
                        className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call {detailsModalProvider.phone}</span>
                      </a>
                    )}
                    {detailsModalProvider.website && (
                      <a
                        href={detailsModalProvider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Official Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Technical / Registry Source */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                <p>Registry Provider ID: <code className="text-slate-600">{detailsModalProvider.id}</code></p>
                <p>GPS Coordinates: {typeof detailsModalProvider.latitude === 'number' ? detailsModalProvider.latitude.toFixed(5) : (detailsModalProvider.latitude || 'N/A')}, {typeof detailsModalProvider.longitude === 'number' ? detailsModalProvider.longitude.toFixed(5) : (detailsModalProvider.longitude || 'N/A')}</p>
                <p>Data Source: {detailsModalProvider.source}</p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDirectionsClick(detailsModalProvider)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Open Navigation & Directions</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailsModalProvider(null)}
                className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
