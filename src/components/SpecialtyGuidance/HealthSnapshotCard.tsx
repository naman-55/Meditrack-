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
    return (
      <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-xs animate-pulse flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full lg:w-2/3">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-100 rounded-md w-48" />
            <div className="h-4 bg-slate-100 rounded-md w-72" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-72 h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const reportsCount = snapshot?.reportCount;
  const measurementsCount = snapshot?.measurementCount;
  const paramsCount = snapshot?.parametersAnalyzed;
  const abnormalCount = snapshot?.abnormalResults;
  const trendsCount = snapshot?.trendsToMonitor;
  const specialtiesCount = snapshot?.specialtiesSuggested;
  const status = snapshot?.status || 'Analysis unavailable';
  const isCurrent = status === 'Analysis up to date';
  const needsRefresh = status === 'Analysis needs refresh';
  const statusClasses = isCurrent
    ? 'bg-[#ECFDF5] border-emerald-200/60 text-emerald-900 dark:bg-[#081421] dark:border-[#20364A] dark:text-[#F1F5FB]'
    : needsRefresh
      ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-[#081421] dark:border-[#80652A] dark:text-[#F1F5FB]'
      : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#081421] dark:border-[#20364A] dark:text-[#F1F5FB]';

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
      {/* Left section: Illustration + Info + Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
        {/* Healthcare Badge Illustration */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EBF3FF] dark:bg-[#0B2545]/60 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-[#20364A] shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-[#2684FF]/20 flex items-center justify-center">
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
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 dark:bg-[#00D6B0] border-2 border-white dark:border-[#0D1B2A] flex items-center justify-center text-white dark:text-[#050D18] shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />
          </div>
        </div>

        {/* Content & Metrics */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#071B49] dark:text-[#F1F5FB] tracking-tight leading-tight">
              Your Health Snapshot
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] mt-0.5 font-medium">
              {snapshot ? (
                <>Based on <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">{reportsCount} medical reports</span> and <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">{measurementsCount} validated measurements</span></>
              ) : 'Analysis summary is unavailable.'}
            </p>
          </div>

          {/* 4 Equal Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
            {/* Metric 1: Parameters Analysed */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-100 dark:border-[#20364A]">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-[#0B2545]/80 text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-[#F1F5FB] leading-none">
                  {paramsCount ?? '—'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Parameters
                </p>
              </div>
            </div>

            {/* Metric 2: Abnormal Results */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-100 dark:border-[#20364A]">
              <div className="w-8 h-8 rounded-lg bg-rose-100/70 dark:bg-[#321B27] text-rose-600 dark:text-[#FF5368] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-[#F1F5FB] leading-none">
                  {abnormalCount ?? '—'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Abnormal
                </p>
              </div>
            </div>

            {/* Metric 3: Trends to Monitor */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-100 dark:border-[#20364A]">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-[#302719] text-amber-600 dark:text-[#F5B942] flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-[#F1F5FB] leading-none">
                  {trendsCount ?? '—'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-tight mt-0.5 truncate">
                  Tracked
                </p>
              </div>
            </div>

            {/* Metric 4: Specialties Suggested */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-100 dark:border-[#20364A]">
              <div className="w-8 h-8 rounded-lg bg-purple-100/70 dark:bg-[#2D1B4E] text-purple-600 dark:text-[#8957FF] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] dark:text-[#F1F5FB] leading-none">
                  {specialtiesCount ?? '—'}
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
      <div className={`lg:w-72 shrink-0 border rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-2xs ${statusClasses}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
            isCurrent
              ? 'bg-emerald-500 dark:bg-[#062E2D] text-white dark:text-[#00D6B0] dark:border dark:border-[#075E56]'
              : needsRefresh
              ? 'bg-amber-500 dark:bg-[#302719] text-white dark:text-[#F5B942] dark:border dark:border-[#80652A]'
              : 'bg-slate-400 dark:bg-[#1A2635] text-white dark:text-[#8297B2]'
          }`}>
            {isCurrent ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            ) : needsRefresh ? (
              <Clock className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#071B49] dark:text-[#F1F5FB] leading-tight">
              {status}
            </h3>
            <p className="text-[11px] leading-relaxed mt-1 text-[#64748B] dark:text-[#8297B2]">
              {isCurrent
                ? 'Your recommendations are based on the analysis available for your medical data.'
                : needsRefresh
                  ? 'Refresh analysis to review recommendations for your available medical data.'
                  : status === 'No medical data'
                    ? 'Upload a medical report to create your health snapshot.'
                    : 'Snapshot details are currently unavailable.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#00A884] dark:text-[#00D6B0] hover:text-emerald-800 dark:hover:text-[#20D6A1] transition-colors self-start focus:outline-hidden cursor-pointer"
        >
          <span>View Analysis Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
