import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../api/auth';
import { useAuth } from './AuthContext';

export interface UserPreferences {
  appearance: {
    theme: 'Light' | 'Dark' | 'System';
    reduceAnimations: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
    healthReminders: boolean;
    labReportAlerts: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  };
  units: {
    height: 'cm' | 'ft & in';
    weight: 'kg' | 'lbs';
    temperature: '°C' | '°F';
    timeFormat: '12h' | '24h';
  };
  privacy: {
    locationAccess: boolean;
    aiHealthInsights: boolean;
    analytics: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  appearance: {
    theme: 'Light',
    reduceAnimations: false,
  },
  notifications: {
    emailNotifications: true,
    smsAlerts: false,
    pushNotifications: true,
    healthReminders: false,
    labReportAlerts: false,
    frequency: 'instant',
  },
  units: {
    height: 'cm',
    weight: 'kg',
    temperature: '°C',
    timeFormat: '12h',
  },
  privacy: {
    locationAccess: true,
    aiHealthInsights: true,
    analytics: false,
  },
};

const STORAGE_KEY = 'meditrack_user_preferences_v2';

interface SettingsContextType {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  preferences: UserPreferences;
  updatePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  setAppearance: (key: keyof UserPreferences['appearance'], val: any) => void;
  notificationPrefsLoaded: boolean;
  notificationSaving: string | null;
  notificationError: string | null;
  setNotification: (key: NotificationToggleKey, val: boolean) => Promise<boolean>;
  setNotificationFrequency: (val: UserPreferences['notifications']['frequency']) => Promise<boolean>;
  setUnit: (key: keyof UserPreferences['units'], val: any) => void;
  setPrivacy: (key: keyof UserPreferences['privacy'], val: boolean) => void;
  resetPreferences: () => Promise<boolean>;
}

type NotificationToggleKey = Exclude<keyof UserPreferences['notifications'], 'frequency'>;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          appearance: { ...DEFAULT_PREFERENCES.appearance, ...(parsed.appearance || {}) },
          notifications: { ...DEFAULT_PREFERENCES.notifications, ...(parsed.notifications || {}) },
          units: { ...DEFAULT_PREFERENCES.units, ...(parsed.units || {}) },
          privacy: { ...DEFAULT_PREFERENCES.privacy, ...(parsed.privacy || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings from storage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    if (authLoading) {
      setNotificationPrefsLoaded(false);
      return;
    }
    if (!user) {
      setPreferences(prev => ({ ...prev, notifications: { ...DEFAULT_PREFERENCES.notifications } }));
      setNotificationPrefsLoaded(true);
      return;
    }

    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        emailNotifications: user.notification_email === 1,
        smsAlerts: user.notification_sms === 1,
        pushNotifications: user.notification_push === 1,
        healthReminders: user.notification_health_reminders === 1,
        labReportAlerts: user.notification_lab_report_alerts === 1,
        frequency: user.notification_frequency || 'instant'
      }
    }));
    setNotificationPrefsLoaded(true);
  }, [authLoading, user?.id, user?.notification_email, user?.notification_sms, user?.notification_push, user?.notification_health_reminders, user?.notification_lab_report_alerts, user?.notification_frequency]);

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }

    // Apply reduced animations to document root if enabled
    if (preferences.appearance.reduceAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [preferences]);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = preferences.appearance.theme === 'Dark' ||
        (preferences.appearance.theme === 'System' && systemTheme.matches);
      root.classList.toggle('dark', isDark);
      root.classList.toggle('dark-mode', isDark);
      root.dataset.theme = isDark ? 'dark' : 'light';
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    applyTheme();
    if (preferences.appearance.theme === 'System') {
      systemTheme.addEventListener('change', applyTheme);
      return () => systemTheme.removeEventListener('change', applyTheme);
    }
  }, [preferences.appearance.theme]);

  const openSettings = () => setIsOpen(true);
  const closeSettings = () => setIsOpen(false);
  const toggleSettings = () => setIsOpen((prev) => !prev);

  const updatePreferences = (updater: (prev: UserPreferences) => UserPreferences) => {
    setPreferences((prev) => updater(prev));
  };

  const setAppearance = (key: keyof UserPreferences['appearance'], val: any) => {
    setPreferences((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: val },
    }));
  };

  const notificationProfileField: Record<NotificationToggleKey, keyof User> = {
    emailNotifications: 'notification_email',
    smsAlerts: 'notification_sms',
    pushNotifications: 'notification_push',
    healthReminders: 'notification_health_reminders',
    labReportAlerts: 'notification_lab_report_alerts'
  };

  const setNotification = async (key: NotificationToggleKey, val: boolean) => {
    if (!notificationPrefsLoaded || notificationSaving) return false;
    const previousValue = preferences.notifications[key];
    setNotificationError(null);
    setNotificationSaving(key);
    setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: val } }));
    try {
      if (!user) throw new Error('Sign in to save notification settings.');
      const savedUser = await authService.updateProfile({ [notificationProfileField[key]]: val ? 1 : 0 });
      updateUser(savedUser);
      return true;
    } catch (error: any) {
      setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: previousValue } }));
      setNotificationError(error?.message || 'Could not save the notification setting. Your previous value was restored.');
      return false;
    } finally {
      setNotificationSaving(null);
    }
  };

  const setNotificationFrequency = async (val: UserPreferences['notifications']['frequency']) => {
    if (!notificationPrefsLoaded || notificationSaving) return false;
    const previousValue = preferences.notifications.frequency;
    setNotificationError(null);
    setNotificationSaving('frequency');
    setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, frequency: val } }));
    try {
      if (!user) throw new Error('Sign in to save notification settings.');
      const savedUser = await authService.updateProfile({ notification_frequency: val });
      updateUser(savedUser);
      return true;
    } catch (error: any) {
      setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, frequency: previousValue } }));
      setNotificationError(error?.message || 'Could not save the notification cadence. Your previous value was restored.');
      return false;
    } finally {
      setNotificationSaving(null);
    }
  };

  const setUnit = (key: keyof UserPreferences['units'], val: any) => {
    setPreferences((prev) => ({
      ...prev,
      units: { ...prev.units, [key]: val },
    }));
  };

  const setPrivacy = (key: keyof UserPreferences['privacy'], val: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: val },
    }));
  };

  const resetPreferences = async () => {
    if (!notificationPrefsLoaded || notificationSaving) return false;
    const previousPreferences = preferences;
    setNotificationError(null);
    setNotificationSaving('reset');
    try {
      if (user) {
        const savedUser = await authService.updateProfile({
          notification_email: DEFAULT_PREFERENCES.notifications.emailNotifications ? 1 : 0,
          notification_sms: DEFAULT_PREFERENCES.notifications.smsAlerts ? 1 : 0,
          notification_push: DEFAULT_PREFERENCES.notifications.pushNotifications ? 1 : 0,
          notification_health_reminders: DEFAULT_PREFERENCES.notifications.healthReminders ? 1 : 0,
          notification_lab_report_alerts: DEFAULT_PREFERENCES.notifications.labReportAlerts ? 1 : 0,
          notification_frequency: DEFAULT_PREFERENCES.notifications.frequency
        });
        updateUser(savedUser);
      }
      setPreferences(DEFAULT_PREFERENCES);
      return true;
    } catch (error: any) {
      setPreferences(previousPreferences);
      setNotificationError(error?.message || 'Could not reset settings. Your previous values were restored.');
      return false;
    } finally {
      setNotificationSaving(null);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        openSettings,
        closeSettings,
        toggleSettings,
        preferences,
        updatePreferences,
        setAppearance,
        setNotification,
        setNotificationFrequency,
        notificationPrefsLoaded,
        notificationSaving,
        notificationError,
        setUnit,
        setPrivacy,
        resetPreferences,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
