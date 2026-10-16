import React from 'react';
import { Skeleton, TableSkeleton } from '../shared/SkeletonPrimitives';

/**
 * Page-specific skeleton layout for Admin management pages.
 * Replicates admin headers, search/filter bars, and administrative tables.
 */
export function AdminTableSkeleton({ 
  title = "Administration", 
  subtitle = "Manage system records and configurations" 
}: { 
  title?: string; 
  subtitle?: string; 
}) {
  return (
    <div id="admin-table-skeleton" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading administration records">
      {/* 1. Admin Header & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-52 sm:w-64" />
          </div>
          <Skeleton className="h-4 w-64 sm:w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 2. Admin Data Table */}
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
export default AdminTableSkeleton;
