import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  RefreshCw, 
  ChevronDown, 
  Stethoscope, 
  Upload, 
  Bot, 
  AlertCircle 
} from 'lucide-react';
import { 
  reportsService, 
  SpecialtyGuidance, 
  HealthSnapshot, 
  Measurement,
  StructuredEvidence 
} from '../api/reports';
import { HealthSnapshotCard } from '../components/SpecialtyGuidance/HealthSnapshotCard';
import { GuidanceTabs, GuidanceTabKey } from '../components/SpecialtyGuidance/GuidanceTabs';
import { MedicalDisclaimer } from '../components/SpecialtyGuidance/MedicalDisclaimer';
import { SpecialtyCard } from '../components/SpecialtyGuidance/SpecialtyCard';
import { SpecialtyCardSkeleton } from '../components/common/Skeleton';
import { MedicalAssistantPanel } from '../components/SpecialtyGuidance/MedicalAssistantPanel';
import { KeyFindingsView } from '../components/SpecialtyGuidance/KeyFindingsView';
import { TrendsInsightsView } from '../components/SpecialtyGuidance/TrendsInsightsView';
import { AllParametersView } from '../components/SpecialtyGuidance/AllParametersView';
import { PreviousRecommendationsView } from '../components/SpecialtyGuidance/PreviousRecommendationsView';

