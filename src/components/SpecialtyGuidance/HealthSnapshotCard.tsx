import React from 'react';
import { 
  FileCheck, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { HealthSnapshot } from '../../api/reports';
import { HealthSnapshotCardSkeleton } from '../common/Skeleton';

interface HealthSnapshotCardProps {
  snapshot: HealthSnapshot | null;
  loading: boolean;
  onViewDetails: () => void;
}

export const HealthSnapshotCard: React.FC<HealthSnapshotCardProps> = ({
  snapshot,
  loading,
  onViewDetails
}) => {
  if (loading) {
    return <HealthSnapshotCardSkeleton />;
  }

  const reportsCount = snapshot?.reportCount ?? 0;
  const measurementsCount = snapshot?.measurementCount ?? 0;
  const paramsCount = snapshot?.parametersAnalyzed ?? 0;
  const abnormalCount = snapshot?.abnormalResults ?? 0;
  const trendsCount = snapshot?.trendsToMonitor ?? 0;
  const specialtiesCount = snapshot?.specialtiesSuggested ?? 0;

  return (
    <div className="bg-white dark:bg-[#081729] rounded-2xl border border-[#DCE5EC] dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
      {/* Left section: Illustration + Info + Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
        {/* Soft Healthcare Badge Illustration */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EBF3FF] dark:bg-[#0B203E] flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-[#1B4582] shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-[#081E3B] flex items-center justify-center">
            <svg 
              className="w-7 h-7 text-[#2563EB] dark:text-[#2684FF]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          </div>
          {/* Subtle overlay shield badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 dark:bg-[#00D6B0] border-2 border-white dark:border-[#040D1A] flex items-center justify-center text-white dark:text-[#040D1A] shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />
          </div>
        </div>

        {/* Content & Metrics */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#071B49] dark:text-white tracking-tight leading-tight">
              Your Health Snapshot
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] mt-0.5 font-medium">
              Based on <span className="font-semibold text-slate-800 dark:text-white">{reportsCount} medical reports</span> and <span className="font-semibold text-slate-800 dark:text-white">{measurementsCount} validated measurements</span>
            </p>
          </div>

          {/* 4 Equal Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
            {/* Metric 1: Parameters Analysed */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#050E1A] border border-slate-100 dark:border-[#152A42]">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-[#0B203E] text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-white leading-none">
                  {paramsCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Parameters
                </p>
              </div>
            </div>

            {/* Metric 2: Abnormal Results */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#050E1A] border border-slate-100 dark:border-[#152A42]">
              <div className="w-8 h-8 rounded-lg bg-rose-100/70 dark:bg-[#2D1017] text-rose-600 dark:text-[#FF4D6D] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-white leading-none">
                  {abnormalCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Abnormal
                </p>
              </div>
            </div>

            {/* Metric 3: Trends to Monitor */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#050E1A] border border-slate-100 dark:border-[#152A42]">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-[#281B09] text-amber-600 dark:text-[#F5A623] flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-white leading-none">
                  {trendsCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Tracked
                </p>
              </div>
            </div>

            {/* Metric 4: Specialties Suggested */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#050E1A] border border-slate-100 dark:border-[#152A42]">
              <div className="w-8 h-8 rounded-lg bg-purple-100/70 dark:bg-[#22123B] text-purple-600 dark:text-[#A855F7] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-white leading-none">
                  {specialtiesCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Specialties
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right status block */}
      <div className="lg:w-72 shrink-0 bg-[#ECFDF5] dark:bg-[#050E1A] border border-emerald-200/60 dark:border-[#00D6B0]/40 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 dark:bg-[#042724] text-white dark:text-[#00D6B0] border border-transparent dark:border-[#00D6B0]/40 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-white leading-tight">
              {snapshot?.status || 'Analysis up to date'}
            </h3>
            <p className="text-[11px] text-emerald-700/90 dark:text-[#8297B2] leading-normal mt-1">
              Your recommendations are based on your latest medical data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#00A884] dark:text-[#00D6B0] hover:text-emerald-800 dark:hover:text-[#20D6A1] transition-colors self-start focus:outline-hidden"
        >
          <span>View Analysis Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
