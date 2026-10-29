import React from 'react';
import { Skeleton, MetricCardGridSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for FutureOutlook.tsx.
 * Replicates forecasting engine header, disclaimer, 4 KPI cards, filter pills, and projection table.
 */
export function FutureOutlookSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div id="future-outlook-skeleton" className="space-y-6 pb-12 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading future health projections">
      {/* 1. Header with Forecasting Controls */}
      <div className="flex justify-between items-start md:items-center flex-wrap gap-4 border-b border-slate-200/90 dark:border-[#20364A] pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 sm:w-64" />
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
        </div>
        <Skeleton className="h-10 w-48 rounded-xl shrink-0" />
      </div>

      {/* 2. Clinical Disclaimer Banner */}
      <div className="bg-amber-50/70 dark:bg-[#201F1A] border border-amber-200/80 dark:border-[#8B7028] rounded-2xl p-4 sm:p-5 flex gap-3">
        <Skeleton className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-3.5 w-full max-w-3xl" />
        </div>
      </div>

      {/* 3. 4 KPI Summary Cards */}
      <MetricCardGridSkeleton count={4} />

      {/* 4. Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="h-8 w-32 rounded-lg shrink-0" />
        <Skeleton className="h-8 w-36 rounded-lg shrink-0" />
        <Skeleton className="h-8 w-28 rounded-lg shrink-0" />
        <Skeleton className="h-8 w-40 rounded-lg shrink-0" />
      </div>

      {/* 5. Main Forecasting Table */}
      <div className="bg-white dark:bg-[#07111D] shadow-xs border border-slate-200/90 dark:border-[#20364A] rounded-2xl overflow-hidden">
        {/* Table Head */}
        <div className="bg-slate-50 dark:bg-[#112236] px-6 py-4 border-b border-slate-200/90 dark:border-[#20364A] flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-[#20364A]">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-48">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default FutureOutlookSkeleton;
