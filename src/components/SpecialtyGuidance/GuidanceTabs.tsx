import React from 'react';
import { 
  UsersRound, 
  FileText, 
  TrendingUp, 
  Layers, 
  History 
} from 'lucide-react';

export type GuidanceTabKey = 
  | 'recommended' 
  | 'findings' 
  | 'trends' 
  | 'all_parameters' 
  | 'previous';

interface GuidanceTabsProps {
  activeTab: GuidanceTabKey;
  onTabChange: (tab: GuidanceTabKey) => void;
  counts?: {
    recommended?: number;
    findings?: number;
    parameters?: number;
  };
}

export const GuidanceTabs: React.FC<GuidanceTabsProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  const tabs: Array<{ key: GuidanceTabKey; label: string; icon: React.ElementType; count?: number }> = [
    { key: 'recommended', label: 'Recommended Specialists', icon: UsersRound, count: counts?.recommended },
    { key: 'findings', label: 'Key Findings', icon: FileText, count: counts?.findings },
    { key: 'trends', label: 'Trends & Insights', icon: TrendingUp },
    { key: 'all_parameters', label: 'All Parameters', icon: Layers, count: counts?.parameters },
    { key: 'previous', label: 'Previous Recommendations', icon: History }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus:outline-hidden ${
              isActive
                ? 'bg-[#E6F7F3] text-[#00A884] border border-[#00A884]/30 shadow-2xs dark:bg-[#042724] dark:border-[#00D6B0] dark:text-[#00D6B0]'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#081729] dark:border-[#152A42] dark:text-[#94A9C2] dark:hover:bg-[#0D2038] dark:hover:text-white'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[#00A884] dark:text-[#00D6B0]' : 'text-slate-400 dark:text-[#8FA2BA]'}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                isActive ? 'bg-[#00A884]/15 text-[#00A884] dark:bg-[#00D6B0] dark:text-[#040D1A]' : 'bg-slate-100 text-slate-500 dark:bg-[#0B1B30] dark:border dark:border-[#152A42] dark:text-[#8297B2]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
