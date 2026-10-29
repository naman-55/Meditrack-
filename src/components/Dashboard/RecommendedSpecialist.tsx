import React from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

interface SpecialtyData {
  available: boolean;
  suggested_specialty?: string;
  reason?: string;
}

export default function RecommendedSpecialist({ guidance, isLoading, error }: { guidance?: SpecialtyData, isLoading?: boolean, error?: string }) {
  return (
    <div className="bg-white dark:bg-[#0D1B2A] p-5 rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-2xs flex flex-col h-full min-h-[160px]">
      <h4 className="font-bold text-[#071B49] dark:text-[#F1F5FB] mb-2 text-base">Recommended Specialist</h4>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-6 h-6 text-red-400 dark:text-[#FF5368] mb-2" />
          <p className="text-xs text-red-500 dark:text-[#FF5368] font-medium">Failed to load guidance</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex flex-col justify-center text-center border-2 border-slate-50 dark:border-[#20364A] dark:bg-[#102033]/40 rounded-xl p-4 mt-2 space-y-3">
          <Skeleton className="w-10 h-10 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-full mx-auto" />
          <Skeleton className="h-3 w-5/6 mx-auto" />
        </div>
      ) : !guidance || !guidance.available ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <Stethoscope className="w-8 h-8 text-slate-300 dark:text-[#8297B2] mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-700 dark:text-[#B4C4D8]">No specialty guidance available.</p>
          <p className="text-[11px] text-slate-500 dark:text-[#8297B2] mt-2">Care recommendations are generated based on identified medical risk markers.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center text-center border border-indigo-50 dark:border-[#20364A] bg-[#F8FAFC]/50 dark:bg-[#102033] rounded-xl p-4 mt-2">
          <Stethoscope className="w-8 h-8 text-indigo-500 dark:text-[#00D6B0] mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-[#F1F5FB]">{guidance.suggested_specialty}</p>
          <div className="text-left mt-4 border-t border-indigo-100 dark:border-[#20364A] pt-3">
            <p className="text-xs font-bold text-slate-700 dark:text-[#B4C4D8] mb-1">Why this recommendation?</p>
            <p className="text-[11px] text-slate-500 dark:text-[#8297B2] leading-relaxed">
              Based on available health indicators and report trends, a {guidance.suggested_specialty?.toLowerCase() || 'specialist'} may be appropriate for further review.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#20364A] pt-3">
            <a href="/specialty-guidance" className="text-xs font-semibold text-slate-600 dark:text-[#8297B2] hover:text-slate-900 dark:hover:text-[#F1F5FB] transition-colors">
              Risk Logic &rarr;
            </a>
            <a
              href={`/care-near-me?specialty=${encodeURIComponent(guidance.suggested_specialty?.toLowerCase() || '')}`}
              className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#20D6A1] transition-colors flex items-center gap-1"
            >
              Find Nearby &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
