import React from 'react';
import { FileText, FlaskConical, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MetricCardGridSkeleton } from '../common/Skeleton';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accent?: 'blue' | 'purple' | 'red' | 'teal';
  valueColor?: string;
  waveColor?: string;
}

function SummaryCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, valueColor = "text-slate-900 dark:text-[#F1F5FB]", waveColor = "#2684FF" }: SummaryCardProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0D1B2A] p-6 rounded-2xl border border-slate-100 dark:border-[#20364A] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
      {/* Subtle organic background wave matching reference screenshot in dark mode */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-0 dark:opacity-20 transition-opacity">
        <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
          <path 
            d="M0 60 C50 20, 100 80, 180 20 L180 90 L0 90 Z" 
            fill={waveColor} 
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <h3 className={cn("text-3xl font-extrabold mb-1 tracking-tight", valueColor)}>{value}</h3>
        <p className="text-sm font-semibold text-slate-700 dark:text-[#B4C4D8]">{title}</p>
        <p className="text-xs text-slate-500 dark:text-[#8297B2] mt-1.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading, error }: { summary?: any, isLoading?: boolean, error?: string }) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <MetricCardGridSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#0D1B2A] p-6 rounded-2xl border border-red-100 dark:border-rose-900/40 shadow-sm flex flex-col items-center justify-center text-center h-[180px]">
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
  let qualityColor = "text-slate-300 dark:text-[#8297B2]";
  let qualityIconColor = "text-slate-400 dark:text-[#8297B2]";
  let qualityIconBg = "bg-slate-50 dark:bg-[#102033]";

  if (summary?.dataQuality && summary.dataQuality !== 'Insufficient information') {
    dataQuality = summary.dataQuality;
    dataQualitySub = "Reliable";
    qualityColor = "text-slate-900 dark:text-[#F1F5FB]";
    qualityIconColor = "text-emerald-600 dark:text-[#00D6B0]";
    qualityIconBg = "bg-emerald-50 dark:bg-[#062E2D]";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      <SummaryCard
        title="Reports Uploaded"
        value={reportsCount}
        subtitle={reportsCount > 0 ? "Processed documents" : "No reports processed yet"}
        icon={FileText}
        iconColor="text-blue-600 dark:text-[#2684FF]"
        iconBg="bg-blue-50 dark:bg-[#0B2254]/60"
        waveColor="#2684FF"
      />
      <SummaryCard
        title="Parameters Tracked"
        value={paramsCount > 0 ? paramsCount : "—"}
        subtitle={paramsCount > 0 ? "Across all reports" : "Available after extraction"}
        valueColor={paramsCount > 0 ? "text-slate-900 dark:text-[#F1F5FB]" : "text-slate-300 dark:text-[#8297B2]"}
        icon={FlaskConical}
        iconColor="text-indigo-600 dark:text-[#c084fc]"
        iconBg="bg-indigo-50 dark:bg-[#2e1065]/50"
        waveColor="#a855f7"
      />
      <SummaryCard
        title="Active Alerts"
        value={alertsCount}
        subtitle={alertsCount > 0 ? "Needs attention" : "No immediate concerns"}
        valueColor={alertsCount > 0 ? "text-amber-600 dark:text-[#F5B942]" : "text-slate-900 dark:text-[#F1F5FB]"}
        icon={AlertTriangle}
        iconColor={alertsCount > 0 ? "text-amber-600 dark:text-[#F5B942]" : "text-rose-500 dark:text-[#FF5368]"}
        iconBg={alertsCount > 0 ? "bg-amber-50 dark:bg-[#201F1A]" : "bg-rose-50 dark:bg-[#2A0E14]"}
        waveColor="#FF5368"
      />
      <SummaryCard
        title="Overall Data Quality"
        value={dataQuality}
        subtitle={dataQualitySub}
        valueColor={qualityColor}
        icon={ShieldCheck}
        iconColor={qualityIconColor}
        iconBg={qualityIconBg}
        waveColor="#00D6B0"
      />
    </div>
  );
}
