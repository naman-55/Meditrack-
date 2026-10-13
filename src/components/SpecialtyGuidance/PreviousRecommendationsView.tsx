import React from 'react';
import { SpecialtyGuidance } from '../../api/reports';
import { ShieldCheck } from 'lucide-react';

interface PreviousRecommendationsViewProps {
  guidances: SpecialtyGuidance[];
  loading: boolean;
}

export const PreviousRecommendationsView: React.FC<PreviousRecommendationsViewProps> = ({
  guidances,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-[#081421] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-6 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-[#071B49] dark:text-[#F1F5FB]">Previous Recommendations History</h3>
        <p className="text-xs text-[#64748B] dark:text-[#8297B2] mt-0.5">
          Auditable timeline of specialty mapping evaluations and clinical rule versions.
        </p>
      </div>

      <div className="space-y-3">
        {guidances.map((g) => (
          <div key={g.id} className="p-4 rounded-xl border border-slate-200/80 dark:border-[#20364A] bg-slate-50/60 dark:bg-[#081421] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-[#F1F5FB] text-sm">{g.suggested_specialty}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 dark:bg-[#0E2849] text-blue-700 dark:text-[#2684FF] border dark:border-[#1E4370]">
                  {g.domain}
                </span>
              </div>
              <p className="text-slate-500 dark:text-[#8297B2] text-[11px]">
                Rule Version: {g.rule_version} • Generated: {g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Current Run'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-[#00D6B0] bg-emerald-50 dark:bg-[#062E2D] px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-[#075E56] font-semibold text-[11px] self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D6B0]" />
              <span>Persisted Audit Record</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
