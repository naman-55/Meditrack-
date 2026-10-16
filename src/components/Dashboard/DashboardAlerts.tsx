import React from 'react';
import { AlertTriangle, Bell, Info, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardAlertsSkeleton } from '../common/Skeleton';

interface Alert {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export default function DashboardAlerts({ alerts, isLoading, error }: { alerts?: Alert[], isLoading?: boolean, error?: string }) {
  if (isLoading) {
    return <DashboardAlertsSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-red-100 dark:border-rose-900/40 shadow-sm p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-[#2A0E14] rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 dark:text-[#FF5368]" />
          </div>
          <p className="text-sm font-medium text-red-500 dark:text-[#FF5368]">Failed to load alerts.</p>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200 dark:border-[#20364A] shadow-sm p-4 sm:p-5 flex items-center justify-between mb-6 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-[#102033] border border-transparent dark:border-[#20364A] rounded-xl">
            <Bell className="w-5 h-5 text-slate-400 dark:text-[#B4C4D8]" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-[#B4C4D8]">No active alerts.</p>
        </div>
        <Link to="/family-alerts" className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#20D6A1] flex items-center gap-1.5 transition-colors">
          <span>Manage Alerts</span> <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200 dark:border-[#20364A] shadow-sm p-5 mb-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-[#F5B942]" />
          Recent Alerts
        </h4>
        <Link to="/family-alerts" className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#20D6A1] flex items-center gap-1.5 transition-colors">
          <span>View All</span> <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex gap-3 p-3 bg-amber-50 dark:bg-[#201F1A] border border-amber-100 dark:border-[#8B7028]/60 rounded-xl">
            {alert.type === 'CRITICAL' ? (
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-[#FF5368] shrink-0" />
            ) : alert.type === 'ATTENTION' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-[#F5B942] shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-500 dark:text-[#2684FF] shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-[#F1F5FB]">{alert.message}</p>
              <p className="text-xs text-slate-500 dark:text-[#8297B2] mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
