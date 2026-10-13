import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, LineChart, Activity } from 'lucide-react';

interface TrendsInsightsViewProps {
  parametersCount: number;
  trendsCount: number;
}

export const TrendsInsightsView: React.FC<TrendsInsightsViewProps> = ({
  parametersCount,
  trendsCount
}) => {
  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#20364A] pb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#071B49] dark:text-[#F1F5FB]">Longitudinal Trends & Clinical Insights</h3>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] mt-0.5">
            Trajectories evaluated across multiple distinct laboratory report collection dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/trends"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#00A884] bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border-[#075E56] dark:hover:bg-[#0A4240] transition-colors shadow-2xs"
          >
            <span>View Full Trends</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/future-outlook"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 dark:bg-[#081421] dark:text-[#2684FF] dark:border-[#20364A] dark:hover:bg-[#14283B] transition-colors shadow-2xs"
          >
            <span>Future Outlook</span>
            <LineChart className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-200/80 dark:border-[#20364A] space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-[#F1F5FB] font-bold text-sm">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-[#00D6B0]" />
            <span>Monitored Biomarkers</span>
          </div>
          <p className="text-2xl font-black text-[#071B49] dark:text-[#00D6B0]">{trendsCount} Parameters with History</p>
          <p className="text-xs text-slate-500 dark:text-[#8297B2] leading-relaxed">
            Parameters with at least two distinct collection dates qualify for deterministic slope and rate-of-change trend calculations.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081421] border border-slate-200/80 dark:border-[#20364A] space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-[#F1F5FB] font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-[#2684FF]" />
            <span>Longitudinal Trajectory</span>
          </div>
          <p className="text-2xl font-black text-[#071B49] dark:text-[#2684FF]">{parametersCount} Extracted Biomarkers</p>
          <p className="text-xs text-slate-500 dark:text-[#8297B2] leading-relaxed">
            Biomarkers are longitudinally evaluated against canonical clinical reference intervals without fabricating forecasts.
          </p>
        </div>
      </div>
    </div>
  );
};
