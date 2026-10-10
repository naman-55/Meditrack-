import { NormalizedParameter } from './types';

export function generateAlerts(parameters: NormalizedParameter[]) {
  const alerts: any[] = [];
  let alertId = 1;
  
  // Get latest parameters
  const latestParams = new Map<string, NormalizedParameter>();
  for (const p of parameters) {
    latestParams.set(p.normalizedName, p);
  }
  
  for (const [name, p] of latestParams.entries()) {
    // If we have strict reference values
    if (p.referenceMin !== undefined && p.referenceMax !== undefined && p.value !== null) {
      if (p.value > p.referenceMax) {
        alerts.push({
          id: alertId++,
          type: 'ATTENTION',
          message: `${p.name} value (${p.value}) is above the supplied reference range (${p.referenceMax}).`,
          created_at: new Date().toISOString()
        });
      } else if (p.value < p.referenceMin) {
        alerts.push({
          id: alertId++,
          type: 'ATTENTION',
          message: `${p.name} value (${p.value}) is below the supplied reference range (${p.referenceMin}).`,
          created_at: new Date().toISOString()
        });
      }
    } else {
      // Basic fallback alerts for known critical params if they are way off
      if (name === 'blood_pressure_systolic' && p.value !== null && p.value > 140) {
        alerts.push({
          id: alertId++,
          type: 'ATTENTION',
          message: `Systolic Blood Pressure is high (${p.value} mmHg).`,
          created_at: new Date().toISOString()
        });
      }
      if (name === 'blood_pressure_diastolic' && p.value !== null && p.value > 90) {
        alerts.push({
          id: alertId++,
          type: 'ATTENTION',
          message: `Diastolic Blood Pressure is high (${p.value} mmHg).`,
          created_at: new Date().toISOString()
        });
      }
    }
  }
  
  return alerts;
}
