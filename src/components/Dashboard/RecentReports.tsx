import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentReport {
  id: number;
  name: string;
  date: string;
  status: string;
}

export default function RecentReports({ reports, isLoading, error }: { reports?: RecentReport[], isLoading?: boolean, error?: string }) {
  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900 dark:text-[#F1F5FB]">Recent Reports</h4>
        <Link to="/reports" className="text-sm font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:underline transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-400 dark:text-[#FF5368] mb-2" />
            <p className="text-xs text-red-500 dark:text-[#FF5368] font-medium">Failed to load reports.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#20364A] bg-slate-50 dark:bg-[#102033]">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#14283B] shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-[#14283B] rounded mb-2"></div>
                  <div className="h-2 w-1/2 bg-slate-200 dark:bg-[#14283B] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-lg font-bold text-slate-800 dark:text-[#F1F5FB] mb-2">No medical reports yet</p>
            <p className="text-sm text-slate-500 dark:text-[#7186A3] max-w-[200px] mb-4">Upload your first medical report to start tracking your health insights.</p>
            <Link to="/reports" className="px-4 py-2 bg-emerald-600 dark:bg-[#00D6B0] text-white dark:text-[#07111D] text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-700 dark:hover:bg-[#00A88F] transition-colors">
              + Upload Report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link 
                key={report.id} 
                to="/reports" 
                className="block p-3.5 rounded-xl border border-slate-100 dark:border-[#20364A] hover:border-emerald-200 dark:hover:border-[#00D6B0]/40 bg-slate-50 dark:bg-[#102033] dark:hover:bg-[#14283B] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#14283B] border border-slate-200 dark:border-[#20364A] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-500 dark:text-[#A6B8CF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-[#F1F5FB] line-clamp-1">{report.name}</p>
                      <p className="text-xs text-slate-500 dark:text-[#7186A3] mt-0.5">{report.date}</p>
                    </div>
                  </div>
                  {report.status === 'COMPLETED' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-[#00D6B0]/15 dark:text-[#00D6B0] dark:border dark:border-[#00D6B0]/30 text-[10px] font-bold rounded-lg">Processed</span>
                  ) : report.status === 'FAILED' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-[#FF5368]/15 dark:text-[#FF5368] dark:border dark:border-[#FF5368]/30 text-[10px] font-bold rounded-lg">Failed</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-[#F5B942]/15 dark:text-[#F5B942] dark:border dark:border-[#F5B942]/30 text-[10px] font-bold rounded-lg">Processing</span>
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
