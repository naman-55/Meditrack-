import React, { useMemo } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface TrendChartDataPoint {
  date: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
}

export interface TrendChartProps {
  title: string;
  unit?: string | null;
  data?: TrendChartDataPoint[];
  isLoading?: boolean;
  error?: string;
  type?: 'single' | 'dual';
  color?: string;
}

export default function TrendChart({ 
  title, 
  unit, 
  data, 
  isLoading, 
  error,
  type = 'single',
  color = '#00D6B0'
}: TrendChartProps) {

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(d => {
      const dateObj = new Date(d.date);
      return {
        ...d,
        shortDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [data]);

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
          <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] capitalize">{title}</h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 dark:text-[#FF5368] mb-2" />
          <p className="text-sm text-red-500 dark:text-[#FF5368] font-medium">Failed to load chart data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 dark:bg-[#102033] rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-5 flex items-end gap-2 animate-pulse">
          <div className="w-full h-1/4 bg-slate-100 dark:bg-[#102033] rounded-t"></div>
          <div className="w-full h-2/4 bg-slate-100 dark:bg-[#102033] rounded-t"></div>
          <div className="w-full h-3/4 bg-slate-100 dark:bg-[#102033] rounded-t"></div>
          <div className="w-full h-full bg-slate-100 dark:bg-[#102033] rounded-t"></div>
          <div className="w-full h-1/2 bg-slate-100 dark:bg-[#102033] rounded-t"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between">
          <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] capitalize">
            {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 dark:text-[#7186A3] font-normal text-xs ml-1">({unit})</span>}
          </h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Activity className="w-10 h-10 text-slate-200 dark:text-[#20364A] mb-3" />
          <h5 className="text-base font-semibold text-slate-800 dark:text-[#F1F5FB]">Insufficient Data</h5>
          <p className="text-xs text-slate-500 dark:text-[#7186A3] max-w-[250px] mt-2 leading-relaxed">
            Upload at least two reports with {title?.replace(/_/g, ' ').toLowerCase()} measurements to see a longitudinal trend.
          </p>
        </div>
      </div>
    );
  }

  const chartGradientId = `colorValue-${title?.replace(/[^a-zA-Z0-9]/g, '') || 'chart'}`;

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="p-5 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between shrink-0">
        <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] capitalize">
          {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 dark:text-[#7186A3] font-normal text-xs ml-1">({unit})</span>}
        </h4>
        {type === 'dual' && (
          <div className="flex gap-3 text-[10px] font-bold text-slate-500 dark:text-[#A6B8CF]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5368]"></span> SYS</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2684FF]"></span> DIA</span>
          </div>
        )}
      </div>
      <div className="flex-1 relative w-full h-full p-5 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'single' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.45}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--chart-label)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--chart-label)' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--chart-tooltip)', 
                  color: 'var(--chart-tooltip-foreground)', 
                  fontSize: '12px', 
                  boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.4)' 
                }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--chart-tooltip-foreground)', marginBottom: '4px' }}
                itemStyle={{ color: color, fontWeight: 600, textTransform: 'capitalize' }}
                formatter={(value: number) => [`${value} ${unit || ''}`, title?.replace(/_/g, ' ')]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill={`url(#${chartGradientId})`} 
                dot={{ r: 3.5, fill: color, strokeWidth: 0 }} 
                activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#0D1B2A', fill: color }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--chart-label)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--chart-label)' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--chart-tooltip)', 
                  color: 'var(--chart-tooltip-foreground)', 
                  fontSize: '12px', 
                  boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.4)' 
                }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--chart-tooltip-foreground)', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#FF5368" strokeWidth={2.5} dot={{ r: 3.5, fill: '#FF5368', strokeWidth: 0 }} activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#0D1B2A', fill: '#FF5368' }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#2684FF" strokeWidth={2.5} dot={{ r: 3.5, fill: '#2684FF', strokeWidth: 0 }} activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#0D1B2A', fill: '#2684FF' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
