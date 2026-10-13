import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FileText, 
  Minus, 
  ArrowDown, 
  ArrowUp, 
  MoreVertical, 
  Info, 
  Calendar
} from 'lucide-react';
import BiomarkerIcon from './BiomarkerIcon';
import { 
  evaluateBiomarkerStatus, 
  calculateBiomarkerChange, 
  getMetricVisualTheme,
  getYAxisConfig
} from './clinicalRules';

export interface ObservationPoint {
  date: string;
  displayDate: string;
  value: number;
  rawValue?: string;
  unit?: string;
  sourceText?: string | null;
  reportId?: number;
  reportName?: string;
}

export interface MetricCardData {
  id: string | number;
  parameter: string;
  displayName?: string;
  unit: string;
  observations: ObservationPoint[];
  direction?: string;
  validMeasurementCount: number;
  startDate?: string;
  endDate?: string;
  evidence?: string;
  dataQuality?: string;
  latestValue: number | null;
  latestRawValue?: string;
  firstValue: number | null;
  latestSourceText?: string | null;
}

interface MetricCardProps {
  data: MetricCardData;
  className?: string;
  onInspect?: (metric: MetricCardData) => void;
}

export default function MetricCard({ data, className = '', onInspect }: MetricCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const theme = getMetricVisualTheme(data.parameter);
  const evaluation = evaluateBiomarkerStatus(
    data.parameter,
    data.latestValue,
    data.unit,
    data.latestSourceText
  );

  const changeAnalysis = calculateBiomarkerChange(
    data.firstValue,
    data.latestValue,
    data.parameter
  );

  const yAxisConfig = getYAxisConfig(data.parameter);

  // Format chart points
  const chartPoints = (data.observations || []).map((obs) => {
    let shortDate = obs.date;
    try {
      const d = new Date(obs.date);
      if (!isNaN(d.getTime())) {
        shortDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
    } catch (e) {}

    return {
      date: shortDate,
      fullDate: obs.displayDate || obs.date,
      value: obs.value,
      rawValue: obs.rawValue || obs.value.toString(),
      unit: obs.unit || data.unit
    };
  });

  const gradientId = `area-grad-${data.parameter.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Custom Point Label to show numeric values above points (matches design reference)
  const renderPointLabel = (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;
    
    // Prevent overlapping if many points
    if (chartPoints.length > 6 && index % 2 !== 0 && index !== chartPoints.length - 1) {
      return null;
    }

    return (
      <text
        x={x}
        y={y - 7}
        fill={theme.chartColor}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        className="select-none"
      >
        {value}
      </text>
    );
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <p className="font-semibold text-slate-200">{item.fullDate || item.date}</p>
          <p className="text-sm font-bold text-emerald-400">
            {item.rawValue} {item.unit}
          </p>
          <p className="text-[10px] text-slate-400 border-t border-slate-700 pt-1 mt-1">
            Ref: {evaluation.referenceRangeText}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 sm:p-6 relative ${theme.cardBorderHover} ${className}`}
    >
      {/* SECTION A: CARD HEADER */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className={`w-11 h-11 rounded-xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
              aria-hidden="true"
            >
              <BiomarkerIcon parameterName={data.parameter} className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3 
                className="text-sm sm:text-base font-bold text-[#101B3D] tracking-tight leading-none whitespace-nowrap group-hover:text-indigo-950 transition-colors"
                title={data.displayName || data.parameter}
              >
                {data.displayName || data.parameter}
              </h3>
              <p className="text-xs text-[#64748B] font-medium leading-none mt-1">
                {data.unit || 'Standard Unit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto relative">
            {/* Status Badge */}
            <span 
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide shadow-2xs ${evaluation.badgeStyle.bg} ${evaluation.badgeStyle.text} ${evaluation.badgeStyle.border}`}
              title={evaluation.explanation}
            >
              <span className="text-[11px] font-black">{evaluation.badgeStyle.icon}</span>
              <span>{evaluation.statusLabel}</span>
            </span>

            {/* 3-Dot Action Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                aria-label={`Actions for ${data.parameter}`}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onInspect?.(data);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      View Historical Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onInspect?.(data);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-500" />
                      Clinical Reference Info
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SECTION B: COMPACT TREND CHART */}
        <div className="w-full py-1 my-1">
          {chartPoints.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No trend observation points available
            </div>
          ) : chartPoints.length === 1 ? (
            <div className="h-28 flex flex-col items-center justify-center text-slate-500 text-xs bg-slate-50/60 rounded-xl border border-slate-200/80 p-3 text-center">
              <span className="font-bold text-slate-800 text-sm mb-0.5">
                {chartPoints[0].rawValue} {data.unit}
              </span>
              <span className="text-[11px] text-slate-400">
                Single observation on {chartPoints[0].fullDate}. At least 2 points needed for trajectory line.
              </span>
            </div>
          ) : (
            <div className="h-28 sm:h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartPoints}
                  margin={{ top: 16, right: 12, left: -22, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.gradientFrom} stopOpacity={0.20} />
                      <stop offset="100%" stopColor={theme.gradientTo} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#F1F5F9" 
                  />

                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} 
                    dy={6}
                  />

                  <YAxis 
                    domain={yAxisConfig.domain as any}
                    ticks={yAxisConfig.ticks}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} 
                    dx={-2}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={theme.chartColor}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                    label={renderPointLabel}
                    dot={{
                      r: 4,
                      fill: theme.chartColor,
                      stroke: '#FFFFFF',
                      strokeWidth: 2
                    }}
                    activeDot={{
                      r: 6,
                      fill: theme.chartColor,
                      stroke: '#FFFFFF',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PANELS: SECTIONS C & D */}
      <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t border-slate-100/90">
        {/* SECTION C: LATEST-VALUE PANEL */}
        <button
          type="button"
          onClick={() => onInspect?.(data)}
          className="bg-[#F8FAFC] hover:bg-slate-100 rounded-xl px-3 py-2 border border-slate-200/70 text-left transition-colors flex items-center justify-between group/panel focus:outline-hidden focus:ring-2 focus:ring-indigo-500 min-w-0"
          title="Click to inspect latest observation details"
        >
          <div className="min-w-0 flex-1 pr-1">
            <p className="text-sm font-bold text-[#101B3D] leading-tight whitespace-nowrap">
              {data.latestRawValue !== undefined && data.latestRawValue !== null 
                ? `${data.latestRawValue} ${data.unit}`.trim() 
                : '—'}
            </p>
            <p className="text-[10px] text-[#64748B] font-medium leading-none mt-1 whitespace-nowrap">
              Latest Value
            </p>
          </div>
          <FileText className="w-4 h-4 text-slate-400 group-hover/panel:text-indigo-600 shrink-0 ml-1 transition-colors" />
        </button>

        {/* SECTION D: CHANGE-SUMMARY PANEL */}
        <div 
          className="bg-[#F8FAFC] rounded-xl px-3 py-2 border border-slate-200/70 flex items-center gap-1.5 min-w-0"
          title={`Starting observation: ${changeAnalysis.firstValueStr} ${data.unit} → Latest: ${changeAnalysis.latestValueStr} ${data.unit}`}
        >
          <div className="shrink-0">
            {changeAnalysis.iconType === 'minus' && (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
            {changeAnalysis.iconType === 'down' && (
              <ArrowDown className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            )}
            {changeAnalysis.iconType === 'up' && (
              <ArrowUp className="w-4 h-4 text-rose-500 stroke-[2.5]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#101B3D] leading-tight truncate">
              {changeAnalysis.bracketText}
            </p>
            <p className="text-[10px] text-[#64748B] font-medium leading-none mt-1 truncate">
              {changeAnalysis.interpretationText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
