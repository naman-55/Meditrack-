import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, RefreshCw, Activity, ShieldAlert, ChevronRight, Info } from 'lucide-react';
import { reportsService, SpecialtyGuidance } from '../api/reports';

export default function SpecialtyGuidancePage() {
  const [guidances, setGuidances] = useState<SpecialtyGuidance[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchGuidance();
  }, []);

  const fetchGuidance = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getSpecialtyGuidance();
      setGuidances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await reportsService.analyzeSpecialtyGuidance();
      await fetchGuidance();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Specialty Guidance</h1>
          <p className="mt-1 text-slate-500">Care navigation mapping based on your clinical risk domains.</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50"
        >
          {analyzing ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : 'Evaluate Active Risks'}
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex gap-3 text-indigo-800 text-sm">
        <Info className="w-5 h-5 shrink-0" />
        <p><strong>Care Guidance Only:</strong> This module maps verified elevated indicators to relevant medical specialties based on clinical guidelines. It does not claim a confirmed diagnosis.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Evaluating specialty mappings...</div>
      ) : guidances.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Guidance Generated</h3>
          <p className="text-slate-500">Ensure your risk assessment is up to date. Guidance triggers only when sufficient evidence of elevated risk exists.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidances.map((guidance) => (
            <div key={guidance.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{guidance.domain} Domain</p>
                    <h2 className="text-xl font-bold text-slate-900">{guidance.suggested_specialty}</h2>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-700 block mb-1">Clinical Mapping Evidence:</span>
                {guidance.evidence}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Rule Version: {guidance.rule_version}</span>
                <Link
                  to={`/care-near-me?specialty=${encodeURIComponent(guidance.suggested_specialty.toLowerCase())}`}
                  className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
                >
                  Find Providers <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
