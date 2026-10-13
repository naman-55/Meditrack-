import React from 'react';
import { Measurement } from '../../api/reports';
import { FileText, CheckCircle2 } from 'lucide-react';

interface KeyFindingsViewProps {
  measurements: Measurement[];
  loading: boolean;
}

export const KeyFindingsView: React.FC<KeyFindingsViewProps> = ({ measurements, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-[#081421] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-12 text-center space-y-2">
        <FileText className="w-10 h-10 text-slate-300 dark:text-[#8297B2] mx-auto" />
        <h4 className="text-base font-bold text-slate-800 dark:text-[#F1F5FB]">No Key Findings Available</h4>
        <p className="text-xs text-slate-500 dark:text-[#8297B2]">Upload a laboratory report to extract clinical findings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#071B49] dark:text-[#F1F5FB]">Validated Clinical Findings</h3>
          <p className="text-xs text-[#64748B] dark:text-[#8297B2] mt-0.5">
            Individual observations extracted from your pathology and laboratory reports.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-[#B4C4D8] bg-slate-100 dark:bg-[#081421] border dark:border-[#20364A] px-2.5 py-1 rounded-full">
          {measurements.length} Measurements
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-[#B4C4D8]">
          <thead className="bg-[#F8FAFC] dark:bg-[#081421] text-slate-400 dark:text-[#8297B2] font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#20364A]">
            <tr>
              <th className="py-3 px-5">Parameter</th>
              <th className="py-3 px-5">Observed Value</th>
              <th className="py-3 px-5">Unit</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#20364A]/60">
            {measurements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-[#102033]/60 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-[#F1F5FB]">
                  {m.parameter}
                </td>
                <td className="py-3.5 px-5 font-extrabold text-[#071B49] dark:text-[#00D6B0]">
                  {m.normalized_value || m.raw_value}
                </td>
                <td className="py-3.5 px-5 text-slate-500 dark:text-[#8297B2]">
                  {m.unit}
                </td>
                <td className="py-3.5 px-5 text-slate-600 dark:text-[#8297B2] font-medium">
                  {m.report_date}
                </td>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-[#00D6B0] bg-emerald-50 dark:bg-[#062E2D] px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-[#075E56]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#00D6B0]" />
                    Validated
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
