import { MedicalReport, Measurement } from '../api/reports';
import { DashboardAnalytics } from './types';
import { normalizeReports, normalizeMeasurements } from './normalize';
import { calculateTrend } from './trends';
import { calculateRiskOverview } from './risk';
import { generateAlerts } from './alerts';

export function generateDashboardAnalytics(
  reports: MedicalReport[],
  measurements: Measurement[]
): DashboardAnalytics {
  const normalizedReports = normalizeReports(reports);
  const normalizedMeasurements = normalizeMeasurements(measurements);
  
  const parametersTracked = new Set(normalizedMeasurements.map(m => m.normalizedName)).size;
  
  const uniqueParams = Array.from(new Set(normalizedMeasurements.map(m => m.normalizedName)));
  const trends: any = {};
  
  for (const param of uniqueParams) {
    const trend = calculateTrend(normalizedMeasurements, param);
    if (trend) {
      trends[param] = trend;
    }
  }
  
  let dataQuality = 'Insufficient information';
  if (normalizedReports.length > 0 && normalizedMeasurements.length > 0) {
    dataQuality = 'Good'; // Simplified local calculation
  }
  
  const riskOverview = calculateRiskOverview(normalizedMeasurements);
  const alerts = generateAlerts(normalizedMeasurements);
  
  return {
    reportsCount: normalizedReports.length,
    parametersTracked,
    dataQuality,
    activeAlerts: alerts.length,
    alerts,
    reports: normalizedReports,
    parameters: normalizedMeasurements,
    trends,
    riskOverview
  };
}
