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
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm font-medium text-red-500">Failed to load alerts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="w-5 h-5 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">No active alerts.</p>
        </div>
        <Link to="/family-alerts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          Manage Alerts <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Recent Alerts
        </h4>
        <Link to="/family-alerts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            {alert.type === 'CRITICAL' ? (
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            ) : alert.type === 'ATTENTION' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800">{alert.message}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
