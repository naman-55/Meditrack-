import React from 'react';
import { FileText, FlaskConical, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
  isLoading?: boolean;
}

function SummaryCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, valueColor = "text-slate-900", isLoading }: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-slate-100 mb-4"></div>
        <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="h-3 w-32 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <h3 className={cn("text-2xl font-bold mb-1", valueColor)}>{value}</h3>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading, error }: { summary?: any, isLoading?: boolean, error?: string }) {
  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center h-[180px]">
            <p className="text-xs text-red-400">Failed to load</p>
          </div>
        ))}
      </div>
    );
  }

  const reportsCount = summary?.reportsUploaded || 0;
  const paramsCount = summary?.parametersTracked || 0;
  const alertsCount = summary?.activeAlerts || 0;
  
  let dataQuality = "—";
  let dataQualitySub = "Validation required";
  let qualityColor = "text-slate-300";
  let qualityIconColor = "text-slate-400";
  let qualityIconBg = "bg-slate-50";

  if (summary?.dataQuality && summary.dataQuality !== 'Insufficient information') {
    dataQuality = summary.dataQuality;
    dataQualitySub = "Reliable";
    qualityColor = "text-slate-900";
    qualityIconColor = "text-emerald-600";
    qualityIconBg = "bg-emerald-50";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      <SummaryCard
        isLoading={isLoading}
        title="Reports Uploaded"
        value={reportsCount}
        subtitle={reportsCount > 0 ? "Processed documents" : "No reports processed yet"}
        icon={FileText}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <SummaryCard
        isLoading={isLoading}
        title="Parameters Tracked"
        value={paramsCount > 0 ? paramsCount : "—"}
        subtitle={paramsCount > 0 ? "Across all reports" : "Available after extraction"}
        valueColor={paramsCount > 0 ? "text-slate-900" : "text-slate-300"}
        icon={FlaskConical}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
      />
      <SummaryCard
        isLoading={isLoading}
        title="Active Alerts"
        value={alertsCount}
        subtitle={alertsCount > 0 ? "Needs attention" : "No immediate concerns"}
        valueColor={alertsCount > 0 ? "text-amber-600" : "text-emerald-600"}
        icon={AlertTriangle}
        iconColor={alertsCount > 0 ? "text-amber-600" : "text-emerald-600"}
        iconBg={alertsCount > 0 ? "bg-amber-50" : "bg-emerald-50"}
      />
      <SummaryCard
        isLoading={isLoading}
        title="Overall Data Quality"
        value={dataQuality}
        subtitle={dataQualitySub}
        valueColor={qualityColor}
        icon={ShieldCheck}
        iconColor={qualityIconColor}
        iconBg={qualityIconBg}
      />
    </div>
  );
}
