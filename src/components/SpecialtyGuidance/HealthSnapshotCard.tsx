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

  const reportsCount = snapshot?.reportCount ?? 0;
  const measurementsCount = snapshot?.measurementCount ?? 0;
  const paramsCount = snapshot?.parametersAnalyzed ?? 0;
  const abnormalCount = snapshot?.abnormalResults ?? 0;
  const trendsCount = snapshot?.trendsToMonitor ?? 0;
  const specialtiesCount = snapshot?.specialtiesSuggested ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
      {/* Left section: Illustration + Info + Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
        {/* Soft Pastel Healthcare Badge Illustration */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EBF3FF] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <svg 
              className="w-7 h-7 text-[#2563EB]" 
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
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />
          </div>
        </div>

        {/* Content & Metrics */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#071B49] tracking-tight leading-tight">
              Your Health Snapshot
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-medium">
              Based on <span className="font-semibold text-slate-800">{reportsCount} medical reports</span> and <span className="font-semibold text-slate-800">{measurementsCount} validated measurements</span>
            </p>
          </div>

          {/* 4 Equal Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
            {/* Metric 1: Parameters Analysed */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-[#2563EB] flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] leading-none">
                  {paramsCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-tight mt-0.5 truncate">
                  Parameters Analysed
                </p>
              </div>
            </div>

            {/* Metric 2: Abnormal Results */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] leading-none">
                  {abnormalCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-tight mt-0.5 truncate">
                  Abnormal Results
                </p>
              </div>
            </div>

            {/* Metric 3: Trends to Monitor */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] leading-none">
                  {trendsCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-tight mt-0.5 truncate">
                  Trends to Monitor
                </p>
              </div>
            </div>

            {/* Metric 4: Specialties Suggested */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-[#071B49] leading-none">
                  {specialtiesCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-tight mt-0.5 truncate">
                  Specialties Suggested
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right status block */}
      <div className="lg:w-72 shrink-0 bg-[#ECFDF5] border border-emerald-200/60 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-900 leading-tight">
              {snapshot?.status || 'Analysis up to date'}
            </h3>
            <p className="text-[11px] text-emerald-700/90 leading-normal mt-1">
              Your recommendations are based on your latest medical data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#00A884] hover:text-emerald-800 transition-colors self-start focus:outline-hidden"
        >
          <span>View Analysis Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
