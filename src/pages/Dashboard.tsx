import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, AlertCircle, Printer } from 'lucide-react';
import SummaryCards from '../components/Dashboard/SummaryCards';
import HealthRiskOverview from '../components/Dashboard/HealthRiskOverview';
import RecentReports from '../components/Dashboard/RecentReports';
import LatestMetrics from '../components/Dashboard/LatestMetrics';
import RecommendedSpecialist from '../components/Dashboard/RecommendedSpecialist';
import NearbyCare from '../components/Dashboard/NearbyCare';
import DashboardAlerts from '../components/Dashboard/DashboardAlerts';
import TrendChart from '../components/Dashboard/TrendChart';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { reportsService } from '../api/reports';
import { generateDashboardAnalytics } from '../analytics';
import { useAuth } from '../context/AuthContext';
import { generatePDFReport, ReportData } from '../utils/pdfExport';


const getParameterColor = (paramName: string) => {
  const colors: Record<string, string> = {
    'hemoglobin': '#e63946',
    'total_cholesterol': '#f4a261',
    'ldl_cholesterol': '#e76f51',
    'ldl': '#e76f51',
    'hdl_cholesterol': '#2a9d8f',
    'hdl': '#2a9d8f',
    'triglycerides': '#9d4edd',
    'fasting_glucose': '#4361ee',
    'blood_glucose': '#4361ee',
    'glucose': '#4361ee',
    'hba1c': '#f72585',
    'creatinine': '#4cc9f0',
    'wbc': '#6c757d',
    'platelets': '#ffb703',
    'heart_rate': '#ff0a54',
    'spo2': '#00b4d8',
    'bmi': '#7209b7',
    'alt': '#4361ee',
    'ast': '#f72585',
    'sgpt': '#4361ee',
    'sgot': '#f72585'
  };
  
  const normalized = paramName.toLowerCase();
  
  // Try exact match first
  if (colors[normalized]) return colors[normalized];
  
  // Try substring match for alt/sgpt
  if (normalized.includes('alt') || normalized.includes('sgpt')) return colors['alt'];
  if (normalized.includes('ast') || normalized.includes('sgot')) return colors['ast'];
  
  const fallbackColors = ['#4cc9f0', '#4361ee', '#7209b7', '#f72585', '#e63946', '#f4a261', '#2a9d8f'];
  let hash = 0;
  for (let i = 0; i < paramName.length; i++) {
    hash = paramName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const [activeVitalTab, setActiveVitalTab] = useState<'bp' | 'hr' | 'other'>('bp');
  
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [measurementsData, setMeasurementsData] = useState<any[]>([]);
  const [risksData, setRisksData] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  
  
  
  const handleExportPDF = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!dashboardDisplayData) return;
    
    const sections: any[] = [];
    
    if (dashboardDisplayData.summary) {
      sections.push({
        type: 'text',
        title: 'Executive Summary',
        content: `This clinical summary is based on the analysis of ${dashboardDisplayData.summary.reportsUploaded} reports, tracking ${dashboardDisplayData.summary.parametersTracked} key health parameters. The overall data quality score is ${dashboardDisplayData.summary.dataQuality}%.`
      });
    }

    if (dashboardDisplayData.alerts && dashboardDisplayData.alerts.length > 0) {
      sections.push({
        type: 'table',
        title: 'Clinical Alerts',
        headers: ['Severity', 'Message', 'Source', 'Date'],
        rows: dashboardDisplayData.alerts.map((a: any) => [
          (a.severity || a.type || '').toUpperCase(), 
          a.message || '', 
          a.source || 'AI Analysis', 
          (a.date || a.created_at) ? new Date(a.date || a.created_at).toLocaleDateString() : ''
        ])
      });
    }

    if (dashboardDisplayData.parameters && dashboardDisplayData.parameters.length > 0) {
      const vitalsList = ['Blood Pressure Systolic', 'Blood Pressure Diastolic', 'Heart Rate', 'SpO2', 'BMI'];
      
      const vitals = dashboardDisplayData.parameters.filter((p: any) => vitalsList.includes(p.name));
      const labs = dashboardDisplayData.parameters.filter((p: any) => !vitalsList.includes(p.name));
      
      if (vitals.length > 0) {
        sections.push({
          type: 'table',
          title: 'Vitals & Measurements',
          headers: ['Parameter', 'Value', 'Unit', 'Status'],
          rows: vitals.map((p: any) => [
            p.name || '', 
            p.value !== null && p.value !== undefined ? p.value : p.latest_value || '-', 
            p.unit || '-', 
            (p.status || 'NORMAL').toUpperCase()
          ])
        });
      }
      
      if (labs.length > 0) {
        sections.push({
          type: 'table',
          title: 'Laboratory Results',
          headers: ['Parameter', 'Value', 'Unit', 'Status'],
          rows: labs.map((p: any) => [
            p.name || '', 
            p.value !== null && p.value !== undefined ? p.value : p.latest_value || '-', 
            p.unit || '-', 
            (p.status || 'NORMAL').toUpperCase()
          ])
        });
      }
    }

    if (dashboardDisplayData.riskOverview && dashboardDisplayData.riskOverview.length > 0) {
      sections.push({
        type: 'table',
        title: 'Risk Assessment',
        headers: ['Category', 'Risk Level', 'Details'],
        rows: dashboardDisplayData.riskOverview.map((r: any) => [
          r.domain || r.category || '',
          (r.level || r.risk_level || '').toUpperCase(),
          r.label || r.details || ''
        ])
      });
    }

    const reportData = {
      title: 'Clinical Health Summary',
      subtitle: 'CONFIDENTIAL MEDICAL REPORT',
      metadata: {
        patientName: user?.name || 'Unknown Patient',
        patientId: user?.id || 'PT-' + Math.floor(Math.random() * 1000000),
        dob: 'Not Specified', // Default fallback
        gender: 'Not Specified',
        date: new Date().toLocaleDateString()
      },
      sections
    };

    generatePDFReport(reportData as ReportData, 'Clinical_Health_Summary.pdf', e.currentTarget);
  };


  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [reports, measurements, risks, specialty] = await Promise.all([
        reportsService.getReports(),
        reportsService.getMeasurements(),
        reportsService.getRisks().catch(err => {
          console.error('Failed to load risk data:', err);
          return [];
        }),
        reportsService.getSpecialtyGuidance().catch(err => {
          console.error('Failed to load specialty guidance:', err);
          return [];
        })
      ]);
      setReportsData(reports);
      setMeasurementsData(measurements);
      setRisksData(risks || []);
      setSpecialtyData(specialty || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const localAnalytics = useMemo(() => {
    if (!reportsData.length && !measurementsData.length) return null;
    return generateDashboardAnalytics(reportsData, measurementsData);
  }, [reportsData, measurementsData]);

  const dashboardDisplayData = useMemo(() => {
    
    
    // Use localAnalytics
    if (!localAnalytics) return null;
    
    // Get top parameter for chart
    const params = Object.keys(localAnalytics.trends).filter(p => !['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate', 'spo2'].includes(p));
    let topParam = selectedParam;
    if (!topParam || !params.includes(topParam)) {
      topParam = params.length > 0 ? params[0] : null;
    }
    
    // Auto-select if selectedParam is missing
    if (topParam && topParam !== selectedParam) {
      setTimeout(() => setSelectedParam(topParam), 0);
    }
    const chartData = topParam ? {
      parameter: topParam,
      unit: localAnalytics.parameters.find(p => p.normalizedName === topParam)?.unit || '',
      data: localAnalytics.trends[topParam].points,
      color: getParameterColor(topParam)
    } : undefined;
    
    const sysTrend = localAnalytics.trends['blood_pressure_systolic'];
    const diaTrend = localAnalytics.trends['blood_pressure_diastolic'];
    let bpChartData = undefined;
    
    if (sysTrend && diaTrend) {
      // Merge points by date
      const bpPoints = [];
      const diaMap = new Map(diaTrend.points.map(p => [p.date, p.value]));
      for (const sys of sysTrend.points) {
        if (diaMap.has(sys.date)) {
          bpPoints.push({
            date: sys.date,
            systolic: sys.value,
            diastolic: diaMap.get(sys.date)
          });
        }
      }
      if (bpPoints.length >= 1) {
        bpChartData = {
          parameter: 'Blood Pressure',
          unit: 'mmHg',
          data: bpPoints
        };
      }
    }

    const hrTrend = localAnalytics.trends['heart_rate'];
    let hrChartData = undefined;
    if (hrTrend && hrTrend.points.length >= 1) {
      hrChartData = {
        parameter: 'Heart Rate',
        unit: 'bpm',
        data: hrTrend.points,
        color: getParameterColor('heart_rate')
      };
    }

    const spo2Trend = localAnalytics.trends['spo2'];
    let spo2ChartData = undefined;
    if (spo2Trend && spo2Trend.points.length >= 1) {
      spo2ChartData = {
        parameter: 'SpO2',
        unit: '%',
        data: spo2Trend.points,
        color: getParameterColor('spo2')
      };
    }
    
    // Add BMI as well just in case "imp" meant BMI
    const bmiTrend = localAnalytics.trends['bmi'];
    let bmiChartData = undefined;
    if (bmiTrend && bmiTrend.points.length >= 1) {
      bmiChartData = {
        parameter: 'BMI',
        unit: 'kg/m²',
        data: bmiTrend.points,
        color: getParameterColor('bmi')
      };
    }
    
    // Use validated backend risks if available, otherwise fallback to localAnalytics risk evaluation
    const resolvedRiskOverview = (risksData && risksData.length > 0)
      ? risksData.map((r: any) => ({
          domain: r.domain,
          level: r.level,
          label: r.label,
          dataQuality: r.data_quality || r.dataQuality
        }))
      : localAnalytics.riskOverview;

    const resolvedSpecialty = (specialtyData && specialtyData.length > 0)
      ? {
          available: true,
          suggested_specialty: specialtyData[0].suggested_specialty,
          reason: specialtyData[0].evidence
        }
      : undefined;

    return {
      summary: {
        reportsUploaded: localAnalytics.reportsCount,
        parametersTracked: localAnalytics.parametersTracked,
        activeAlerts: localAnalytics.activeAlerts,
        dataQuality: localAnalytics.dataQuality
      },
      alerts: localAnalytics.alerts,
      parameters: localAnalytics.parameters,
      chartData,
      bpChartData,
      hrChartData,
      spo2ChartData,
      bmiChartData,
      riskOverview: resolvedRiskOverview,
      specialtyGuidance: resolvedSpecialty,
      recentReports: localAnalytics.reports.slice(-5).map(r => ({
        id: r.id,
        name: r.reportName,
        date: r.testedAt,
        status: r.processingStatus
      })).reverse(),
      trendSummary: topParam ? {
        available: localAnalytics.trends[topParam].points.length >= 2,
        parameter: topParam,
        direction: localAnalytics.trends[topParam].direction,
        percentageChange: localAnalytics.trends[topParam].percentageChange,
        valid_measurement_count: localAnalytics.trends[topParam].points.length,
        start_date: localAnalytics.trends[topParam].points[0]?.date,
        end_date: localAnalytics.trends[topParam].points[localAnalytics.trends[topParam].points.length-1]?.date,
        points: localAnalytics.trends[topParam].points
      } : { available: false }
    } as any;
  }, [data, localAnalytics, selectedParam, risksData, specialtyData]);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div id="dashboard-content" className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="md:hidden print:hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#F1F5FB] leading-tight">Welcome back, <span className="text-emerald-700 dark:text-[#00D6B0]">{user?.name?.split(' ')[0]}</span> 👋</h2>
          <p className="text-sm text-gray-500 dark:text-[#8297B2] mt-1">Here's your health overview</p>
        </div>
        <div className="hidden md:block print:block">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F1F5FB] print:block">Health Overview Report</h1>
        </div>
        <button 
          data-html2canvas-ignore="true"
          onClick={handleExportPDF}
          className="print:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#102033] border border-slate-200 dark:border-[#20364A] text-slate-700 dark:text-[#B4C4D8] rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-[#162A3E] dark:hover:text-[#F1F5FB] transition-colors ml-auto"
        >
          <Printer className="w-4 h-4" />
          <span className="font-semibold text-sm hidden sm:inline">Export PDF</span>
        </button>
      </div>
      
      {error && !dashboardDisplayData ? (
        <div className="bg-red-50 dark:bg-[#2A0E14] border border-red-200 dark:border-[#801826] text-red-700 dark:text-[#FF5368] p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={loadData} className="px-3 py-1.5 bg-red-100 dark:bg-[#3D141C] hover:bg-red-200 dark:hover:bg-[#4E1A24] rounded-lg text-xs font-bold transition-colors">
            Retry
          </button>
        </div>
      ) : null}

      <ErrorBoundary title="Summary">
        <SummaryCards summary={dashboardDisplayData?.summary} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
      </ErrorBoundary>
      
      <ErrorBoundary title="Alerts">
        <DashboardAlerts alerts={dashboardDisplayData?.alerts} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
      </ErrorBoundary>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px] mb-6">
        <ErrorBoundary title="Primary Metric Trend">
          <div className="relative h-full flex flex-col">
            {localAnalytics && Object.keys(localAnalytics.trends).filter(p => !['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate', 'spo2'].includes(p)).length > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <select
                  value={selectedParam || ''}
                  onChange={(e) => setSelectedParam(e.target.value)}
                  className="block w-40 rounded-xl border border-slate-300 dark:border-[#20364A] bg-white dark:bg-[#102033] py-1.5 pl-3 pr-8 text-xs sm:text-sm text-slate-800 dark:text-[#F1F5FB] focus:border-[#00D6B0] focus:outline-none focus:ring-[#00D6B0]"
                >
                  {Object.keys(localAnalytics.trends)
                    .filter(p => !['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate', 'spo2'].includes(p))
                    .map(p => (
                    <option key={p} value={p}>
                      {localAnalytics.parameters.find(x => x.normalizedName === p)?.name || p}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TrendChart 
              title={dashboardDisplayData?.chartData?.parameter ? (localAnalytics?.parameters.find(x => x.normalizedName === dashboardDisplayData.chartData.parameter)?.name || dashboardDisplayData.chartData.parameter) : "Primary Metric"} 
              unit={dashboardDisplayData?.chartData?.unit}
              data={dashboardDisplayData?.chartData?.data as any} 
              isLoading={loading} 
              error={error && !dashboardDisplayData ? error : undefined} 
              type="single"
              color={dashboardDisplayData?.chartData?.color || "#0ea5e9"}
            />
          </div>
        </ErrorBoundary>

        <ErrorBoundary title="Vitals Trend">
          <div className="relative h-full flex flex-col bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200 dark:border-[#20364A] shadow-sm overflow-hidden min-h-[300px] transition-colors">
            {/* Custom Modern Header for Switcher */}
            <div className="p-4 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between z-10 shrink-0">
              <h4 className="font-bold text-slate-700 dark:text-[#F1F5FB] capitalize">Vitals Track</h4>
              <div className="flex bg-slate-100 dark:bg-[#102033] p-1 rounded-xl border border-transparent dark:border-[#20364A]">
                <button
                  onClick={() => setActiveVitalTab('bp')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeVitalTab === 'bp' 
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-[#00A88F] dark:text-white' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-[#8297B2] dark:hover:text-[#F1F5FB]'
                  }`}
                >
                  BP
                </button>
                <button
                  onClick={() => setActiveVitalTab('hr')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeVitalTab === 'hr' 
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-[#00A88F] dark:text-white' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-[#8297B2] dark:hover:text-[#F1F5FB]'
                  }`}
                >
                  Heart Rate
                </button>
                <button
                  onClick={() => setActiveVitalTab('other')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeVitalTab === 'other' 
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-[#00A88F] dark:text-white' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-[#8297B2] dark:hover:text-[#F1F5FB]'
                  }`}
                >
                  {dashboardDisplayData?.spo2ChartData ? "SpO2" : dashboardDisplayData?.bmiChartData ? "BMI" : "Other"}
                </button>
              </div>
            </div>

            {/* Render the selected chart, we will use a modified wrapper so TrendChart's own header is hidden or we just let TrendChart render but we can hide its header via CSS */}
            <div className="flex-1 w-full h-full relative [&>div]:border-none [&>div]:shadow-none [&>div>div:first-child]:hidden [&>div]:rounded-none">
              {activeVitalTab === 'bp' && (
                <TrendChart 
                  title="Blood Pressure" 
                  unit="mmHg"
                  data={dashboardDisplayData?.bpChartData?.data as any} 
                  isLoading={loading} 
                  error={error && !dashboardDisplayData ? error : undefined} 
                  type="dual"
                />
              )}
              {activeVitalTab === 'hr' && (
                <TrendChart 
                  title="Heart Rate" 
                  unit="bpm"
                  data={dashboardDisplayData?.hrChartData?.data as any} 
                  isLoading={loading} 
                  error={error && !dashboardDisplayData ? error : undefined} 
                  type="single"
                  color={dashboardDisplayData?.hrChartData?.color || "#ec4899"}
                />
              )}
              {activeVitalTab === 'other' && (
                <TrendChart 
                  title={dashboardDisplayData?.spo2ChartData ? "SpO2" : dashboardDisplayData?.bmiChartData ? "BMI" : "Important Parameter"} 
                  unit={dashboardDisplayData?.spo2ChartData ? "%" : dashboardDisplayData?.bmiChartData ? "kg/m²" : ""}
                  data={dashboardDisplayData?.spo2ChartData?.data || dashboardDisplayData?.bmiChartData?.data as any} 
                  isLoading={loading} 
                  error={error && !dashboardDisplayData ? error : undefined} 
                  type="single"
                  color={dashboardDisplayData?.spo2ChartData?.color || dashboardDisplayData?.bmiChartData?.color || "#8b5cf6"}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
        <div className="lg:col-span-7 h-full flex flex-col">
          <ErrorBoundary title="Recent Reports">
            <RecentReports reports={dashboardDisplayData?.recentReports} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-3 h-full flex flex-col">
          <ErrorBoundary title="Health Risk Overview">
            <HealthRiskOverview risks={dashboardDisplayData?.riskOverview} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
          </ErrorBoundary>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="h-full flex flex-col">
          <ErrorBoundary title="Latest Metrics">
            <LatestMetrics parameters={dashboardDisplayData?.parameters} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
          </ErrorBoundary>
        </div>
        <div className="h-full flex flex-col">
          <ErrorBoundary title="Recommended Specialist">
            <RecommendedSpecialist guidance={dashboardDisplayData?.specialtyGuidance} isLoading={loading} error={error && !dashboardDisplayData ? error : undefined} />
          </ErrorBoundary>
        </div>
        <div className="h-full flex flex-col">
          <ErrorBoundary title="Nearby Care">
            <NearbyCare />
          </ErrorBoundary>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-[#20364A] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-[#7186A3] mb-3" />
        <h5 className="font-bold text-slate-700 dark:text-[#F1F5FB] text-sm mb-1">Disclaimer</h5>
        <p className="text-xs text-slate-500 dark:text-[#7186A3] max-w-md leading-relaxed">
          This is an AI-assisted health analysis tool for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment.
        </p>
      </div>

      {/* @ts-ignore */}
      {import.meta.env.MODE === 'development' && localAnalytics && (
        <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col shadow-sm text-slate-300">
          <h5 className="font-bold text-white text-sm mb-3">Analytics Debug</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="block text-slate-500 mb-1">Reports</span>
              <span className="font-mono text-emerald-400">{localAnalytics.reportsCount}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Parameters Detected</span>
              <span className="font-mono text-emerald-400">{localAnalytics.parameters.length}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Trendable Parameters</span>
              <span className="font-mono text-emerald-400">{Object.keys(localAnalytics.trends).length}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Active Alerts</span>
              <span className="font-mono text-emerald-400">{localAnalytics.activeAlerts}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
