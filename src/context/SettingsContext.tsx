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
    glucose: 'mg/dL' | 'mmol/L';
    cholesterol: 'mg/dL' | 'mmol/L';
    creatinine: 'mg/dL' | 'µmol/L';
    hemoglobin: 'g/dL' | 'g/L';
    platelets: 'x10^3/µL' | 'lakh/µL';
    bloodPressure: 'mmHg' | 'kPa';
    labMode: 'standard' | 'original';
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
    glucose: 'mg/dL',
    cholesterol: 'mg/dL',
    creatinine: 'mg/dL',
    hemoglobin: 'g/dL',
    platelets: 'x10^3/µL',
    bloodPressure: 'mmHg',
    labMode: 'standard',
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
  getPreferredUnit: (parameter: string) => string;
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

    // Apply theme (Light, Dark, or System) to document root
    const theme = preferences.appearance.theme;
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const isDark = theme === 'Dark' || (theme === 'System' && !!mediaQuery?.matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (preferences.appearance.theme === 'System') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    mediaQuery?.addEventListener?.('change', handleSystemThemeChange);

    // Apply reduced animations to document root if enabled
    if (preferences.appearance.reduceAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    return () => {
      mediaQuery?.removeEventListener?.('change', handleSystemThemeChange);
    };
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

  const getPreferredUnit = (parameter: string): string => {
    const lower = (parameter || '').toLowerCase();
    if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('fbs')) {
      return preferences.units.glucose || 'mg/dL';
    }
    if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('hdl') || lower.includes('triglyceride')) {
      return preferences.units.cholesterol || 'mg/dL';
    }
    if (lower.includes('creatinine')) {
      return preferences.units.creatinine || 'mg/dL';
    }
    if (lower.includes('hemoglobin') || lower.includes('hb')) {
      return preferences.units.hemoglobin || 'g/dL';
    }
    if (lower.includes('platelet')) {
      return preferences.units.platelets || 'x10^3/µL';
    }
    if (lower.includes('blood_pressure') || lower.includes('bp')) {
      return preferences.units.bloodPressure || 'mmHg';
    }
    if (lower.includes('height')) {
      return preferences.units.height || 'cm';
    }
    if (lower.includes('weight')) {
      return preferences.units.weight || 'kg';
    }
    if (lower.includes('temp')) {
      return preferences.units.temperature || '°C';
    }
    return '';
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
        getPreferredUnit,
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
