import { generatePDFReport, ReportData } from '../utils/pdfExport';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, RefreshCw, AlertCircle, Printer } from 'lucide-react';
import { reportsService, Trend } from '../api/reports';


const getParameterColor = (paramName: string) => {
  const colors: Record<string, string> = {
    'hemoglobin': '#ef4444',
    'total_cholesterol': '#f59e0b',
    'ldl_cholesterol': '#f97316',
    'ldl': '#f97316',
    'hdl_cholesterol': '#10b981',
    'hdl': '#10b981',
    'triglycerides': '#8b5cf6',
    'fasting_glucose': '#3b82f6',
    'blood_glucose': '#3b82f6',
    'glucose': '#3b82f6',
    'hba1c': '#ec4899',
    'creatinine': '#06b6d4',
    'wbc': '#64748b',
    'platelets': '#eab308'
  };
  
  const normalized = paramName.toLowerCase().replace(/\s+/g, '_');
  if (colors[normalized]) return colors[normalized];
  
  const fallbackColors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
};

export default function Trends() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getTrends();
      setTrends(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  
  
  const handleExportPDF = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!trends || trends.length === 0) return;
    
    const sections: any[] = [];
    
    sections.push({
      type: 'text',
      title: 'Longitudinal Analysis Summary',
      content: 'This report provides a longitudinal analysis of key health metrics over time, including trend direction, data quality, and clinical evidence. Monitoring these trends allows for early detection of deviations from baseline health.'
    });

    sections.push({
      type: 'table',
      title: 'Longitudinal Trend Analysis',
      headers: ['Parameter', 'Trend', 'Evidence / Finding', 'Timeline', 'Quality'],
      rows: trends.map(t => [
        (t.parameter || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        (t.direction || '').toUpperCase(),
        t.evidence,
        `${t.start_date ? new Date(t.start_date).toLocaleDateString() : ''} - ${t.end_date ? new Date(t.end_date).toLocaleDateString() : ''}`,
        t.data_quality
      ])
    });

    const reportData = {
      title: 'Clinical Trends Report',
      subtitle: 'LONGITUDINAL ANALYSIS',
      metadata: {
        patientName: user?.name || 'Unknown Patient',
        patientId: user?.id || 'PT-' + Math.floor(Math.random() * 1000000),
        dob: 'Not Specified',
        gender: 'Not Specified',
        date: new Date().toLocaleDateString()
      },
      sections
    };

    generatePDFReport(reportData as ReportData, 'Longitudinal_Trends_Report.pdf', e.currentTarget);
  };


  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await reportsService.analyzeTrends();
      await fetchTrends();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleChart = async (parameter: string) => {
    if (expandedChart === parameter) {
      setExpandedChart(null);
      return;
    }
    
    setExpandedChart(parameter);
    setChartLoading(true);
    try {
      const data = await reportsService.getTrendChart(parameter);
      setChartData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-5 h-5 text-rose-500" />;
      case 'decreasing': return <TrendingDown className="w-5 h-5 text-emerald-500" />;
      case 'stable': return <Minus className="w-5 h-5 text-slate-500" />;
      default: return <Activity className="w-5 h-5 text-indigo-500" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-lg text-sm">
          <p className="font-semibold text-slate-900 mb-1">{label}</p>
          <p className="text-emerald-600 font-medium">Value: {payload[0].payload.raw_value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="trends-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Longitudinal Trends</h1>
          <p className="mt-1 text-slate-500">Analyze changes in your health metrics over time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            data-html2canvas-ignore="true"
            onClick={handleExportPDF}
            className="print:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="font-medium text-sm hidden sm:inline">Export PDF</span>
          </button>
          <button data-html2canvas-ignore="true" onClick={runAnalysis} disabled={analyzing} className="print:hidden inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {analyzing ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : 'Run Analysis'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Loading trends...</div>
      ) : trends.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No trends detected</h3>
          <p className="text-slate-500">A minimum of 3 valid measurements for a parameter is required to declare a trend.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => toggleChart(trend.parameter)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getDirectionIcon(trend.direction)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{trend.parameter}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {trend.valid_measurement_count} observations ({trend.start_date} to {trend.end_date})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                    {trend.evidence}
                  </div>
                  {trend.data_quality !== 'RELIABLE' && (
                    <div className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      {trend.data_quality}
                    </div>
                  )}
                </div>
              </div>

              {expandedChart === trend.parameter && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-4">
                  {chartLoading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">Loading chart data...</div>
                  ) : chartData.length > 0 ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dx={-10}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          {trend.parameter === 'blood_pressure' ? (
                            <>
                              <Line 
                                type="monotone" 
                                dataKey="systolic" 
                                name="Systolic"
                                stroke="#f43f5e" 
                                strokeWidth={3}
                                dot={{ fill: '#f43f5e', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="diastolic" 
                                name="Diastolic"
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                              />
                            </>
                          ) : (
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={getParameterColor(trend.parameter)} 
                              strokeWidth={3}
                              dot={{ fill: getParameterColor(trend.parameter), strokeWidth: 0, r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 0, fill: getParameterColor(trend.parameter) }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">No chart data available.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
