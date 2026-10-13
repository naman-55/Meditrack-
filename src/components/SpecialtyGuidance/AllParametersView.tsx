import React from 'react';
import { Measurement } from '../../api/reports';
import { Layers } from 'lucide-react';

interface AllParametersViewProps {
  measurements: Measurement[];
  loading: boolean;
}

export const AllParametersView: React.FC<AllParametersViewProps> = ({ measurements, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-6 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-[#081421] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Deduplicate by parameter name
  const paramMap = new Map<string, { latest: Measurement; count: number }>();
  for (const m of measurements) {
    const existing = paramMap.get(m.parameter);
    if (!existing) {
      paramMap.set(m.parameter, { latest: m, count: 1 });
    } else {
      existing.count += 1;
    }
  }

  const items = Array.from(paramMap.values());

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#071B49] dark:text-[#F1F5FB]">Catalog of Extracted Parameters</h3>
          <p className="text-xs text-[#64748B] dark:text-[#8297B2] mt-0.5">
            Distinct laboratory biomarkers detected across all uploaded records.
          </p>
        </div>
        <span className="text-xs font-bold text-[#00A884] dark:text-[#00D6B0] bg-emerald-50 dark:bg-[#062E2D] px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-[#075E56]">
          {items.length} Unique Biomarkers
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, index) => (
          <div key={index} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#20364A] bg-slate-50/50 dark:bg-[#081421] hover:bg-white dark:hover:bg-[#102033] hover:border-slate-300 dark:hover:border-[#2D4A66] transition-all shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-[#F1F5FB] text-xs truncate max-w-[170px]" title={item.latest.parameter}>
                {item.latest.parameter}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-[#8297B2] font-semibold">
                {item.count} reading{item.count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-base font-extrabold text-[#071B49] dark:text-[#00D6B0]">
                {item.latest.normalized_value || item.latest.raw_value}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#8297B2] font-medium">
                {item.latest.unit}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-[#8297B2]">
              Latest: {item.latest.report_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
