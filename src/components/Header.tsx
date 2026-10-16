import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  Settings, 
  LogOut, 
  FileText, 
  Activity, 
  Pill, 
  MapPin, 
  X, 
  CheckCheck, 
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { useAlertNotifications } from '../context/AlertNotificationContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../api/client';
import { AlertListSkeleton } from './common/Skeleton';

interface SearchResults {
  reports: Array<{ id: number; filename: string; report_type: string; report_date: string }>;
  measurements: Array<{ id: number; parameter: string; raw_value: string; unit: string; report_date: string }>;
  medications: Array<{ id: number; name: string; dosage: string; frequency: string }>;
  specialists: Array<{ id: string | number; name: string; specialty: string; city?: string }>;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { preferences, setAppearance } = useSettings();
  const isDarkMode = preferences.appearance.theme === 'Dark' || (preferences.appearance.theme === 'System' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleTheme = () => {
    setAppearance('theme', isDarkMode ? 'Light' : 'Dark');
  };
  const { 
    alerts, 
    unreadCount: unreadAlertsCount, 
    isLoading: isLoadingAlerts, 
    markAsRead: markAlertAsRead, 
    markAllAsRead: markAllAlertsAsRead, 
    refreshAlerts 
  } = useAlertNotifications();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Profile Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Debounced Global Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const data = await apiClient.get(`/api/search?q=${encodeURIComponent(trimmed)}`);
        setSearchResults(data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResultsCount = searchResults 
    ? (searchResults.reports.length + searchResults.measurements.length + searchResults.medications.length + searchResults.specialists.length)
    : 0;

  return (
    <header className="h-16 bg-white dark:bg-[#040D1A] border-b border-[#DCE5EC] dark:border-[#0D1C2E] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors duration-150">
      {/* Left: Mobile Menu & Welcome Heading */}
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 text-[#64748B] hover:text-[#071B49] dark:text-[#94A9C2] dark:hover:text-[#FFFFFF] rounded-xl hover:bg-slate-50 dark:hover:bg-[#0D2038] md:hidden transition-colors"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <h2 className="text-base sm:text-lg font-bold text-[#071B49] dark:text-[#FFFFFF] leading-tight">
            Welcome back, <span className="text-[#00A884] dark:text-[#00D6B0]">{user?.name ? user.name.split(' ')[0] : 'Patient'}</span> 👋
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#8297B2] mt-0.5">Authoritative healthcare monitoring &amp; clinical timeline</p>
        </div>
      </div>

      {/* Center & Right: Search, Alerts, User Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Global Search Box (Desktop & Tablet) */}
        <div ref={searchContainerRef} className="relative hidden sm:block w-72 lg:w-84">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] dark:text-[#8297B2]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
              className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] dark:bg-[#0B1B30] border border-[#DCE5EC] dark:border-[#152A42] rounded-xl text-xs sm:text-sm text-[#071B49] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#00D6B0] focus:border-[#00D6B0] placeholder-[#64748B] dark:placeholder-[#8297B2] transition-all"
              placeholder="Search reports, vitals, meds..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#071B49] dark:text-[#8297B2] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#081729] rounded-2xl shadow-xl border border-[#DCE5EC] dark:border-[#152A42] overflow-hidden z-50 max-h-[440px] overflow-y-auto animate-in fade-in duration-100">
              <div className="p-3 border-b border-[#DCE5EC] dark:border-[#152A42] bg-[#F8FAFC] dark:bg-[#050E1A] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] dark:text-[#8297B2] uppercase tracking-wider">
                  {totalResultsCount} Results for &ldquo;{searchQuery}&rdquo;
                </span>
                {isSearching && (
                  <span className="text-[10px] text-[#00A884] dark:text-[#00D6B0] font-medium animate-pulse">Searching...</span>
                )}
              </div>

              {totalResultsCount === 0 ? (
                <div className="p-6 text-center text-[#64748B] dark:text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-[#071B49] dark:text-white">No matching records found</p>
                  <p>Try searching for a biomarker, report name, medication, or medical clinic.</p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Reports */}
                  {searchResults.reports.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-[#2563EB]" />
                        <span>Medical Reports ({searchResults.reports.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {searchResults.reports.map(r => (
                          <div
                            key={r.id}
                            onClick={() => { setShowSearchDropdown(false); navigate('/reports'); }}
                            className="p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-[#071B49] dark:text-slate-100 truncate">{r.filename}</p>
                              <p className="text-[10px] text-[#64748B] dark:text-slate-400">{r.report_type} &middot; {r.report_date}</p>
                            </div>
                            <span className="text-[10px] text-[#2563EB] dark:text-blue-400 font-semibold shrink-0">View &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Measurements */}
                  {searchResults.measurements.length > 0 && (
                    <div className="border-t border-[#DCE5EC]/60 dark:border-[#20364A] pt-2">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] dark:text-[#8297B2] uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-[#00A884] dark:text-[#00D6B0]" />
                        <span>Clinical Vitals &amp; Biomarkers ({searchResults.measurements.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {searchResults.measurements.map(m => (
                          <div
                            key={m.id}
                            onClick={() => { setShowSearchDropdown(false); navigate('/timeline'); }}
                            className="p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] truncate">{m.parameter}</p>
                              <p className="text-[10px] text-[#64748B] dark:text-[#8297B2]">{m.report_date}</p>
                            </div>
                            <span className="text-xs font-extrabold text-[#00A884] dark:text-[#00D6B0] shrink-0">
                              {m.raw_value} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {searchResults.medications.length > 0 && (
                    <div className="border-t border-[#DCE5EC]/60 dark:border-[#20364A] pt-2">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] dark:text-[#8297B2] uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3 h-3 text-[#EF476F]" />
                        <span>Prescriptions &amp; Medications ({searchResults.medications.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {searchResults.medications.map(med => (
                          <div
                            key={med.id}
                            onClick={() => { setShowSearchDropdown(false); navigate('/dashboard'); }}
                            className="p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] truncate">{med.name}</p>
                              <p className="text-[10px] text-[#64748B] dark:text-[#8297B2]">{med.frequency || 'Daily'}</p>
                            </div>
                            <span className="text-xs font-bold text-[#64748B] dark:text-[#8297B2] shrink-0">{med.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialists */}
                  {searchResults.specialists.length > 0 && (
                    <div className="border-t border-[#DCE5EC]/60 dark:border-[#20364A] pt-2">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#2563EB]" />
                        <span>Healthcare Providers ({searchResults.specialists.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {searchResults.specialists.map(s => (
                          <div
                            key={s.id}
                            onClick={() => { setShowSearchDropdown(false); navigate('/care-near-me'); }}
                            className="p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-[#071B49] dark:text-slate-100 truncate">{s.name}</p>
                              <p className="text-[10px] text-[#64748B] dark:text-slate-400">{s.specialty || 'Medical Facility'}</p>
                            </div>
                            <span className="text-[10px] text-[#2563EB] dark:text-blue-400 font-semibold shrink-0">Map &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div ref={notifContainerRef} className="relative">
          <button 
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) refreshAlerts();
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative",
              showNotifications 
                ? "bg-[#E8FAF4] dark:bg-[#062E2D] text-[#00A884] dark:text-[#00D6B0] border border-emerald-300 dark:border-[#075E56]" 
                : "text-[#64748B] hover:text-[#071B49] dark:text-[#B4C4D8] dark:hover:text-[#F1F5FB] hover:bg-slate-50 dark:hover:bg-[#162A3E] border border-[#DCE5EC] dark:border-[#20364A]"
            )}
            title="Health Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0B1624]",
                alerts.some(a => !a.is_read && a.severity === 'CRITICAL') ? "bg-red-600 animate-pulse" : "bg-[#EF476F]"
              )}>
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#102033] rounded-2xl shadow-xl border border-[#DCE5EC] dark:border-[#20364A] overflow-hidden z-50 animate-in fade-in duration-100">
              <div className="p-4 border-b border-[#DCE5EC] dark:border-[#20364A] bg-[#F8FAFC] dark:bg-[#0B1624] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#071B49] dark:text-[#F1F5FB] text-sm">Clinical Alerts</h3>
                  <p className="text-[11px] text-[#64748B] dark:text-[#8297B2]">
                    {unreadAlertsCount > 0 ? `${unreadAlertsCount} unread alert${unreadAlertsCount > 1 ? 's' : ''}` : 'All alerts caught up'}
                  </p>
                </div>
                {unreadAlertsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAlertsAsRead}
                    className="text-[11px] font-semibold text-[#00A884] dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#DCE5EC]/60 dark:divide-[#20364A]">
                {isLoadingAlerts ? (
                  <AlertListSkeleton count={3} />
                ) : alerts.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-[#64748B] dark:text-[#7186A3] space-y-1">
                    <p className="font-bold text-[#071B49] dark:text-[#F1F5FB]">No active clinical alerts</p>
                    <p>Alerts are generated when notable risk markers or updates are detected.</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const sev = alert.severity || 'WARNING';
                    const isCrit = sev === 'CRITICAL';
                    const isHigh = sev === 'HIGH_PRIORITY';
                    const isWarn = sev === 'WARNING';

                    let badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                    let iconBg = 'bg-[#E8FAF4] text-[#00A884]';
                    if (isCrit) {
                      badgeClass = 'bg-red-100 text-red-700 border-red-300 font-black animate-pulse';
                      iconBg = 'bg-red-100 text-red-600';
                    } else if (isHigh) {
                      badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                      iconBg = 'bg-amber-100 text-amber-700';
                    } else if (isWarn) {
                      badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      iconBg = 'bg-yellow-100 text-yellow-700';
                    }

                    return (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          markAlertAsRead(alert.id);
                          if (alert.action_url) navigate(alert.action_url);
                          else if (alert.source_report_id) navigate(`/reports?highlight=${alert.source_report_id}`);
                          setShowNotifications(false);
                        }}
                        className={cn(
                          "p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-3",
                          alert.is_read ? "bg-white hover:bg-[#F8FAFC]" : isCrit ? "bg-red-50/70 hover:bg-red-50" : "bg-[#F0FDF9] hover:bg-[#E8FAF4]"
                        )}
                      >
                        <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", iconBg)}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", badgeClass)}>
                              {sev}
                            </span>
                            <span className="text-[10px] text-[#64748B] shrink-0">
                              {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <p className="font-bold text-[#071B49] text-xs leading-snug">
                            {alert.title || alert.message}
                          </p>
                          {alert.measured_value && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">Observed:</span>
                              <span className={cn("px-1.5 py-0.2 rounded font-bold", isCrit ? "bg-red-200 text-red-900" : isHigh ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-800")}>
                                {alert.measured_value}
                              </span>
                              {alert.reference_range && <span className="text-slate-400">({alert.reference_range})</span>}
                            </div>
                          )}
                          {alert.message && alert.title && alert.title !== alert.message && (
                            <p className="text-[#64748B] mt-0.5 leading-relaxed line-clamp-2">
                              {alert.message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#64748B]">
                            <span>Source: {alert.source || 'Clinical System'}</span>
                            {alert.deliveries && alert.deliveries.length > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="font-semibold text-indigo-600">
                                  {alert.deliveries.length} dispatch{alert.deliveries.length > 1 ? 'es' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {!alert.is_read && (
                          <span className={cn("w-2 h-2 rounded-full shrink-0 mt-2", isCrit ? "bg-red-600 animate-ping" : "bg-[#00A884]")}></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-[#DCE5EC] dark:border-[#20364A] bg-[#F8FAFC] dark:bg-[#0B1B30] text-center">
                <button
                  type="button"
                  onClick={() => { setShowNotifications(false); navigate('/family-alerts'); }}
                  className="text-xs font-semibold text-[#2563EB] dark:text-[#2684FF] hover:underline"
                >
                  Manage Emergency Contacts &amp; Alert Rules &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#071B49] hover:bg-slate-50 border border-[#DCE5EC] bg-white dark:bg-[#081421] dark:text-[#A6B8CF] dark:hover:text-[#F1F5FB] dark:hover:bg-[#14283B] dark:border-[#20364A] transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-[#F5B942]" /> : <Moon className="w-4 h-4 text-[#A6B8CF]" />}
        </button>

        {/* Settings Full-Screen Page Button */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#071B49] dark:text-[#B4C4D8] dark:hover:text-[#F1F5FB] hover:bg-slate-50 dark:hover:bg-[#162A3E] border border-[#DCE5EC] dark:border-[#20364A] transition-colors"
          title="Settings & Preferences"
          aria-label="Settings page"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Menu */}
        <div ref={profileMenuRef} className="relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#DCE5EC] dark:border-[#20364A] cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00A884] dark:bg-[#00D6B0] text-white dark:text-[#050D18] flex items-center justify-center font-bold text-sm shadow-2xs">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] block truncate max-w-[120px]">
                {user?.name || 'Patient'}
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#8297B2] font-medium block">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Verified Patient'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8297B2] hidden sm:block" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#081729] rounded-2xl shadow-xl border border-[#DCE5EC] dark:border-[#20364A] py-1.5 z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-4 py-2.5 border-b border-[#DCE5EC]/60 dark:border-[#20364A]">
                <p className="text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] truncate">{user?.name || 'Patient'}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#8297B2] truncate">{user?.email || 'patient@meditrack.io'}</p>
              </div>

              <button
                type="button"
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-[#071B49] dark:text-[#F1F5FB] hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] flex items-center gap-2 transition-colors"
              >
                <span>View Full Profile</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowProfileMenu(false); navigate('/family-alerts'); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-[#071B49] dark:text-[#F1F5FB] hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] flex items-center gap-2 transition-colors"
              >
                <span>Trusted Contacts</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-[#071B49] dark:text-[#F1F5FB] hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] flex items-center gap-2 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8297B2]" />
                <span>Settings & Preferences</span>
              </button>

              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => { setShowProfileMenu(false); navigate('/admin/users'); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#2563EB] dark:text-[#2684FF] hover:bg-[#F8FAFC] dark:hover:bg-[#162A3E] flex items-center gap-2 transition-colors border-t border-[#DCE5EC]/60 dark:border-[#20364A]"
                >
                  <span>Admin Console</span>
                </button>
              )}

              <div className="border-t border-[#DCE5EC]/60 dark:border-[#20364A] mt-1 pt-1">
                <button 
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs text-[#EF476F] dark:text-[#FF5368] hover:bg-[#FFF0F3] dark:hover:bg-[#2A0E14] flex items-center gap-2 font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
