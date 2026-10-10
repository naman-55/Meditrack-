import { RiskLevel } from '../components/Dashboard/HealthRiskOverview';

export interface RiskAssessment {
  id: string;
  category: string;
  level: RiskLevel;
  label: string;
  timestamp: string;
}

export interface RiskAssessmentService {
  getAssessment(): Promise<RiskAssessment[]>;
}

// Future implementation
export const riskService: RiskAssessmentService = {
  getAssessment: async () => {
    throw new Error('Risk assessment API not implemented yet.');
  }
};
