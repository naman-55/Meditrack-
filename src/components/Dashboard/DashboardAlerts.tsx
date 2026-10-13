import React from 'react';
import { AlertTriangle, Bell, Info, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Alert {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export default function DashboardAlerts({ alerts, isLoading, error }: { alerts?: Alert[], isLoading?: boolean, error?: string }) {
  if (error) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-red-100 dark:border-[#FF5368]/30 shadow-sm p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 dark:bg-[#FF5368]/15 rounded-xl border border-transparent dark:border-[#FF5368]/30">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-[#FF5368]" />
          </div>
          <p className="text-sm font-medium text-red-600 dark:text-[#FF5368]">Failed to load alerts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm p-5 mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-[#102033] rounded"></div>
          <div className="h-4 w-20 bg-slate-200 dark:bg-[#102033] rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-slate-50 dark:bg-[#102033] border border-slate-100 dark:border-[#20364A] rounded-xl">
            <div className="w-5 h-5 bg-slate-200 dark:bg-[#14283B] rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-[#14283B] rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-slate-200 dark:bg-[#14283B] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm p-4 sm:p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-[#102033] border border-transparent dark:border-[#20364A] rounded-xl text-slate-400 dark:text-[#A6B8CF]">
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-[#A6B8CF]">No active alerts.</p>
        </div>
        <Link to="/family-alerts" className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-[#00D6B0] hover:underline flex items-center gap-1.5 transition-colors">
          <span>Manage Alerts</span> <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-[#F5B942]" />
          Recent Alerts
        </h4>
        <Link to="/family-alerts" className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex gap-3 p-3 bg-amber-50 dark:bg-[#102033] border border-amber-100 dark:border-[#20364A] rounded-xl">
            {alert.type === 'CRITICAL' ? (
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-[#FF5368] shrink-0" />
            ) : alert.type === 'ATTENTION' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-[#F5B942] shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-500 dark:text-[#4BA3FF] shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-[#F1F5FB]">{alert.message}</p>
              <p className="text-xs text-slate-500 dark:text-[#7186A3] mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
