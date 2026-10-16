import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Activity, ShieldAlert, HeartPulse, Stethoscope, Info, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { reportsService, RiskAssessment } from '../api/reports';
import { RiskCardSkeleton } from '../components/common/Skeleton';

interface EvidenceDetail {
  parameter: string;
  value: string;
  date: string;
  report: string;
  page: string;
  reason: string;
}

interface ParsedEvidence {
  explanation: string;
  action: string;
  details: EvidenceDetail[];
  missingRequirements?: string[];
}

export default function RiskAssessmentPage() {
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState<Record<number, boolean>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.getRisks();
      setRisks(data);
    } catch (err: any) {
      console.error('Failed to load risks:', err);
      setError(err?.message || 'Failed to load clinical risk assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await reportsService.analyzeRisks();
      await fetchRisks();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const parseEvidence = (jsonStr: string): ParsedEvidence => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { explanation: jsonStr, action: '', details: [], missingRequirements: [] };
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'GREEN': return 'bg-emerald-100 dark:bg-[#062E2D] text-emerald-800 dark:text-[#00D6B0] border-emerald-200 dark:border-[#075E56]';
      case 'YELLOW': return 'bg-yellow-100 dark:bg-[#201F1A] text-yellow-800 dark:text-[#F5B942] border-yellow-200 dark:border-[#8B7028]';
      case 'ORANGE': return 'bg-orange-100 dark:bg-[#281A0E] text-orange-800 dark:text-[#F5A032] border-orange-200 dark:border-[#7A4010]';
      case 'RED': return 'bg-red-100 dark:bg-[#2A0E14] text-red-800 dark:text-[#FF5368] border-red-200 dark:border-[#801826]';
      case 'GREY':
      default: return 'bg-slate-100 dark:bg-[#152A42] text-slate-800 dark:text-[#94A9C2] border-slate-200 dark:border-[#1F3A55]';
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'cardiovascular': return <HeartPulse className="w-6 h-6" />;
      case 'metabolic': return <Activity className="w-6 h-6" />;
      case 'renal': return <FileText className="w-6 h-6" />;
      case 'hematologic': return <ShieldAlert className="w-6 h-6" />;
      default: return <Stethoscope className="w-6 h-6" />;
    }
  };

  const toggleWhy = (id: number) => setExpandedWhy(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEvidence = (id: number) => setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinical Risk Assessment</h1>
          <p className="mt-1 text-slate-500 dark:text-[#8297B2]">Explicit rules-based clinical indicators mapped across major health domains.</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center px-4 py-2 bg-slate-900 dark:bg-[#00D6B0] text-white dark:text-[#050D18] text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-[#00A88F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
        >
          {analyzing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Evaluating Rules...</span>
            </span>
          ) : (
            'Run Clinical Rules Engine'
          )}
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-[#0B2254] border border-blue-200 dark:border-blue-800/40 p-4 rounded-xl flex gap-3 text-blue-800 dark:text-[#6BA1FF] text-sm">
        <Info className="w-5 h-5 shrink-0" />
        <p>This engine strictly follows versioned clinical rules (v2.0.0-clinical). No arbitrary scores are generated, and missing data is never assumed to be normal. It abstains (GREY) when data is insufficient or unreliable.</p>
      </div>

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load risk assessments</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRisks}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <RiskCardSkeleton count={4} />
      ) : error && risks.length === 0 ? null : risks.length === 0 ? (
        <div className="bg-white dark:bg-[#081729] rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#152A42]">
          <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-[#1F3A55] mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Risk Assessments</h3>
          <p className="text-slate-500 dark:text-[#8297B2]">Run the rules engine to assess current validated measurements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {risks.map((risk) => {
            const parsed = parseEvidence(risk.evidence);
            return (
              <div key={risk.id} className="bg-white dark:bg-[#081729] rounded-2xl shadow-sm border border-slate-200 dark:border-[#152A42] flex flex-col h-full overflow-hidden">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${getLevelColor(risk.level)} border`}>
                        {getDomainIcon(risk.domain)}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{risk.domain} Health</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getLevelColor(risk.level)}`}>
                      {risk.level}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-slate-800 dark:text-[#F1F5FB] mb-1">{risk.label}</p>
                    <p className="text-slate-500 dark:text-[#8297B2] text-sm">{parsed.explanation}</p>
                  </div>

                  {parsed.missingRequirements && parsed.missingRequirements.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-[#0B1B30] border border-slate-200 dark:border-[#1F3A55] rounded-xl text-xs text-slate-700 dark:text-[#B4C4D8]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">Missing Observations:</span>
                        <a 
                          href="/reports" 
                          className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#00A88F] flex items-center gap-1"
                        >
                          Upload Report &rarr;
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {parsed.missingRequirements.map((req, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white dark:bg-[#081729] border border-slate-200 dark:border-[#152A42] rounded-md text-[11px] font-medium text-slate-600 dark:text-[#94A9C2]">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => toggleWhy(risk.id)} className="text-sm font-medium text-indigo-600 dark:text-[#6BA1FF] hover:text-indigo-700 flex items-center bg-indigo-50 dark:bg-[#0B2254] px-3 py-1.5 rounded-lg transition-colors">
                      {expandedWhy[risk.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Why?
                    </button>
                    {parsed.details.length > 0 && (
                      <button onClick={() => toggleEvidence(risk.id)} className="text-sm font-medium text-slate-600 dark:text-[#94A9C2] hover:text-slate-700 flex items-center bg-slate-100 dark:bg-[#152A42] px-3 py-1.5 rounded-lg transition-colors">
                        {expandedEvidence[risk.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        View Evidence ({parsed.details.length})
                      </button>
                    )}
                  </div>
                </div>

                {expandedWhy[risk.id] && (
                  <div className="px-6 py-4 bg-indigo-50 dark:bg-[#0B2254] border-t border-indigo-100 dark:border-blue-900/40 animate-in slide-in-from-top-2 text-sm text-indigo-900 dark:text-[#6BA1FF]">
                    <strong>Recommended Action:</strong> {parsed.action || 'No specific action recommended based on current data.'}
                  </div>
                )}

                {expandedEvidence[risk.id] && parsed.details.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-[#152A42] bg-slate-50 dark:bg-[#050E1A]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-[#94A9C2]">
                        <thead className="bg-slate-100/50 dark:bg-[#112236] text-slate-500 dark:text-[#B4C4D8] text-xs uppercase font-medium">
                          <tr>
                            <th className="px-6 py-3">Parameter</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-[#152A42]">
                          {parsed.details.map((detail, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-[#162A3E]">
                              <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{detail.parameter}</td>
                              <td className="px-6 py-3 font-mono text-xs">{detail.value}</td>
                              <td className="px-6 py-3">{detail.date}</td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-1.5" title={detail.report}>
                                  <FileText className="w-4 h-4 text-slate-400 dark:text-[#647A96]" />
                                  <span className="truncate max-w-[120px]">{detail.report}</span>
                                  <span className="text-xs bg-slate-200 dark:bg-[#152A42] dark:text-[#94A9C2] px-1.5 rounded">p.{detail.page}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3">{detail.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="p-4 mt-auto border-t border-slate-100 dark:border-[#152A42] bg-slate-50/50 dark:bg-[#050E1A] flex items-center justify-between text-xs text-slate-500 dark:text-[#647A96]">
                  <span className="flex items-center gap-1.5">
                    Data Quality: <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      risk.data_quality === 'RELIABLE' || risk.data_quality === 'SUFFICIENT' 
                        ? 'bg-emerald-50 dark:bg-[#062E2D] text-emerald-700 dark:text-[#00D6B0] border border-emerald-200 dark:border-[#075E56]' 
                        : risk.data_quality === 'PARTIAL'
                        ? 'bg-amber-50 dark:bg-[#201F1A] text-amber-700 dark:text-[#F5B942] border border-amber-200 dark:border-[#8B7028]'
                        : 'bg-slate-100 dark:bg-[#152A42] text-slate-600 dark:text-[#94A9C2] border border-slate-200 dark:border-[#1F3A55]'
                    }`}>{risk.data_quality}</span>
                  </span>
                  <span>Rule Engine v{risk.rule_version}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
