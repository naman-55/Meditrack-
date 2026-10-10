export interface NormalizedReport {
  id: number;
  reportName: string;
  testedAt: string;
  processingStatus: string;
}

export interface NormalizedParameter {
  id: number;
  testedAt: string;
  name: string;
  normalizedName: string;
  value: number | null;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  status?: "normal" | "low" | "high" | "unknown";
}

export interface TrendResult {
  parameter: string;
  points: { date: string; value: number }[];
  firstValue: number;
  latestValue: number;
  absoluteChange: number;
  percentageChange: number;
  direction: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface DashboardAnalytics {
  reportsCount: number;
  parametersTracked: number;
  dataQuality: string;
  activeAlerts: number;
  alerts: any[];
  reports: NormalizedReport[];
  parameters: NormalizedParameter[];
  trends: Record<string, TrendResult>;
  riskOverview: any[];
}
