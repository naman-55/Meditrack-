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
  parameter: string;
  raw_value: string;
  normalized_value: string;
  unit: string;
  report_date: string;
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

export interface SpecialtyGuidance {
  id: number;
  domain: string;
  suggested_specialty: string;
  evidence: string;
  rule_version: string;
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
  analyzeSpecialtyGuidance: async (): Promise<{ message: string, guidances: SpecialtyGuidance[] }> => {
    return apiClient.post('/api/specialty/analyze', {});
  }
};