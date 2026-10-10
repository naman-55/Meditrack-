import React from 'react';
import { Activity, Heart, FileText, ClipboardList, Shield, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';

export interface RiskIndicator {
  domain: string;
  level: string;
  label: string;
}

const riskLevelColors: Record<string, string> = {
  GREEN: 'text-emerald-600 bg-emerald-50',
  YELLOW: 'text-yellow-600 bg-yellow-50',
  ORANGE: 'text-orange-600 bg-orange-50',
  RED: 'text-red-600 bg-red-50',
  GREY: 'text-slate-500 bg-slate-50',
};

const riskLevelDots: Record<string, string> = {
  GREEN: 'bg-emerald-500',
  YELLOW: 'bg-yellow-400',
  ORANGE: 'bg-orange-500',
  RED: 'bg-red-500',
  GREY: 'bg-slate-400',
};

const getIconForDomain = (domain: string) => {
  if (domain.toLowerCase().includes('cardio') || domain.toLowerCase().includes('heart')) return Heart;
  if (domain.toLowerCase().includes('metabolic')) return Activity;
  if (domain.toLowerCase().includes('kidney')) return FileText;
  return Shield;
};

export default function HealthRiskOverview({ risks, isLoading, error }: { risks?: RiskIndicator[], isLoading?: boolean, error?: string }) {
  const isDataAvailable = risks && risks.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Health Risk Overview <span className="text-slate-400 font-normal text-sm cursor-help">ⓘ</span>
        </h4>
      </div>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
          <p className="text-sm text-red-500 font-medium">Failed to load risk data.</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 p-5 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !isDataAvailable ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-slate-300" />
          </div>
          <h5 className="text-lg font-semibold text-slate-800">Risk assessment is not available yet.</h5>
          <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
            Medical risk analysis and qualitative indicators will appear here once sufficient data is analyzed.
          </p>
          <div className="mt-6 flex gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              INSUFFICIENT DATA
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-5 space-y-4">
          {risks.map((item, idx) => {
            const Icon = getIconForDomain(item.domain);
            const levelColor = riskLevelColors[item.level] || riskLevelColors['GREY'];
            const dotColor = riskLevelDots[item.level] || riskLevelDots['GREY'];
            
            return (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", levelColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-900 text-sm capitalize">{item.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", levelColor.split(' ')[0])}>
                    {item.label}
                  </span>
                  <div className={cn("w-2.5 h-2.5 rounded-full", dotColor)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isDataAvailable && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-center">
          <a href="/risk-assessment" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
            View Full Assessment <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </div>
  );
}
