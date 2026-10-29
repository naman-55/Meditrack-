import React from 'react';
import { cn } from '../../utils/cn';

// Export shared low-level skeleton primitives
export {
  Skeleton,
  CardSkeleton,
  MetricCardSkeleton,
  MetricCardGridSkeleton,
  TableSkeleton,
  ChartSkeleton,
  BadgeSkeleton,
  AvatarSkeleton,
  ButtonSkeleton
} from '../skeletons/shared/SkeletonPrimitives';
export type { SkeletonProps } from '../skeletons/shared/SkeletonPrimitives';

import { Skeleton, ChartSkeleton } from '../skeletons/shared/SkeletonPrimitives';

// Export dedicated page-specific skeleton layouts
export { DashboardSkeleton } from '../skeletons/pages/DashboardSkeleton';
export { ReportsSkeleton } from '../skeletons/pages/ReportsSkeleton';
export { ReportDetailsModalSkeleton } from '../skeletons/pages/ReportDetailsModalSkeleton';
export { TimelineSkeleton } from '../skeletons/pages/TimelineSkeleton';
export { TrendsSkeleton } from '../skeletons/pages/TrendsSkeleton';
export { RiskAssessmentSkeleton } from '../skeletons/pages/RiskAssessmentSkeleton';
export { FutureOutlookSkeleton } from '../skeletons/pages/FutureOutlookSkeleton';
export { SpecialtyGuidanceSkeleton } from '../skeletons/pages/SpecialtyGuidanceSkeleton';
export { CareNearMeSkeleton } from '../skeletons/pages/CareNearMeSkeleton';
export { FamilyAlertsSkeleton } from '../skeletons/pages/FamilyAlertsSkeleton';
export { ProfileSkeleton } from '../skeletons/pages/ProfileSkeleton';
export { SettingsSkeleton } from '../skeletons/pages/SettingsSkeleton';
export { AdminTableSkeleton } from '../skeletons/pages/AdminTableSkeleton';
export { AuthSkeleton } from '../skeletons/pages/AuthSkeleton';

/**
 * Dashboard Alerts Skeleton matching DashboardAlerts widget.
 */
export function DashboardAlertsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] shadow-xs p-5 mb-6 space-y-3", className)} aria-hidden="true">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-[#1F3A55] bg-slate-50/60 dark:bg-[#0B1B30]">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      </div>
    </div>
  );
}

/**
 * Risk Assessment Card Skeleton matching the 4 clinical domains.
 */
export function RiskCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#081729] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#152A42] p-6 flex flex-col justify-between min-h-[260px] space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#152A42]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Report List Item Skeleton for Reports.tsx list view.
 */
export function ReportListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-[#081729] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#152A42] overflow-hidden divide-y divide-slate-100 dark:divide-[#152A42]" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-6 flex items-start justify-between sm:items-center gap-4">
          <div className="flex items-center min-w-0 gap-4 flex-1">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48 sm:w-64" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Report Details Modal Skeleton for previewing extracted lab documents.
 */
export function ReportDetailsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto" aria-hidden="true">
      <div className="bg-white dark:bg-[#081729] rounded-2xl shadow-md border border-slate-200/90 dark:border-[#152A42] overflow-hidden">
        <div className="bg-slate-900 dark:bg-[#050D18] px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-52 bg-slate-700 dark:bg-[#152A42]" />
            <Skeleton className="h-3.5 w-36 bg-slate-800 dark:bg-[#0B1B30]" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg bg-slate-800 dark:bg-[#0B1B30]" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Specialty Guidance Card Skeleton.
 */
export function SpecialtyCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#081729] rounded-2xl border border-[#DCE5EC] dark:border-[#152A42] p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#0B1B30] rounded-xl space-y-2 border border-slate-100 dark:border-[#1F3A55]">
            <Skeleton className="h-3 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Health Snapshot Card Skeleton.
 */
export function HealthSnapshotCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#081729] rounded-2xl border border-[#DCE5EC] dark:border-[#152A42] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6" aria-hidden="true">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
        <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
        <div className="space-y-2.5 flex-1 min-w-0">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
      <Skeleton className="w-full lg:w-48 h-20 rounded-xl shrink-0" />
    </div>
  );
}

/**
 * Care Provider Card Skeleton for CareNearMe.tsx.
 */
export function CareProviderCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#152A42]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Trusted Contact Card Skeleton for FamilyAlerts.tsx.
 */
export function TrustedContactSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Universal Fallback Skeleton (for ProtectedRoute/AdminRoute initial auth validation).
 */
export function PageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading page content">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-4 w-36 sm:w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs h-32 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-64" />
        </div>
        <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-[#152A42]">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Alert List Skeleton for Notifications and Family Alerts.
 */
export function AlertListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-[#152A42]" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-5 flex items-start gap-3.5">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
