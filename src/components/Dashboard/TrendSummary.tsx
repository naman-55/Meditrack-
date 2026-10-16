import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TrendData {
  available: boolean;
  parameter?: string;
  direction?: string;
  valid_measurement_count?: number;
  start_date?: string;
  end_date?: string;
  percentageChange?: number;
  points?: { date: string; value: number }[];
}

export default function TrendSummary({ trend, isLoading, error }: { trend?: TrendData, isLoading?: boolean, error?: string }) {
  
  const chartData = useMemo(() => {
    if (!trend?.points) return [];
    return trend.points.map(p => {
      const d = new Date(p.date);
      return {
        date: p.date,
        shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: p.value
      };
    });
  }, [trend?.points]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[320px]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h4 className="font-bold text-slate-900">
          Trend Summary 
          {trend?.start_date && trend?.end_date && trend.available ? (
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({trend.start_date.substring(0, 7)} to {trend.end_date.substring(0, 7)})
            </span>
          ) : null}
        </h4>
      </div>
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-6 h-6 text-red-300 mb-2" />
          <p className="text-xs text-red-500 font-medium">Failed to load trends</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex flex-col justify-center animate-pulse">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="flex-1">
              <div className="h-4 w-2/3 bg-slate-200 rounded mb-1"></div>
              <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col gap-2">
            <div className="flex-1 w-full bg-slate-100 rounded"></div>
          </div>
        </div>
      ) : !trend || !trend.available || chartData.length < 2 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-full h-32 flex items-center justify-center mb-3">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={[{v: 10}, {v: 15}, {v: 8}, {v: 12}]}>
                 <Line type="monotone" dataKey="v" stroke="var(--chart-grid)" strokeWidth={3} dot={false} isAnimationActive={false} />
               </LineChart>
             </ResponsiveContainer>
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Not enough historical data</p>
          <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">Upload additional reports to generate analytical trends.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-5 shrink-0">
            <div className={`p-2.5 rounded-full ${trend.direction === 'improving' ? 'bg-emerald-100 text-emerald-600' : trend.direction === 'declining' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              {trend.direction === 'improving' ? <TrendingUp className="w-5 h-5" /> : trend.direction === 'declining' ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 capitalize leading-tight">{trend.parameter?.replace(/_/g, ' ')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 capitalize">{trend.direction === 'stable' ? 'Remained stable' : trend.direction}</p>
                {typeof trend.percentageChange === 'number' && !Number.isNaN(trend.percentageChange) && trend.percentageChange !== 0 && (
                  <span className={`text-xs font-semibold ${trend.direction === 'improving' ? 'text-emerald-600' : trend.direction === 'declining' ? 'text-rose-600' : 'text-slate-600'}`}>
                    ({trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="shortDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--chart-label)' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--chart-label)' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--chart-tooltip)', color: 'var(--chart-tooltip-foreground)', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--chart-tooltip-foreground)', marginBottom: '4px' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: '500' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Value"
                  stroke={trend.direction === 'improving' ? '#10b981' : trend.direction === 'declining' ? '#f43f5e' : '#64748b'} 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: 'var(--chart-dot-outline)' }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
