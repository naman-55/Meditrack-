import React, { useState } from 'react';
import { BarChart2, Database, Calendar, TrendingUp, HelpCircle } from 'lucide-react';

export interface SummaryStatsData {
  metricsTrackedCount: number;
  measurementsPerMetric: number | string;
  totalMeasurementsCount: number;
  analysisPeriodText: string;
  stableMetricsPercentage: number;
  stableMetricsCount: number;
}

interface TrendsSummaryStatsProps {
  stats: SummaryStatsData;
  isLoading?: boolean;
}

export default function TrendsSummaryStats({ stats, isLoading = false }: TrendsSummaryStatsProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 animate-pulse"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: METRICS TRACKED */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
        <div 
          className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#635BFF] flex items-center justify-center shrink-0 shadow-2xs"
          aria-hidden="true"
        >
          <BarChart2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
            {stats.metricsTrackedCount}
          </p>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-none whitespace-nowrap">
            Metrics Tracked
          </p>
        </div>
      </div>

      {/* CARD 2: MEASUREMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
        <div 
          className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs"
          aria-hidden="true"
        >
          <Database className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
            {stats.measurementsPerMetric}
          </p>
          <p 
            className="text-xs sm:text-sm text-[#64748B] font-medium leading-none whitespace-nowrap"
            title={`${stats.totalMeasurementsCount} total observations analyzed`}
          >
            Measurements Each
          </p>
        </div>
      </div>

      {/* CARD 3: ANALYSIS PERIOD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
        <div 
          className="w-12 h-12 rounded-xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs"
          aria-hidden="true"
        >
          <Calendar className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p 
            className="text-xs sm:text-sm font-bold text-[#101B3D] tracking-tight leading-snug mb-1 whitespace-nowrap" 
            title={stats.analysisPeriodText}
          >
            {stats.analysisPeriodText}
          </p>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-none whitespace-nowrap">
            Analysis Period
          </p>
        </div>
      </div>

      {/* CARD 4: OVERALL TREND SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0 relative">
        <div 
          className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs"
          aria-hidden="true"
        >
          <TrendingUp className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
            {stats.stableMetricsPercentage}%
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm text-[#64748B] font-medium leading-none whitespace-nowrap">
              Metrics Stable
            </span>
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                aria-label="Information about stability calculation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute right-0 bottom-full mb-2 z-30 w-56 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 animate-in fade-in">
                  <p className="font-semibold text-emerald-400 mb-1">
                    {stats.stableMetricsCount} of {stats.metricsTrackedCount} Metrics Stable
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Percentage of active biomarkers whose values changed by less than 1% across the analyzed observations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
