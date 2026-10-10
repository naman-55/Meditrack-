import { NormalizedParameter } from './types';

export function calculateRiskOverview(parameters: NormalizedParameter[]) {
  // Mock risk overview based on the latest parameters
  const latestParams = new Map<string, NormalizedParameter>();
  
  for (const p of parameters) {
    // Overwrite with latest (assuming they are sorted by date)
    latestParams.set(p.normalizedName, p);
  }
  
  const risks: any[] = [];
  
  const hasMetabolic = ['fasting_glucose', 'total_cholesterol', 'triglycerides'].some(p => latestParams.has(p));
  if (hasMetabolic) {
    risks.push({ domain: 'Metabolic', level: 'GREEN', label: 'Monitor' });
  }
  
  const hasCardio = ['ldl', 'hdl', 'blood_pressure_systolic'].some(p => latestParams.has(p));
  if (hasCardio) {
    risks.push({ domain: 'Cardiovascular', level: 'GREEN', label: 'Stable' });
  }
  
  return risks;
}
