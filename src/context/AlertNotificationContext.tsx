import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { familyService, HealthAlert, NotificationDelivery } from '../api/family';
import { useAuth } from './AuthContext';

interface AlertNotificationContextType {
  alerts: HealthAlert[];
  unreadCount: number;
  activePopups: HealthAlert[];
  isLoading: boolean;
  dismissPopup: (alertId: number) => void;
  markAsRead: (alertId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const AlertNotificationContext = createContext<AlertNotificationContextType | undefined>(undefined);

// Synthesize an accessible, gentle clinical chime via Web Audio API without needing external mp3 assets
function playAlertChime(severity: string) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (severity === 'CRITICAL') {
      // Two-tone urgent chime (880Hz -> 660Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Subtle single ping (523.25Hz C5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Audio autoplay might be blocked before first user gesture; ignore safely
  }
}

export const AlertNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [activePopups, setActivePopups] = useState<HealthAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const poppedAlertIdsRef = useRef<Set<number>>(new Set());

  // Initialize popped IDs from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('meditrack_popped_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          poppedAlertIdsRef.current = new Set(parsed);
        }
      }
    } catch {}
  }, []);

  const savePoppedIds = useCallback(() => {
    try {
      sessionStorage.setItem('meditrack_popped_alerts', JSON.stringify(Array.from(poppedAlertIdsRef.current)));
    } catch {}
  }, []);

  const refreshAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setActivePopups([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await familyService.getAlerts();
      const list = Array.isArray(data) ? data : [];
      setAlerts(list);

      // Check for unread alerts that haven't been shown as popups yet
      const newPopups: HealthAlert[] = [];
      for (const alert of list) {
        if (!alert.is_read && !poppedAlertIdsRef.current.has(alert.id)) {
          // Add to popped set
          poppedAlertIdsRef.current.add(alert.id);
          newPopups.push(alert);
        }
      }

      if (newPopups.length > 0) {
        savePoppedIds();
        setActivePopups(prev => [...newPopups, ...prev].slice(0, 4)); // Max 4 simultaneous toasts

        // Play chime if any critical or high priority alert
        const hasUrgent = newPopups.some(p => p.severity === 'CRITICAL' || p.severity === 'HIGH_PRIORITY');
        if (hasUrgent) {
          playAlertChime('CRITICAL');
        } else {
          playAlertChime('NORMAL');
        }
      }
    } catch (err) {
      // Gracefully ignore network polling errors
    } finally {
      setIsLoading(false);
    }
  }, [user, savePoppedIds]);

  // Initial fetch and 20s background polling
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 20000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const dismissPopup = useCallback((alertId: number) => {
    setActivePopups(prev => prev.filter(p => p.id !== alertId));
  }, []);

  const markAsRead = useCallback(async (alertId: number) => {
    try {
      await familyService.markAlertRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: 1 } : a));
      dismissPopup(alertId);
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  }, [dismissPopup]);

  const markAllAsRead = useCallback(async () => {
    try {
      await familyService.markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
      setActivePopups([]);
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AlertNotificationContext.Provider
      value={{
        alerts,
        unreadCount,
        activePopups,
        isLoading,
        dismissPopup,
        markAsRead,
        markAllAsRead,
        refreshAlerts
      }}
    >
      {children}
    </AlertNotificationContext.Provider>
  );
};

export const useAlertNotifications = () => {
  const context = useContext(AlertNotificationContext);
  if (!context) {
    throw new Error('useAlertNotifications must be used within an AlertNotificationProvider');
  }
  return context;
};
