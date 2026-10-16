import React from 'react';
import { cn } from '../../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shimmer?: boolean;
}

/**
 * Base atomic Skeleton primitive.
 * Supports light mode (slate-200/90) and dark mode (slate-700/70) with optional shimmer.
 * Respects prefers-reduced-motion and user's reduceAnimations setting.
 */
export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-slate-200/90 dark:bg-[#152A42] border border-transparent dark:border-[#1F3A55]/50 animate-pulse motion-reduce:animate-none",
        shimmer && "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/50 dark:after:via-[#20364B]/40 after:to-transparent motion-reduce:after:animate-none",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Themed Card container skeleton matching the application's card design tokens.
 */
export function CardSkeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {children || (
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Single KPI Metric Card Skeleton matching summary statistic cards.
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-4 sm:p-5 shadow-xs flex items-center gap-3.5 min-w-0 h-[100px] sm:h-[110px]",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-36 hidden sm:block" />
      </div>
    </div>
  );
}

/**
 * Metric Card Grid Skeleton for rendering a complete multi-card row.
 */
export function MetricCardGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table Skeleton with customizable row count and column count.
 */
export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] overflow-hidden shadow-xs",
        className
      )}
      aria-hidden="true"
    >
      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-[#0B1B30] px-6 py-4 border-b border-slate-200/90 dark:border-[#152A42] flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 max-w-[140px]" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-slate-100 dark:divide-[#152A42]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4 flex-1",
                  c === 0 ? "max-w-[160px]" : c === cols - 1 ? "max-w-[80px]" : "max-w-[120px]"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart Skeleton placeholder simulating bar or line trajectories with axes.
 */
export function ChartSkeleton({ height = "h-64", className }: { height?: string; className?: string }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#081729] rounded-2xl border border-slate-200/90 dark:border-[#152A42] p-5 shadow-xs space-y-4 flex flex-col justify-between",
        height,
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-end justify-between gap-3 h-36 px-2 pt-4">
        <Skeleton className="h-16 w-full rounded-t-lg" />
        <Skeleton className="h-28 w-full rounded-t-lg" />
        <Skeleton className="h-20 w-full rounded-t-lg" />
        <Skeleton className="h-32 w-full rounded-t-lg" />
        <Skeleton className="h-24 w-full rounded-t-lg" />
        <Skeleton className="h-36 w-full rounded-t-lg" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#152A42]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Pill/Badge skeleton.
 */
export function BadgeSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-16 rounded-full", className)} />;
}

/**
 * Avatar circular skeleton.
 */
export function AvatarSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("w-10 h-10 rounded-full shrink-0", className)} />;
}

/**
 * Action button skeleton.
 */
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-28 rounded-xl", className)} />;
}
