import React from 'react';
import { Measurement } from '../../api/reports';
import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TableSkeleton } from '../common/Skeleton';

interface KeyFindingsViewProps {
  measurements: Measurement[];
  loading: boolean;
}

export const KeyFindingsView: React.FC<KeyFindingsViewProps> = ({ measurements, loading }) => {
  if (loading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  if (measurements.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#DCE5EC] p-12 text-center space-y-2">
        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
        <h4 className="text-base font-bold text-slate-800">No Key Findings Available</h4>
        <p className="text-xs text-slate-500">Upload a laboratory report to extract clinical findings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5EC] shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#071B49]">Validated Clinical Findings</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Individual observations extracted from your pathology and laboratory reports.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {measurements.length} Measurements
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-5">Parameter</th>
              <th className="py-3 px-5">Observed Value</th>
              <th className="py-3 px-5">Unit</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {measurements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  {m.parameter}
                </td>
                <td className="py-3.5 px-5 font-extrabold text-[#071B49]">
                  {m.normalized_value || m.raw_value}
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  {m.unit}
                </td>
                <td className="py-3.5 px-5 text-slate-600 font-medium">
                  {m.report_date}
                </td>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
