import React from 'react';
import { Skeleton, TableSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Settings.tsx.
 * Replicates settings navigation tabs, appearance themes grid, unit selectors, and active sessions.
 */
export function SettingsSkeleton() {
  return (
    <div id="settings-skeleton" className="max-w-5xl mx-auto space-y-6 pb-20 px-3 sm:px-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading settings and preferences">
      {/* 1. Page Header */}
      <div className="space-y-1.5 pt-2">
        <Skeleton className="h-7 w-52 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      {/* 2. Settings Category Tab Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/90 dark:border-[#152A42]">
        <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>

      {/* 3. Appearance & Theme Section */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#152A42]">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>

        {/* 3 Theme Mode Cards (Light, Dark, System) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-[#152A42] space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="w-4 h-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Clinical Measurement Units Section */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#152A42]">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-[#152A42] space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Security & Active Login Sessions Table */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#152A42]">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-60" />
          </div>
        </div>

        <TableSkeleton rows={3} cols={4} />
      </div>
    </div>
  );
}
export default SettingsSkeleton;
