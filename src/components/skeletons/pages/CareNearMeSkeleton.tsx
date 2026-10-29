import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for CareNearMe.tsx.
 * Replicates the filters bar, facility cards, and interactive map placeholder.
 */
export function CareNearMeSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div id="care-near-me-skeleton" className="space-y-6 pb-12 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading nearby care facilities">
      {/* 1. Header & Location Search Filter Bar */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 sm:w-60" />
            <Skeleton className="h-4 w-64 sm:w-80" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* 2. Results Counter Skeleton */}
      <div className="flex justify-between items-center px-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* 3. 2-Column Main Section: Provider Cards on Left, Map Container on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Doctor/Hospital Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#152A42]">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-xl" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Map Skeleton Container (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-xs h-[460px] lg:h-[560px] p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex-1 bg-slate-100 dark:bg-[#0B1B30] rounded-xl my-2 flex items-center justify-center">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
          <div className="pt-2 flex justify-between items-center">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default CareNearMeSkeleton;
