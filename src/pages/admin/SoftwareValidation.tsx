import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, XCircle, Info, Activity } from 'lucide-react';
import { validationService, ValidationReport, TestCase } from '../../api/validation';
import { AdminTableSkeleton } from '../../components/common/Skeleton';

export default function SoftwareValidation() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await validationService.runValidation();
      setReport(data);
    } catch (err) {
      setError('Failed to load validation report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return <AdminTableSkeleton title="Software Validation & Compliance" subtitle="Automated validation runner and medical rules verification reports" />;
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-slate-600">{error}</p>
        <button onClick={loadReport} className="mt-4 px-4 py-2 bg-slate-100 rounded-md hover:bg-slate-200">
          Retry
        </button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'N/A': return <Info className="w-4 h-4 text-slate-400" />;
      default: return <Activity className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
      case 'N/A': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Software Validation Framework
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            System logic, data extraction, and forecasting verification.
          </p>
        </div>
        <button 
          onClick={loadReport}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Activity className="w-4 h-4" /> Run Full Suite
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 text-sm">IMPORTANT DISCLAIMER</h4>
          <p className="text-sm text-amber-700 mt-1">{report.disclaimer}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Test Cases Execution</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {(report.testCases || []).map((tc) => (
                <div key={tc.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="mt-0.5">{getStatusIcon(tc.status)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{tc.id}</span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{tc.category}</span>
                        </div>
                        <h4 className="font-medium text-slate-800 mt-1 text-sm">{tc.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{tc.description}</p>
                        
                        {(tc.expected || tc.actual) && (
                          <div className="mt-3 grid grid-cols-2 gap-4 text-[11px]">
                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <span className="font-semibold text-slate-600 block mb-0.5">Expected:</span>
                              <span className="text-slate-500">{tc.expected}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <span className="font-semibold text-slate-600 block mb-0.5">Actual:</span>
                              <span className="text-slate-500">{tc.actual}</span>
                            </div>
                          </div>
                        )}
                        {tc.details && (
                          <p className="text-[11px] text-slate-400 mt-2 italic">{tc.details}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusBadge(tc.status)}`}>
                      {tc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Evaluation Metrics</h3>
            <div className="space-y-3">
              {[
                { label: 'Sensitivity', value: report.metrics?.sensitivity },
                { label: 'Specificity', value: report.metrics?.specificity },
                { label: 'Precision', value: report.metrics?.precision },
                { label: 'Recall', value: report.metrics?.recall },
                { label: 'F1 Score', value: report.metrics?.f1 },
                { label: 'MAE', value: report.metrics?.mae },
                { label: 'RMSE', value: report.metrics?.rmse },
                { label: 'Directional Accuracy', value: report.metrics?.directionalAccuracy },
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{metric.label}</span>
                  {typeof metric.value === 'number' && !Number.isNaN(metric.value) ? (
                    <span className="text-sm font-bold text-slate-800">{metric.value.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-400 rounded">N/A</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic">
              * Metrics read N/A because no labeled hold-out dataset is available to run empirical evaluation. Placeholder values are strictly prohibited.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">Known Limitations</h3>
            <ul className="space-y-3">
              {(report.knownLimitations || []).map((limitation, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="leading-relaxed">{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">False Positives / Negatives</h3>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Requires labeled dataset</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
