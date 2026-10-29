import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Play, 
  RefreshCw, 
  ChevronDown, 
  Check, 
  Filter,
  Sparkles
} from 'lucide-react';

export type DateRangePreset = 
  | 'primary' // Aug 01, 2026 – Aug 29, 2026
  | 'all'     // All available data
  | '30d'     // Last 30 days
  | '90d'     // Last 90 days
  | '180d';   // Last 6 months

export interface DateRangeOption {
  id: DateRangePreset;
  label: string;
  displayRange: string;
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { id: 'primary', label: 'Primary Period', displayRange: 'Aug 01, 2026 – Aug 29, 2026' },
  { id: 'all', label: 'All Available History', displayRange: 'Complete Historical Baseline' },
  { id: '30d', label: 'Last 30 Days', displayRange: 'Recent 30 Days' },
  { id: '90d', label: 'Last 90 Days', displayRange: 'Recent Quarter (90 Days)' },
  { id: '180d', label: 'Last 6 Months', displayRange: 'Recent 6 Months' }
];

export type PanelViewMode = 'primary_five' | 'all' | 'liver_renal' | 'metabolic_lipid' | 'hematology';

interface TrendsHeaderProps {
  selectedDatePreset: DateRangePreset;
  onSelectDatePreset: (preset: DateRangePreset) => void;
  activeDateRangeText: string;
  viewMode: PanelViewMode;
  onSelectViewMode: (mode: PanelViewMode) => void;
  onExportPDF: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  isExporting?: boolean;
}

export default function TrendsHeader({
  selectedDatePreset,
  onSelectDatePreset,
  activeDateRangeText,
  viewMode,
  onSelectViewMode,
  onExportPDF,
  onRunAnalysis,
  isAnalyzing,
  isExporting = false
}: TrendsHeaderProps) {
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      {/* LEFT SIDE: ICON + TITLE + SUBTITLE */}
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#635BFF] flex items-center justify-center shrink-0 shadow-2xs"
          aria-hidden="true"
        >
          <TrendingUp className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-tight">
            Longitudinal Trends
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
            Analyze how your health metrics change over time.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: DATE-RANGE SELECTOR + EXPORT PDF + RUN ANALYSIS */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* PANEL / FILTER TOGGLE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setFilterDropdownOpen(!filterDropdownOpen);
              setDateDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter biomarker panels"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Panel:</span>
            <span className="text-indigo-600 font-bold">
              {viewMode === 'primary_five' ? 'Key Panel (5)' :
               viewMode === 'all' ? 'All (13)' :
               viewMode === 'liver_renal' ? 'Liver & Renal' :
               viewMode === 'metabolic_lipid' ? 'Metabolic & Lipids' : 'CBC'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {filterDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setFilterDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-11 z-30 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Metric View
                </div>
                {[
                  { id: 'primary_five', label: 'Primary Key Panel (5 metrics)', desc: 'ALT, AST, Creatinine, Glucose, HDL' },
                  { id: 'all', label: 'All Tracked Biomarkers (13 metrics)', desc: 'Complete clinical archive' },
                  { id: 'liver_renal', label: 'Liver & Kidney Panel', desc: 'ALT, AST, Creatinine' },
                  { id: 'metabolic_lipid', label: 'Metabolic & Lipid Panel', desc: 'Glucose, HDL, LDL, Chol, TG' },
                  { id: 'hematology', label: 'Complete Blood Count (CBC)', desc: 'Hb, PCV, Platelets, RBC, WBC' }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelectViewMode(option.id as PanelViewMode);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      viewMode === option.id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-[10px] text-slate-400">{option.desc}</div>
                    </div>
                    {viewMode === option.id && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* DATE-RANGE SELECTOR DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDateDropdownOpen(!dateDropdownOpen);
              setFilterDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Select date range filter"
            aria-expanded={dateDropdownOpen}
          >
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[210px]">
              {activeDateRangeText}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dateDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setDateDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-11 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Date Range Filter
                </div>
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectDatePreset(opt.id);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between ${
                      selectedDatePreset === opt.id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.displayRange}</div>
                    </div>
                    {selectedDatePreset === opt.id && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* EXPORT PDF BUTTON */}
        <button
          type="button"
          onClick={onExportPDF}
          disabled={isExporting}
          data-html2canvas-ignore="true"
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          title="Export displayed longitudinal health analytics to PDF"
        >
          {isExporting ? (
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse mr-1" />
          ) : (
            <Download className="w-4 h-4 text-slate-600" />
          )}
          <span>Export PDF</span>
        </button>

        {/* RUN ANALYSIS PRIMARY BUTTON */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          data-html2canvas-ignore="true"
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white rounded-xl font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
