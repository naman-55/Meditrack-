import React, { useEffect, useState } from 'react';
import { X, Calendar, FileText, CheckCircle2, AlertCircle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import BiomarkerIcon from './BiomarkerIcon';
import { MetricCardData } from './MetricCard';
import { 
  CLINICAL_REFERENCE_RANGES, 
  normalizeParamKey, 
  evaluateBiomarkerStatus, 
  getMetricVisualTheme 
} from './clinicalRules';
import { 
  getCompatibleUnits, 
  convertUnit, 
  convertReferenceRange 
} from '../../lib/units';

interface MetricDetailModalProps {
  metric: MetricCardData | null;
  onClose: () => void;
}

export default function MetricDetailModal({ metric, onClose }: MetricDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [activeUnit, setActiveUnit] = useState<string>(metric?.unit || '');

  useEffect(() => {
    if (metric) {
      setActiveUnit(metric.unit);
    }
  }, [metric]);

  if (!metric) return null;

  const compatibleUnits = getCompatibleUnits(metric.parameter);
  const isConverted = activeUnit.toLowerCase() !== (metric.unit || '').toLowerCase();

  const latestConv = isConverted 
    ? convertUnit(metric.latestValue, metric.unit, activeUnit, { parameter: metric.parameter })
    : { success: true, value: metric.latestValue };
  const displayLatestValue = latestConv.success && latestConv.value !== null ? latestConv.value : metric.latestValue;

  const normKey = normalizeParamKey(metric.parameter);
  const ref = CLINICAL_REFERENCE_RANGES[normKey];
  const theme = getMetricVisualTheme(metric.parameter);
  const evaluation = evaluateBiomarkerStatus(
    metric.parameter,
    displayLatestValue,
    activeUnit,
    metric.latestSourceText
  );

  const convertedRef = isConverted
    ? convertReferenceRange(evaluation.referenceRangeText, metric.unit, activeUnit, metric.parameter)
    : { success: true, formattedRange: evaluation.referenceRangeText };
  const displayRefText = convertedRef.success ? convertedRef.formattedRange : evaluation.referenceRangeText;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
              <BiomarkerIcon parameterName={metric.parameter} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-[#101B3D]">
                  {metric.displayName || metric.parameter}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${evaluation.badgeStyle.bg} ${evaluation.badgeStyle.text} ${evaluation.badgeStyle.border}`}>
                  {evaluation.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xs text-slate-500 font-medium">
                  Active Display Unit: <span className="font-semibold text-slate-700">{activeUnit}</span>
                  {ref && ` • ${ref.organSystem}`}
                </p>

                {compatibleUnits.length > 1 && (
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
                    {compatibleUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setActiveUnit(u)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                          activeUnit.toLowerCase() === u.toLowerCase()
                            ? 'bg-[#00A884] text-white shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* REFERENCE RANGE SUMMARY BOX */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider">Reference Range</span>
              <span className="font-bold text-slate-800 text-sm">{displayRefText}</span>
              {isConverted && (
                <span className="text-[10px] text-slate-400 block mt-0.5">Orig: {evaluation.referenceRangeText}</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider">Latest Value</span>
              <span className="font-bold text-slate-800 text-sm">
                {displayLatestValue} {activeUnit}
              </span>
              {isConverted && (
                <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                  Orig: {metric.latestRawValue || metric.latestValue} {metric.unit}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider">Observations Count</span>
              <span className="font-bold text-slate-800 text-sm">{metric.observations.length} Valid Records</span>
            </div>
          </div>

          {/* OBSERVATIONS TIMELINE TABLE */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Historical Observation Records
              </h4>
              {isConverted && (
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Values converted to {activeUnit}
                </span>
              )}
            </div>

            {metric.observations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No observation timeline points found.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Displayed Value ({activeUnit})</th>
                      {isConverted && <th className="py-2.5 px-3">Original Lab Value</th>}
                      <th className="py-2.5 px-3">Report Document</th>
                      <th className="py-2.5 px-3">Lab Notes & Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {metric.observations.map((obs, idx) => {
                      const obsSourceUnit = obs.unit || metric.unit;
                      let displayedVal = obs.rawValue || obs.value;
                      if (isConverted) {
                        const conv = convertUnit(obs.value, obsSourceUnit, activeUnit, { parameter: metric.parameter });
                        if (conv.success && conv.value !== null) {
                          displayedVal = conv.value;
                        }
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {obs.displayDate || obs.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600">
                            {displayedVal} {activeUnit}
                          </td>
                          {isConverted && (
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {obs.rawValue || obs.value} {obsSourceUnit}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]">
                            {obs.reportName || `Report #${obs.reportId || idx + 1}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={obs.sourceText || ''}>
                            {obs.sourceText || 'Standard validated record'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CLINICAL GUIDELINES & EDUCATION */}
          {ref?.description && (
            <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-indigo-900 block">Clinical Significance</span>
                <p className="text-indigo-800/90 leading-relaxed">{ref.description}</p>
                <p className="text-[11px] text-indigo-600/80 mt-1">
                  Trajectories should be reviewed in consultation with a licensed healthcare physician.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
