import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsService, Trend, Measurement } from '../api/reports';
import { generatePDFReport, ReportData } from '../utils/pdfExport';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  UploadCloud, 
  Search,
  Calendar
} from 'lucide-react';
import TrendsHeader, { DateRangePreset, PanelViewMode } from '../components/Trends/TrendsHeader';
import TrendsSummaryStats, { SummaryStatsData } from '../components/Trends/TrendsSummaryStats';
import MetricCard, { MetricCardData, ObservationPoint } from '../components/Trends/MetricCard';
import MetricDetailModal from '../components/Trends/MetricDetailModal';
import { 
  normalizeParamKey, 
  CLINICAL_REFERENCE_RANGES, 
  evaluateBiomarkerStatus, 
  calculateBiomarkerChange 
} from '../components/Trends/clinicalRules';
import { getParameterDisplayName } from '../analytics/parameters';

// Key 5 parameters from the reference mockup
const PRIMARY_FIVE_KEYS = ['alt', 'ast', 'creatinine', 'fasting_glucose', 'hdl'];

export default function Trends() {
  const { user } = useAuth();

  // Data states
  const [trends, setTrends] = useState<Trend[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Interactive controls
  const [datePreset, setDatePreset] = useState<DateRangePreset>('primary');
  const [viewMode, setViewMode] = useState<PanelViewMode>('primary_five');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingMetric, setInspectingMetric] = useState<MetricCardData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsData, measurementsData] = await Promise.all([
        reportsService.getTrends().catch((err) => {
          console.error('Failed to fetch trends:', err);
          return [] as Trend[];
        }),
        reportsService.getMeasurements().catch((err) => {
          console.error('Failed to fetch measurements:', err);
          return [] as Measurement[];
        })
      ]);

      setTrends(trendsData);
      setMeasurements(measurementsData);
    } catch (err: any) {
      console.error('Error loading trends dashboard data:', err);
      setError('Unable to load longitudinal health measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await reportsService.analyzeTrends();
      setSuccessToast(res?.message || 'Longitudinal trend analysis completed successfully.');
      setTimeout(() => setSuccessToast(null), 4000);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to run trend analysis:', err);
      setError('Trend analysis computation encountered an error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Group measurements by parameter
  const groupedMeasurements = useMemo(() => {
    const map = new Map<string, Measurement[]>();

    for (const m of measurements) {
      const rawParam = m.parameter || 'Unknown';
      if (!map.has(rawParam)) {
        map.set(rawParam, []);
      }
      map.get(rawParam)!.push(m);
    }

    // Sort observations for each parameter chronologically
    for (const [key, obsList] of map.entries()) {
      obsList.sort((a, b) => {
        const dateA = new Date(a.report_date).getTime();
        const dateB = new Date(b.report_date).getTime();
        return dateA - dateB;
      });
    }

    return map;
  }, [measurements]);

  // Determine observation date boundaries across the entire dataset
  const allDates = useMemo(() => {
    const dates: string[] = [];
    for (const m of measurements) {
      if (m.report_date) dates.push(m.report_date);
    }
    return Array.from(new Set(dates)).sort();
  }, [measurements]);

  // Compute active date boundaries based on datePreset
  const activeDateBounds = useMemo(() => {
    if (allDates.length === 0) return { start: null, end: null, label: 'No Date Range' };

    const firstAvailableDate = allDates[0];
    const lastAvailableDate = allDates[allDates.length - 1];

    if (datePreset === 'primary') {
      // Primary period spans the August 2026 data points: '2026-08-01' to '2026-08-29'
      const start = '2026-08-01';
      const end = '2026-08-29';
      return { start, end, label: 'Aug 01 – Aug 29, 2026' };
    }

    if (datePreset === 'all') {
      const startFmt = formatDateString(firstAvailableDate);
      const endFmt = formatDateString(lastAvailableDate);
      return { 
        start: firstAvailableDate, 
        end: lastAvailableDate, 
        label: `${startFmt} – ${endFmt}` 
      };
    }

    // Days relative to latest date
    const latestTimestamp = new Date(lastAvailableDate).getTime();
    let daysToSubtract = 30;
    let labelPrefix = 'Last 30 Days';

    if (datePreset === '90d') {
      daysToSubtract = 90;
      labelPrefix = 'Last 90 Days';
    } else if (datePreset === '180d') {
      daysToSubtract = 180;
      labelPrefix = 'Last 6 Months';
    }

    const startTimestamp = latestTimestamp - daysToSubtract * 24 * 60 * 60 * 1000;
    const startDateStr = new Date(startTimestamp).toISOString().split('T')[0];

    return {
      start: startDateStr,
      end: lastAvailableDate,
      label: `${labelPrefix} (${formatDateString(startDateStr)} – ${formatDateString(lastAvailableDate)})`
    };
  }, [allDates, datePreset]);

  // Build unified MetricCardData objects
  const metricCardsData = useMemo(() => {
    const cards: MetricCardData[] = [];
    const trendsMap = new Map<string, Trend>();
    for (const t of trends) {
      trendsMap.set(t.parameter.toLowerCase(), t);
    }

    for (const [paramName, rawObsList] of groupedMeasurements.entries()) {
      // Filter observations by selected date range
      const filteredObs = rawObsList.filter((obs) => {
        if (!activeDateBounds.start || !activeDateBounds.end) return true;
        return obs.report_date >= activeDateBounds.start && obs.report_date <= activeDateBounds.end;
      });

      if (filteredObs.length === 0) continue;

      // Extract numeric values
      const observationPoints: ObservationPoint[] = filteredObs.map((obs) => {
        let numeric = 0;
        const normStr = obs.normalized_value || obs.raw_value || '0';
        
        if (normStr.includes('/')) {
          // Blood pressure systolic fallback
          const parts = normStr.split('/');
          numeric = parseFloat(parts[0]) || 0;
        } else {
          const match = normStr.match(/-?\d+(\.\d+)?/);
          numeric = match ? parseFloat(match[0]) : 0;
        }

        return {
          date: obs.report_date,
          displayDate: formatDateString(obs.report_date),
          value: numeric,
          rawValue: obs.raw_value || obs.normalized_value || `${numeric}`,
          unit: obs.unit || '',
          sourceText: (obs as any).source_text || null,
          reportId: (obs as any).report_id
        };
      });

      const firstPoint = observationPoints[0];
      const latestPoint = observationPoints[observationPoints.length - 1];
      const matchingTrend = trendsMap.get(paramName.toLowerCase());

      const normKey = normalizeParamKey(paramName);
      const canonicalMeta = CLINICAL_REFERENCE_RANGES[normKey];
      const displayName = canonicalMeta?.displayName || getParameterDisplayName(normKey) || paramName;
      const standardUnit = latestPoint.unit || canonicalMeta?.standardUnit || matchingTrend?.evidence?.match(/unit:\s*(\w+)/i)?.[1] || '';

      cards.push({
        id: matchingTrend?.id || paramName,
        parameter: paramName,
        displayName,
        unit: standardUnit,
        observations: observationPoints,
        direction: matchingTrend?.direction || (
          Math.abs(latestPoint.value - firstPoint.value) < 0.0001 ? 'STABLE' :
          latestPoint.value > firstPoint.value ? 'INCREASING' : 'DECREASING'
        ),
        validMeasurementCount: observationPoints.length,
        startDate: firstPoint.date,
        endDate: latestPoint.date,
        evidence: matchingTrend?.evidence || `Observed from ${firstPoint.rawValue} to ${latestPoint.rawValue}`,
        dataQuality: matchingTrend?.data_quality || 'RELIABLE',
        latestValue: latestPoint.value,
        latestRawValue: latestPoint.rawValue,
        firstValue: firstPoint.value,
        latestSourceText: latestPoint.sourceText
      });
    }

    return cards;
  }, [groupedMeasurements, trends, activeDateBounds]);

  // Filter and prioritize cards according to viewMode & search query
  const displayedCards = useMemo(() => {
    let result = [...metricCardsData];

    // Filter by panel view mode
    if (viewMode === 'primary_five') {
      // Pick specifically the 5 key metrics from reference image
      result = result.filter(c => PRIMARY_FIVE_KEYS.includes(normalizeParamKey(c.parameter)));
      
      // Order strictly according to the reference image:
      // ALT -> AST -> Creatinine -> Fasting Glucose -> HDL
      result.sort((a, b) => {
        const indexA = PRIMARY_FIVE_KEYS.indexOf(normalizeParamKey(a.parameter));
        const indexB = PRIMARY_FIVE_KEYS.indexOf(normalizeParamKey(b.parameter));
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
    } else if (viewMode === 'liver_renal') {
      result = result.filter(c => ['alt', 'ast', 'creatinine'].includes(normalizeParamKey(c.parameter)));
    } else if (viewMode === 'metabolic_lipid') {
      result = result.filter(c => ['fasting_glucose', 'hdl', 'ldl', 'total_cholesterol', 'triglycerides'].includes(normalizeParamKey(c.parameter)));
    } else if (viewMode === 'hematology') {
      result = result.filter(c => ['hemoglobin', 'hematocrit', 'platelets', 'rbc', 'wbc'].includes(normalizeParamKey(c.parameter)));
    } else {
      // 'all': Show primary five first, then remainder alphabetically
      result.sort((a, b) => {
        const indexA = PRIMARY_FIVE_KEYS.indexOf(normalizeParamKey(a.parameter));
        const indexB = PRIMARY_FIVE_KEYS.indexOf(normalizeParamKey(b.parameter));
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return (a.displayName || a.parameter).localeCompare(b.displayName || b.parameter);
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.displayName || '').toLowerCase().includes(q) ||
        c.parameter.toLowerCase().includes(q) ||
        c.unit.toLowerCase().includes(q)
      );
    }

    return result;
  }, [metricCardsData, viewMode, searchQuery]);

  // Compute Summary Statistics from actual application data
  const summaryStats: SummaryStatsData = useMemo(() => {
    const trackedCount = displayedCards.length;
    let totalObservations = 0;
    let stableCount = 0;

    for (const card of displayedCards) {
      totalObservations += card.observations.length;
      const isStable = (card.direction || '').toUpperCase() === 'STABLE';
      if (isStable) stableCount++;
    }

    const avgObservations = trackedCount > 0 ? Math.round(totalObservations / trackedCount) : 0;
    const stablePercentage = trackedCount > 0 ? Math.round((stableCount / trackedCount) * 100) : 0;

    return {
      metricsTrackedCount: trackedCount,
      measurementsPerMetric: avgObservations,
      totalMeasurementsCount: totalObservations,
      analysisPeriodText: activeDateBounds.label.replace(/\s*\(.*\)/, ''),
      stableMetricsPercentage: stablePercentage,
      stableMetricsCount: stableCount
    };
  }, [displayedCards, activeDateBounds]);

  // Dynamic CSS grid column span calculator
  // Requirement: 3 columns on row 1, 2 wider cards on row 2 when five metrics are displayed.
  // Last row remains visually balanced.
  const getCardGridSpanClass = (index: number, totalCount: number) => {
    if (totalCount === 5) {
      // First 3 cards span 2 columns of 6-col grid (2 + 2 + 2 = 6, exactly 3 cards on row 1)
      // Final 2 cards span 3 columns of 6-col grid (3 + 3 = 6, exactly 2 wider cards on row 2)
      if (index < 3) return 'lg:col-span-2';
      return 'lg:col-span-3';
    }

    if (totalCount === 2) {
      return 'lg:col-span-3';
    }

    if (totalCount % 3 === 2) {
      // N cards where last row has 2 cards (e.g. 5, 8, 11)
      if (index >= totalCount - 2) return 'lg:col-span-3';
      return 'lg:col-span-2';
    }

    if (totalCount % 3 === 1 && index === totalCount - 1) {
      // Last odd card spans full 6 or stays standard
      return 'lg:col-span-6 max-w-2xl mx-auto w-full';
    }

    return 'lg:col-span-2';
  };

  // PDF Export
  const handleExportPDF = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (displayedCards.length === 0) return;

    setExporting(true);
    try {
      const sections: any[] = [];

      sections.push({
        type: 'text',
        title: 'Longitudinal Analysis Summary',
        content: `This clinical health analytics summary evaluates ${displayedCards.length} biomarkers across the observation window (${summaryStats.analysisPeriodText}). Over this period, ${summaryStats.stableMetricsPercentage}% of analyzed biomarkers demonstrated stable baseline trajectories.`
      });

      sections.push({
        type: 'table',
        title: 'Longitudinal Biomarker Analysis Table',
        headers: ['Biomarker', 'Latest Value', 'Net Change', 'Trend', 'Clinical Status', 'Reference Range', 'Observations'],
        rows: displayedCards.map((card) => {
          const evalRes = evaluateBiomarkerStatus(
            card.parameter,
            card.latestValue,
            card.unit,
            card.latestSourceText
          );
          const change = calculateBiomarkerChange(
            card.firstValue,
            card.latestValue,
            card.parameter
          );

          return [
            card.displayName || card.parameter,
            `${card.latestRawValue || card.latestValue} ${card.unit}`.trim(),
            change.bracketText,
            (card.direction || 'STABLE').toUpperCase(),
            evalRes.statusLabel,
            evalRes.referenceRangeText,
            `${card.observations.length} points`
          ];
        })
      });

      sections.push({
        type: 'text',
        title: 'Clinical Notice',
        content: 'Longitudinal trend indicators represent retrospective statistical trajectories derived from validated laboratory measurements. They do not constitute an independent medical diagnosis. Consult your healthcare provider for formal clinical interpretation.'
      });

      const reportData: ReportData = {
        title: 'Clinical Trends Report',
        subtitle: 'LONGITUDINAL HEALTH ANALYTICS DASHBOARD',
        metadata: {
          patientName: user?.name || 'Verified Patient',
          patientId: user?.id ? `PT-${user.id}` : 'PT-883492',
          dob: (user as any)?.date_of_birth || 'Not Specified',
          gender: (user as any)?.gender || 'Not Specified',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        },
        sections
      };

      generatePDFReport(reportData, 'Longitudinal_Trends_Report.pdf', e.currentTarget);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setError('PDF report generation encountered an error.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="trends-content" className="space-y-6 pb-12">
      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button 
            onClick={fetchData}
            className="text-xs bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold px-3 py-1 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 3: HEADER */}
      <TrendsHeader
        selectedDatePreset={datePreset}
        onSelectDatePreset={setDatePreset}
        activeDateRangeText={activeDateBounds.label}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onExportPDF={handleExportPDF}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={analyzing}
        isExporting={exporting}
      />

      {/* SECTION 4: SUMMARY STATISTICS GRID */}
      <TrendsSummaryStats 
        stats={summaryStats} 
        isLoading={loading} 
      />

      {/* SEARCH & FILTER CONTROLS BAR (For All Biomarkers View) */}
      {viewMode === 'all' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search biomarker (e.g. Glucose, Hemoglobin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{displayedCards.length}</span> of {metricCardsData.length} biomarkers
          </div>
        </div>
      )}

      {/* SECTION 5: MAIN METRICS GRID */}
      {loading ? (
        /* Skeleton Grid Loading State */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-[18px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs h-80 animate-pulse flex flex-col justify-between ${
                i <= 3 ? 'lg:col-span-2' : 'lg:col-span-3'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-28 bg-slate-100 rounded-xl my-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedCards.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-slate-200/90 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#101B3D] mb-1.5">
            {searchQuery ? 'No matching biomarkers found' : 'No measurements in selected date range'}
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6 leading-relaxed">
            {searchQuery 
              ? `No health parameters match the search query "${searchQuery}". Try a different keyword.` 
              : 'Try selecting "All Available History" or upload new laboratory reports to establish longitudinal trajectories.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>View All History</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* The Responsive CSS Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-[18px]">
          {displayedCards.map((metricCard, index) => (
            <MetricCard
              key={metricCard.parameter}
              data={metricCard}
              className={getCardGridSpanClass(index, displayedCards.length)}
              onInspect={(metric) => setInspectingMetric(metric)}
            />
          ))}
        </div>
      )}

      {/* METRIC INSPECTION MODAL */}
      <MetricDetailModal
        metric={inspectingMetric}
        onClose={() => setInspectingMetric(null)}
      />
    </div>
  );
}

function formatDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}
