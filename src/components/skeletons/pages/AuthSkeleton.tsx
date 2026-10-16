import React from 'react';
import { Skeleton } from '../shared/SkeletonPrimitives';

/**
 * Skeleton layout for Authentication pages (Login, ForgotPassword, ResetPassword).
 */
export function AuthSkeleton() {
  return (
    <div id="auth-skeleton" className="min-h-screen bg-[#F7F9FB] dark:bg-[#050D18] flex items-center justify-center p-4 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading authentication">
      <div className="w-full max-w-md bg-white dark:bg-[#081729] rounded-3xl border border-slate-200/90 dark:border-[#152A42] p-8 shadow-md space-y-6">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-2">
          <Skeleton className="w-12 h-12 rounded-2xl mx-auto" />
          <Skeleton className="h-6 w-44 mx-auto" />
          <Skeleton className="h-3.5 w-60 mx-auto" />
        </div>

        {/* Input Fields */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Submit Button */}
        <Skeleton className="h-12 w-full rounded-xl" />

        {/* Footer Link */}
        <div className="pt-2 text-center">
          <Skeleton className="h-3.5 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
export default AuthSkeleton;
