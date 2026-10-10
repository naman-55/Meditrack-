import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  Sun, 
  Moon, 
  Monitor, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Laptop, 
  LogOut, 
  Download, 
  Trash2, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  Sliders,
  Shield,
  UserCheck
} from 'lucide-react';
import { useSettings, UserPreferences } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

type SubView = 'main' | 'change-password' | 'sessions' | 'theme-picker' | 'height-picker' | 'weight-picker' | 'temp-picker' | 'time-picker';

export default function SettingsDrawer() {
  const { isOpen, closeSettings, preferences, setAppearance, setNotification, setUnit, setPrivacy } = useSettings();
  const { user, logout } = useAuth();

  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Delete Account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Logout All Devices modal
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Data Download state
  const [isDownloadingData, setIsDownloadingData] = useState(false);

  // Reset subview when drawer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveSubView('main');
      setShowDeleteModal(false);
      setShowLogoutAllModal(false);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch sessions when opening sessions view
  useEffect(() => {
    if (activeSubView === 'sessions' && isOpen) {
      fetchSessions();
    }
  }, [activeSubView, isOpen]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/sessions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        // Fallback placeholder session representation if table was empty
        setSessions([
          {
            id: 1,
            user_agent: navigator.userAgent,
            ip_address: '127.0.0.1 (Current Device)',
            last_used_at: new Date().toISOString(),
            is_current: true
          }
        ]);
      }
    } catch (e) {
      console.warn('Failed to load sessions:', e);
      setSessions([
        {
          id: 1,
          user_agent: navigator.userAgent,
          ip_address: 'Current Active Browser',
          last_used_at: new Date().toISOString(),
          is_current: true
        }
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/revoke-session/${sessionId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        showToast('Device session terminated');
        fetchSessions();
      } else {
        showToast('Failed to revoke session', 'error');
      }
    } catch (e) {
      showToast('Error terminating session', 'error');
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        showToast('All sessions logged out');
        setTimeout(() => {
          logout();
          closeSettings();
        }, 1200);
      } else {
        showToast('Failed to logout all devices', 'error');
      }
    } catch (e) {
      showToast('Error during device logout', 'error');
    } finally {
      setIsLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Password updated securely');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveSubView('main');
      } else {
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch (e) {
      setPasswordError('Network error while updating password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    setIsDownloadingData(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/export-data', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meditrack-health-archive-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Medical record archive downloaded');
      } else {
        showToast('Failed to export medical data', 'error');
      }
    } catch (e) {
      showToast('Error exporting health data', 'error');
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }
    setIsDeletingAccount(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        showToast('Account permanently removed');
        setTimeout(() => {
          logout();
          closeSettings();
        }, 1200);
      } else {
        showToast('Failed to delete account', 'error');
      }
    } catch (e) {
      showToast('Error deleting account', 'error');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#071B49]/25 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Slide Drawer Panel */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[460px] max-w-full bg-[#F7F9FB] shadow-[-8px_0_24px_rgba(7,27,73,0.08)] flex flex-col z-50 transition-transform duration-300 ease-in-out border-l border-[#DCE5EC]"
        )}
        role="dialog"
        aria-label="Settings panel"
      >
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div 
            className={cn(
              "absolute top-4 left-4 right-4 z-50 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-200",
              toastType === 'success' 
                ? "bg-[#00A884] text-white shadow-[#00A884]/20" 
                : "bg-[#EF476F] text-white shadow-[#EF476F]/20"
            )}
          >
            {toastType === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-5 bg-[#FFFFFF] border-b border-[#DCE5EC] flex items-center justify-between shrink-0 shadow-[0_2px_8px_rgba(7,27,73,0.02)]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#071B49]">Settings</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A884]/10 text-[#00A884]">v2.0</span>
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">Manage your preferences</p>
          </div>

          <button
            type="button"
            onClick={closeSettings}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#071B49] bg-[#FFFFFF] border border-[#DCE5EC] shadow-[2px_2px_5px_rgba(7,27,73,0.03),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:shadow-inner active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#00A884]/30"
            aria-label="Close settings drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {activeSubView === 'main' && (
            <>
              {/* SECTION 1: Appearance */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Appearance</span>
                </h3>

                <div className="space-y-3">
                  {/* Theme Row */}
                  <div 
                    onClick={() => setActiveSubView('theme-picker')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Theme</span>
                      <span className="text-[11px] text-[#64748B] block">Interface visual palette</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#00A884]">{preferences.appearance.theme}</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Reduce Animations Row */}
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-transparent">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Reduce animations</span>
                      <span className="text-[11px] text-[#64748B] block">Smoother, motion-reduced transitions</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.appearance.reduceAnimations}
                      onChange={(checked) => setAppearance('reduceAnimations', checked)}
                      label="Reduce animations"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: Notifications */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Notifications</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Email notifications</span>
                      <span className="text-[11px] text-[#64748B] block">Health digests and critical updates</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.notifications.emailNotifications}
                      onChange={(checked) => setNotification('emailNotifications', checked)}
                      label="Email notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Push notifications</span>
                      <span className="text-[11px] text-[#64748B] block">Real-time alerts on active device</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.notifications.pushNotifications}
                      onChange={(checked) => setNotification('pushNotifications', checked)}
                      label="Push notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Health reminders</span>
                      <span className="text-[11px] text-[#64748B] block">Medication schedules & vitals check-ins</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.notifications.healthReminders}
                      onChange={(checked) => setNotification('healthReminders', checked)}
                      label="Health reminders"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Lab report alerts</span>
                      <span className="text-[11px] text-[#64748B] block">Instant notifications when tests are parsed</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.notifications.labReportAlerts}
                      onChange={(checked) => setNotification('labReportAlerts', checked)}
                      label="Lab report alerts"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 3: Units & Display */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Units & Display</span>
                </h3>

                <div className="space-y-2">
                  {/* Height */}
                  <div 
                    onClick={() => setActiveSubView('height-picker')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Height</span>
                      <span className="text-[11px] text-[#64748B] block">Measurement unit for stature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2563EB]">{preferences.units.height}</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Weight */}
                  <div 
                    onClick={() => setActiveSubView('weight-picker')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Weight</span>
                      <span className="text-[11px] text-[#64748B] block">Body mass calculation unit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2563EB]">{preferences.units.weight}</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div 
                    onClick={() => setActiveSubView('temp-picker')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Temperature</span>
                      <span className="text-[11px] text-[#64748B] block">Clinical thermometer standard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2563EB]">{preferences.units.temperature}</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Time Format */}
                  <div 
                    onClick={() => setActiveSubView('time-picker')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Time format</span>
                      <span className="text-[11px] text-[#64748B] block">Clinical log timestamp display</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2563EB]">{preferences.units.timeFormat}</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Privacy */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Privacy</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Location access</span>
                      <span className="text-[11px] text-[#64748B] block">For finding urgent care & clinics nearby</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.privacy.locationAccess}
                      onChange={(checked) => setPrivacy('locationAccess', checked)}
                      label="Location access"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">AI health insights</span>
                      <span className="text-[11px] text-[#64748B] block">Automated lab parsing & risk detection</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.privacy.aiHealthInsights}
                      onChange={(checked) => setPrivacy('aiHealthInsights', checked)}
                      label="AI health insights"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Analytics</span>
                      <span className="text-[11px] text-[#64748B] block">Anonymous diagnostic usage telemetry</span>
                    </div>
                    <NeumorphicToggle
                      checked={preferences.privacy.analytics}
                      onChange={(checked) => setPrivacy('analytics', checked)}
                      label="Analytics"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 5: Security */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Security</span>
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubView('change-password')}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Change Password</span>
                      <span className="text-[11px] text-[#64748B] block">Update account access credential</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubView('sessions')}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">Active Sessions</span>
                      <span className="text-[11px] text-[#64748B] block">Manage devices logged into this profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLogoutAllModal(true)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#FFF0F3] text-left transition-colors border border-transparent hover:border-[#EF476F]/20 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#EF476F] block">Logout All Devices</span>
                      <span className="text-[11px] text-[#64748B] block">Revoke all active browser sessions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#EF476F] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </section>

              {/* SECTION 6: Account */}
              <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-4 shadow-[4px_4px_12px_rgba(7,27,73,0.03),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#071B49] mb-3 flex items-center gap-1.5">
                  <span>Account</span>
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadData}
                    disabled={isDownloadingData}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors border border-transparent hover:border-[#DCE5EC]/60 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#071B49] block">
                        {isDownloadingData ? 'Generating archive...' : 'Download My Data'}
                      </span>
                      <span className="text-[11px] text-[#64748B] block">Export complete medical chart JSON</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#FFF0F3] text-left transition-colors border border-transparent hover:border-[#EF476F]/20 group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#EF476F] block">Delete Account</span>
                      <span className="text-[11px] text-[#64748B] block">Permanently erase medical records & profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#EF476F] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* SUBVIEW: Change Password */}
          {activeSubView === 'change-password' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setActiveSubView('main')}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 mb-2"
              >
                &larr; Back to Settings
              </button>

              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-5 shadow-[4px_4px_12px_rgba(7,27,73,0.03)]">
                <h3 className="text-sm font-bold text-[#071B49] mb-1">Change Account Password</h3>
                <p className="text-xs text-[#64748B] mb-4">
                  Passwords must be at least 8 characters and contain mixed characters.
                </p>

                {passwordError && (
                  <div className="p-3 mb-4 rounded-xl bg-[#FFF0F3] border border-[#EF476F]/30 text-xs text-[#EF476F] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#071B49] mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F9FB] border border-[#DCE5EC] text-[#071B49] focus:outline-none focus:ring-2 focus:ring-[#00A884]/30 focus:border-[#00A884] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#071B49]"
                      >
                        {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#071B49] mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimum 8 characters"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F9FB] border border-[#DCE5EC] text-[#071B49] focus:outline-none focus:ring-2 focus:ring-[#00A884]/30 focus:border-[#00A884] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#071B49]"
                      >
                        {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#071B49] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F7F9FB] border border-[#DCE5EC] text-[#071B49] focus:outline-none focus:ring-2 focus:ring-[#00A884]/30 focus:border-[#00A884]"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#00A884] hover:bg-[#009272] text-white text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Updating Password...' : 'Save New Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubView('main')}
                      className="py-2.5 px-4 rounded-xl bg-[#FFFFFF] border border-[#DCE5EC] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUBVIEW: Active Sessions */}
          {activeSubView === 'sessions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setActiveSubView('main')}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 mb-2"
              >
                &larr; Back to Settings
              </button>

              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-5 shadow-[4px_4px_12px_rgba(7,27,73,0.03)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#071B49]">Active Patient Sessions</h3>
                  <button
                    type="button"
                    onClick={fetchSessions}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-[#64748B] mb-4">
                  Devices and browser instances with active authorization to your medical dashboard.
                </p>

                {isLoadingSessions ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">Loading active sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#64748B]">No other active sessions detected.</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((sess, idx) => (
                      <div 
                        key={sess.id || idx}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE5EC] flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-[#00A884] shrink-0" />
                            <span className="text-xs font-bold text-[#071B49] truncate">
                              {sess.ip_address || 'Local Device'}
                            </span>
                            {idx === 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00A884]/15 text-[#00A884] font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5 max-w-[240px]">
                            {sess.user_agent || 'Standard Secure Browser'}
                          </p>
                          <span className="text-[10px] text-[#94A3B8] block">
                            Last active: {sess.last_used_at ? new Date(sess.last_used_at).toLocaleDateString() : 'Just now'}
                          </span>
                        </div>

                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#EF476F] hover:bg-[#FFF0F3] rounded-lg border border-[#EF476F]/30 transition-colors shrink-0"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBVIEW: Theme Picker */}
          {activeSubView === 'theme-picker' && (
            <OptionPickerView
              title="Interface Theme"
              description="Choose how MediTrack appears on this device"
              options={['Light', 'Dark', 'System'] as const}
              selected={preferences.appearance.theme}
              onSelect={(val) => {
                setAppearance('theme', val);
                setActiveSubView('main');
                showToast(`Theme updated to ${val}`);
              }}
              onBack={() => setActiveSubView('main')}
            />
          )}

          {/* SUBVIEW: Height Picker */}
          {activeSubView === 'height-picker' && (
            <OptionPickerView
              title="Height Unit"
              description="Standard for height reporting & BMI computation"
              options={['cm', 'ft & in'] as const}
              selected={preferences.units.height}
              onSelect={(val) => {
                setUnit('height', val);
                setActiveSubView('main');
                showToast(`Height unit updated to ${val}`);
              }}
              onBack={() => setActiveSubView('main')}
            />
          )}

          {/* SUBVIEW: Weight Picker */}
          {activeSubView === 'weight-picker' && (
            <OptionPickerView
              title="Weight Unit"
              description="Standard for body mass index and medication dosages"
              options={['kg', 'lbs'] as const}
              selected={preferences.units.weight}
              onSelect={(val) => {
                setUnit('weight', val);
                setActiveSubView('main');
                showToast(`Weight unit updated to ${val}`);
              }}
              onBack={() => setActiveSubView('main')}
            />
          )}

          {/* SUBVIEW: Temperature Picker */}
          {activeSubView === 'temp-picker' && (
            <OptionPickerView
              title="Temperature Unit"
              description="Standard for body temperature monitoring and fever alerts"
              options={['°C', '°F'] as const}
              selected={preferences.units.temperature}
              onSelect={(val) => {
                setUnit('temperature', val);
                setActiveSubView('main');
                showToast(`Temperature unit updated to ${val}`);
              }}
              onBack={() => setActiveSubView('main')}
            />
          )}

          {/* SUBVIEW: Time Format Picker */}
          {activeSubView === 'time-picker' && (
            <OptionPickerView
              title="Time Format"
              description="Display standard for vital check logs & medication alarms"
              options={['12h', '24h'] as const}
              selected={preferences.units.timeFormat}
              onSelect={(val) => {
                setUnit('timeFormat', val);
                setActiveSubView('main');
                showToast(`Time format updated to ${val}`);
              }}
              onBack={() => setActiveSubView('main')}
            />
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-[#FFFFFF] border-t border-[#DCE5EC] text-center shrink-0">
          <p className="text-[11px] text-[#64748B]">
            MediTrack Healthcare Security Suite &bull; Patient HIPAA Standard
          </p>
        </div>
      </aside>

      {/* Logout All Devices Confirmation Modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-60 bg-[#071B49]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#EF476F]/10 text-[#EF476F] flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#071B49]">Logout All Devices?</h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                This will immediately terminate all active sessions across phones, tablets, and desktop browsers. You will need to log in again.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#EF476F] hover:bg-[#D9385E] text-white transition-colors"
              >
                {isLoggingOutAll ? 'Logging Out...' : 'Confirm Logout'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutAllModal(false)}
                className="py-2 px-3 text-xs font-semibold rounded-xl bg-[#FFFFFF] border border-[#DCE5EC] text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-[#071B49]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#EF476F]/10 text-[#EF476F] flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#EF476F]">Permanent Account Deletion</h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                This action is irreversible. All parsed lab reports, doctor records, medications, and trend metrics will be deleted.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#071B49] mb-1">
                Type <span className="font-bold text-[#EF476F]">DELETE</span> to proceed:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F9FB] border border-[#DCE5EC] text-[#071B49] focus:outline-none focus:ring-2 focus:ring-[#EF476F]/30"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmationText !== 'DELETE'}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#EF476F] hover:bg-[#D9385E] text-white transition-colors disabled:opacity-40"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }}
                className="py-2 px-3 text-xs font-semibold rounded-xl bg-[#FFFFFF] border border-[#DCE5EC] text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sleek Neumorphic Toggle Switch Component
interface NeumorphicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function NeumorphicToggle({ checked, onChange, label }: NeumorphicToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-[10px] font-bold tracking-wider select-none",
        checked ? "text-[#00A884]" : "text-[#64748B]"
      )}>
        {checked ? 'ON' : 'OFF'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00A884]/30",
          checked
            ? "bg-[#00A884] border border-[#009272] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]"
            : "bg-[#F1F5F9] border border-[#DCE5EC] shadow-[inset_2px_2px_4px_rgba(7,27,73,0.06),inset_-1px_-1px_2px_rgba(255,255,255,0.9)]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out my-auto ml-1",
            checked
              ? "translate-x-5 shadow-[1px_1px_4px_rgba(0,0,0,0.2)]"
              : "translate-x-0 shadow-[1px_2px_3px_rgba(7,27,73,0.12)]"
          )}
        />
      </button>
    </div>
  );
}

// Sub-view Option Picker Component
interface OptionPickerViewProps<T extends string> {
  title: string;
  description: string;
  options: readonly T[];
  selected: T;
  onSelect: (val: T) => void;
  onBack: () => void;
}

function OptionPickerView<T extends string>({
  title,
  description,
  options,
  selected,
  onSelect,
  onBack
}: OptionPickerViewProps<T>) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 mb-2"
      >
        &larr; Back to Settings
      </button>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5EC] p-5 shadow-[4px_4px_12px_rgba(7,27,73,0.03)]">
        <h3 className="text-sm font-bold text-[#071B49] mb-1">{title}</h3>
        <p className="text-xs text-[#64748B] mb-4">{description}</p>

        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onSelect(opt)}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold transition-all border",
                  isSelected
                    ? "bg-[#00A884]/10 text-[#00A884] border-[#00A884]/40 shadow-xs"
                    : "bg-[#F8FAFC] text-[#071B49] border-[#DCE5EC] hover:bg-[#FFFFFF]"
                )}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-4 h-4 text-[#00A884]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
