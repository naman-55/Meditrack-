import { apiClient } from './client';

export interface TestCase {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'PENDING' | 'N/A';
  details?: string;
  expected?: string;
  actual?: string;
}

export interface ValidationMetrics {
  sensitivity: number | null;
  specificity: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  mae: number | null;
  rmse: number | null;
  directionalAccuracy: number | null;
}

export interface ValidationReport {
  timestamp: string;
  testCases: TestCase[];
  metrics: ValidationMetrics;
  falsePositives: any[];
  falseNegatives: any[];
  knownLimitations: string[];
  disclaimer: string;
}

export const validationService = {
  runValidation: async (): Promise<ValidationReport> => {
    return apiClient.get('/api/admin/validation');
  }
};
