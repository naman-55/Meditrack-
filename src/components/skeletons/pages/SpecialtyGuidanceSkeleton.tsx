import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for SpecialtyGuidance.tsx.
 * Replicates the health snapshot summary card, specialty guidance cards, and right-side AI chat panel.
 */
export function SpecialtyGuidanceSkeleton() {
  return (
    <div id="specialty-guidance-skeleton" className="space-y-6 pb-12 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading specialty guidance and AI assistant">
      {/* 1. Header Bar */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 sm:w-80" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      {/* 2. Health Snapshot Summary Card */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
          <div className="space-y-3 flex-1 min-w-0">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        </div>
        <Skeleton className="w-full lg:w-48 h-20 rounded-xl shrink-0" />
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 dark:border-[#152A42] pb-2">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>

      {/* 4. Split 2-Column Layout: Left Specialty Cards + Right AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Specialty Cards List (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* Suggested Diagnostic Tests Pills */}
              <div className="p-3 bg-slate-50 dark:bg-[#0B1B30] rounded-xl space-y-2 border border-slate-100 dark:border-[#152A42]">
                <Skeleton className="h-3 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#152A42]">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: AI Medical Assistant Panel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-xs flex flex-col h-[580px] p-4 sm:p-5 justify-between">
          {/* AI Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152A42]">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="w-6 h-6 rounded" />
          </div>

          {/* AI Assistant Chat Body */}
          <div className="space-y-3 py-4 flex-1">
            <div className="flex items-start gap-2">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B1B30] border border-slate-100 dark:border-[#152A42] space-y-2 w-4/5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
            <div className="flex items-start justify-end gap-2 pt-2">
              <div className="p-3 rounded-2xl bg-slate-200 dark:bg-[#152A42] space-y-1.5 w-3/5">
                <Skeleton className="h-3 w-full bg-slate-300 dark:bg-[#20364B]" />
              </div>
            </div>
            {/* Suggested Question Buttons */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          </div>

          {/* AI Input Area */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default SpecialtyGuidanceSkeleton;
