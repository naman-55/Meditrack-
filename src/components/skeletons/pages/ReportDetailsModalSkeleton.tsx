import React from 'react';
import { Skeleton, TableSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Skeleton layout for Report Details & Laboratory Result modal views.
 */
export function ReportDetailsModalSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150" aria-busy="true" aria-label="Loading report details">
      {/* 1. Modal Top Banner & Patient Metadata */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl shadow-md border border-slate-200/90 dark:border-[#152A42] overflow-hidden">
        <div className="bg-slate-900 dark:bg-[#050D18] px-6 sm:px-8 py-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56 bg-slate-700 dark:bg-[#152A42]" />
            <Skeleton className="h-3.5 w-40 bg-slate-800 dark:bg-[#0B1B30]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg bg-slate-800 dark:bg-[#0B1B30]" />
            <Skeleton className="h-8 w-24 rounded-lg bg-slate-800 dark:bg-[#0B1B30]" />
          </div>
        </div>

        {/* Patient & Clinic Details Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100 dark:border-[#152A42]">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Biomarkers Table */}
        <div className="p-6">
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    </div>
  );
}
export default ReportDetailsModalSkeleton;
