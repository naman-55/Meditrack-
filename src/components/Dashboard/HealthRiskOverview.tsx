import React from 'react';
import { Activity, Heart, FileText, Shield, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Skeleton } from '../common/Skeleton';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';

export interface RiskIndicator {
  domain: string;
  level: string;
  label: string;
  dataQuality?: string;
  missingRequirements?: string[];
}

const riskLevelColors: Record<string, string> = {
  GREEN: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-[#042724] dark:text-[#00D6B0] dark:border-[#00D6B0]/40',
  YELLOW: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-[#281B09] dark:text-[#F5A623] dark:border-[#7A5E1C]/60',
  ORANGE: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-[#2A1508] dark:text-[#FB923C] dark:border-[#9A3412]/60',
  RED: 'text-red-700 bg-red-50 border-red-200 dark:bg-[#2D1017] dark:text-[#FF4D6D] dark:border-[#801826]/60',
  GREY: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-[#0B1B30] dark:text-[#8297B2] dark:border-[#152A42]',
};

const riskLevelDots: Record<string, string> = {
  GREEN: 'bg-emerald-500 dark:bg-[#00D6B0]',
  YELLOW: 'bg-amber-400 dark:bg-[#F5A623]',
  ORANGE: 'bg-orange-500 dark:bg-[#FB923C]',
  RED: 'bg-red-500 dark:bg-[#FF4D6D]',
  GREY: 'bg-slate-400 dark:bg-[#8297B2]',
};

const getQualityBadge = (quality?: string) => {
  const q = (quality || '').toUpperCase();
  if (q === 'RELIABLE' || q === 'SUFFICIENT') {
    return { label: 'SUFFICIENT', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#042724] dark:text-[#00D6B0] dark:border-[#00D6B0]/30' };
  }
  if (q === 'PARTIAL') {
    return { label: 'PARTIAL', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#281B09] dark:text-[#F5A623] dark:border-[#7A5E1C]/40' };
  }
  return { label: 'INSUFFICIENT', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#0B1B30] dark:text-[#8297B2] dark:border-[#152A42]' };
};

const getIconForDomain = (domain: string) => {
  const d = domain.toLowerCase();
  if (d.includes('cardio') || d.includes('heart')) return Heart;
  if (d.includes('metabolic') || d.includes('glucose')) return Activity;
  if (d.includes('renal') || d.includes('kidney')) return FileText;
  if (d.includes('hemato') || d.includes('blood')) return ClipboardList;
  return Shield;
};

export default function HealthRiskOverview({ risks, isLoading, error }: { risks?: RiskIndicator[], isLoading?: boolean, error?: string }) {
  const isDataAvailable = risks && risks.length > 0;

  return (
    <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200 dark:border-[#152A42] shadow-sm flex flex-col h-full min-h-[300px] transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-[#152A42] flex justify-between items-center">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-[#FFFFFF] flex items-center gap-2">
            Health Risk Overview
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#8297B2] mt-0.5">Rules-based clinical domain evaluations</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0B1B30] text-slate-600 dark:text-[#8297B2] border border-transparent dark:border-[#152A42]">v2.0</span>
      </div>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 dark:text-[#FF4D6D] mb-2" />
          <p className="text-sm text-red-600 dark:text-[#FF4D6D] font-medium">Failed to load risk data.</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 p-5 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-[#152A42]">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : !isDataAvailable ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 dark:border-[#152A42] flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-slate-300 dark:text-[#8297B2]" />
          </div>
          <h5 className="text-sm font-semibold text-slate-800 dark:text-white">No Risk Assessments Available</h5>
          <p className="text-xs text-slate-500 dark:text-[#8297B2] max-w-xs mt-1 leading-relaxed">
            Upload medical laboratory reports to evaluate clinical risk across Cardiovascular, Metabolic, Renal, and Hematologic domains.
          </p>
          <div className="mt-4">
            <a
              href="/reports"
              className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00D6B0] dark:hover:bg-[#00A88F] text-white dark:text-[#040D1A] text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Upload Report &rarr;
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-3">
          {risks.map((item, idx) => {
            const Icon = getIconForDomain(item.domain);
            const levelKey = (item.level || 'GREY').toUpperCase();
            const levelStyle = riskLevelColors[levelKey] || riskLevelColors['GREY'];
            const dotColor = riskLevelDots[levelKey] || riskLevelDots['GREY'];
            const qualityBadge = getQualityBadge(item.dataQuality);
            
            return (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#152A42] bg-[#F8FAFC]/50 dark:bg-[#050E1A] hover:border-slate-200 dark:hover:border-[#00D6B0]/30 hover:bg-slate-50/50 dark:hover:bg-[#0D2038] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", levelStyle)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-[#FFFFFF] text-sm capitalize truncate">{item.domain}</span>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.2 rounded border", qualityBadge.className)}>
                        {qualityBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#8297B2] truncate max-w-[200px] sm:max-w-[240px]" title={item.label}>
                      {item.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5", levelStyle)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                    {levelKey}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isDataAvailable && (
        <div className="p-3 border-t border-slate-100 dark:border-[#152A42] bg-slate-50/70 dark:bg-[#050E1A] rounded-b-xl flex justify-between items-center px-4">
          <span className="text-[11px] text-slate-500 dark:text-[#8297B2]">4 Health Domains</span>
          <a href="/risk-assessment" className="text-xs font-semibold text-emerald-600 dark:text-[#00D6B0] hover:text-emerald-700 dark:hover:text-[#20D6A1] flex items-center gap-1 transition-colors">
            <span>View Full Clinical Evaluation</span> <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </div>
  );
}
