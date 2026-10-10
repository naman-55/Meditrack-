import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Activity, ShieldAlert, HeartPulse, Stethoscope, Info, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { reportsService, RiskAssessment } from '../api/reports';

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
}

export default function RiskAssessmentPage() {
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState<Record<number, boolean>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getRisks();
      setRisks(data);
    } catch (err) {
      console.error(err);
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
      return { explanation: jsonStr, action: '', details: [] };
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'GREEN': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'YELLOW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ORANGE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RED': return 'bg-red-100 text-red-800 border-red-200';
      case 'GREY':
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'cardiovascular': return <HeartPulse className="w-6 h-6" />;
      case 'metabolic': return <Activity className="w-6 h-6" />;
      default: return <Stethoscope className="w-6 h-6" />;
    }
  };

  const toggleWhy = (id: number) => setExpandedWhy(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEvidence = (id: number) => setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Risk Assessment</h1>
          <p className="mt-1 text-slate-500">Explicit rules-based clinical indicators mapped across major health domains.</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
        >
          {analyzing ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : 'Run Clinical Rules Engine'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
        <Info className="w-5 h-5 shrink-0" />
        <p>This engine strictly follows versioned clinical rules (v1.0.0). No arbitrary scores are generated, and missing data is never assumed to be normal. It abstains (GREY) when data is insufficient or unreliable.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Evaluating clinical rules...</div>
      ) : risks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Risk Assessments</h3>
          <p className="text-slate-500">Run the rules engine to assess current validated measurements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {risks.map((risk) => {
            const parsed = parseEvidence(risk.evidence);
            return (
              <div key={risk.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${getLevelColor(risk.level)} border`}>
                        {getDomainIcon(risk.domain)}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 capitalize">{risk.domain} Health</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getLevelColor(risk.level)}`}>
                      {risk.level}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-slate-800 mb-1">{risk.label}</p>
                    <p className="text-slate-500 text-sm">{parsed.explanation}</p>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => toggleWhy(risk.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                      {expandedWhy[risk.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Why?
                    </button>
                    {parsed.details.length > 0 && (
                      <button onClick={() => toggleEvidence(risk.id)} className="text-sm font-medium text-slate-600 hover:text-slate-700 flex items-center bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                        {expandedEvidence[risk.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        View Evidence
                      </button>
                    )}
                  </div>
                </div>

                {expandedWhy[risk.id] && (
                  <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100 animate-in slide-in-from-top-2 text-sm text-indigo-900">
                    <strong>Recommended Action:</strong> {parsed.action || 'No specific action recommended based on current data.'}
                  </div>
                )}

                {expandedEvidence[risk.id] && parsed.details.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-100/50 text-slate-500 text-xs uppercase font-medium">
                          <tr>
                            <th className="px-6 py-3">Parameter</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60">
                          {parsed.details.map((detail, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/50">
                              <td className="px-6 py-3 font-medium text-slate-900">{detail.parameter}</td>
                              <td className="px-6 py-3 font-mono text-xs">{detail.value}</td>
                              <td className="px-6 py-3">{detail.date}</td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-1.5" title={detail.report}>
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="truncate max-w-[120px]">{detail.report}</span>
                                  <span className="text-xs bg-slate-200 px-1.5 rounded">p.{detail.page}</span>
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

                <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    Data Quality: <span className={`font-medium ${risk.data_quality === 'RELIABLE' ? 'text-emerald-600' : 'text-amber-600'}`}>{risk.data_quality}</span>
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
