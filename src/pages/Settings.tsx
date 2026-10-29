import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Sliders, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Laptop, 
  Smartphone,
  LogOut, 
  Download, 
  Trash2, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Activity, 
  FileText, 
  Clock, 
  Layers, 
  RotateCcw,
  ChevronRight,
  ShieldAlert,
  Info,
  Calendar,
  User,
  HeartPulse,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/common/Skeleton';
import { cn } from '../utils/cn';

interface ActiveSession {
  id: number;
  created_at: string;
  expires_at: string;
  last_used_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    preferences, 
    setAppearance, 
    setNotification, 
    setNotificationFrequency,
    notificationPrefsLoaded,
    notificationSaving,
    notificationError,
    setUnit, 
    setPrivacy, 
    resetPreferences 
  } = useSettings();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'all' | 'appearance' | 'notifications' | 'units' | 'privacy' | 'security' | 'account'>('all');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Delete Account Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch active sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    setSessionActionLoading(true);
    setSessionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/revoke-session/${sessionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessionMessage({ text: 'Session revoked successfully.', type: 'success' });
        fetchSessions();
      } else {
        const err = await res.json();
        setSessionMessage({ text: err.error || 'Failed to revoke session.', type: 'error' });
      }
    } catch (err) {
      setSessionMessage({ text: 'Network error revoking session.', type: 'error' });
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out of all active devices? You will remain logged in on this browser.')) {
      return;
    }
    setSessionActionLoading(true);
    setSessionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessionMessage({ text: 'All remote sessions have been revoked.', type: 'success' });
        fetchSessions();
      } else {
        const err = await res.json();
        setSessionMessage({ text: err.error || 'Failed to logout devices.', type: 'error' });
      }
    } catch (err) {
      setSessionMessage({ text: 'Network error logging out devices.', type: 'error' });
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPwError('New password must be different from current password.');
      return;
    }

    setPwLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Failed to update password.');
      } else {
        setPwSuccess('Password successfully updated and all remote sessions were invalidated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      }
    } catch (err) {
      setPwError('Network error updating password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setExportSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/export-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meditrack-health-record-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 5000);
      } else {
        alert('Failed to export data from server.');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error generating medical data export archive.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setDeleteError('Please type "DELETE" in capital letters to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        const err = await res.json();
        setDeleteError(err.error || 'Failed to delete account.');
      }
    } catch (err) {
      setDeleteError('Network error processing account deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecial].filter(Boolean).length;

  const tabs = [
    { id: 'all', label: 'All Settings', icon: Layers },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'units', label: 'Units & Display', icon: Sliders },
    { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck },
    { id: 'security', label: 'Security & Sessions', icon: Lock },
    { id: 'account', label: 'Account & Vault', icon: User },
  ] as const;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Breadcrumb */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-2">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-[#071B49] transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#071B49]">Settings</span>
        </div>

        {/* Title & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#071B49]">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Manage your preferences, privacy, notifications and account security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-saved badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00A884] animate-pulse"></span>
              <span>Changes auto-saved</span>
            </div>

            {/* Reset to defaults */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all display, notification, and unit preferences to defaults?')) {
                  void resetPreferences();
                }
              }}
              disabled={!notificationPrefsLoaded || notificationSaving !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5EC] bg-white hover:bg-slate-50 text-xs font-semibold text-[#64748B] hover:text-[#071B49] transition-all shadow-2xs disabled:cursor-wait disabled:opacity-60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#DCE5EC] no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                isActive
                  ? "bg-[#071B49] text-white shadow-sm"
                  : "bg-white text-[#64748B] hover:text-[#071B49] hover:bg-slate-100 border border-[#DCE5EC]"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-[#00A884]" : "text-[#64748B]")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Settings Cards Grid / Flow */}
      <div className="space-y-6">

        {/* =========================================================================
            SECTION A: APPEARANCE
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Appearance & Interface</h2>
                <p className="text-xs text-[#64748B]">Personalize your visual theme and motion accessibility preferences.</p>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                Color Theme
              </label>
              <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Light', label: 'Light Mode', desc: 'Crisp clinical white & navy', icon: Sun },
                  { id: 'Dark', label: 'Dark Mode', desc: 'Reduced glare for night rounds', icon: Moon },
                  { id: 'System', label: 'System Sync', desc: 'Follows operating system', icon: Monitor },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = preferences.appearance.theme === th.id;
                  return (
                    <div
                      key={th.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setAppearance('theme', th.id as any)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setAppearance('theme', th.id as any);
                        } else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
                          event.preventDefault();
                          const radios = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]') || []);
                          const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
                          const nextIndex = (radios.indexOf(event.currentTarget) + direction + radios.length) % radios.length;
                          radios[nextIndex]?.focus();
                          radios[nextIndex]?.click();
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A884]",
                        isSelected
                          ? "border-[#00A884] bg-emerald-50/40 ring-2 ring-[#00A884]/20"
                          : "border-[#DCE5EC] bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-[#00A884] text-white" : "bg-slate-100 text-[#64748B]"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#00A884] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#071B49]">{th.label}</p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{th.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accessibility: Reduce Animations */}
            <div className="pt-4 border-t border-[#DCE5EC] flex items-center justify-between gap-4">
              <div className="max-w-xl">
                <span className="text-sm font-bold text-[#071B49] block">Reduce Animations</span>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Minimizes transitions and interface motion across graphs and dashboards for accessibility and vestibular comfort.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAppearance('reduceAnimations', !preferences.appearance.reduceAnimations)}
                className={cn(
                  "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                  preferences.appearance.reduceAnimations ? "bg-[#00A884]" : "bg-slate-200"
                )}
                role="switch"
                aria-checked={preferences.appearance.reduceAnimations}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                    preferences.appearance.reduceAnimations ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION B: NOTIFICATIONS
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'notifications') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#00A884]/10 text-[#00A884] flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Notifications & Preferences</h2>
                <p className="text-xs text-[#64748B]">Save your channel and reminder preferences to your account.</p>
              </div>
            </div>

            {notificationSaving && <p role="status" className="text-xs text-[#64748B]">Saving notification setting…</p>}
            {notificationError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{notificationError}</p>}
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-[#64748B]">
              These controls save your preferences. Email, SMS, browser push, scheduled reminders, clinical alert rules, and digest delivery are not configured, so changing a preference will not send a notification.
            </p>

            {!notificationPrefsLoaded ? (
              <div role="status" className="space-y-3 py-2" aria-label="Loading saved notification settings">
                {[1, 2, 3, 4, 5].map((row) => <div key={row} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : (
              <>
            <div className="divide-y divide-[#DCE5EC]">
              {/* Email Notifications */}
              <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Email Notifications</span>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Preference for email notices to {user?.email || 'your account email'}; email delivery is not configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setNotification('emailNotifications', !preferences.notifications.emailNotifications)}
                  disabled={!notificationPrefsLoaded || notificationSaving !== null}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.notifications.emailNotifications ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.notifications.emailNotifications}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.notifications.emailNotifications ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">SMS Alerts</span>
                  <p className="text-xs text-[#64748B] mt-0.5">Preference for text alerts; an SMS provider is not configured.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void setNotification('smsAlerts', !preferences.notifications.smsAlerts)}
                  disabled={!notificationPrefsLoaded || notificationSaving !== null}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner disabled:cursor-wait disabled:opacity-60",
                    preferences.notifications.smsAlerts ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.notifications.smsAlerts}
                  aria-label="SMS alerts preference"
                >
                  <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out", preferences.notifications.smsAlerts ? "translate-x-6" : "translate-x-0")} />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Push Notifications</span>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Preference for browser alerts; browser push is not configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setNotification('pushNotifications', !preferences.notifications.pushNotifications)}
                  disabled={!notificationPrefsLoaded || notificationSaving !== null}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.notifications.pushNotifications ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.notifications.pushNotifications}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.notifications.pushNotifications ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Health & Medication Reminders */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Health & Medication Reminders</span>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Saves your preference. Reminder scheduling is not configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setNotification('healthReminders', !preferences.notifications.healthReminders)}
                  disabled={!notificationPrefsLoaded || notificationSaving !== null}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.notifications.healthReminders ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.notifications.healthReminders}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.notifications.healthReminders ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Lab Report Alerts */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#071B49]">Lab Report Alerts</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Preference only
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Saves your preference. Validated clinical alert rules are not configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setNotification('labReportAlerts', !preferences.notifications.labReportAlerts)}
                  disabled={!notificationPrefsLoaded || notificationSaving !== null}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.notifications.labReportAlerts ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.notifications.labReportAlerts}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.notifications.labReportAlerts ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Notification Frequency Selector */}
            <div className="pt-4 border-t border-[#DCE5EC] space-y-3">
              <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                Preferred Notification Cadence
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'instant', title: 'Instant', desc: 'Saved preference only' },
                  { id: 'daily', title: 'Daily', desc: 'Saved preference only' },
                  { id: 'weekly', title: 'Weekly', desc: 'Saved preference only' },
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => void setNotificationFrequency(freq.id as 'instant' | 'daily' | 'weekly')}
                    disabled={!notificationPrefsLoaded || notificationSaving !== null}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      preferences.notifications.frequency === freq.id
                        ? "border-[#00A884] bg-emerald-50/50 ring-1 ring-[#00A884]"
                        : "border-[#DCE5EC] bg-white hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xs font-bold text-[#071B49] block">{freq.title}</span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">{freq.desc}</span>
                  </button>
                ))}
              </div>
            </div>
              </>
            )}
          </section>
        )}

        {/* =========================================================================
            SECTION C: UNITS & DISPLAY
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'units') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Clinical Units & Display Standards</h2>
                <p className="text-xs text-[#64748B]">Select measurement standards for biometric tracking, vital signs, and time formats.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Height Unit */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#071B49] block">Height Metric</span>
                  <span className="text-[11px] text-[#64748B]">Stature and growth charts</span>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                  {(['cm', 'ft & in'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setUnit('height', unit)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        preferences.units.height === unit
                          ? "bg-[#00A884] text-white shadow-2xs"
                          : "text-[#64748B] hover:text-[#071B49]"
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Unit */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#071B49] block">Weight Metric</span>
                  <span className="text-[11px] text-[#64748B]">Body mass and BMI calculations</span>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                  {(['kg', 'lbs'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setUnit('weight', unit)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        preferences.units.weight === unit
                          ? "bg-[#00A884] text-white shadow-2xs"
                          : "text-[#64748B] hover:text-[#071B49]"
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature Unit */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#071B49] block">Body Temperature</span>
                  <span className="text-[11px] text-[#64748B]">Fever thresholds and thermal logs</span>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                  {(['°C', '°F'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setUnit('temperature', unit)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        preferences.units.temperature === unit
                          ? "bg-[#00A884] text-white shadow-2xs"
                          : "text-[#64748B] hover:text-[#071B49]"
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Format */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#071B49] block">Time Format</span>
                  <span className="text-[11px] text-[#64748B]">Dosage and measurement timestamps</span>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                  {(['12h', '24h'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setUnit('timeFormat', fmt)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        preferences.units.timeFormat === fmt
                          ? "bg-[#00A884] text-white shadow-2xs"
                          : "text-[#64748B] hover:text-[#071B49]"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Laboratory Panels Units */}
            <div className="pt-4 border-t border-[#DCE5EC]">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4 text-[#00A884]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#071B49]">
                  Laboratory Biomarker Units &amp; Formatting
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blood Glucose */}
                <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#071B49] block">Blood Glucose</span>
                    <span className="text-[11px] text-[#64748B]">Fasting &amp; random plasma glucose</span>
                  </div>
                  <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                    {(['mg/dL', 'mmol/L'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setUnit('glucose', unit)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-bold transition-all",
                          preferences.units.glucose === unit
                            ? "bg-[#00A884] text-white shadow-2xs"
                            : "text-[#64748B] hover:text-[#071B49]"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cholesterol & Lipids */}
                <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#071B49] block">Lipid Panel</span>
                    <span className="text-[11px] text-[#64748B]">Total cholesterol, HDL, LDL, Triglycerides</span>
                  </div>
                  <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                    {(['mg/dL', 'mmol/L'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setUnit('cholesterol', unit)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-bold transition-all",
                          preferences.units.cholesterol === unit
                            ? "bg-[#00A884] text-white shadow-2xs"
                            : "text-[#64748B] hover:text-[#071B49]"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Creatinine */}
                <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#071B49] block">Serum Creatinine</span>
                    <span className="text-[11px] text-[#64748B]">Renal clearance biomarker</span>
                  </div>
                  <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                    {(['mg/dL', 'µmol/L'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setUnit('creatinine', unit)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-bold transition-all",
                          preferences.units.creatinine === unit
                            ? "bg-[#00A884] text-white shadow-2xs"
                            : "text-[#64748B] hover:text-[#071B49]"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hemoglobin */}
                <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#071B49] block">Hemoglobin</span>
                    <span className="text-[11px] text-[#64748B]">Complete blood count standard</span>
                  </div>
                  <div className="inline-flex rounded-lg p-1 bg-white border border-[#DCE5EC] shadow-2xs">
                    {(['g/dL', 'g/L'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setUnit('hemoglobin', unit)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-bold transition-all",
                          preferences.units.hemoglobin === unit
                            ? "bg-[#00A884] text-white shadow-2xs"
                            : "text-[#64748B] hover:text-[#071B49]"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Clinical Metric Preview Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#DCE5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-[#00A884]" />
                <span className="text-xs font-semibold text-[#071B49]">Active Patient Vitals Format Preview:</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#071B49] bg-white px-3 py-1.5 rounded-lg border border-[#DCE5EC]">
                <span>178 {preferences.units.height}</span>
                <span className="text-[#64748B]">·</span>
                <span>72 {preferences.units.weight}</span>
                <span className="text-[#64748B]">·</span>
                <span>36.8 {preferences.units.temperature}</span>
                <span className="text-[#64748B]">·</span>
                <span>{preferences.units.timeFormat === '12h' ? '08:30 AM' : '08:30'}</span>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION D: PRIVACY & HEALTH DATA GOVERNANCE
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'privacy') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#00A884]/10 text-[#00A884] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Privacy & Clinical Data Governance</h2>
                <p className="text-xs text-[#64748B]">Control location telemetry, private AI diagnosis engines, and telemetry compliance.</p>
              </div>
            </div>

            <div className="divide-y divide-[#DCE5EC]">
              {/* Location Access */}
              <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-sm font-bold text-[#071B49]">Location Access</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Allow MediTrack to access device geolocation to instantly find verified emergency centers and trauma hospitals in 'Care Near Me'.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy('locationAccess', !preferences.privacy.locationAccess)}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.privacy.locationAccess ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.privacy.locationAccess}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.privacy.locationAccess ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* AI Health Insights */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00A884]" />
                    <span className="text-sm font-bold text-[#071B49]">AI Health Insights &amp; Trend Detection</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Enables automated biomarker anomaly correlation, clinical guidance explanations, and longitudinal risk modeling.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy('aiHealthInsights', !preferences.privacy.aiHealthInsights)}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.privacy.aiHealthInsights ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.privacy.aiHealthInsights}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.privacy.aiHealthInsights ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Analytics */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Anonymous Clinical Analytics</span>
                  <p className="text-xs text-[#64748B] mt-1">
                    Share de-identified telemetry to assist in benchmarking diagnostic accuracy against healthcare registry standards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy('analytics', !preferences.privacy.analytics)}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                    preferences.privacy.analytics ? "bg-[#00A884]" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={preferences.privacy.analytics}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      preferences.privacy.analytics ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* HIPAA Compliance Assurance Banner */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="text-xs text-[#071B49] space-y-1">
                <p className="font-bold">HIPAA &amp; EHR Security Notice</p>
                <p className="text-[#64748B] leading-relaxed">
                  Your personal health information (PHI) is protected with AES-256 encryption at rest and TLS 1.3 in transit. MediTrack never monetizes personal health history or sells clinical profiles to third-party ad brokers.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION E: SECURITY & SESSIONS
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#071B49]/10 text-[#071B49] flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Security &amp; Device Management</h2>
                <p className="text-xs text-[#64748B]">Update account password, audit active login sessions, and revoke remote device tokens.</p>
              </div>
            </div>

            {/* Sub-Card 1: Change Password */}
            <div className="p-5 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#071B49]">Change Password</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Ensure your password is at least 8 characters with mixed casing and digits.</p>
                </div>
                <KeyRound className="w-4 h-4 text-[#64748B]" />
              </div>

              {pwSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A884] shrink-0" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              {pwError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#EF476F] shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div>
                    <label className="text-[11px] font-bold text-[#071B49] block mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-[#DCE5EC] bg-white text-[#071B49] placeholder:text-slate-400 focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] shadow-[inset_0_1px_2px_rgba(7,27,73,0.04)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-[11px] font-bold text-[#071B49] block mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-[#DCE5EC] bg-white text-[#071B49] placeholder:text-slate-400 focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] shadow-[inset_0_1px_2px_rgba(7,27,73,0.04)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="text-[11px] font-bold text-[#071B49] block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE5EC] bg-white text-[#071B49] placeholder:text-slate-400 focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] shadow-[inset_0_1px_2px_rgba(7,27,73,0.04)]"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="p-3 rounded-lg bg-white border border-[#DCE5EC] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#64748B]">Password Strength</span>
                      <span className={cn(
                        "font-bold",
                        strengthScore >= 4 ? "text-[#00A884]" : strengthScore >= 2 ? "text-amber-600" : "text-[#EF476F]"
                      )}>
                        {strengthScore >= 4 ? 'Strong' : strengthScore >= 2 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={cn(
                            "h-full flex-1 rounded-full transition-all",
                            strengthScore >= step
                              ? strengthScore >= 4 ? "bg-[#00A884]" : strengthScore >= 2 ? "bg-amber-500" : "bg-[#EF476F]"
                              : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#64748B] pt-1">
                      <span className={cn(hasMinLength ? "text-emerald-700 font-bold" : "")}>
                        {hasMinLength ? '✓' : '•'} 8+ characters
                      </span>
                      <span className={cn(hasUpperCase ? "text-emerald-700 font-bold" : "")}>
                        {hasUpperCase ? '✓' : '•'} Uppercase letter
                      </span>
                      <span className={cn(hasNumber ? "text-emerald-700 font-bold" : "")}>
                        {hasNumber ? '✓' : '•'} Number
                      </span>
                      <span className={cn(hasSpecial ? "text-emerald-700 font-bold" : "")}>
                        {hasSpecial ? '✓' : '•'} Symbol
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pwLoading || !currentPassword || !newPassword}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A884] hover:bg-[#009272] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                  >
                    {pwLoading ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sub-Card 2: Active Sessions & Remote Logout */}
            <div className="p-5 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#071B49]">Active Login Sessions</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Devices currently authenticated to your medical profile.</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  disabled={sessionActionLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#EF476F]/30 bg-white hover:bg-rose-50 text-xs font-bold text-[#EF476F] transition-all shadow-2xs self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout All Other Devices</span>
                </button>
              </div>

              {sessionMessage && (
                <div className={cn(
                  "p-3 rounded-lg text-xs font-semibold flex items-center gap-2",
                  sessionMessage.type === 'success' 
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                )}>
                  {sessionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00A884] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#EF476F] shrink-0" />
                  )}
                  <span>{sessionMessage.text}</span>
                </div>
              )}

              {/* Sessions Table / List */}
              <div className="bg-white rounded-xl border border-[#DCE5EC] overflow-hidden">
                {sessionsLoading ? (
                  <TableSkeleton rows={3} cols={3} />
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    <Laptop className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <span>Current web browser session active.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-[#DCE5EC]">
                    {sessions.map((sess, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div key={sess.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#071B49] flex items-center justify-center shrink-0">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#071B49] truncate">
                                  {sess.user_agent ? sess.user_agent.slice(0, 45) + '...' : 'Web Browser Client'}
                                </span>
                                {isFirst && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#00A884]/15 text-[#00A884] font-bold text-[10px] shrink-0">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                IP: {sess.ip_address || '127.0.0.1'} · Active: {new Date(sess.last_used_at || sess.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {!isFirst && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(sess.id)}
                              disabled={sessionActionLoading}
                              className="text-xs font-bold text-[#EF476F] hover:underline shrink-0"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION F: ACCOUNT & DATA VAULT
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'account') && (
          <section className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-[2px_4px_12px_rgba(7,27,73,0.03)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#DCE5EC]">
              <div className="w-10 h-10 rounded-xl bg-[#00A884]/10 text-[#00A884] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071B49]">Account &amp; Medical Data Vault</h2>
                <p className="text-xs text-[#64748B]">Export complete personal health record (PHR) archives or manage account termination.</p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F7F9FB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#071B49] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {user?.name?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#071B49]">{user?.name || 'Verified Patient'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00A884]/15 text-[#00A884] text-[10px] font-bold">
                      {user?.role === 'ADMIN' ? 'Administrator' : 'EHR Verified'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">{user?.email || 'patient@meditrack.io'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5EC] hover:bg-slate-50 text-xs font-bold text-[#071B49] transition-all shadow-2xs self-start sm:self-auto"
              >
                <span>Edit Full Profile</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
            </div>

            {/* Download Health Data (JSON/PHR Export) */}
            <div className="p-5 rounded-xl border border-[#DCE5EC] bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#071B49]">Download Personal Health Record (PHR Archive)</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Export your complete vitals, clinical reports, medication records, and lab alerts in standard JSON format.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-sm active:scale-98 shrink-0"
                >
                  {exportLoading ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>Generating Archive...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Health Data (JSON)</span>
                    </>
                  )}
                </button>
              </div>

              {exportSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A884]" />
                  <span>Personal health record archive downloaded successfully to your device.</span>
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-5 rounded-xl border border-[#EF476F]/30 bg-rose-50/40 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EF476F]/10 text-[#EF476F] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#EF476F]">Danger Zone: Delete MediTrack Account</h3>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Permanently delete your account, patient profile, historical measurements, and connected medical documents. This action cannot be reversed.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EF476F]/40 hover:bg-[#EF476F] hover:text-white text-[#EF476F] text-xs font-bold transition-all shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-[#EF476F]/40 space-y-3">
                  <p className="text-xs font-bold text-[#071B49]">
                    To confirm account deletion, please type <span className="text-[#EF476F] font-mono">DELETE</span> below:
                  </p>

                  {deleteError && (
                    <p className="text-xs font-semibold text-[#EF476F]">{deleteError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Type DELETE"
                      className="px-3 py-2 text-xs rounded-lg border border-[#DCE5EC] bg-white text-[#071B49] focus:outline-none focus:border-[#EF476F] focus:ring-1 focus:ring-[#EF476F]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteConfirmationText !== 'DELETE'}
                        className="px-4 py-2 rounded-lg bg-[#EF476F] hover:bg-[#d63a60] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs"
                      >
                        {deleteLoading ? 'Deleting...' : 'Confirm Permanent Deletion'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationText('');
                          setDeleteError(null);
                        }}
                        className="px-3 py-2 rounded-lg border border-[#DCE5EC] text-xs font-bold text-[#64748B] hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
