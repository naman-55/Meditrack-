import React from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentReport {
  id: number;
  name: string;
  date: string;
  status: string;
}

export default function RecentReports({ reports, isLoading, error }: { reports?: RecentReport[], isLoading?: boolean, error?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900">Recent Reports</h4>
        <Link to="/reports" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
            <p className="text-xs text-red-500 font-medium">Failed to load reports.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded bg-slate-200 shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 w-3/4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-lg font-bold text-slate-800 mb-2">No medical reports yet</p>
            <p className="text-sm text-slate-500 max-w-[200px] mb-4">Upload your first medical report to start tracking your health insights.</p>
            <Link to="/reports" className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">
              + Upload Report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link 
                key={report.id} 
                to="/reports" 
                className="block p-3 rounded-lg border border-slate-100 hover:border-emerald-200 bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{report.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{report.date}</p>
                    </div>
                  </div>
                  {report.status === 'COMPLETED' ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Processed</span>
                  ) : report.status === 'FAILED' ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded">Failed</span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">Processing</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