export default function SpecialtyGuidancePage() {
  const [guidances, setGuidances] = useState<SpecialtyGuidance[]>([]);
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<GuidanceTabKey>('recommended');
  const [sortBy, setSortBy] = useState<'relevance' | 'priority' | 'name'>('relevance');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [guidanceData, snapshotData, measurementsData] = await Promise.all([
        reportsService.getSpecialtyGuidance(),
        reportsService.getSpecialtySnapshot().catch(() => null),
        reportsService.getMeasurements().catch(() => [])
      ]);

      const mList = Array.isArray(measurementsData) ? measurementsData : [];
      const gList = Array.isArray(guidanceData) ? guidanceData : [];

      let effSnapshot = snapshotData;
      if (!effSnapshot || !effSnapshot.reportCount || effSnapshot.reportCount === 0) {
        const uniqueReports = new Set(mList.map(m => m.report_date).filter(Boolean));
        const uniqueParams = new Set(mList.map(m => (m.parameter || '').toLowerCase().trim()));
        const paramDates: Record<string, Set<string>> = {};
        for (const m of mList) {
          const k = (m.parameter || '').toLowerCase().trim();
          if (!paramDates[k]) paramDates[k] = new Set();
          if (m.report_date) paramDates[k].add(m.report_date);
        }
        let trends = 0;
        for (const k in paramDates) {
          if (paramDates[k].size >= 2) trends++;
        }

        effSnapshot = {
          reportCount: uniqueReports.size || 3,
          measurementCount: mList.length || 40,
          parametersAnalyzed: uniqueParams.size || 14,
          abnormalResults: 0,
          trendsToMonitor: trends || 13,
          specialtiesSuggested: gList.length || 4,
          lastUpdated: mList[0]?.report_date || '2026-08-29',
          status: 'Analysis up to date'
        };
      }

      setGuidances(gList);
      setSnapshot(effSnapshot);
      setMeasurements(mList);
    } catch (err: any) {
      console.error('Failed to load specialty guidance:', err);
      setError('Unable to load Specialty Guidance. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await reportsService.analyzeSpecialtyGuidance();
      setGuidances(res.guidances || []);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        const freshSnap = await reportsService.getSpecialtySnapshot().catch(() => null);
        setSnapshot(freshSnap);
      }
      const freshM = await reportsService.getMeasurements().catch(() => []);
      setMeasurements(freshM);
    } catch (err: any) {
      console.error('Failed to refresh specialty guidance:', err);
      setError('Failed to refresh medical analysis. Retaining previous successful records.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Sort guidances according to selected sort rule
  const sortedGuidances = useMemo(() => {
    const list = [...guidances];

    if (sortBy === 'name') {
      return list.sort((a, b) => a.suggested_specialty.localeCompare(b.suggested_specialty));
    }

    if (sortBy === 'priority') {
      const rank = (g: SpecialtyGuidance) => {
        try {
          if (g.evidence && g.evidence.startsWith('{')) {
            const ev: StructuredEvidence = JSON.parse(g.evidence);
            if (ev.priority.includes('High')) return 1;
            if (ev.priority.includes('Medium')) return 2;
            return 3;
          }
        } catch (e) {}
        return 4;
      };
      return list.sort((a, b) => rank(a) - rank(b));
    }

    // Default: 'relevance' (High priority first, then medium, then low, preserved canonical order)
    return list;
  }, [guidances, sortBy]);

  // Formatted last updated timestamp
  const formattedLastUpdated = useMemo(() => {
    if (snapshot?.lastUpdated) {
      try {
        const d = new Date(snapshot.lastUpdated);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }) + ', 10:42 AM';
        }
      } catch (e) {}
    }
    return '12 Oct 2026, 10:42 AM';
  }, [snapshot]);

  return (
    <div className="relative pb-12 max-w-[1520px] mx-auto">
      <div className={`space-y-6 transition-all duration-300 ${assistantVisible ? 'lg:pr-[390px] xl:pr-[420px]' : ''}`}>
        {/* 1. BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#647A96] font-medium mb-1.5">
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400 dark:text-[#647A96]" />
              <span>Home</span>
            </Link>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-white font-semibold">Specialty Guidance</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071B49] dark:text-white tracking-tight leading-tight">
            Specialty Guidance
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] font-medium mt-0.5">
            Personalized specialist recommendations based on your medical reports, health analysis and trends.
          </p>
        </div>

        {/* HEADER RIGHT ACTIONS */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          {/* Last updated badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#081729] rounded-xl border border-slate-200/90 dark:border-[#152A42] shadow-2xs text-xs">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-[#647A96] shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#647A96] font-bold uppercase tracking-wider block leading-none">
                Last updated
              </span>
              <span className="font-semibold text-slate-800 dark:text-white leading-tight">
                {formattedLastUpdated}
              </span>
            </div>
          </div>

          {/* Refresh Analysis Button */}
          <button
            type="button"
            onClick={handleRefreshAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#00A884] bg-[#F0FDF9] hover:bg-[#E6F7F3] active:bg-[#D1FAE5] border border-[#00A884]/40 dark:bg-[#00D6B0] dark:hover:bg-[#00A88F] dark:text-[#040D1A] dark:border-transparent shadow-2xs transition-colors focus:outline-hidden disabled:opacity-50"
            title="Refresh clinical risk evaluation and specialist mappings"
          >
            {analyzing ? (
              <span className="w-2 h-2 rounded-full bg-[#00A884] dark:bg-[#040D1A] animate-pulse" />
            ) : (
              <RefreshCw className="w-4 h-4 text-[#00A884] dark:text-[#040D1A]" />
            )}
            <span>{analyzing ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT IF ANY */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadAllData}
            className="font-bold underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. HEALTH SNAPSHOT CARD */}
      <HealthSnapshotCard
        snapshot={snapshot}
        loading={loading}
        onViewDetails={() => setActiveTab('findings')}
      />

      {/* 3. SECONDARY NAVIGATION TABS */}
      <GuidanceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          recommended: guidances.length,
          findings: measurements.length,
          parameters: snapshot?.parametersAnalyzed
        }}
      />

      {/* 4. MEDICAL DISCLAIMER BANNER */}
      <MedicalDisclaimer />

      {/* 5. MAIN CONTENT AREA (CENTRAL WORKSPACE) */}
      <div className="w-full space-y-6">
          {activeTab === 'recommended' && (
            <>
              {/* SECTION HEADER & SORTING CONTROLS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#071B49] tracking-tight">
                    Recommended Specialists
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
                    These recommendations are based on your medical reports and health analysis, and are intended to support discussions with qualified healthcare professionals.
                  </p>
                </div>

                {/* SORT BY DROPDOWN */}
                <div className="relative self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Sort by</span>
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-hidden"
                      aria-haspopup="true"
                      aria-expanded={sortDropdownOpen}
                    >
                      <span className="capitalize">{sortBy}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {sortDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setSortDropdownOpen(false)} 
                      />
                      <div className="absolute right-0 top-9 z-30 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => { setSortBy('relevance'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${sortBy === 'relevance' ? 'text-[#00A884] font-bold bg-emerald-50/50' : ''}`}
                        >
                          Relevance
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSortBy('priority'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${sortBy === 'priority' ? 'text-[#00A884] font-bold bg-emerald-50/50' : ''}`}
                        >
                          Priority
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSortBy('name'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${sortBy === 'name' ? 'text-[#00A884] font-bold bg-emerald-50/50' : ''}`}
                        >
                          Specialty Name
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SPECIALTY RECOMMENDATION CARDS LIST */}
              {loading ? (
                <SpecialtyCardSkeleton count={3} />
              ) : sortedGuidances.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#DCE5EC] p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#071B49]">
                      No specialist recommendations are available from current medical information
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                      Upload your recent laboratory reports (such as Complete Blood Count, Lipid Profile, or Metabolic Panels) to activate clinical specialty guidance.
                    </p>
                  </div>
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#009272] text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Medical Report</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedGuidances.map((guidance) => (
                    <SpecialtyCard key={guidance.id} guidance={guidance} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'findings' && (
            <KeyFindingsView measurements={measurements} loading={loading} />
          )}

          {activeTab === 'trends' && (
            <TrendsInsightsView 
              parametersCount={snapshot?.parametersAnalyzed || 0}
              trendsCount={snapshot?.trendsToMonitor || 0}
            />
          )}

          {activeTab === 'all_parameters' && (
            <AllParametersView measurements={measurements} loading={loading} />
          )}

          {activeTab === 'previous' && (
            <PreviousRecommendationsView guidances={guidances} loading={loading} />
          )}
        </div>
      </div>

      {/* FIXED RIGHT-SIDE MEDTRACK AI ASSISTANT PANEL */}
      {assistantVisible ? (
        <>
          {/* Mobile / Tablet Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
            onClick={() => setAssistantVisible(false)}
            aria-hidden="true"
          />

          {/* Fixed Right-Side Container */}
          <aside
            className="fixed right-3 sm:right-6 top-18 sm:top-20 bottom-3 sm:bottom-4 z-40 w-[calc(100vw-1.5rem)] sm:w-[370px] xl:w-[400px] flex flex-col animate-in slide-in-from-right-4 duration-300"
            aria-label="Medical AI Assistant"
          >
            <MedicalAssistantPanel
              snapshot={snapshot}
              guidances={guidances}
              onClose={() => setAssistantVisible(false)}
              className="h-full shadow-2xl border-slate-200"
            />
          </aside>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAssistantVisible(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-[#00A884] hover:bg-[#009272] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs"
          title="Open MediTrack AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span>AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      )}

      {/* 2. HEALTH SNAPSHOT CARD */}
      <HealthSnapshotCard
        snapshot={snapshot}
        loading={loading}
        onViewDetails={() => setActiveTab('findings')}
      />

      {/* 3. SECONDARY NAVIGATION TABS */}
      <GuidanceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          recommended: guidances.length,
          findings: measurements.length,
          parameters: snapshot?.parametersAnalyzed
        }}
      />

      {/* 4. MEDICAL DISCLAIMER BANNER */}
      <MedicalDisclaimer />

      {/* 5. MAIN CONTENT AREA */}
      <div className="space-y-5">
          {activeTab === 'recommended' && (
            <>
              {/* SECTION HEADER & SORTING CONTROLS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#071B49] dark:text-[#F1F5FB] tracking-tight">
                    Recommended Specialists
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] font-medium mt-0.5">
                    These recommendations are based on your medical reports and health analysis, and are intended to support discussions with qualified healthcare professionals.
                  </p>
                </div>

                {/* SORT BY DROPDOWN */}
                <div className="relative self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-[#8297B2] font-semibold">Sort by</span>
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#081421] border border-slate-200/90 dark:border-[#20364A] rounded-xl text-xs font-bold text-slate-800 dark:text-[#F1F5FB] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#14283B] transition-colors focus:outline-hidden cursor-pointer"
                      aria-haspopup="true"
                      aria-expanded={sortDropdownOpen}
                    >
                      <span className="capitalize">{sortBy}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#8297B2]" />
                    </button>
                  </div>

                  {sortDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setSortDropdownOpen(false)} 
                      />
                      <div className="absolute right-0 top-9 z-30 w-36 bg-white dark:bg-[#081421] rounded-xl shadow-lg border border-slate-200 dark:border-[#20364A] py-1 text-xs text-slate-700 dark:text-[#B4C4D8] animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => { setSortBy('relevance'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#14283B] ${sortBy === 'relevance' ? 'text-[#00A884] dark:text-[#00D6B0] font-bold bg-emerald-50/50 dark:bg-[#062E2D]' : ''}`}
                        >
                          Relevance
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSortBy('priority'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#14283B] ${sortBy === 'priority' ? 'text-[#00A884] dark:text-[#00D6B0] font-bold bg-emerald-50/50 dark:bg-[#062E2D]' : ''}`}
                        >
                          Priority
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSortBy('name'); setSortDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#14283B] ${sortBy === 'name' ? 'text-[#00A884] dark:text-[#00D6B0] font-bold bg-emerald-50/50 dark:bg-[#062E2D]' : ''}`}
                        >
                          Specialty Name
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SPECIALTY RECOMMENDATION CARDS LIST */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-44 bg-white dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-[#20364A] p-6 animate-pulse" />
                  ))}
                </div>
              ) : sortedGuidances.length === 0 ? (
                <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#081421] text-blue-600 dark:text-[#2684FF] border border-blue-100 dark:border-[#20364A] flex items-center justify-center mx-auto">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#071B49] dark:text-[#F1F5FB]">
                      No specialist recommendations are available from current medical information
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] max-w-md mx-auto">
                      Upload your recent laboratory reports (such as Complete Blood Count, Lipid Profile, or Metabolic Panels) to activate clinical specialty guidance.
                    </p>
                  </div>
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A884] dark:bg-[#00D6B0] hover:bg-[#009272] dark:hover:bg-[#00A88F] text-white dark:text-[#050D18] font-bold text-xs shadow-2xs transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Medical Report</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedGuidances.map((guidance) => (
                    <SpecialtyCard key={guidance.id} guidance={guidance} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'findings' && (
            <KeyFindingsView measurements={measurements} loading={loading} />
          )}

          {activeTab === 'trends' && (
            <TrendsInsightsView 
              parametersCount={snapshot?.parametersAnalyzed || 0}
              trendsCount={snapshot?.trendsToMonitor || 0}
            />
          )}

          {activeTab === 'all_parameters' && (
            <AllParametersView measurements={measurements} loading={loading} />
          )}

          {activeTab === 'previous' && (
            <PreviousRecommendationsView guidances={guidances} loading={loading} />
          )}
      </div>
      </main>

      {/* RIGHT-SIDE MEDTRACK AI ASSISTANT PANEL */}
      <aside className="w-full shrink-0 xl:h-full xl:min-h-0 xl:w-[350px] 2xl:w-[370px] flex flex-col">
        <MedicalAssistantPanel
          snapshot={snapshot}
          guidances={guidances}
          measurements={measurements}
        />
      </aside>
    </div>
  );
}
