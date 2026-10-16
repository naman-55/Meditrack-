import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  AlertCircle, 
  FileCheck2, 
  Calendar, 
  Trash2, 
  Eye, 
  Download, 
  X, 
  Activity, 
  CheckCircle2,
  Printer,
  ShieldCheck 
} from 'lucide-react';
import { reportsService, MedicalReport, Measurement } from '../api/reports';
import { getCompatibleUnits, convertUnit } from '../lib/units';
import { ReportListSkeleton, ReportDetailsSkeleton, Skeleton } from '../components/common/Skeleton';

export default function Reports() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('General Lab Report');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Preview Modal State
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
  const [previewMeasurements, setPreviewMeasurements] = useState<Measurement[]>([]);
  const [previewUser, setPreviewUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewTab, setPreviewTab] = useState<'document' | 'biomarkers' | 'raw_pdf'>('document');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});

  const getRowDisplay = (m: Measurement, idx: number) => {
    const rowKey = `${m.id || idx}_${m.parameter}`;
    const rawStr = String(m.raw_value || m.normalized_value || '');
    const rawNum = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
    const originalUnit = m.unit || '';
    const compat = getCompatibleUnits(m.parameter);
    const activeUnit = selectedUnits[rowKey] || originalUnit;
    const isConverted = activeUnit.toLowerCase() !== originalUnit.toLowerCase() && !isNaN(rawNum);

    let displayedVal = rawStr;
    if (isConverted) {
      const conv = convertUnit(rawNum, originalUnit, activeUnit, { parameter: m.parameter });
      if (conv.success && conv.value !== null) {
        displayedVal = conv.value.toString();
      }
    }

    return {
      displayedVal,
      activeUnit,
      originalUnit,
      compat,
      isConverted,
      rowKey
    };
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Securely load preview document using authenticated fetch and Blob URL (no JWT in URL)
  useEffect(() => {
    if (!previewReport) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    const token = localStorage.getItem('token');
    fetch(`/api/reports/${previewReport.id}/view`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load report document');
        return res.blob();
      })
      .then(blob => {
        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl(objectUrl);
        }
      })
      .catch(err => {
        console.error('Failed to load document preview:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [previewReport?.id]);

  // Keyboard shortcut to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewReport) {
        setPreviewReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewReport]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.getReports();
      setReports(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }
    // Validate type
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only PDF, JPG, or PNG files are allowed');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await reportsService.uploadReport(file, reportType, reportDate);
      setShowUpload(false);
      setFile(null);
      await fetchReports();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reportsService.deleteReport(id);
      if (previewReport?.id === id) {
        setPreviewReport(null);
      }
      await fetchReports();
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete report');
    }
  };

  const openPreview = async (report: MedicalReport) => {
    setPreviewReport(report);
    setPreviewTab('document');
    setLoadingDetails(true);
    try {
      const details = await reportsService.getReportDetails(report.id);
      setPreviewMeasurements(details.measurements || []);
      setPreviewUser(details.user || null);
    } catch (err) {
      console.error('Failed to load report details:', err);
      setPreviewMeasurements([]);
      setPreviewUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadReport = async (report: MedicalReport) => {
    setDownloadingId(report.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${report.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename || `report-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      setError('Could not download file: ' + (err.message || 'Network error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const token = localStorage.getItem('token') || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Reports</h1>
          <p className="mt-1 text-slate-500">View and manage your diagnostic lab reports and clinical biomarkers.</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-colors"
        >
          {showUpload ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Upload Report</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
            <p>{error}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="text-xs font-semibold px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload New Report</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select File (PDF, JPG, PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option>General Lab Report</option>
                  <option>Blood Test</option>
                  <option>Lipid Panel</option>
                  <option>Comprehensive Metabolic Panel</option>
                  <option>Prescription</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Date</label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Processing Document...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Submit Document</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <ReportListSkeleton count={4} />
      ) : error && reports.length === 0 ? null : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No reports yet</h3>
          <p className="text-slate-500">Upload your first medical report to begin tracking your data.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>{reports.length} {reports.length === 1 ? 'Report' : 'Reports'} Available</span>
            <span className="text-slate-400">Actions</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {reports.map((report) => (
              <li 
                key={report.id} 
                className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start justify-between sm:items-center">
                  <div className="flex items-center min-w-0 gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {report.filename}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> {report.report_type}</span>
                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Tested: {report.report_date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-4 shrink-0 flex-col sm:flex-row">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      report.processing_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {report.processing_status}
                    </span>
                    {deletingId === report.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openPreview(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors shadow-xs"
                          title="View Report"
                          aria-label="View Report"
                        >
                          <Eye className="w-4 h-4 text-emerald-600" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadReport(report)}
                          disabled={downloadingId === report.id}
                          className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                          title="Download PDF File"
                          aria-label="Download PDF File"
                        >
                          {downloadingId === report.id ? (
                            <span className="w-4 h-4 flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                            </span>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeletingId(report.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors shadow-xs"
                          title="Delete Report"
                          aria-label="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FULL REPORT PREVIEW MODAL */}
      {previewReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {previewReport.filename}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">{previewReport.report_type}</span>
                    <span>•</span>
                    <span>Date: {previewReport.report_date}</span>
                    <span>•</span>
                    <span className="inline-flex items-center text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {previewReport.processing_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  Print
                </button>
                <button
                  onClick={() => downloadReport(previewReport)}
                  disabled={downloadingId === previewReport.id}
                  className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                  title="Download PDF File"
                >
                  {downloadingId === previewReport.id ? (
                    <span className="w-3.5 h-3.5 mr-1.5 inline-flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </span>
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex space-x-6">
                <button
                  onClick={() => setPreviewTab('document')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    previewTab === 'document'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Report Document
                </button>
                <button
                  onClick={() => setPreviewTab('biomarkers')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    previewTab === 'biomarkers'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Extracted Biomarkers
                  {previewMeasurements.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                      {previewMeasurements.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setPreviewTab('raw_pdf')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    previewTab === 'raw_pdf'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Browser PDF Viewer
                </button>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-[11px]">ESC</kbd> to exit
              </span>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
              {loadingDetails ? (
                <ReportDetailsSkeleton />
              ) : previewTab === 'document' ? (
                /* OFFICIAL CLINICAL REPORT DOCUMENT VIEW */
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* If image file, show direct image */}
                  {(previewReport.filename.toLowerCase().endsWith('.jpg') || 
                    previewReport.filename.toLowerCase().endsWith('.jpeg') || 
                    previewReport.filename.toLowerCase().endsWith('.png')) ? (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 text-center">
                      {previewBlobUrl ? (
                        <img 
                          src={previewBlobUrl}
                          alt={previewReport.filename}
                          className="max-h-[620px] mx-auto rounded-lg shadow-sm object-contain"
                        />
                      ) : (
                        <div className="p-4 space-y-4">
                          <Skeleton className="h-80 sm:h-96 w-full rounded-xl" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Clinical Diagnostic Report Sheet */
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden text-slate-900">
                      {/* Clinical Top Banner */}
                      <div className="bg-slate-900 px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">MediTrack Diagnostic Laboratory</h2>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1">Official Clinical Laboratory & Biomarker Analysis Report</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            CAP / CLIA Accredited Archive
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 font-mono">SPECIMEN #MED-RPT-{previewReport.id}</p>
                        </div>
                      </div>

                      {/* Patient & Demographics Information Card */}
                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block uppercase font-medium text-[10px] tracking-wider">Patient Name</span>
                            <span className="font-bold text-slate-900 text-sm">{previewUser?.name || 'Leo'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-medium text-[10px] tracking-wider">Document ID</span>
                            <span className="font-semibold text-slate-800 font-mono text-sm">MED-RPT-{previewReport.id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-medium text-[10px] tracking-wider">Report Category</span>
                            <span className="font-semibold text-slate-800 text-sm">{previewReport.report_type}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-medium text-[10px] tracking-wider">Collection Date</span>
                            <span className="font-semibold text-slate-800 text-sm">{previewReport.report_date}</span>
                          </div>
                        </div>

                        {/* Biomarker Results Table */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>Extracted Clinical Lab Biomarkers</span>
                              <span className="text-xs font-normal text-slate-500">
                                ({previewMeasurements.length} measurements identified)
                              </span>
                            </h3>
                            <button
                              onClick={() => downloadReport(previewReport)}
                              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Export PDF
                            </button>
                          </div>

                          {previewMeasurements.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                              <p className="text-sm text-slate-500">Document parsed and verified. No tabular biomarkers recorded.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                              <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 text-white text-xs">
                                    <th className="py-3 px-4 font-semibold">Biomarker / Parameter</th>
                                    <th className="py-3 px-4 font-semibold">Result Value</th>
                                    <th className="py-3 px-4 font-semibold">Standard Unit</th>
                                    <th className="py-3 px-4 font-semibold">Reference Range / Notes</th>
                                    <th className="py-3 px-4 font-semibold text-right">Clinical Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {previewMeasurements.map((m, idx) => {
                                    const note = String((m as any).source_text || '').toUpperCase();
                                    let flag = 'NORMAL';
                                    let flagColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                    if (note.includes('HIGH') || note.includes('ELEVATED')) {
                                      flag = 'HIGH';
                                      flagColor = 'bg-red-50 text-red-700 border-red-200 font-bold';
                                    } else if (note.includes('LOW')) {
                                      flag = 'LOW';
                                      flagColor = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                                    } else if (note.includes('BORDERLINE')) {
                                      flag = 'BORDERLINE';
                                      flagColor = 'bg-purple-50 text-purple-700 border-purple-200';
                                    }

                                    const disp = getRowDisplay(m, idx);

                                    return (
                                      <tr key={m.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                        <td className="py-3 px-4 font-semibold text-slate-900">
                                          {m.parameter}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-800">
                                          <div>
                                            <span>{disp.displayedVal}</span>
                                            {disp.isConverted && (
                                              <span className="block text-[10px] text-indigo-600 font-mono mt-0.5">
                                                Orig: {m.raw_value || m.normalized_value} {disp.originalUnit}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                                          {disp.compat.length > 1 ? (
                                            <select
                                              value={disp.activeUnit}
                                              onChange={(e) => setSelectedUnits(prev => ({ ...prev, [disp.rowKey]: e.target.value }))}
                                              className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 font-medium cursor-pointer hover:border-slate-300"
                                            >
                                              {disp.compat.map((u) => (
                                                <option key={u} value={u}>{u}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <span>{m.unit}</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={(m as any).source_text}>
                                          {(m as any).source_text || 'Standard reference reading'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${flagColor}`}>
                                            {flag}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Laboratory Verification & Authorization Section */}
                        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
                          <div>
                            <p className="font-semibold text-slate-700">MediTrack Automated Diagnostics</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              This electronic document is certified and preserved in the patient diagnostic health record.
                            </p>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Report
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">Archive Status: Verified</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : previewTab === 'biomarkers' ? (
                /* EXTRACTED BIOMARKERS TABLE VIEW */
                <div className="space-y-4 max-w-4xl mx-auto">
                  {previewMeasurements.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                      <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-base font-semibold text-slate-900 mb-1">No individual lab measurements parsed</h4>
                      <p className="text-sm text-slate-500 max-w-md mx-auto">
                        This document is archived and preserved. You can inspect the visual document directly in the Report Document tab.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {previewMeasurements.length} Verified Biomarkers Extracted
                        </span>
                        <span className="text-xs text-slate-400">Validated against clinical ranges</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
                              <th className="py-3 px-4 font-semibold">Biomarker / Test</th>
                              <th className="py-3 px-4 font-semibold">Result Value</th>
                              <th className="py-3 px-4 font-semibold">Standard Unit</th>
                              <th className="py-3 px-4 font-semibold">Context / Notes</th>
                              <th className="py-3 px-4 font-semibold text-right">Clinical Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewMeasurements.map((m, idx) => {
                              const note = String((m as any).source_text || '').toUpperCase();
                              let flag = 'NORMAL';
                              let flagColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              if (note.includes('HIGH') || note.includes('ELEVATED')) {
                                flag = 'HIGH';
                                flagColor = 'bg-red-50 text-red-700 border-red-200 font-semibold';
                              } else if (note.includes('LOW')) {
                                flag = 'LOW';
                                flagColor = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
                              } else if (note.includes('BORDERLINE')) {
                                flag = 'BORDERLINE';
                                flagColor = 'bg-purple-50 text-purple-700 border-purple-200';
                              }

                              const disp = getRowDisplay(m, idx);

                              return (
                                <tr key={m.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 font-medium text-slate-900">
                                    {m.parameter}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">
                                    <div>
                                      <span>{disp.displayedVal}</span>
                                      {disp.isConverted && (
                                        <span className="block text-[10px] text-indigo-600 font-mono mt-0.5">
                                          Orig: {m.raw_value || m.normalized_value} {disp.originalUnit}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                                    {disp.compat.length > 1 ? (
                                      <select
                                        value={disp.activeUnit}
                                        onChange={(e) => setSelectedUnits(prev => ({ ...prev, [disp.rowKey]: e.target.value }))}
                                        className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 font-medium cursor-pointer hover:border-slate-300"
                                      >
                                        {disp.compat.map((u) => (
                                          <option key={u} value={u}>{u}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span>{m.unit}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={(m as any).source_text}>
                                    {(m as any).source_text || 'Standard reference reading'}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${flagColor}`}>
                                      {flag}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* RAW BROWSER PDF VIEWER EMBED */
                <div className="flex flex-col h-full space-y-3 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      If your browser restricts PDF plugins in frames, use the Report Document tab or Download PDF.
                    </span>
                    <button 
                      onClick={() => downloadReport(previewReport)} 
                      className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF file
                    </button>
                  </div>
                  <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-white shadow-inner min-h-[580px]">
                    {previewBlobUrl ? (
                      <iframe
                        src={previewBlobUrl}
                        title={previewReport.filename}
                        className="w-full h-full min-h-[580px] border-0"
                      />
                    ) : (
                      <div className="p-6">
                        <Skeleton className="w-full h-[580px] rounded-xl" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

