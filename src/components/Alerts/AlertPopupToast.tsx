import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, X, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAlertNotifications } from '../../context/AlertNotificationContext';
import { HealthAlert } from '../../api/family';

export default function AlertPopupToast() {
  const { activePopups, dismissPopup, markAsRead } = useAlertNotifications();
  const navigate = useNavigate();

  if (activePopups.length === 0) return null;

  const handleAction = async (alert: HealthAlert) => {
    await markAsRead(alert.id);
    if (alert.action_url) {
      navigate(alert.action_url);
    } else if (alert.source_report_id) {
      navigate(`/reports?highlight=${alert.source_report_id}`);
    } else {
      navigate('/family-alerts');
    }
  };

  return (
    <div 
      className="fixed top-20 right-4 sm:right-6 md:right-8 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] pointer-events-none"
      role="region"
      aria-label="Real-time Health Risk Alerts"
    >
      {activePopups.map((alert) => {
        const severity = alert.severity || 'WARNING';
        const isCritical = severity === 'CRITICAL';
        const isHigh = severity === 'HIGH_PRIORITY';
        const isWarning = severity === 'WARNING';

        // Visual Treatment
        let borderClass = 'border-blue-300 bg-white';
        let bannerBg = 'bg-blue-600 text-white';
        let badgeText = 'INFORMATIONAL';
        let IconComponent = Info;
        let shadowClass = 'shadow-lg';

        if (isCritical) {
          borderClass = 'border-red-500 bg-red-50/90 ring-2 ring-red-400 ring-offset-1';
          bannerBg = 'bg-red-600 text-white animate-pulse';
          badgeText = 'CRITICAL CLINICAL ALERT';
          IconComponent = ShieldAlert;
          shadowClass = 'shadow-2xl shadow-red-500/20';
        } else if (isHigh) {
          borderClass = 'border-amber-500 bg-amber-50/90 ring-1 ring-amber-400';
          bannerBg = 'bg-amber-600 text-white';
          badgeText = 'HIGH PRIORITY';
          IconComponent = AlertTriangle;
          shadowClass = 'shadow-xl shadow-amber-500/15';
        } else if (isWarning) {
          borderClass = 'border-yellow-400 bg-yellow-50/80';
          bannerBg = 'bg-yellow-600 text-white';
          badgeText = 'ABNORMAL FINDING';
          IconComponent = AlertCircle;
          shadowClass = 'shadow-lg';
        }

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto rounded-xl border ${borderClass} ${shadowClass} overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100 backdrop-blur-md`}
          >
            {/* Top Severity Ribbon */}
            <div className={`px-4 py-1.5 ${bannerBg} flex items-center justify-between text-xs font-bold tracking-wide uppercase`}>
              <div className="flex items-center gap-1.5">
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{badgeText}</span>
              </div>
              <span className="text-[10px] opacity-90 lowercase font-normal">
                {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-2.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {alert.title || alert.message}
                </h4>
                {alert.measured_value && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Observed:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${isCritical ? 'bg-red-200 text-red-900' : isHigh ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'}`}>
                      {alert.measured_value}
                    </span>
                    {alert.reference_range && (
                      <span className="text-slate-500 text-[11px]">(Ref: {alert.reference_range})</span>
                    )}
                  </div>
                )}
              </div>

              {alert.message && alert.title && alert.title !== alert.message && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {alert.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => dismissPopup(alert.id)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                >
                  Dismiss
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(alert)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-colors ${
                      isCritical
                        ? 'bg-red-600 hover:bg-red-700'
                        : isHigh
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
