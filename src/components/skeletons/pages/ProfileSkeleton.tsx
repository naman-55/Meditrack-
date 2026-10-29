import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Profile.tsx.
 * Replicates patient identification, biometric vitals (BMI gauge), emergency contact, and security sections.
 */
export function ProfileSkeleton() {
  return (
    <div id="profile-skeleton" className="max-w-5xl mx-auto space-y-6 pb-20 px-3 sm:px-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading patient profile">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 sm:w-60" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* 2. Personal Identification Card */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-[#152A42]">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Clinical Vitals & Biometrics Card (Height, Weight, BMI Gauge) */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#152A42]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* BMI Progress Gauge Placeholder */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>

      {/* 4. Emergency Contacts & Notification Preferences */}
      <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#152A42]">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
export default ProfileSkeleton;
