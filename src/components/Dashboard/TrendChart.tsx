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
  color = '#0ea5e9'
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-700 capitalize">{title}</h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
          <p className="text-sm text-red-500 font-medium">Failed to load chart data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-5 flex items-end gap-2 animate-pulse">
          <div className="w-full h-1/4 bg-slate-100 rounded-t"></div>
          <div className="w-full h-2/4 bg-slate-100 rounded-t"></div>
          <div className="w-full h-3/4 bg-slate-100 rounded-t"></div>
          <div className="w-full h-full bg-slate-100 rounded-t"></div>
          <div className="w-full h-1/2 bg-slate-100 rounded-t"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-700 capitalize">
            {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 font-normal text-xs ml-1">({unit})</span>}
          </h4>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Activity className="w-10 h-10 text-slate-200 mb-3" />
          <h5 className="text-base font-semibold text-slate-800">Insufficient Data</h5>
          <p className="text-xs text-slate-500 max-w-[250px] mt-2 leading-relaxed">
            Upload at least two reports with {title?.replace(/_/g, ' ').toLowerCase()} measurements to see a longitudinal trend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h4 className="font-bold text-slate-700 capitalize">
          {title?.replace(/_/g, ' ')} {unit && <span className="text-slate-400 font-normal text-xs ml-1">({unit})</span>}
        </h4>
        {type === 'dual' && (
          <div className="flex gap-3 text-[10px] font-bold text-slate-500">
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
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ color: color, fontWeight: 600, textTransform: 'capitalize' }}
                formatter={(value: number) => [`${value} ${unit || ''}`, title?.replace(/_/g, ' ')]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#colorValue-${title?.replace(/[^a-zA-Z0-9]/g, '') || 'chart'})`} 
                dot={{ r: 4, fill: color, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                 animationDuration={1500}
                 animationEasing="ease-in-out"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="shortDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
