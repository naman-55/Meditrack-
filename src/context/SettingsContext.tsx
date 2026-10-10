import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserPreferences {
  appearance: {
    theme: 'Light' | 'Dark' | 'System';
    reduceAnimations: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    healthReminders: boolean;
    labReportAlerts: boolean;
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
    pushNotifications: true,
    healthReminders: true,
    labReportAlerts: true,
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
  setNotification: (key: keyof UserPreferences['notifications'], val: boolean) => void;
  setUnit: (key: keyof UserPreferences['units'], val: any) => void;
  setPrivacy: (key: keyof UserPreferences['privacy'], val: boolean) => void;
  resetPreferences: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const setNotification = (key: keyof UserPreferences['notifications'], val: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: val },
    }));
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

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
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
