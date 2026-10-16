import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for RiskAssessment.tsx.
 * Replicates the rules engine header, clinical disclaimer, and 2x2 domain risk cards grid.
 */
export function RiskAssessmentSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div id="risk-assessment-skeleton" className="space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading clinical risk assessment">
      {/* 1. Header Bar with Rules Engine Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-60 sm:w-72" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl shrink-0" />
      </div>

      {/* 2. Clinical Rules Engine Notice Banner */}
      <div className="bg-slate-50 dark:bg-[#0B1B30] border border-slate-200/80 dark:border-[#152A42] p-4 rounded-xl flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      {/* 3. 2x2 Clinical Domain Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#081729] rounded-2xl shadow-xs border border-slate-200/90 dark:border-[#152A42] p-6 flex flex-col justify-between space-y-5"
          >
            {/* Domain Header & Severity Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Explanation & Action Notice */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>

            {/* Missing Observations Chip */}
            <div className="p-3 bg-slate-50 dark:bg-[#0B1B30] border border-slate-200/80 dark:border-[#152A42] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-28 rounded-md" />
              </div>
            </div>

            {/* Bottom Toggle Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-[#152A42] flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default RiskAssessmentSkeleton;
