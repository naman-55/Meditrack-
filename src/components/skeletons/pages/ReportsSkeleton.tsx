import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Reports.tsx.
 * Replicates the report list header, actions, and document card rows.
 */
export function ReportsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div id="reports-skeleton" className="space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading medical reports">
      {/* 1. Header Bar with Upload Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-60" />
          <Skeleton className="h-4 w-64 sm:w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
      </div>

      {/* 2. Main Reports List Card */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl shadow-xs border border-slate-200/90 dark:border-[#152A42] overflow-hidden">
        {/* Counter & Action Header */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#0B1B30] border-b border-slate-200/90 dark:border-[#152A42] flex justify-between items-center">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Report Items List */}
        <div className="divide-y divide-slate-100 dark:divide-[#152A42]">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-4 sm:p-6 flex items-start justify-between sm:items-center gap-4">
              <div className="flex items-center min-w-0 gap-4 flex-1">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-44 sm:w-64" />
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-col sm:flex-row">
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="w-9 h-9 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ReportsSkeleton;
