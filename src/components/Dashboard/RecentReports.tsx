import React from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../common/Skeleton';

interface RecentReport {
  id: number;
  name: string;
  date: string;
  status: string;
}

export default function RecentReports({ reports, isLoading, error }: { reports?: RecentReport[], isLoading?: boolean, error?: string }) {
  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900 dark:text-[#F1F5FB]">Recent Reports</h4>
        <Link to="/reports" className="text-sm font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#20D6A1] transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-300 dark:text-[#FF5368] mb-2" />
            <p className="text-xs text-red-500 dark:text-[#FF5368] font-medium">Failed to load reports.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-[#20364A]">
                <Skeleton className="w-8 h-8 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-lg font-bold text-slate-800 dark:text-[#F1F5FB] mb-2">No medical reports yet</p>
            <p className="text-sm text-slate-500 dark:text-[#8297B2] max-w-[200px] mb-4">Upload your first medical report to start tracking your health insights.</p>
            <Link to="/reports" className="px-4 py-2 bg-[#00A88F] hover:bg-[#008F7A] text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
              + Upload Report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link 
                key={report.id} 
                to="/reports" 
                className="block p-3 rounded-xl border border-slate-100 dark:border-[#20364A] hover:border-emerald-200 dark:hover:border-[#00D6B0]/50 bg-slate-50 dark:bg-[#07111D] hover:bg-slate-100/70 dark:hover:bg-[#162A3E] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0B2254]/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-[#2684FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-[#F1F5FB] line-clamp-1">{report.name}</p>
                      <p className="text-xs text-slate-500 dark:text-[#8297B2] mt-0.5">{report.date}</p>
                    </div>
                  </div>
                  {report.status === 'COMPLETED' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-[#062E2D] text-emerald-700 dark:text-[#00D6B0] border border-transparent dark:border-[#075E56] text-[10px] font-bold rounded-full">Processed</span>
                  ) : report.status === 'FAILED' ? (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-[#2A0E14] text-red-700 dark:text-[#FF5368] border border-transparent dark:border-[#801826] text-[10px] font-bold rounded-full">Failed</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-[#201F1A] text-amber-700 dark:text-[#F5B942] border border-transparent dark:border-[#8B7028]/60 text-[10px] font-bold rounded-full">Processing</span>
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
