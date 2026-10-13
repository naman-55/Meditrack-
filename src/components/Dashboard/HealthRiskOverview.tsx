import React from 'react';
import { Activity, Heart, FileText, Shield, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';

export interface RiskIndicator {
  domain: string;
  level: string;
  label: string;
}

const riskLevelColors: Record<string, string> = {
  GREEN: 'text-emerald-600 dark:text-[#20D6A1] bg-emerald-50 dark:bg-[#20D6A1]/15',
  YELLOW: 'text-yellow-600 dark:text-[#F5B942] bg-yellow-50 dark:bg-[#F5B942]/15',
  ORANGE: 'text-orange-600 dark:text-[#F5B942] bg-orange-50 dark:bg-[#F5B942]/15',
  RED: 'text-red-600 dark:text-[#FF5368] bg-red-50 dark:bg-[#FF5368]/15',
  GREY: 'text-slate-500 dark:text-[#7186A3] bg-slate-50 dark:bg-[#102033]',
};

const riskLevelDots: Record<string, string> = {
  GREEN: 'bg-emerald-500 dark:bg-[#20D6A1]',
  YELLOW: 'bg-yellow-400 dark:bg-[#F5B942]',
  ORANGE: 'bg-orange-500 dark:bg-[#F5B942]',
  RED: 'bg-red-500 dark:bg-[#FF5368]',
  GREY: 'bg-slate-400 dark:bg-[#7186A3]',
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
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex justify-between items-center">
        <h4 className="text-lg font-bold text-slate-900 dark:text-[#F1F5FB] flex items-center gap-2">
          Health Risk Overview <span className="text-slate-400 dark:text-[#7186A3] font-normal text-sm cursor-help">ⓘ</span>
        </h4>
      </div>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 dark:text-[#FF5368] mb-2" />
          <p className="text-sm text-red-500 dark:text-[#FF5368] font-medium">Failed to load risk data.</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 p-5 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-[#20364A]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#14283B]"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-[#14283B] rounded"></div>
              </div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-[#14283B] rounded"></div>
            </div>
          ))}
        </div>
      ) : !isDataAvailable ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 dark:border-[#20364A] flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-slate-300 dark:text-[#7186A3]" />
          </div>
          <h5 className="text-lg font-semibold text-slate-800 dark:text-[#F1F5FB]">Risk assessment is not available yet.</h5>
          <p className="text-sm text-slate-500 dark:text-[#7186A3] max-w-sm mt-2 leading-relaxed">
            Medical risk analysis and qualitative indicators will appear here once sufficient data is analyzed.
          </p>
          <div className="mt-6 flex gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-[#102033] border border-slate-200 dark:border-[#20364A] rounded-lg text-[10px] font-medium text-slate-400 dark:text-[#A6B8CF]">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-[#7186A3]"></span>
              INSUFFICIENT DATA
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-5 space-y-3">
          {risks.map((item, idx) => {
            const Icon = getIconForDomain(item.domain);
            const levelColor = riskLevelColors[item.level] || riskLevelColors['GREY'];
            const dotColor = riskLevelDots[item.level] || riskLevelDots['GREY'];
            
            return (
              <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-[#20364A] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border border-transparent dark:border-[#20364A]", levelColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-[#F1F5FB] text-sm capitalize">{item.domain}</span>
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
        <div className="p-4 border-t border-slate-100 dark:border-[#20364A] bg-slate-50 dark:bg-[#102033] rounded-b-2xl flex justify-center">
          <a href="/risk-assessment" className="text-sm font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:underline flex items-center gap-1 transition-colors">
            View Full Assessment <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </div>
  );
}
