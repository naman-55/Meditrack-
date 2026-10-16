import React, { useMemo } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';
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
      <div className="bg-white dark:bg-[#081729] rounded-xl border border-slate-200 dark:border-[#152A42] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between">
          <h4 className="font-bold text-slate-700 dark:text-white capitalize">{title}</h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 dark:text-[#FF4D6D] mb-2" />
          <p className="text-sm text-red-500 dark:text-[#FF4D6D] font-medium">Failed to load chart data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#081729] rounded-xl border border-slate-200 dark:border-[#152A42] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <div className="flex-1 p-5 flex items-end gap-3">
          <Skeleton className="w-full h-1/4 rounded-t-lg" />
          <Skeleton className="w-full h-2/4 rounded-t-lg" />
          <Skeleton className="w-full h-3/4 rounded-t-lg" />
          <Skeleton className="w-full h-full rounded-t-lg" />
          <Skeleton className="w-full h-3/5 rounded-t-lg" />
          <Skeleton className="w-full h-4/5 rounded-t-lg" />
        </div>
        <div className="p-4 border-t border-slate-50 dark:border-[#152A42] flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#081729] rounded-xl border border-slate-200 dark:border-[#152A42] shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between">
          <h4 className="font-bold text-slate-700 dark:text-white capitalize">
            {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 dark:text-[#8297B2] font-normal text-xs ml-1">({unit})</span>}
          </h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Activity className="w-10 h-10 text-slate-200 dark:text-[#8297B2] mb-3" />
          <h5 className="text-base font-semibold text-slate-800 dark:text-white">Insufficient Data</h5>
          <p className="text-xs text-slate-500 dark:text-[#8297B2] max-w-[250px] mt-2 leading-relaxed">
            Upload at least two reports with {title?.replace(/_/g, ' ').toLowerCase()} measurements to see a longitudinal trend.
          </p>
        </div>
      </div>
    );
  }

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const gridStroke = isDarkMode ? '#152A42' : '#f1f5f9';
  const tickColor = isDarkMode ? '#8297B2' : '#64748b';

  return (
    <div className="bg-white dark:bg-[#081729] rounded-xl border border-slate-200 dark:border-[#152A42] shadow-sm flex flex-col h-full min-h-[300px] transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between shrink-0">
        <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] capitalize">
          {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 dark:text-[#8297B2] font-normal text-xs ml-1">({unit})</span>}
        </h4>
        {type === 'dual' && (
          <div className="flex gap-3 text-[10px] font-bold text-slate-500 dark:text-[#8297B2]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> SYS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> DIA</span>
          </div>
        )}
      </div>
      <div className="flex-1 relative w-full h-full p-5 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'single' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorValue-${title?.replace(/[^a-zA-Z0-9]/g, '') || 'chart'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  backgroundColor: isDarkMode ? '#102033' : '#ffffff',
                  borderColor: isDarkMode ? '#20364A' : '#e2e8f0', 
                  fontSize: '12px', 
                  boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.25)',
                  color: isDarkMode ? '#F1F5FB' : '#334155'
                }}
                labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#F1F5FB' : '#334155', marginBottom: '4px' }}
                itemStyle={{ color: color, fontWeight: 600, textTransform: 'capitalize' }}
                formatter={(value: number) => [`${value} ${unit || ''}`, title?.replace(/_/g, ' ')]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill={`url(#colorValue-${title?.replace(/[^a-zA-Z0-9]/g, '') || 'chart'})`} 
                dot={{ r: 4, fill: color, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  backgroundColor: isDarkMode ? '#102033' : '#ffffff',
                  borderColor: isDarkMode ? '#20364A' : '#e2e8f0', 
                  fontSize: '12px', 
                  boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.25)',
                  color: isDarkMode ? '#F1F5FB' : '#334155'
                }}
                labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#F1F5FB' : '#334155', marginBottom: '4px' }}
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
