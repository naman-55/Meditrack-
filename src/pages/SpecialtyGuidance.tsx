import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  RefreshCw, 
  ChevronDown, 
  Stethoscope, 
  Upload, 
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

      setGuidances(gList);
      setSnapshot(snapshotData);
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
          return d.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
        }
      } catch (e) {}
    }
    return 'No analysis yet';
  }, [snapshot]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col xl:flex-row bg-[#F5F8FC] dark:bg-[#050D18] p-4 sm:p-5 md:p-6 gap-5 overflow-hidden">
      <main className="min-w-0 flex-1 space-y-5 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-1 scrollbar-thin">
      {/* 1. BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#8297B2] font-medium mb-1.5">
            <Link to="/" className="hover:text-slate-800 dark:hover:text-[#F1F5FB] flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400 dark:text-[#8297B2]" />
              <span>Home</span>
            </Link>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-[#F1F5FB] font-semibold">Specialty Guidance</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071B49] dark:text-[#F1F5FB] tracking-tight leading-tight">
            Specialty Guidance
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] font-medium mt-0.5">
            Personalized specialist recommendations based on your medical reports, health analysis, and trends.
          </p>
        </div>

        {/* HEADER RIGHT ACTIONS */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          {/* Last updated badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200/90 dark:border-[#20364A] shadow-2xs text-xs">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-[#8297B2] shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-[#8297B2] font-bold uppercase tracking-wider block leading-none">
                Last updated
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5FB] leading-tight">
                {formattedLastUpdated}
              </span>
            </div>
          </div>

          {/* Refresh Analysis Button */}
          <button
            type="button"
            onClick={handleRefreshAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white dark:text-[#050D18] bg-[#00A884] dark:bg-[#00D6B0] hover:bg-[#009272] dark:hover:bg-[#00A88F] shadow-2xs transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer"
            title="Refresh clinical risk evaluation and specialist mappings"
          >
            <RefreshCw className={`w-4 h-4 text-white dark:text-[#050D18] ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT IF ANY */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-[#321B27] border border-rose-200 dark:border-[#7A3043] text-rose-800 dark:text-[#FF5368] text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-[#FF5368]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadAllData}
            className="font-bold underline hover:text-rose-950 dark:hover:text-white cursor-pointer"
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
