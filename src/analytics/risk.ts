import { NormalizedParameter } from './types';

export interface DomainRisk {
  domain: string;
  level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';
  label: string;
  dataQuality?: string;
}

export function calculateRiskOverview(parameters: NormalizedParameter[]): DomainRisk[] {
  // Build map of the most recent observation per canonical parameter
  const latestParams = new Map<string, NormalizedParameter>();
  
  // Parameters are assumed sorted chronologically
  for (const p of parameters) {
    latestParams.set(p.normalizedName, p);
  }

  const risks: DomainRisk[] = [];

  // 1. Cardiovascular Domain
  const sbp = latestParams.get('blood_pressure_systolic');
  const dbp = latestParams.get('blood_pressure_diastolic');
  const ldl = latestParams.get('ldl');
  const chol = latestParams.get('total_cholesterol');
  const tg = latestParams.get('triglycerides');

  const hasCardio = sbp || dbp || ldl || chol || tg;

  if (!hasCardio) {
    risks.push({
      domain: 'Cardiovascular',
      level: 'GREY',
      label: 'Insufficient Data (No BP or Lipids)',
      dataQuality: 'INSUFFICIENT'
    });
  } else {
    let maxRisk = 0; // 0=GREEN, 1=YELLOW, 2=ORANGE, 3=RED
    let reasons: string[] = [];

    if (sbp?.value !== null && sbp?.value !== undefined) {
      if (sbp.value >= 140) { maxRisk = Math.max(maxRisk, 3); reasons.push('Stage 2 Hypertension'); }
      else if (sbp.value >= 130) { maxRisk = Math.max(maxRisk, 2); reasons.push('Stage 1 Hypertension'); }
      else if (sbp.value >= 120) { maxRisk = Math.max(maxRisk, 1); reasons.push('Elevated Systolic BP'); }
    }
    if (dbp?.value !== null && dbp?.value !== undefined) {
      if (dbp.value >= 90) { maxRisk = Math.max(maxRisk, 3); reasons.push('High Diastolic BP'); }
      else if (dbp.value >= 80) { maxRisk = Math.max(maxRisk, 2); reasons.push('Stage 1 Diastolic'); }
    }
    if (ldl?.value !== null && ldl?.value !== undefined) {
      if (ldl.value >= 160) { maxRisk = Math.max(maxRisk, 3); reasons.push('High LDL'); }
      else if (ldl.value >= 130) { maxRisk = Math.max(maxRisk, 2); reasons.push('Borderline LDL'); }
      else if (ldl.value >= 100) { maxRisk = Math.max(maxRisk, 1); reasons.push('Near Optimal LDL'); }
    }
    if (chol?.value !== null && chol?.value !== undefined) {
      if (chol.value >= 240) { maxRisk = Math.max(maxRisk, 3); reasons.push('High Cholesterol'); }
      else if (chol.value >= 200) { maxRisk = Math.max(maxRisk, 2); reasons.push('Borderline Cholesterol'); }
    }

    const level: DomainRisk['level'] = maxRisk === 3 ? 'RED' : maxRisk === 2 ? 'ORANGE' : maxRisk === 1 ? 'YELLOW' : 'GREEN';
    const label = reasons.length > 0 ? reasons[0] : 'Optimal Cardiovascular Bounds';

    risks.push({
      domain: 'Cardiovascular',
      level,
      label,
      dataQuality: (sbp && ldl) ? 'SUFFICIENT' : 'PARTIAL'
    });
  }

  // 2. Metabolic Domain
  const glucose = latestParams.get('fasting_glucose') || latestParams.get('serum_glucose');
  const hba1c = latestParams.get('hba1c');
  const bmi = latestParams.get('bmi');

  const hasMetabolic = glucose || hba1c || bmi;

  if (!hasMetabolic) {
    risks.push({
      domain: 'Metabolic',
      level: 'GREY',
      label: 'Insufficient Data (No Glucose or HbA1c)',
      dataQuality: 'INSUFFICIENT'
    });
  } else {
    let maxRisk = 0;
    let reasons: string[] = [];

    if (glucose?.value !== null && glucose?.value !== undefined) {
      if (glucose.value >= 126) { maxRisk = Math.max(maxRisk, 3); reasons.push('Diabetes Range'); }
      else if (glucose.value >= 100) { maxRisk = Math.max(maxRisk, 1); reasons.push('Prediabetes Range'); }
    }
    if (hba1c?.value !== null && hba1c?.value !== undefined) {
      if (hba1c.value >= 6.5) { maxRisk = Math.max(maxRisk, 3); reasons.push('Elevated HbA1c'); }
      else if (hba1c.value >= 5.7) { maxRisk = Math.max(maxRisk, 1); reasons.push('Prediabetes HbA1c'); }
    }
    if (bmi?.value !== null && bmi?.value !== undefined) {
      if (bmi.value >= 30) { maxRisk = Math.max(maxRisk, 2); reasons.push('Obese BMI'); }
      else if (bmi.value >= 25) { maxRisk = Math.max(maxRisk, 1); reasons.push('Overweight BMI'); }
    }

    const level: DomainRisk['level'] = maxRisk === 3 ? 'RED' : maxRisk === 2 ? 'ORANGE' : maxRisk === 1 ? 'YELLOW' : 'GREEN';
    const label = reasons.length > 0 ? reasons[0] : 'Optimal Glycemic & Metabolic Bounds';

    risks.push({
      domain: 'Metabolic',
      level,
      label,
      dataQuality: (glucose && hba1c) ? 'SUFFICIENT' : 'PARTIAL'
    });
  }

  // 3. Renal Domain
  const creatinine = latestParams.get('creatinine');
  const bun = latestParams.get('bun');

  if (creatinine || bun) {
    let maxRisk = 0;
    let reasons: string[] = [];
    if (creatinine?.value !== null && creatinine?.value !== undefined) {
      if (creatinine.value >= 2.0) { maxRisk = Math.max(maxRisk, 3); reasons.push('Marked Creatinine Elevation'); }
      else if (creatinine.value >= 1.3) { maxRisk = Math.max(maxRisk, 2); reasons.push('Mildly Elevated Creatinine'); }
    }
    const level: DomainRisk['level'] = maxRisk === 3 ? 'RED' : maxRisk === 2 ? 'ORANGE' : maxRisk === 1 ? 'YELLOW' : 'GREEN';
    risks.push({
      domain: 'Renal',
      level,
      label: reasons.length > 0 ? reasons[0] : 'Normal Kidney Function Markers',
      dataQuality: creatinine ? 'SUFFICIENT' : 'PARTIAL'
    });
  }

  // 4. Hematologic Domain
  const hb = latestParams.get('hemoglobin');
  const plt = latestParams.get('platelets');
  const wbc = latestParams.get('wbc');

  if (hb || plt || wbc) {
    let maxRisk = 0;
    let reasons: string[] = [];
    if (hb?.value !== null && hb?.value !== undefined) {
      if (hb.value < 7.0) { maxRisk = Math.max(maxRisk, 3); reasons.push('Severe Anemia'); }
      else if (hb.value < 10.0) { maxRisk = Math.max(maxRisk, 2); reasons.push('Moderate Anemia'); }
      else if (hb.value < 12.0) { maxRisk = Math.max(maxRisk, 1); reasons.push('Mild Anemia'); }
    }
    if (plt?.value !== null && plt?.value !== undefined) {
      if (plt.value < 50) { maxRisk = Math.max(maxRisk, 3); reasons.push('Severe Thrombocytopenia'); }
      else if (plt.value < 100) { maxRisk = Math.max(maxRisk, 2); reasons.push('Low Platelet Count'); }
    }
    const level: DomainRisk['level'] = maxRisk === 3 ? 'RED' : maxRisk === 2 ? 'ORANGE' : maxRisk === 1 ? 'YELLOW' : 'GREEN';
    risks.push({
      domain: 'Hematologic',
      level,
      label: reasons.length > 0 ? reasons[0] : 'Optimal Complete Blood Count Bounds',
      dataQuality: hb ? 'SUFFICIENT' : 'PARTIAL'
    });
  }

  return risks;
}
