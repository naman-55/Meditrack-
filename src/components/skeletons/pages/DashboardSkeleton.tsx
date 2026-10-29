import React from 'react';
import { 
  Skeleton, 
  MetricCardGridSkeleton, 
  ChartSkeleton 
} from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for the Dashboard.
 * Accurately replicates Dashboard.tsx structure, widgets, and responsive breakpoints.
 */
export function DashboardSkeleton() {
  return (
    <div id="dashboard-skeleton" className="space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading health dashboard">
      {/* 1. Header & Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 sm:w-72" />
          <Skeleton className="h-4 w-40 sm:w-52" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
      </div>

      {/* 2. Top Summary KPI Cards (4-column row) */}
      <MetricCardGridSkeleton count={4} />

      {/* 3. Clinical Alerts Section */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-[#1F3A55] bg-slate-50/60 dark:bg-[#0B1B30]">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      </div>

      {/* 4. Main Metric Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[320px]">
        {/* Left: Primary Metric Trend Chart with Parameter Selector */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-[340px]">
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-[#152A42]">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
          <div className="flex items-end justify-between gap-3 h-40 px-2 pt-4">
            <Skeleton className="h-20 w-full rounded-t-lg" />
            <Skeleton className="h-32 w-full rounded-t-lg" />
            <Skeleton className="h-24 w-full rounded-t-lg" />
            <Skeleton className="h-36 w-full rounded-t-lg" />
            <Skeleton className="h-28 w-full rounded-t-lg" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Right: Key Health Vitals Card with Tabs */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-[340px]">
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-[#152A42]">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-[#0B1B30] p-1 rounded-xl">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-40 px-2 pt-4">
            <Skeleton className="h-24 w-full rounded-t-lg" />
            <Skeleton className="h-20 w-full rounded-t-lg" />
            <Skeleton className="h-32 w-full rounded-t-lg" />
            <Skeleton className="h-28 w-full rounded-t-lg" />
            <Skeleton className="h-36 w-full rounded-t-lg" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* 5. Bottom 4-Quadrant Clinical Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1: Health Risk Overview */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-[#152A42] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 2: Recent Reports */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-[#152A42] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 3: Latest Extracted Metrics */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-[#152A42]">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 4: Recommended Specialist */}
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
          <div className="pt-2">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardSkeleton;
