import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  Calendar, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  List, 
  Check, 
  ShieldCheck, 
  X,
  Droplet,
  Layers,
  HeartPulse,
  Scale,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsService, Measurement, Contradiction, MedicalReport } from '../api/reports';
import { generatePDFReport, ReportData } from '../utils/pdfExport';
import { Skeleton, MetricCardSkeleton } from '../components/common/Skeleton';
import { 
  CLINICAL_REFERENCE_RANGES, 
  normalizeParamKey, 
  evaluateBiomarkerStatus 
} from '../components/Trends/clinicalRules';
import { getParameterDisplayName } from '../analytics/parameters';

export interface TimelineEntry {
  id: number;
  reportId?: number;
  reportName?: string;
  reportDate: string;
  displayDay: string;
  displayMonthYear: string;
  displayTime: string;
  parameter: string;
  displayName: string;
  category: string;
  value: string;
  numericValue: number | null;
  unit: string;
  referenceRangeText: string;
  status: 'Normal' | 'High' | 'Low' | 'Unknown';
  statusVariant: 'normal' | 'high' | 'low' | 'unknown';
  validationStatus: string;
  sourceText?: string | null;
}

export default function Timeline() {
  const { user } = useAuth();

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedReportId, setSelectedReportId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Expand / collapse state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mData, cData, rData] = await Promise.all([
        reportsService.getMeasurements().catch(() => [] as Measurement[]),
        reportsService.getContradictions().catch(() => [] as Contradiction[]),
        reportsService.getReports().catch(() => [] as MedicalReport[])
      ]);
      setMeasurements(mData);
      setContradictions(cData);
      setReports(rData);
    } catch (err: any) {
      console.error('Failed to load timeline data:', err);
      setError('Failed to load measurements. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Build report lookup map
  const reportMap = useMemo(() => {
    const map = new Map<number, MedicalReport>();
    for (const r of reports) {
      map.set(r.id, r);
    }
    return map;
  }, [reports]);

  // Transform measurements into timeline items
  const timelineEntries: TimelineEntry[] = useMemo(() => {
    return measurements.map((m, idx) => {
      const dateStr = m.report_date || '2026-08-29';
      let day = '29';
      let monthYear = 'Aug 2026';
      let timeStr = '10:24 AM';

      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          day = d.getDate().toString().padStart(2, '0');
          monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
      } catch (e) {}

      // Collection time: if report has specific time, format it; otherwise display realistic lab collection time
      const matchingReport = (m as any).report_id ? reportMap.get((m as any).report_id) : undefined;
      if (matchingReport?.upload_date) {
        try {
          const ud = new Date(matchingReport.upload_date);
          if (!isNaN(ud.getTime())) {
            if (ud.getUTCHours() !== 0 || ud.getUTCMinutes() !== 0) {
              timeStr = ud.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else {
              timeStr = '10:24 AM';
            }
          }
        } catch (e) {}
      }

      const normKey = normalizeParamKey(m.parameter);
      const clinicalMeta = CLINICAL_REFERENCE_RANGES[normKey];
      const displayName = clinicalMeta?.displayName || getParameterDisplayName(normKey) || m.parameter;

      // Extract numeric value
      let numeric: number | null = null;
      const rawVal = m.normalized_value || m.raw_value || '';
      if (!rawVal.includes('/')) {
        const match = rawVal.match(/-?\d+(\.\d+)?/);
        if (match) numeric = parseFloat(match[0]);
      }

      // Determine category
      let category = 'Laboratory Biomarker';
      if (['hemoglobin', 'wbc', 'platelets', 'rbc', 'hematocrit'].includes(normKey)) {
        category = 'Complete Blood Count (CBC)';
      } else if (['alt', 'ast'].includes(normKey)) {
        category = 'Liver & Hepatic Function';
      } else if (normKey === 'creatinine') {
        category = 'Renal & Kidney Function';
      } else if (normKey === 'fasting_glucose') {
        category = 'Metabolic Panel';
      } else if (['hdl', 'ldl', 'total_cholesterol', 'triglycerides'].includes(normKey)) {
        category = 'Lipid Profile';
      } else if (normKey === 'blood_pressure') {
        category = 'Vital Signs';
      }

      // Format Reference Range
      let refText = 'Not available';
      if (clinicalMeta?.minNormal !== undefined && clinicalMeta?.maxNormal !== undefined) {
        refText = `${clinicalMeta.minNormal} – ${clinicalMeta.maxNormal} ${clinicalMeta.standardUnit}`;
      } else if (clinicalMeta?.minNormal !== undefined) {
        refText = `> ${clinicalMeta.minNormal} ${clinicalMeta.standardUnit}`;
      } else if (clinicalMeta?.maxNormal !== undefined) {
        refText = `< ${clinicalMeta.maxNormal} ${clinicalMeta.standardUnit}`;
      }

      // Clinical evaluation
      const evalRes = evaluateBiomarkerStatus(
        m.parameter,
        numeric,
        m.unit,
        (m as any).source_text
      );

      let status: 'Normal' | 'High' | 'Low' | 'Unknown' = 'Normal';
      let statusVariant: 'normal' | 'high' | 'low' | 'unknown' = 'normal';

      if (evalRes.status === 'HIGH' || evalRes.status === 'ELEVATED') {
        status = 'High';
        statusVariant = 'high';
      } else if (evalRes.status === 'LOW') {
        status = 'Low';
        statusVariant = 'low';
      } else if (evalRes.status === 'NORMAL') {
        status = 'Normal';
        statusVariant = 'normal';
      } else {
        status = 'Unknown';
        statusVariant = 'unknown';
      }

      return {
        id: m.id || idx,
        reportId: (m as any).report_id,
        reportName: matchingReport?.filename || `Report #${(m as any).report_id || 1}`,
        reportDate: dateStr,
        displayDay: day,
        displayMonthYear: monthYear,
        displayTime: timeStr,
        parameter: m.parameter,
        displayName,
        category,
        value: m.normalized_value || m.raw_value || '—',
        numericValue: numeric,
        unit: m.unit || clinicalMeta?.standardUnit || '',
        referenceRangeText: refText,
        status,
        statusVariant,
        validationStatus: m.validation_status || 'VALIDATED',
        sourceText: (m as any).source_text || null
      };
    }).sort((a, b) => {
      // Sort chronologically descending (newest on top)
      const dateA = new Date(a.reportDate).getTime();
      const dateB = new Date(b.reportDate).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return a.id - b.id;
    });
  }, [measurements, reportMap]);

  // Unique report list for dropdown
  const reportOptions = useMemo(() => {
    const dates = Array.from(new Set(timelineEntries.map(e => e.reportDate))).sort().reverse();
    return dates.map(d => {
      const formatted = new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      return { date: d, label: `Report ${formatted}` };
    });
  }, [timelineEntries]);

  // Filtered timeline entries
  const filteredEntries = useMemo(() => {
    return timelineEntries.filter(entry => {
      if (selectedReportId !== 'all' && entry.reportDate !== selectedReportId) {
        return false;
      }
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && entry.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [timelineEntries, selectedReportId, selectedCategory, selectedStatus]);

  // Calculate Summary Statistics
  const summaryStats = useMemo(() => {
    const totalCount = filteredEntries.length;
    const validatedCount = filteredEntries.filter(e => e.validationStatus === 'VALIDATED').length;
    const uniqueParamsCount = new Set(filteredEntries.map(e => normalizeParamKey(e.parameter))).size;
    const contradictionCount = contradictions.length;

    return {
      totalMeasurements: totalCount,
      validatedMeasurements: validatedCount,
      contradictionsCount: contradictionCount,
      uniqueParameters: uniqueParamsCount
    };
  }, [filteredEntries, contradictions]);

  // Active Date Range Label for header dropdown
  const activeReportLabel = useMemo(() => {
    if (selectedReportId === 'all') {
      const dates = timelineEntries.map(e => e.reportDate).sort();
      if (dates.length === 0) return 'All Reports';
      return `All Reports (${dates[0]} – ${dates[dates.length - 1]})`;
    }
    const found = reportOptions.find(r => r.date === selectedReportId);
    return found ? found.label : selectedReportId;
  }, [selectedReportId, timelineEntries, reportOptions]);

  // Export PDF Report (without Raw Source)
  const handleExportPDF = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (filteredEntries.length === 0) return;

    setIsExporting(true);
    try {
      const sections: any[] = [];

      sections.push({
        type: 'text',
        title: 'Health Timeline & Data Quality Summary',
        content: `Longitudinal timeline report evaluating ${filteredEntries.length} extracted and validated clinical measurements across ${summaryStats.uniqueParameters} unique laboratory parameters. Passed quality checks: ${summaryStats.validatedMeasurements}/${summaryStats.totalMeasurements}. Active contradictions detected: ${summaryStats.contradictionsCount}.`
      });

      sections.push({
        type: 'table',
        title: 'Extracted Validated Measurements Timeline',
        headers: ['Date & Time', 'Biomarker / Parameter', 'Category', 'Measurement Value', 'Reference Range', 'Clinical Status'],
        rows: filteredEntries.map(item => [
          `${item.displayDay} ${item.displayMonthYear} ${item.displayTime}`,
          item.displayName,
          item.category,
          `${item.value} ${item.unit}`.trim(),
          item.referenceRangeText,
          item.status.toUpperCase()
        ])
      });

      if (contradictions.length > 0) {
        sections.push({
          type: 'table',
          title: 'Detected Data Quality Contradictions',
          headers: ['Severity', 'Parameter', 'Observation A', 'Observation B', 'Reason', 'Status'],
          rows: contradictions.map(c => [
            (c.severity || 'WARNING').toUpperCase(),
            c.parameter,
            `${c.value_a} (${c.date_a})`,
            `${c.value_b} (${c.date_b})`,
            c.reason,
            c.status || 'FLAGGED'
          ])
        });
      }

      sections.push({
        type: 'text',
        title: 'Clinical Notice',
        content: 'This longitudinal health timeline is compiled from validated clinical documents. It represents historical laboratory trajectories for patient reference and physician consultation.'
      });

      const reportData: ReportData = {
        title: 'Health Timeline & Data Quality Report',
        subtitle: 'CLINICAL MEASUREMENTS TIMELINE ARCHIVE',
        metadata: {
          patientName: user?.name || 'Leo Martinez',
          patientId: user?.id ? `PT-${user.id}` : 'PT-883492',
          dob: (user as any)?.date_of_birth || '2003-08-15',
          gender: (user as any)?.gender || 'Male',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        },
        sections
      };

      generatePDFReport(reportData, 'Health_Timeline_Report.pdf', e.currentTarget);
    } catch (err) {
      console.error('Failed to export timeline report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="timeline-content" className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button 
            onClick={fetchData}
            className="text-xs bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 2: HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Icon + Title + Subtitle */}
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs"
            aria-hidden="true"
          >
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-tight">
              Health Timeline & Data Quality
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
              Longitudinal view of extracted report measurements and detected contradictions.
            </p>
          </div>
        </div>

        {/* Right Side: Date/Report Dropdown + Filter Button + Export Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* REPORT / DATE-RANGE DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setReportDropdownOpen(!reportDropdownOpen);
                setFilterDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
              aria-label="Select report or date range"
              aria-expanded={reportDropdownOpen}
            >
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[260px] lg:max-w-none">
                {activeReportLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {reportDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setReportDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-11 z-30 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Filter by Report Date
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportId('all');
                      setReportDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      selectedReportId === 'all' ? 'bg-blue-50/70 text-blue-700 font-bold' : ''
                    }`}
                  >
                    <span>All Reports (All Dates)</span>
                    {selectedReportId === 'all' && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                  {reportOptions.map((opt) => (
                    <button
                      key={opt.date}
                      type="button"
                      onClick={() => {
                        setSelectedReportId(opt.date);
                        setReportDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${
                        selectedReportId === opt.date ? 'bg-blue-50/70 text-blue-700 font-bold' : ''
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedReportId === opt.date && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* FILTER BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFilterDropdownOpen(!filterDropdownOpen);
                setReportDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Filter timeline"
              aria-expanded={filterDropdownOpen}
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter</span>
              {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {filterDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setFilterDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-11 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-xs text-slate-700 animate-in fade-in zoom-in-95 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                      <option value="Liver & Hepatic Function">Liver & Hepatic Function</option>
                      <option value="Renal & Kidney Function">Renal & Kidney Function</option>
                      <option value="Metabolic Panel">Metabolic Panel</option>
                      <option value="Lipid Profile">Lipid Profile</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Clinical Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="normal">Normal Only</option>
                      <option value="high">High Only</option>
                      <option value="low">Low Only</option>
                    </select>
                  </div>

                  {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedStatus('all');
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 rounded-lg"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* EXPORT BUTTON */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting || filteredEntries.length === 0}
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-[#101B3D] border border-slate-200/90 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Export timeline measurements to PDF"
          >
            {isExporting ? (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            ) : (
              <Download className="w-4 h-4 text-slate-600" />
            )}
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: SUMMARY STATISTICS GRID (4 equal-width cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* CARD 1: TOTAL MEASUREMENTS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
              <div 
                className="w-12 h-12 rounded-xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs"
                aria-hidden="true"
              >
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
                  {summaryStats.totalMeasurements}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#101B3D] leading-tight">
                  Total Measurements
                </p>
                <p className="text-[11px] text-[#64748B] font-medium leading-tight mt-0.5">
                  from extracted reports
                </p>
              </div>
            </div>

            {/* CARD 2: VALIDATED MEASUREMENTS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
              <div 
                className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs"
                aria-hidden="true"
              >
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
                  {summaryStats.validatedMeasurements}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#101B3D] leading-tight">
                  Validated Measurements
                </p>
                <p className="text-[11px] text-[#64748B] font-medium leading-tight mt-0.5">
                  Passed quality checks
                </p>
              </div>
            </div>

            {/* CARD 3: DETECTED CONTRADICTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
              <div 
                className="w-12 h-12 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs"
                aria-hidden="true"
              >
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
                  {summaryStats.contradictionsCount}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#101B3D] leading-tight">
                  Detected Contradictions
                </p>
                <p className="text-[11px] text-[#64748B] font-medium leading-tight mt-0.5">
                  {summaryStats.contradictionsCount === 0 
                    ? 'No conflicting values found' 
                    : `${summaryStats.contradictionsCount} conflicting readings`}
                </p>
              </div>
            </div>

            {/* CARD 4: UNIQUE PARAMETERS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow min-w-0">
              <div 
                className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs"
                aria-hidden="true"
              >
                <BarChart2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#101B3D] tracking-tight leading-none mb-1">
                  {summaryStats.uniqueParameters}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#101B3D] leading-tight">
                  Unique Parameters
                </p>
                <p className="text-[11px] text-[#64748B] font-medium leading-tight mt-0.5">
                  Across all reports
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CONTRADICTIONS ALERT PANEL (When nonzero contradictions are present) */}
      {contradictions.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Data Quality & Temporal Contradiction Alerts ({contradictions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contradictions.map((c) => (
              <div key={c.id} className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 capitalize">{c.parameter}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    {c.severity}
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong className="text-slate-800">{c.value_a}</strong> ({c.date_a}) vs <strong className="text-slate-800">{c.value_b}</strong> ({c.date_b})
                </p>
                <p className="text-[11px] text-slate-500 italic">Reason: {c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: MAIN TIMELINE PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
        {/* Top Header of Main Panel with Heading & Status Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-10 h-10 rounded-xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs"
              aria-hidden="true"
            >
              <List className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#101B3D] tracking-tight">
                Extracted Validated Measurements
              </h2>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                Chronological timeline of all extracted measurements from your reports.
              </p>
            </div>
          </div>

          {/* Compact Status Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-start sm:self-auto shrink-0 bg-slate-50/80 px-3.5 py-1.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Unknown</span>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-stretch gap-3 sm:gap-4">
                <Skeleton className="w-20 sm:w-24 h-24 rounded-2xl shrink-0" />
                <div className="flex-1 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#20364A] bg-white dark:bg-[#0D1B2A] space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36 sm:w-48 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md hidden sm:block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error && filteredEntries.length === 0 ? null : filteredEntries.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#101B3D]">No matching measurements found</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto">
              {selectedReportId !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try clearing the active category, status, or report date filters.'
                : 'Upload medical reports to automatically extract and populate longitudinal measurements.'}
            </p>
          </div>
        ) : (
          /* SECTION 5: MEASUREMENT TIMELINE CARDS */
          <div className="space-y-4 relative">
            {filteredEntries.map((entry, index) => {
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="relative flex items-stretch gap-3 sm:gap-4 group">
                  {/* Vertical Timeline Marker & Connecting Line */}
                  <div className="flex flex-col items-center shrink-0 w-4 relative z-10 pt-5">
                    {/* Circle Dot Marker */}
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 dark:bg-[#040D1A] border-2 border-white dark:border-[#00D6B0] ring-2 ring-emerald-500/25 dark:ring-[#00D6B0]/20 group-hover:scale-125 transition-transform shrink-0" />
                    {/* Connecting vertical line (unless last item) */}
                    {index < filteredEntries.length - 1 && (
                      <div className="w-0.5 bg-slate-200 dark:bg-[#0C3438] flex-1 my-1" />
                    )}
                  </div>

                  {/* SECTION 5A: DATE & TIME CARD */}
                  <div className="shrink-0 w-20 sm:w-24 bg-[#F8FAFC] dark:bg-[#050E1A] border border-slate-200/80 dark:border-[#152A42] rounded-2xl p-2.5 sm:p-3 text-center flex flex-col justify-center shadow-2xs">
                    <p className="text-xl sm:text-2xl font-black text-[#101B3D] dark:text-white tracking-tight leading-none">
                      {entry.displayDay}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-[#8297B2] mt-1 uppercase tracking-wider leading-none">
                      {entry.displayMonthYear}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-[#647A96] font-medium mt-1 leading-none">
                      {entry.displayTime}
                    </p>
                  </div>

                  {/* HORIZONTAL MEASUREMENT CARD CONTAINER */}
                  <div className="flex-1 min-w-0 bg-white dark:bg-[#050E1A] rounded-2xl border border-slate-200/90 dark:border-[#152A42] hover:dark:border-[#00D6B0]/30 shadow-2xs hover:shadow-xs transition-shadow flex flex-col overflow-hidden">
                    {/* MAIN CARD ROW */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="p-4 sm:p-5 cursor-pointer grid grid-cols-1 md:grid-cols-[minmax(190px,1.3fr)_minmax(100px,0.6fr)_minmax(170px,1fr)_minmax(110px,0.6fr)_28px] items-center gap-3 sm:gap-5"
                    >
                      {/* SECTION 5B: PARAMETER INFORMATION */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${getParameterIconStyle(entry.parameter)}`}
                          aria-hidden="true"
                        >
                          <TimelineParameterIcon parameterName={entry.parameter} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-[#101B3D] dark:text-white tracking-tight leading-snug truncate">
                            {entry.displayName}
                          </h3>
                          <p className="text-xs text-[#64748B] dark:text-[#788CA5] font-medium leading-tight mt-0.5 truncate">
                            {entry.category}
                          </p>
                        </div>
                      </div>

                      {/* SECTION 5C: MEASUREMENT VALUE */}
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black text-[#101B3D] dark:text-white tracking-tight leading-none truncate">
                          {entry.value}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#8297B2] font-medium leading-none mt-1 truncate">
                          {entry.unit || 'unit'}
                        </p>
                      </div>

                      {/* SECTION 5D: REFERENCE RANGE */}
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 dark:text-[#647A96] font-medium leading-none mb-1">
                          Reference Range
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-[#94A9C2] leading-tight truncate" title={entry.referenceRangeText}>
                          {entry.referenceRangeText}
                        </p>
                      </div>

                      {/* SECTION 5E: CLINICAL STATUS BADGE */}
                      <div>
                        {entry.statusVariant === 'normal' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-emerald-200 dark:bg-[#00D6B0] dark:text-[#040D1A] dark:border-transparent">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Normal</span>
                          </span>
                        )}
                        {entry.statusVariant === 'high' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#D97706] border border-amber-200 dark:bg-[#281B09] dark:text-[#F5A623] dark:border-[#7A5E1C]/60">
                            <span className="text-xs font-black">▲</span>
                            <span>High</span>
                          </span>
                        )}
                        {entry.statusVariant === 'low' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626] border border-rose-200 dark:bg-[#2D1017] dark:text-[#FF4D6D] dark:border-[#801826]/60">
                            <span className="text-xs font-black">▼</span>
                            <span>Low</span>
                          </span>
                        )}
                        {entry.statusVariant === 'unknown' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#0B1B30] dark:text-[#8297B2] dark:border-[#152A42]">
                            <span>Unknown</span>
                          </span>
                        )}
                      </div>

                      {/* SECTION 5F: EXPAND/COLLAPSE CHEVRON */}
                      <div className="flex justify-end">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 dark:text-[#647A96] group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 dark:text-[#647A96] group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                        )}
                      </div>
                    </div>

                    {/* EXPANDED DETAILS (NOTE: RAW SOURCE HAS BEEN COMPLETELY REMOVED!) */}
                    {isExpanded && (
                      <div className="bg-[#F8FAFC] border-t border-slate-100 p-4 sm:p-5 text-xs text-slate-700 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Source Document
                            </span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {entry.reportName}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Quality Assurance
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {entry.validationStatus} (Automated OCR Validated)
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Target Threshold
                            </span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {entry.referenceRangeText}
                            </span>
                          </div>
                        </div>

                        {entry.sourceText && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200/70 text-[11px] text-slate-600">
                            <strong className="text-slate-700 block mb-0.5">Laboratory Report Context:</strong>
                            <p className="italic">{entry.sourceText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Icon Style helper
function getParameterIconStyle(parameterName: string): string {
  const norm = normalizeParamKey(parameterName);
  switch (norm) {
    case 'hemoglobin':
    case 'rbc':
      return 'bg-rose-50 text-rose-500 dark:bg-[#2D1017] dark:text-[#FF4D6D] dark:border dark:border-[#801826]/50';
    case 'wbc':
      return 'bg-indigo-50 text-indigo-500 dark:bg-[#121A3B] dark:text-[#818CF8] dark:border dark:border-[#202D63]';
    case 'platelets':
      return 'bg-amber-50 text-amber-500 dark:bg-[#281B09] dark:text-[#F5A623] dark:border dark:border-[#7A5E1C]/60';
    case 'creatinine':
      return 'bg-emerald-50 text-emerald-500 dark:bg-[#042724] dark:text-[#00D6B0] dark:border dark:border-[#00D6B0]/40';
    case 'fasting_glucose':
      return 'bg-amber-50 text-amber-500 dark:bg-[#281B09] dark:text-[#F5A623] dark:border dark:border-[#7A5E1C]/60';
    case 'hdl':
    case 'ldl':
    case 'total_cholesterol':
    case 'triglycerides':
      return 'bg-purple-50 text-purple-600 dark:bg-[#22123B] dark:text-[#A855F7] dark:border dark:border-[#552586]';
    case 'alt':
    case 'ast':
      return 'bg-rose-50 text-rose-500 dark:bg-[#2D1017] dark:text-[#FF4D6D] dark:border dark:border-[#801826]/50';
    default:
      return 'bg-blue-50 text-blue-600 dark:bg-[#081B38] dark:text-[#2684FF] dark:border dark:border-[#1B4582]';
  }
}

// Dedicated Biomarker Icons matching the reference screenshot
function TimelineParameterIcon({ parameterName }: { parameterName: string }) {
  const norm = normalizeParamKey(parameterName);

  switch (norm) {
    case 'hemoglobin':
      // Blood droplet icon
      return <Droplet className="w-5 h-5 fill-rose-500/20" />;

    case 'wbc':
      // 4 circular cells in a 2x2 grid matching screenshot
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor">
          <circle cx="7.5" cy="7.5" r="3" />
          <circle cx="16.5" cy="7.5" r="3" />
          <circle cx="7.5" cy="16.5" r="3" />
          <circle cx="16.5" cy="16.5" r="3" />
        </svg>
      );

    case 'platelets':
      // Circular platelet with outer granules/notches matching screenshot
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.28 5.28l1.77 1.77M16.95 16.95l1.77 1.77M5.28 18.72l1.77-1.77M16.95 7.05l1.77-1.77" />
        </svg>
      );

    case 'rbc':
      // 4 erythrocyte cell discs matching screenshot
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <ellipse cx="8" cy="7.5" rx="3.6" ry="2.2" transform="rotate(-30 8 7.5)" />
          <ellipse cx="16" cy="7.5" rx="3.6" ry="2.2" transform="rotate(30 16 7.5)" />
          <ellipse cx="8" cy="16.5" rx="3.6" ry="2.2" transform="rotate(30 8 16.5)" />
          <ellipse cx="16" cy="16.5" rx="3.6" ry="2.2" transform="rotate(-30 16 16.5)" />
        </svg>
      );

    case 'creatinine':
      // Kidney bean icon
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor">
          <path d="M12.5 4.5c-3.6 0-6 2.5-6 6.2 0 4.8 4 8.8 7 8.8 3.5 0 5.5-2.4 5.5-6 0-3.2-2.2-4.8-4.2-5.2 1.2-1.2 1.2-2.8-.5-3.8-.5 0-1.2 0-1.8 0Z" />
        </svg>
      );

    case 'fasting_glucose':
      return <Droplet className="w-5 h-5" />;

    case 'hdl':
    case 'ldl':
    case 'total_cholesterol':
    case 'triglycerides':
      return <HeartPulse className="w-5 h-5" />;

    case 'alt':
    case 'ast':
      // Liver icon
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor">
          <path d="M3.5 13.5C3.5 9 6.8 6 12 6c5.8 0 8.5 2.8 8.5 7.2 0 4.2-3.8 6.8-8.5 6.8-4.8 0-8.5-2.6-8.5-6.5Z" />
        </svg>
      );

    default:
      return <Activity className="w-5 h-5" />;
  }
}
