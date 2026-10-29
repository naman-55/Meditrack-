import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertCircle, 
  AlertTriangle,
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  HelpCircle,
  Activity,
  Calendar,
  Layers,
  Database,
  ShieldCheck,
  LineChart
} from 'lucide-react';
import { reportsService, FutureOutlook } from '../api/reports';
import { FutureOutlookSkeleton } from '../components/common/Skeleton';

export default function FutureOutlookPage() {
  const [forecasts, setForecasts] = useState<FutureOutlook[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AVAILABLE' | 'TREND' | 'INSUFFICIENT'>('ALL');

  useEffect(() => {
    fetchOutlook();
  }, []);

  const fetchOutlook = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await reportsService.getOutlook();
      setForecasts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load forecasts:', err);
      setErrorMsg(err.message || 'Unable to connect to the medical forecasting engine.');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      await reportsService.analyzeOutlook();
      await fetchOutlook();
    } catch (err: any) {
      console.error('Analysis execution failed:', err);
      setErrorMsg(err.message || 'Analysis failed. Please check that your laboratory reports are validated.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Distinct Status Presentation mapping (Phase 4 requirement: Anti-all-grey & Dark Palette Match)
  const getStatusBadge = (status?: string, confidence?: string) => {
    switch (status) {
      case 'FORECAST_AVAILABLE':
        return {
          label: 'Forecast Available',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border-[#075E56]',
          dot: 'bg-emerald-500 dark:bg-[#00D6B0]'
        };
      case 'TREND_AVAILABLE':
        return {
          label: 'Historical Trend Only',
          classes: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold dark:bg-[#0B2254]/60 dark:text-[#2684FF] dark:border-[#2684FF]/40',
          dot: 'bg-blue-500 dark:bg-[#2684FF]'
        };
      case 'DATA_QUALITY_WARNING':
        return {
          label: 'Data Quality Review',
          classes: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold dark:bg-[#201F1A] dark:text-[#F5B942] dark:border-[#8B7028]/60',
          dot: 'bg-amber-500 dark:bg-[#F5B942]'
        };
      case 'INSUFFICIENT_DATA':
        return {
          label: 'Insufficient History',
          classes: 'bg-amber-50/70 text-amber-900 border-amber-200 dark:bg-[#201F1A] dark:text-[#F5B942] dark:border-[#8B7028]/50',
          dot: 'bg-amber-400 dark:bg-[#F5B942]'
        };
      case 'NO_DATA':
        return {
          label: 'No Measurements Found',
          classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#102033] dark:text-[#8297B2] dark:border-[#20364A]',
          dot: 'bg-slate-400 dark:bg-[#8297B2]'
        };
      case 'ANALYSIS_ERROR':
      case 'INVALID_DATA':
        return {
          label: 'Processing Issue',
          classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-[#2A0E14] dark:text-[#FF5368] dark:border-[#801826]',
          dot: 'bg-rose-500 dark:bg-[#FF5368]'
        };
      default:
        // Graceful fallback for legacy records
        if (confidence === 'HIGH' || confidence === 'MEDIUM' || confidence === 'LOW') {
          return {
            label: 'Forecast Available',
            classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border-[#075E56]',
            dot: 'bg-emerald-500 dark:bg-[#00D6B0]'
          };
        }
        return {
          label: 'Insufficient Data',
          classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#102033] dark:text-[#8297B2] dark:border-[#20364A]',
          dot: 'bg-slate-400 dark:bg-[#8297B2]'
        };
    }
  };

  const getDirectionVisual = (direction: string) => {
    switch (direction) {
      case 'INCREASING':
        return {
          icon: <TrendingUp className="w-4 h-4 text-rose-600 dark:text-[#FF5368]" />,
          label: 'Increasing',
          textColor: 'text-rose-700 dark:text-[#FF5368] font-medium'
        };
      case 'DECREASING':
        return {
          icon: <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-[#20D6A1]" />,
          label: 'Decreasing',
          textColor: 'text-emerald-700 dark:text-[#20D6A1] font-medium'
        };
      case 'STABLE':
        return {
          icon: <Minus className="w-4 h-4 text-blue-600 dark:text-[#2684FF]" />,
          label: 'Stable (Baseline)',
          textColor: 'text-blue-700 dark:text-[#2684FF] font-medium'
        };
      case 'NO_CLEAR_TREND':
        return {
          icon: <Activity className="w-4 h-4 text-amber-600 dark:text-[#F5B942]" />,
          label: 'Fluctuating / Indeterminate',
          textColor: 'text-amber-700 dark:text-[#F5B942] font-medium'
        };
      case 'GREY':
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-slate-400 dark:text-[#8297B2]" />,
          label: 'Indeterminate',
          textColor: 'text-slate-500 dark:text-[#8297B2]'
        };
    }
  };

  const parseJsonSafe = (jsonStr: string | null | undefined, fallback: any = null) => {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return fallback;
    }
  };

  const filteredForecasts = forecasts.filter((f) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'AVAILABLE') return f.status === 'FORECAST_AVAILABLE';
    if (activeFilter === 'TREND') return f.status === 'TREND_AVAILABLE';
    if (activeFilter === 'INSUFFICIENT') return f.status === 'INSUFFICIENT_DATA' || f.status === 'NO_DATA';
    return true;
  });

  const availableCount = forecasts.filter(f => f.status === 'FORECAST_AVAILABLE').length;
  const trendCount = forecasts.filter(f => f.status === 'TREND_AVAILABLE').length;
  const insufficientCount = forecasts.filter(f => f.status === 'INSUFFICIENT_DATA' || f.status === 'NO_DATA').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section with execution controls */}
      <div className="flex justify-between items-start md:items-center flex-wrap gap-4 border-b border-slate-200 dark:border-[#20364A] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00A884]/10 dark:bg-[#062E2D] text-[#00A884] dark:text-[#00D6B0] flex items-center justify-center">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#071B49] dark:text-[#F1F5FB]">Future Outlook</h1>
              <p className="text-sm text-slate-500 dark:text-[#8297B2]">
                Statistically defensible biomarker trajectories &amp; holdout-validated projections.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center px-4 py-2.5 bg-[#00A88F] hover:bg-[#008F7A] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-[#00D6B0] mr-2 animate-pulse" />
                Fitting Regression Models...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Forecasting Engine
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Clinical Disclaimer */}
      <div className="bg-amber-50/90 dark:bg-[#1D1709] border border-amber-200 dark:border-[#7A5E1C] rounded-2xl p-4 sm:p-5 flex gap-3 text-amber-900 dark:text-[#D8C59A] text-sm shadow-xs">
        <Info className="w-5 h-5 shrink-0 text-amber-700 dark:text-[#F5A623] mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-[#FFD166]">
            Clinical Decision Support &amp; Mathematical Notice
          </p>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-[#D8C59A] leading-relaxed clinical-notice-body">
            Estimates are calculated using elapsed-time linear regression and empirical expanding-window backtesting from your authenticated laboratory measurements. Projections represent statistical trends, <strong>not medical diagnoses or clinical prognostications</strong>. They do not account for unmeasured medications, acute illnesses, or therapeutic lifestyle changes.
          </p>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-[#2D1017] border border-rose-200 dark:border-[#801826] rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-800 dark:text-[#FF4D6D] text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-[#FF4D6D] shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchOutlook}
            className="text-xs font-semibold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-[#3D141C] dark:hover:bg-[#4E1A24] text-rose-900 dark:text-[#FF4D6D] rounded-lg transition-colors border border-transparent dark:border-[#801826]"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#081729] p-4 rounded-xl border border-slate-200 dark:border-[#152A42] shadow-2xs">
          <div className="text-xs font-medium text-slate-500 dark:text-[#8297B2] uppercase tracking-wider">Total Tracked</div>
          <div className="mt-1 text-2xl font-bold text-[#071B49] dark:text-[#FFFFFF]">{forecasts.length}</div>
          <div className="text-[11px] text-slate-400 dark:text-[#647A96] mt-0.5">Canonical biomarkers</div>
        </div>
        <div className="bg-white dark:bg-[#081729] p-4 rounded-xl border border-slate-200 dark:border-[#152A42] shadow-2xs">
          <div className="text-xs font-medium text-emerald-600 dark:text-[#00D6B0] uppercase tracking-wider">Forecasts Available</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-[#00D6B0]">{availableCount}</div>
          <div className="text-[11px] text-slate-400 dark:text-[#647A96] mt-0.5">Sufficient longitudinal data</div>
        </div>
        <div className="bg-white dark:bg-[#081729] p-4 rounded-xl border border-slate-200 dark:border-[#152A42] shadow-2xs">
          <div className="text-xs font-medium text-blue-600 dark:text-[#2684FF] uppercase tracking-wider">Trend Only</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-[#2684FF]">{trendCount}</div>
          <div className="text-[11px] text-slate-400 dark:text-[#647A96] mt-0.5">Directional history only</div>
        </div>
        <div className="bg-white dark:bg-[#081729] p-4 rounded-xl border border-slate-200 dark:border-[#152A42] shadow-2xs">
          <div className="text-xs font-medium text-amber-600 dark:text-[#F5A623] uppercase tracking-wider">Insufficient Data</div>
          <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-[#F5A623]">{insufficientCount}</div>
          <div className="text-[11px] text-slate-400 dark:text-[#647A96] mt-0.5">&lt;3 distinct dates or unvalidated</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#152A42] pb-2 text-xs sm:text-sm overflow-x-auto">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors border ${
            activeFilter === 'ALL'
              ? 'bg-[#071B49] text-white border-transparent dark:bg-[#0B2554] dark:text-[#FFFFFF] dark:border-[#2684FF]'
              : 'text-slate-600 hover:bg-slate-100 border-transparent dark:bg-[#081729] dark:text-[#8297B2] dark:hover:bg-[#0D2038] dark:hover:text-[#FFFFFF] dark:border-[#152A42]'
          }`}
        >
          All Parameters ({forecasts.length})
        </button>
        <button
          onClick={() => setActiveFilter('AVAILABLE')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors border ${
            activeFilter === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-transparent dark:bg-[#0B2554] dark:text-[#FFFFFF] dark:border-[#2684FF]'
              : 'text-slate-600 hover:bg-slate-100 border-transparent dark:bg-[#081729] dark:text-[#8297B2] dark:hover:bg-[#0D2038] dark:hover:text-[#FFFFFF] dark:border-[#152A42]'
          }`}
        >
          Forecast Available ({availableCount})
        </button>
        <button
          onClick={() => setActiveFilter('TREND')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors border ${
            activeFilter === 'TREND'
              ? 'bg-blue-600 text-white border-transparent dark:bg-[#0B2554] dark:text-[#FFFFFF] dark:border-[#2684FF]'
              : 'text-slate-600 hover:bg-slate-100 border-transparent dark:bg-[#081729] dark:text-[#8297B2] dark:hover:bg-[#0D2038] dark:hover:text-[#FFFFFF] dark:border-[#152A42]'
          }`}
        >
          Trend Only ({trendCount})
        </button>
        <button
          onClick={() => setActiveFilter('INSUFFICIENT')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors border ${
            activeFilter === 'INSUFFICIENT'
              ? 'bg-amber-600 text-white border-transparent dark:bg-[#0B2554] dark:text-[#FFFFFF] dark:border-[#2684FF]'
              : 'text-slate-600 hover:bg-slate-100 border-transparent dark:bg-[#081729] dark:text-[#8297B2] dark:hover:bg-[#0D2038] dark:hover:text-[#FFFFFF] dark:border-[#152A42]'
          }`}
        >
          Insufficient History ({insufficientCount})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <FutureOutlookSkeleton count={3} />
      ) : errorMsg && forecasts.length === 0 ? null : forecasts.length === 0 ? (
        <div className="bg-white dark:bg-[#081729] rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#152A42] space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-[#8297B2] mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-[#FFFFFF]">No Forecast Run On File</h3>
          <p className="text-sm text-slate-500 dark:text-[#8297B2] max-w-md mx-auto">
            Click &ldquo;Run Forecasting Engine&rdquo; above to extract your validated measurements and evaluate statistical biomarker trends.
          </p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-[#00A88F] text-white text-sm font-medium rounded-xl hover:bg-[#008F7A] transition-colors"
          >
            Run Initial Analysis
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#081729] shadow-sm border border-slate-200 dark:border-[#152A42] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-[#94A9C2]">
              <thead className="bg-[#F8FAFC] dark:bg-[#081729] text-slate-500 dark:text-[#8297B2] text-xs uppercase font-semibold border-b border-slate-200 dark:border-[#152A42]">
                <tr>
                  <th className="px-6 py-4">Biomarker / Parameter</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Observed Trajectory</th>
                  <th className="px-6 py-4">90-Day Projected Estimate</th>
                  <th className="px-6 py-4">Coverage</th>
                  <th className="px-6 py-4 text-right">Method &amp; Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20364A] bg-white dark:bg-[#07111D]">
                {filteredForecasts.map((forecast) => {
                  const statusInfo = getStatusBadge(forecast.status, forecast.confidence_category);
                  const dirInfo = getDirectionVisual(forecast.forecast_direction);
                  const interval = parseJsonSafe(forecast.prediction_interval_json);
                  const backtest = parseJsonSafe(forecast.backtest_metrics_json);
                  const history: Array<{ date: string; value: number }> = parseJsonSafe(forecast.history_json, []);
                  const isExpanded = expandedRow === forecast.id;

                  const displayName = forecast.display_name || forecast.parameter.replace(/_/g, ' ');
                  const unit = forecast.canonical_unit || '';

                  return (
                    <React.Fragment key={forecast.id}>
                      <tr 
                        className={`hover:bg-slate-50/70 dark:hover:bg-[#162A3E] transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/50 dark:bg-[#102033]' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : forecast.id)}
                      >
                        {/* Parameter Name & Latest Value */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#071B49] dark:text-[#F1F5FB] text-sm">
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-[#8297B2] mt-0.5">
                            {forecast.last_observed_value !== null && forecast.last_observed_value !== undefined ? (
                              <span>
                                Latest: <strong className="text-slate-800 dark:text-[#F1F5FB]">{forecast.last_observed_value} {unit}</strong>
                                {forecast.last_observed_date && ` (${forecast.last_observed_date})`}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-[#8297B2]">No validated measurements</span>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${statusInfo.classes}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Observed Trajectory */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {dirInfo.icon}
                            <span className={dirInfo.textColor}>
                              {dirInfo.label}
                            </span>
                          </div>
                          {forecast.history_duration_days && forecast.history_duration_days > 0 ? (
                            <div className="text-[11px] text-slate-400 dark:text-[#8297B2] mt-0.5">
                              Across {forecast.history_duration_days} days
                            </div>
                          ) : null}
                        </td>

                        {/* Forecast Value & Range */}
                        <td className="px-6 py-4">
                          {forecast.status === 'FORECAST_AVAILABLE' && forecast.forecast_value !== null ? (
                            <div>
                              <div className="font-mono text-sm font-bold text-[#071B49] dark:text-[#00D6B0]">
                                ~{forecast.forecast_value} <span className="text-xs font-normal text-slate-500 dark:text-[#B4C4D8]">{unit}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#8297B2] font-mono mt-0.5" title="Statistical prediction interval">
                                Interval: {forecast.forecast_range}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-[#102033] text-slate-500 dark:text-[#8297B2] rounded font-semibold border border-transparent dark:border-[#20364A]">
                                N/A (Withheld)
                              </span>
                              <p className="text-[10px] text-slate-400 dark:text-[#8297B2] leading-tight">
                                {forecast.status === 'TREND_AVAILABLE' 
                                  ? 'Trajectory only; span too short for projection' 
                                  : 'Requires ≥3 distinct dates'}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Coverage & Sample Count */}
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-[#B4C4D8]">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">{forecast.distinct_dates_count || 0}</span> dates
                            <span className="text-slate-400 dark:text-[#8297B2]"> / </span>
                            <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">{forecast.observation_count || 0}</span> obs
                          </div>
                          {forecast.excluded_count && forecast.excluded_count > 0 ? (
                            <div className="text-[10px] text-amber-700 dark:text-[#F5B942] mt-0.5 font-medium">
                              {forecast.excluded_count} excluded
                            </div>
                          ) : null}
                        </td>

                        {/* Expand Button */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(isExpanded ? null : forecast.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A88F] dark:text-[#00D6B0] hover:text-[#008F7A] dark:hover:text-[#20D6A1] px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#162A3E] transition-colors"
                          >
                            <span>{isExpanded ? 'Hide' : 'Details'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Evidence & Model Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-[#07111D] border-t border-slate-200 dark:border-[#20364A]">
                          <td colSpan={6} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left: Observations timeline */}
                              <div className="bg-white dark:bg-[#0D1B2A] p-4 rounded-xl border border-slate-200 dark:border-[#20364A] shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20364A] pb-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F1F5FB] flex items-center gap-1.5">
                                    <Database className="w-3.5 h-3.5 text-[#00A884] dark:text-[#00D6B0]" />
                                    Observed Timeline ({history.length} pts)
                                  </h4>
                                  <span className="text-[11px] text-slate-400 dark:text-[#8297B2]">Canonical: {unit}</span>
                                </div>
                                {history.length === 0 ? (
                                  <p className="text-xs text-slate-400 dark:text-[#8297B2] italic py-4 text-center">
                                    No validated points extractable for this biomarker.
                                  </p>
                               ) : (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {history.map((pt, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-[#07111D] dark:border dark:border-[#20364A]/50">
                                        <span className="font-mono text-slate-600 dark:text-[#B4C4D8]">{pt.date}</span>
                                        <span className="font-mono font-bold text-[#071B49] dark:text-[#F1F5FB]">{pt.value} {unit}</span>
                                      </div>
                                    ))}
                                    {forecast.status === 'FORECAST_AVAILABLE' && forecast.forecast_value !== null && (
                                      <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-emerald-50 dark:bg-[#062E2D] border border-emerald-200 dark:border-[#075E56] font-semibold text-emerald-900 dark:text-[#00D6B0]">
                                        <span className="font-mono">Target: {forecast.forecast_target_date || '90-Day'}</span>
                                        <span className="font-mono">~{forecast.forecast_value} {unit}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Center: Backtesting & Error Metrics */}
                              <div className="bg-white dark:bg-[#0D1B2A] p-4 rounded-xl border border-slate-200 dark:border-[#20364A] shadow-2xs space-y-3">
                                <div className="border-b border-slate-100 dark:border-[#20364A] pb-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F1F5FB] flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#2684FF]" />
                                    Chronological Holdout Evaluation
                                  </h4>
                                </div>
                                {backtest && backtest.evalSampleSize > 0 ? (
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#20364A]/60">
                                      <span className="text-slate-500 dark:text-[#8297B2]">Evaluation Method:</span>
                                      <span className="font-medium text-slate-800 dark:text-[#F1F5FB] text-right">{backtest.evalMethod}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#20364A]/60">
                                      <span className="text-slate-500 dark:text-[#8297B2]">Held-Out Predictions:</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-[#F1F5FB]">{backtest.evalSampleSize} observation(s)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#20364A]/60">
                                      <span className="text-slate-500 dark:text-[#8297B2]">Mean Absolute Error (MAE):</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-[#F1F5FB]">
                                        {backtest.mae !== null ? `${backtest.mae} ${unit}` : 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#20364A]/60">
                                      <span className="text-slate-500 dark:text-[#8297B2]">Root Mean Square Error (RMSE):</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-[#F1F5FB]">
                                        {backtest.rmse !== null ? `${backtest.rmse} ${unit}` : 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-500 dark:text-[#8297B2]">Directional Accuracy:</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-[#F1F5FB]">
                                        {backtest.directionalAccuracy !== null ? `${backtest.directionalAccuracy}%` : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-4 text-center space-y-1 text-xs text-slate-500 dark:text-[#8297B2]">
                                    <p className="font-medium text-slate-700 dark:text-[#F1F5FB]">Evaluation Not Applicable</p>
                                    <p className="text-[11px] text-slate-400 dark:text-[#8297B2]">
                                      Forecast accuracy has not yet been established for this user&apos;s available history (requires &ge;3 distinct observation points for rolling holdout).
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right: Diagnostic Rationale, Model Metadata & Limitations */}
                              <div className="bg-white dark:bg-[#0D1B2A] p-4 rounded-xl border border-slate-200 dark:border-[#20364A] shadow-2xs space-y-3">
                                <div className="border-b border-slate-100 dark:border-[#20364A] pb-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F1F5FB] flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-[#8297B2]" />
                                    Eligibility Rationale &amp; Audit Trail
                                  </h4>
                                </div>
                                <div className="space-y-2 text-xs text-slate-600 dark:text-[#B4C4D8]">
                                  <div className="p-2.5 rounded bg-slate-50 dark:bg-[#07111D] border border-slate-100 dark:border-[#20364A] text-[11px]">
                                    <strong className="text-slate-800 dark:text-[#F1F5FB] block mb-0.5">Status Rationale:</strong>
                                    <span>{forecast.reason_message || forecast.limitations}</span>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <p><strong className="text-slate-700 dark:text-[#B4C4D8]">Model Name:</strong> {forecast.model_version?.includes('clinical') ? 'OLS Regression & Expanding Holdout' : 'Linear Baseline'}</p>
                                    <p><strong className="text-slate-700 dark:text-[#B4C4D8]">Model Version:</strong> <span className="font-mono text-slate-800 dark:text-[#F1F5FB]">{forecast.model_version}</span></p>
                                    <p><strong className="text-slate-700 dark:text-[#B4C4D8]">Input Fingerprint:</strong> <span className="font-mono text-[10px] text-slate-800 dark:text-[#F1F5FB]">{forecast.input_data_version}</span></p>
                                    <p><strong className="text-slate-700 dark:text-[#B4C4D8]">Confidence Category:</strong> <span className="font-semibold text-slate-800 dark:text-[#F1F5FB]">{forecast.confidence_category}</span></p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
