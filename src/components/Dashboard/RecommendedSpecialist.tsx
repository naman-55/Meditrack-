import React from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';

interface SpecialtyData {
  available: boolean;
  suggested_specialty?: string;
  reason?: string;
}

export default function RecommendedSpecialist({ guidance, isLoading, error }: { guidance?: SpecialtyData, isLoading?: boolean, error?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[160px]">
      <h4 className="font-bold text-slate-900 mb-2">Recommended Specialist</h4>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-6 h-6 text-red-300 mb-2" />
          <p className="text-xs text-red-500 font-medium">Failed to load guidance</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex flex-col justify-center text-center border-2 border-slate-50 rounded-xl p-4 mt-2 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-full mx-auto mb-2"></div>
          <div className="h-4 w-3/4 bg-slate-200 rounded mx-auto mb-2"></div>
          <div className="h-2 w-full bg-slate-200 rounded mx-auto"></div>
          <div className="h-2 w-5/6 bg-slate-200 rounded mx-auto mt-1"></div>
        </div>
      ) : !guidance || !guidance.available ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Stethoscope className="w-8 h-8 text-slate-300 mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-700">No specialty guidance available.</p>
          <p className="text-[10px] text-slate-500 mt-2">Care recommendations are generated based on identified medical risk markers.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center text-center border-2 border-indigo-50 rounded-xl p-4 mt-2">
          <Stethoscope className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">{guidance.suggested_specialty}</p>
          <div className="text-left mt-4 border-t border-indigo-100 pt-3">
            <p className="text-xs font-bold text-slate-700 mb-1">Why this recommendation?</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Based on available health indicators and report trends, a {guidance.suggested_specialty?.toLowerCase() || 'specialist'} may be appropriate for further review.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <a href="/specialty-guidance" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Risk Logic &rarr;
            </a>
            <a
              href={`/care-near-me?specialty=${encodeURIComponent(guidance.suggested_specialty?.toLowerCase() || '')}`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
            >
              Find Nearby &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
