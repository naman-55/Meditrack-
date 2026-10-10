import React, { useState, useEffect } from 'react';
import { Activity, Calendar, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { reportsService, Measurement, Contradiction } from '../api/reports';

export default function Timeline() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const mData = await reportsService.getMeasurements();
      const cData = await reportsService.getContradictions();
      setMeasurements(mData);
      setContradictions(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Loading timeline...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Timeline & Data Quality</h1>
        <p className="mt-1 text-slate-500">Longitudinal view of extracted report measurements and detected contradictions.</p>
      </div>

      {contradictions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-4 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Data Quality Alerts</h2>
          </div>
          <div className="space-y-3">
            {contradictions.map(c => (
              <div key={c.id} className="bg-red-50 p-4 rounded-xl text-sm border border-red-100">
                <span className="font-semibold text-red-800">{c.severity} Contradiction: </span>
                {c.parameter} change detected ({c.value_a} on {c.date_a} vs {c.value_b} on {c.date_b}). Reason: {c.reason}. Status: {c.status}
              </div>
            ))}
          </div>
        </div>
      )}

      {measurements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No measurements found</h3>
          <p className="text-slate-500">Upload a medical report to automatically extract health measurements.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Extracted Validated Measurements
          </h2>
          <div className="relative border-l-2 border-slate-200 ml-3 md:ml-4 space-y-8">
            {measurements.map((m, idx) => (
              <div key={m.id} className="relative pl-6 sm:pl-8 group">
                <div className="absolute w-4 h-4 bg-white border-2 border-emerald-500 rounded-full -left-[9px] top-1 group-hover:scale-125 transition-transform" />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> {m.report_date}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{m.parameter}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800 tracking-tight">{m.normalized_value}</span>
                      <span className="text-sm font-medium text-slate-500">{m.unit}</span>
                    </div>
                  </div>
                  
                  <div className="sm:text-right text-sm">
                    <p className="text-slate-500">Raw Source:</p>
                    <p className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 mt-1 inline-block">"{m.raw_value}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
