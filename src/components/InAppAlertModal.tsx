import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Check, 
  Volume2, 
  VolumeX, 
  Bell
} from 'lucide-react';
import { apiClient, getAccessToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

interface AlertItem {
  id: number;
  type: string;
  title?: string;
  severity?: string;
  message: string;
  source: string;
  status: string;
  is_read?: number;
  created_at: string;
}

/**
 * Generates an authentic, gentle dual-tone clinical chime using the Web Audio API.
 */
function playClinicalAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // AudioContext playback may be blocked before initial user gesture
  }
}

/**
 * Requests browser desktop notification permissions and fires a native OS pop-up.
 */
function triggerDesktopPopup(title: string, body: string, onClick?: () => void) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'meditrack-health-alert'
      });
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
    } catch {
      // Ignore background notification restrictions
    }
  }
}

export default function InAppAlertModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState<AlertItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPromptedPermission, setHasPromptedPermission] = useState(false);
  const seenAlertIdsRef = useRef<Set<number>>(new Set());

  const checkAlerts = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await apiClient.get('/api/alerts');
      const list: AlertItem[] = Array.isArray(data) ? data : [];

      // Find any newly arrived unread alerts
      const unreadAlerts = list.filter(a => !a.is_read);
      for (const alert of unreadAlerts) {
        if (!seenAlertIdsRef.current.has(alert.id)) {
          seenAlertIdsRef.current.add(alert.id);
          setActiveAlert(alert);

          // Play sound if not muted
          if (!isMuted) {
            playClinicalAlertChime();
          }

          // Trigger native desktop notification popup
          triggerDesktopPopup(
            `MediTrack: ${alert.title || alert.type || 'Health Alert'}`,
            alert.message,
            () => {
              navigate(`/family-alerts?alertId=${alert.id}`);
            }
          );
          break; // Show one modal pop-up at a time
        }
      }
    } catch {
      // Ignore transient polling errors
    }
  };

  useEffect(() => {
    checkAlerts();
    // Poll every 10 seconds for real-time prompt pop-ups
    const interval = setInterval(checkAlerts, 10000);

    const handleAlertCreated = () => {
      checkAlerts();
    };
    window.addEventListener('meditrack:alert-created', handleAlertCreated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('meditrack:alert-created', handleAlertCreated);
    };
  }, [user?.id, isMuted]);

  const handleAcknowledge = async () => {
    if (!activeAlert) return;
    const alertId = activeAlert.id;
    try {
      await apiClient.put(`/api/alerts/${alertId}/read`, {});
      window.dispatchEvent(new CustomEvent('meditrack:alert-created'));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActiveAlert(null);
    }
  };

  const handleViewDetails = async () => {
    if (!activeAlert) return;
    const alertId = activeAlert.id;
    await handleAcknowledge();
    navigate(`/family-alerts?alertId=${alertId}`);
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setHasPromptedPermission(true);
      if (perm === 'granted' && activeAlert) {
        triggerDesktopPopup(
          `MediTrack: ${activeAlert.title || 'Health Alert'}`,
          activeAlert.message
        );
      }
    }
  };

  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === 'CRITICAL' || activeAlert.type?.toLowerCase().includes('critical') || activeAlert.type?.toLowerCase().includes('emergency');
  const isHigh = activeAlert.severity === 'HIGH' || activeAlert.type?.toLowerCase().includes('high');
  const severityLabel = activeAlert.severity || (isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "relative w-full max-w-lg bg-white dark:bg-[#0D1B2A] rounded-3xl shadow-2xl overflow-hidden border-2 animate-in zoom-in-95 duration-200",
          isCritical 
            ? "border-rose-500 shadow-rose-500/20" 
            : isHigh 
            ? "border-amber-500 shadow-amber-500/20" 
            : "border-emerald-500 shadow-emerald-500/20"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {/* Top Header Banner */}
        <div className={cn(
          "px-6 py-4 flex items-center justify-between text-white font-bold",
          isCritical 
            ? "bg-gradient-to-r from-rose-600 to-red-700" 
            : isHigh 
            ? "bg-gradient-to-r from-amber-600 to-orange-600" 
            : "bg-gradient-to-r from-emerald-600 to-teal-700"
        )}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-xs animate-bounce">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase opacity-90 block leading-tight font-black">
                Real-Time Health Pop-Up Alert
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {severityLabel} Priority Notice
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title={isMuted ? "Unmute alert chime" : "Mute alert chime"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleAcknowledge}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Close alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                isCritical 
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" 
                  : isHigh 
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" 
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              )}>
                {activeAlert.source || 'Automated Clinical System'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {activeAlert.created_at ? new Date(activeAlert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
              </span>
            </div>

            <h4 id="alert-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {activeAlert.title || (activeAlert.type === 'REPORT_PROCESSED' ? 'Medical Report Processing Complete' : activeAlert.type?.replace(/_/g, ' ')) || 'Clinical Notice'}
            </h4>

            <p id="alert-dialog-description" className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#102033] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {activeAlert.message}
            </p>
          </div>

          {/* Browser Desktop Notification Prompt Banner (if not yet granted) */}
          {'Notification' in window && Notification.permission === 'default' && !hasPromptedPermission && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Show native desktop pop-up alerts on this device?</span>
              </div>
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shrink-0 ml-2"
              >
                Enable
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleViewDetails}
              className={cn(
                "w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98",
                isCritical 
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30" 
                  : isHigh 
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30" 
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
              )}
            >
              <span>View Full Clinical Details</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAcknowledge}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-[#14283B] dark:hover:bg-[#1b344d] transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
