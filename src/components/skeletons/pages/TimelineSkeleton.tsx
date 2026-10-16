import React from 'react';
import { Skeleton, MetricCardGridSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Timeline.tsx.
 * Replicates the timeline header, 4 stats cards, and chronological vertical timeline entries.
 */
export function TimelineSkeleton() {
  return (
    <div id="timeline-skeleton" className="space-y-6 pb-12 max-w-7xl mx-auto animate-in fade-in duration-150" aria-busy="true" aria-label="Loading health timeline">
      {/* 1. Header Bar with Dropdown & Export Controls */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 sm:w-80" />
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Summary Statistics Cards */}
      <MetricCardGridSkeleton count={4} />

      {/* 3. Main Timeline Panel */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-xs p-5 sm:p-7 space-y-6">
        {/* Panel Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#152A42]">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3.5 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0B1B30] px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-[#152A42]">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Vertical Timeline Items */}
        <div className="space-y-4 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-stretch gap-3 sm:gap-4">
              {/* Date Column */}
              <div className="shrink-0 w-20 sm:w-24 bg-slate-50 dark:bg-[#0B1B30] border border-slate-200/80 dark:border-[#152A42] rounded-2xl p-3 flex flex-col items-center justify-center space-y-2">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-2.5 w-8" />
              </div>

              {/* Observation Detail Card */}
              <div className="flex-1 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#152A42] bg-white dark:bg-[#081729] space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40 sm:w-52" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full hidden sm:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default TimelineSkeleton;
