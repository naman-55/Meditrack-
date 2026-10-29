import React from 'react';
import { Skeleton, MetricCardGridSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Trends.tsx.
 * Replicates TrendsHeader presets, summary stats cards, and 5-card longitudinal metric grid.
 */
export function TrendsSkeleton() {
  return (
    <div id="trends-skeleton" className="space-y-6 pb-12 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading biomarker trends">
      {/* 1. Trends Header & Preset Controls */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-60 sm:w-80" />
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Summary Statistics Cards */}
      <MetricCardGridSkeleton count={4} />

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#081729] p-3.5 rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-2xs flex justify-between items-center">
        <Skeleton className="h-9 w-full sm:w-80 rounded-xl" />
        <Skeleton className="h-4 w-36 hidden sm:block" />
      </div>

      {/* 4. Main Metrics 5-Card Grid (3 top, 2 bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-[18px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/80 dark:border-[#152A42] p-6 shadow-xs h-80 flex flex-col justify-between ${
              i <= 2 ? 'lg:col-span-2' : 'lg:col-span-3'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Sparkline Chart Area */}
            <div className="h-28 rounded-xl bg-slate-50 dark:bg-[#0B1B30] p-3 flex items-end justify-between gap-2 border border-slate-100 dark:border-[#152A42]">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-24 w-full rounded" />
              <Skeleton className="h-18 w-full rounded" />
              <Skeleton className="h-22 w-full rounded" />
            </div>

            {/* Bottom Metrics Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default TrendsSkeleton;
