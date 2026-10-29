import React from 'react';
import { SpecialtyGuidance } from '../../api/reports';
import { History, ShieldCheck } from 'lucide-react';

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
      <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-[#071B49]">Previous Recommendations History</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Auditable timeline of specialty mapping evaluations and clinical rule versions.
        </p>
      </div>

      <div className="space-y-3">
        {guidances.map((g) => (
          <div key={g.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{g.suggested_specialty}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-700">
                  {g.domain}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Rule Version: {g.rule_version} • Generated: {g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Current Run'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 font-semibold text-[11px] self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Persisted Audit Record</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
