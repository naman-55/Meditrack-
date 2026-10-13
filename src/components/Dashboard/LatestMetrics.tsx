import React from 'react';
import { Activity, AlertCircle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { NormalizedParameter } from '../../analytics/types';

interface LatestMetricsProps {
  parameters?: NormalizedParameter[];
  isLoading?: boolean;
  error?: string;
}

export default function LatestMetrics({ parameters, isLoading, error }: LatestMetricsProps) {
  if (error) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[250px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A]">
          <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB]">Latest Metrics</h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 dark:text-[#FF5368] mb-2" />
          <p className="text-sm text-red-500 dark:text-[#FF5368] font-medium">Failed to load metrics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[250px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A]">
          <div className="h-5 w-32 bg-slate-200 dark:bg-[#102033] rounded animate-pulse"></div>
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 dark:bg-[#102033] rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-[#102033] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!parameters || parameters.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[250px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A]">
          <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB]">Latest Metrics</h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Activity className="w-10 h-10 text-slate-200 dark:text-[#20364A] mb-3" />
          <p className="text-sm text-slate-500 dark:text-[#7186A3]">No recent metrics available.</p>
        </div>
      </div>
    );
  }

  // Sort: out of range first, then by date
  const sortedParams = [...parameters].sort((a, b) => {
    const aIsOut = a.status === 'high' || a.status === 'low';
    const bIsOut = b.status === 'high' || b.status === 'low';
    if (aIsOut && !bIsOut) return -1;
    if (!aIsOut && bIsOut) return 1;
    return new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime();
  });

  // Take top 4 most unique by name
  const uniqueParams: NormalizedParameter[] = [];
  const seen = new Set();
  for (const p of sortedParams) {
    if (!seen.has(p.normalizedName)) {
      seen.add(p.normalizedName);
      uniqueParams.push(p);
      if (uniqueParams.length >= 4) break;
    }
  }

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[250px]">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
        <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB]">Latest Metrics</h4>
        <span className="text-[10px] font-bold text-slate-400 dark:text-[#7186A3] uppercase tracking-wider">Priority</span>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          {uniqueParams.map(param => (
            <div key={param.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  param.status === 'high' ? 'bg-[#FF5368]' :
                  param.status === 'low' ? 'bg-[#4BA3FF]' : 'bg-[#20D6A1]'
                }`}></div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-[#F1F5FB] capitalize">
                    {param.name.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-[#7186A3]">
                    {new Date(param.testedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-[#F1F5FB]">
                    {param.value} <span className="text-[10px] text-slate-400 dark:text-[#7186A3] font-normal">{param.unit}</span>
                  </span>
                  {param.status === 'high' && <span className="text-[10px] font-bold text-[#FF5368]">HIGH</span>}
                  {param.status === 'low' && <span className="text-[10px] font-bold text-[#4BA3FF]">LOW</span>}
                  {param.status === 'normal' && <span className="text-[10px] font-bold text-[#20D6A1]">NORMAL</span>}
                </div>
                {param.status === 'high' ? (
                  <TrendingUp className="w-4 h-4 text-[#FF5368]" />
                ) : param.status === 'low' ? (
                  <TrendingDown className="w-4 h-4 text-[#4BA3FF]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#20D6A1]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
