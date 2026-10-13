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
  accent: 'blue' | 'purple' | 'red' | 'teal';
  valueColor?: string;
  isLoading?: boolean;
}

const ACCENT_COLORS = {
  blue: { hex: '#2684FF', stroke: '#2684FF', darkIcon: 'text-[#2684FF]' },
  purple: { hex: '#8957FF', stroke: '#8957FF', darkIcon: 'text-[#8957FF]' },
  red: { hex: '#FF5368', stroke: '#FF5368', darkIcon: 'text-[#FF5368]' },
  teal: { hex: '#00D6B0', stroke: '#00D6B0', darkIcon: 'text-[#00D6B0]' },
};

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  iconBg, 
  accent,
  valueColor = "text-slate-900 dark:text-[#F1F5FB]", 
  isLoading 
}: SummaryCardProps) {
  const accentCfg = ACCENT_COLORS[accent];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] p-6 rounded-2xl border border-slate-100 dark:border-[#20364A] shadow-sm flex flex-col animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#102033] mb-4"></div>
        <div className="h-8 w-16 bg-slate-200 dark:bg-[#102033] rounded mb-2"></div>
        <div className="h-4 w-24 bg-slate-200 dark:bg-[#102033] rounded mb-3"></div>
        <div className="h-3 w-32 bg-slate-100 dark:bg-[#102033] rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] p-6 rounded-2xl border border-slate-100 dark:border-[#20364A] shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Top icon container */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-transparent dark:border-[#20364A] dark:bg-[#102033]", 
        iconBg
      )}>
        <Icon className={cn("w-5 h-5", iconColor, `dark:${accentCfg.darkIcon}`)} />
      </div>

      {/* Large Metric Value */}
      <h3 className={cn("text-2xl dark:text-3xl font-bold dark:font-extrabold mb-1 tracking-tight", valueColor)}>{value}</h3>
      
      {/* Title */}
      <p className="text-sm font-semibold text-slate-700 dark:text-[#F1F5FB]">{title}</p>
      
      {/* Supporting text */}
      <p className="text-xs text-slate-500 dark:text-[#7186A3] mt-2 relative z-10">{subtitle}</p>

      {/* Subtle organic ambient wave graphic matching dark reference screenshot (hidden in light mode) */}
      <svg 
        className="hidden dark:block absolute right-0 bottom-0 w-36 h-20 pointer-events-none opacity-45 overflow-hidden rounded-br-2xl" 
        viewBox="0 0 144 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`wave-grad-${accent}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentCfg.hex} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accentCfg.hex} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path 
          d="M0 55 C 40 30, 80 70, 144 20 L 144 80 L 0 80 Z" 
          fill={`url(#wave-grad-${accent})`} 
        />
        <path 
          d="M0 55 C 40 30, 80 70, 144 20" 
          stroke={accentCfg.stroke} 
          strokeWidth="1.5" 
          strokeOpacity="0.55" 
          fill="none" 
        />
      </svg>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading, error }: { summary?: any, isLoading?: boolean, error?: string }) {
  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#0D1B2A] p-6 rounded-2xl border border-red-100 dark:border-[#20364A] shadow-sm flex flex-col items-center justify-center text-center h-[180px]">
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
  let qualityColor = "text-slate-300 dark:text-[#7186A3]";
  let qualityIconColor = "text-slate-400";
  let qualityIconBg = "bg-slate-50";

  if (summary?.dataQuality && summary.dataQuality !== 'Insufficient information') {
    dataQuality = summary.dataQuality;
    dataQualitySub = "Reliable";
    qualityColor = "text-slate-900 dark:text-[#F1F5FB]";
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
        accent="blue"
      />
      <SummaryCard
        isLoading={isLoading}
        title="Parameters Tracked"
        value={paramsCount > 0 ? paramsCount : "—"}
        subtitle={paramsCount > 0 ? "Across all reports" : "Available after extraction"}
        valueColor={paramsCount > 0 ? "text-slate-900 dark:text-[#F1F5FB]" : "text-slate-300 dark:text-[#7186A3]"}
        icon={FlaskConical}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
        accent="purple"
      />
      <SummaryCard
        isLoading={isLoading}
        title="Active Alerts"
        value={alertsCount}
        subtitle={alertsCount > 0 ? "Needs attention" : "No immediate concerns"}
        valueColor={alertsCount > 0 ? "text-amber-600 dark:text-[#F5B942]" : "text-emerald-600 dark:text-[#F1F5FB]"}
        icon={AlertTriangle}
        iconColor={alertsCount > 0 ? "text-amber-600" : "text-emerald-600"}
        iconBg={alertsCount > 0 ? "bg-amber-50" : "bg-emerald-50"}
        accent="red"
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
        accent="teal"
      />
    </div>
  );
}
