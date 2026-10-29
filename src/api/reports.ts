import { apiClient } from './client';

export interface MedicalReport {
  id: number;
  filename: string;
  report_type: string;
  report_date: string;
  upload_date: string;
  processing_status: string;
}

export interface Measurement {
  id: number;
  report_id?: number;
  parameter: string;
  raw_value: string;
  normalized_value: string;
  unit: string;
  report_date: string;
  validation_status?: string;
  source_text?: string | null;
}

export interface Contradiction {
  id: number;
  parameter: string;
  value_a: string;
  value_b: string;
  date_a: string;
  date_b: string;
  severity: string;
  reason: string;
  status?: string;
}

export interface Trend {
  id: number;
  parameter: string;
  direction: string;
  valid_measurement_count: number;
  start_date: string;
  end_date: string;
  evidence: string;
  data_quality: string;
}

export interface RiskAssessment {
  id: number;
  domain: string;
  level: string;
  label: string;
  evidence: string;
  data_quality: string;
  rule_version: string;
}

export interface FutureOutlook {
  id: number;
  user_id?: number;
  parameter: string;
  display_name?: string;
  canonical_unit?: string;
  status?: 'NO_DATA' | 'INSUFFICIENT_DATA' | 'DATA_QUALITY_WARNING' | 'TREND_AVAILABLE' | 'FORECAST_AVAILABLE' | 'INVALID_DATA' | 'ANALYSIS_ERROR';
  forecast_direction: string;
  forecast_range: string;
  forecast_value?: number | null;
  forecast_target_date?: string | null;
  confidence_category: string;
  limitations: string;
  model_version: string;
  input_data_version: string;
  data_quality: string;
  observation_count?: number;
  distinct_dates_count?: number;
  history_duration_days?: number;
  last_observed_value?: number | null;
  last_observed_date?: string | null;
  prediction_interval_json?: string | null;
  backtest_metrics_json?: string | null;
  reason_code?: string;
  reason_message?: string;
  excluded_count?: number;
  history_json?: string | null;
  run_id?: string;
  created_at?: string;
}

export interface StructuredFinding {
  parameter: string;
  value: string;
  unit: string;
  status: string;
  statusVariant: 'high' | 'borderline' | 'normal' | 'low';
  date?: string;
  report?: string;
  trend?: string;
}

export interface StructuredEvidence {
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  explanation: string;
  findings: StructuredFinding[];
  whyRecommended: string[];
  ruleReference: string;
  sourceReport?: string;
  suggestedDiscussionPoints?: string[];
}

export interface SpecialtyGuidance {
  id: number;
  domain: string;
  suggested_specialty: string;
  evidence: string;
  rule_version: string;
  created_at?: string;
}

export interface HealthSnapshot {
  reportCount: number;
  measurementCount: number;
  parametersAnalyzed: number;
  abnormalResults: number;
  trendsToMonitor: number;
  specialtiesSuggested: number;
  lastUpdated: string;
  status: 'Analysis up to date' | 'Analysis needs refresh' | 'Analysis processing' | 'No medical data';
}

export const reportsService = {
  getReports: async (): Promise<MedicalReport[]> => {
    return apiClient.get('/api/reports');
  },
  getReportDetails: async (id: number): Promise<{ report: MedicalReport; user?: { id: number; name: string; email: string }; measurements: Measurement[] }> => {
    return apiClient.get(`/api/reports/${id}`);
  },
  deleteReport: async (id: number): Promise<void> => {
    return apiClient.delete(`/api/reports/${id}`);
  },
  uploadReport: async (file: File, type: string, date: string): Promise<MedicalReport> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_type', type);
    formData.append('report_date', date);
    return apiClient.postForm('/api/reports/upload', formData);
  },
  getMeasurements: async (): Promise<Measurement[]> => {
    return apiClient.get('/api/measurements');
  },
  getContradictions: async (): Promise<Contradiction[]> => {
    return apiClient.get('/api/contradictions');
  },
  getTrends: async (): Promise<Trend[]> => {
    return apiClient.get('/api/trends');
  },
  analyzeTrends: async (): Promise<{ message: string, trends: Trend[] }> => {
    return apiClient.post('/api/trends/analyze', {});
  },
  getTrendChart: async (parameter: string): Promise<any[]> => {
    return apiClient.get(`/api/trends/chart/${encodeURIComponent(parameter)}`);
  },
  getRisks: async (): Promise<RiskAssessment[]> => {
    return apiClient.get('/api/risk');
  },
  analyzeRisks: async (): Promise<{ message: string, risks: RiskAssessment[] }> => {
    return apiClient.post('/api/risk/analyze', {});
  },
  getOutlook: async (): Promise<FutureOutlook[]> => {
    return apiClient.get('/api/outlook');
  },
  analyzeOutlook: async (): Promise<{ message: string, forecasts: FutureOutlook[] }> => {
    return apiClient.post('/api/outlook/analyze', {});
  },
  getSpecialtyGuidance: async (): Promise<SpecialtyGuidance[]> => {
    return apiClient.get('/api/specialty');
  },
  getSpecialtySnapshot: async (): Promise<HealthSnapshot> => {
    return apiClient.get('/api/specialty/snapshot');
  },
  analyzeSpecialtyGuidance: async (): Promise<{ message: string, guidances: SpecialtyGuidance[], snapshot?: HealthSnapshot }> => {
    return apiClient.post('/api/specialty/analyze', {});
  },
  chatWithAI: async (message: string, history?: Array<{ role: string; content: string }>): Promise<{ message: string }> => {
    return apiClient.post('/api/ai/chat', { message, history });
  },
  getChatHistory: async (): Promise<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>> => {
    return apiClient.get('/api/ai/chat/history');
  },
  clearChatHistory: async (): Promise<{ success: boolean; message?: string }> => {
    return apiClient.delete('/api/ai/chat/history');
  }
};
