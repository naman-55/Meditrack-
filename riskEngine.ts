/**
 * MediTrack Authoritative Clinical Risk Engine
 * Evaluates patient observations across major clinical domains:
 * 1. Cardiovascular Health
 * 2. Metabolic Health
 * 3. Renal Health
 * 4. Hematologic & Immune Health
 *
 * Utilizes canonical parameter normalization, unit conversion, and validated clinical thresholds.
 */

import { normalizeParameterName, getParameterDisplayName } from './src/analytics/parameters.js';
import { convertToCanonicalUnit } from './src/analytics/unitRegistry.js';

export interface MeasurementRecord {
  id?: number;
  parameter: string;
  raw_value?: string;
  normalized_value: string;
  unit?: string;
  normalized_unit?: string;
  validation_status?: string;
  report_date: string;
  report?: string;
  page?: string;
}

export interface RiskResult {
  domain: string;
  level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';
  label: string;
  evidence: string;
  data_quality: 'RELIABLE' | 'PARTIAL' | 'INSUFFICIENT' | 'UNRELIABLE';
  rule_version: string;
}

export const RISK_RULE_VERSION = '2.0.0-clinical';

function extractNumeric(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = val.toString().replace(/,/g, '');
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function buildEvidenceJson(explanation: string, action: string, details: any[], missingRequirements: string[] = []): string {
  return JSON.stringify({ explanation, action, details, missingRequirements });
}

interface ParsedObservation {
  canonicalParam: string;
  displayName: string;
  originalValue: string;
  originalUnit: string;
  canonicalValue: number;
  canonicalUnit: string;
  date: string;
  report: string;
  page: string;
  validationStatus?: string;
}

/**
 * Extracts and canonicalizes patient observations by mapping aliases and converting units.
 */
function extractCanonicalObservations(measurements: MeasurementRecord[]): Map<string, ParsedObservation> {
  const latestByParam = new Map<string, ParsedObservation>();

  // Sort chronologically ascending so later ones overwrite earlier ones
  const sorted = [...measurements].sort((a, b) => {
    const da = new Date(a.report_date).getTime() || 0;
    const db = new Date(b.report_date).getTime() || 0;
    return da - db;
  });

  for (const m of sorted) {
    const canonical = normalizeParameterName(m.parameter);
    const rawValStr = String(m.raw_value || m.normalized_value || '').trim();
    const unitStr = String(m.unit || m.normalized_unit || '').trim();
    const reportName = m.report || 'Medical Report';
    const pageNum = m.page || '1';
    const dateStr = m.report_date || '';
    const vStatus = m.validation_status;

    // Handle blood pressure compound format (e.g. "120/80")
    if (canonical === 'blood_pressure' || rawValStr.includes('/')) {
      const parts = rawValStr.split('/');
      if (parts.length >= 2) {
        const sys = extractNumeric(parts[0]);
        const dia = extractNumeric(parts[1]);
        if (sys !== null && sys >= 40 && sys <= 300) {
          latestByParam.set('blood_pressure_systolic', {
            canonicalParam: 'blood_pressure_systolic',
            displayName: 'Systolic Blood Pressure',
            originalValue: `${sys}`,
            originalUnit: unitStr || 'mmHg',
            canonicalValue: sys,
            canonicalUnit: 'mmHg',
            date: dateStr,
            report: reportName,
            page: pageNum,
            validationStatus: vStatus
          });
        }
        if (dia !== null && dia >= 20 && dia <= 200) {
          latestByParam.set('blood_pressure_diastolic', {
            canonicalParam: 'blood_pressure_diastolic',
            displayName: 'Diastolic Blood Pressure',
            originalValue: `${dia}`,
            originalUnit: unitStr || 'mmHg',
            canonicalValue: dia,
            canonicalUnit: 'mmHg',
            date: dateStr,
            report: reportName,
            page: pageNum,
            validationStatus: vStatus
          });
        }
      }
      continue;
    }

    const numVal = extractNumeric(rawValStr);
    if (numVal === null) continue;

    // Convert to canonical unit
    let canonicalVal = numVal;
    let canonicalUnit = unitStr;
    const conversion = convertToCanonicalUnit(canonical, numVal, unitStr);
    if (conversion.success && conversion.convertedValue !== null) {
      canonicalVal = conversion.convertedValue;
      canonicalUnit = conversion.canonicalUnit;
    }

    latestByParam.set(canonical, {
      canonicalParam: canonical,
      displayName: getParameterDisplayName(canonical),
      originalValue: rawValStr,
      originalUnit: unitStr,
      canonicalValue: canonicalVal,
      canonicalUnit,
      date: dateStr,
      report: reportName,
      page: pageNum,
      validationStatus: vStatus
    });
  }

  return latestByParam;
}

// -------------------------------------------------------------
// 1. CARDIOVASCULAR RISK EVALUATION
// -------------------------------------------------------------
export function evaluateCardiovascularRisk(measurements: MeasurementRecord[]): RiskResult {
  const obs = extractCanonicalObservations(measurements);

  const sbp = obs.get('blood_pressure_systolic');
  const dbp = obs.get('blood_pressure_diastolic');
  const ldl = obs.get('ldl');
  const chol = obs.get('total_cholesterol');
  const tg = obs.get('triglycerides');
  const hdl = obs.get('hdl');

  const hasAnyCardio = sbp || dbp || ldl || chol || tg || hdl;

  if (!hasAnyCardio) {
    return {
      domain: 'cardiovascular',
      level: 'GREY',
      label: 'Insufficient Information',
      evidence: buildEvidenceJson(
        'Missing both Blood Pressure and Lipid Panel measurements to evaluate cardiovascular risk.',
        'Upload recent medical laboratory reports containing Blood Pressure or Lipid Profile metrics.',
        [],
        ['Blood Pressure', 'LDL Cholesterol', 'Total Cholesterol']
      ),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  const cardioObs = [sbp, dbp, ldl, chol, tg, hdl].filter(Boolean) as ParsedObservation[];
  if (cardioObs.some(o => o.validationStatus && o.validationStatus !== 'VALIDATED')) {
    return {
      domain: 'cardiovascular',
      level: 'GREY',
      label: 'Unreliable Data',
      evidence: buildEvidenceJson(
        'One or more critical cardiovascular measurements have not been validated.',
        'Review and validate pending clinical measurements before computing risk assessment.',
        [],
        ['Validated Measurements']
      ),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0; // 0=GREEN, 1=YELLOW, 2=ORANGE, 3=RED
  const evidenceList: any[] = [];
  const missingRequirements: string[] = [];

  // Blood Pressure Evaluation (AHA/ACC Hypertension Guidelines)
  if (sbp || dbp) {
    const sysVal = sbp ? sbp.canonicalValue : null;
    const diaVal = dbp ? dbp.canonicalValue : null;
    let bpReason = 'Normal';

    if ((sysVal !== null && sysVal >= 140) || (diaVal !== null && diaVal >= 90)) {
      maxRisk = Math.max(maxRisk, 3);
      bpReason = 'Stage 2 Hypertension (>=140/90 mmHg)';
    } else if ((sysVal !== null && sysVal >= 130) || (diaVal !== null && diaVal >= 80)) {
      maxRisk = Math.max(maxRisk, 2);
      bpReason = 'Stage 1 Hypertension (130-139/80-89 mmHg)';
    } else if (sysVal !== null && sysVal >= 120 && (diaVal === null || diaVal < 80)) {
      maxRisk = Math.max(maxRisk, 1);
      bpReason = 'Elevated Blood Pressure (120-129/<80 mmHg)';
    }

    const bpDisplay = `${sysVal ?? '—'}/${diaVal ?? '—'}`;
    const primaryObs = sbp || dbp!;
    evidenceList.push({
      parameter: 'Blood Pressure',
      value: `${bpDisplay} mmHg`,
      date: primaryObs.date,
      report: primaryObs.report,
      page: primaryObs.page,
      reason: bpReason
    });
  } else {
    missingRequirements.push('Blood Pressure');
  }

  // LDL Cholesterol Evaluation (ATP III Guidelines)
  if (ldl) {
    const val = ldl.canonicalValue;
    let ldlReason = 'Optimal (<100 mg/dL)';
    if (val >= 160) {
      maxRisk = Math.max(maxRisk, 3);
      ldlReason = 'High LDL (>=160 mg/dL)';
    } else if (val >= 130) {
      maxRisk = Math.max(maxRisk, 2);
      ldlReason = 'Borderline High LDL (130-159 mg/dL)';
    } else if (val >= 100) {
      maxRisk = Math.max(maxRisk, 1);
      ldlReason = 'Above Optimal LDL (100-129 mg/dL)';
    }

    evidenceList.push({
      parameter: 'LDL Cholesterol',
      value: `${val.toFixed(1)} ${ldl.canonicalUnit}`,
      date: ldl.date,
      report: ldl.report,
      page: ldl.page,
      reason: ldlReason
    });
  } else {
    missingRequirements.push('LDL Cholesterol');
  }

  // Total Cholesterol Evaluation
  if (chol) {
    const val = chol.canonicalValue;
    let cholReason = 'Desirable (<200 mg/dL)';
    if (val >= 240) {
      maxRisk = Math.max(maxRisk, 3);
      cholReason = 'High Total Cholesterol (>=240 mg/dL)';
    } else if (val >= 200) {
      maxRisk = Math.max(maxRisk, 2);
      cholReason = 'Borderline High Total Cholesterol (200-239 mg/dL)';
    }

    evidenceList.push({
      parameter: 'Total Cholesterol',
      value: `${val.toFixed(1)} ${chol.canonicalUnit}`,
      date: chol.date,
      report: chol.report,
      page: chol.page,
      reason: cholReason
    });
  }

  // Triglycerides Evaluation
  if (tg) {
    const val = tg.canonicalValue;
    let tgReason = 'Normal (<150 mg/dL)';
    if (val >= 200) {
      maxRisk = Math.max(maxRisk, 2);
      tgReason = 'High Triglycerides (>=200 mg/dL)';
    } else if (val >= 150) {
      maxRisk = Math.max(maxRisk, 1);
      tgReason = 'Borderline High Triglycerides (150-199 mg/dL)';
    }

    evidenceList.push({
      parameter: 'Triglycerides',
      value: `${val.toFixed(1)} ${tg.canonicalUnit}`,
      date: tg.date,
      report: tg.report,
      page: tg.page,
      reason: tgReason
    });
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'Optimal Indicators';
  let explanation = 'Your cardiovascular metrics are within healthy physiological reference intervals.';
  let action = 'Maintain your current diet, physical activity, and routine cardiovascular checkups.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant Indicators Detected';
    explanation = 'Major cardiovascular indicators (such as blood pressure or LDL) significantly exceed healthy targets.';
    action = 'Consult a cardiologist or primary care physician promptly for a formal clinical evaluation.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated Indicators';
    explanation = 'Cardiovascular metrics are moderately elevated above normal target thresholds.';
    action = 'Consider lifestyle modifications (diet, sodium reduction, exercise) and schedule a routine checkup.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Mild Indicators';
    explanation = 'Mild elevations in blood pressure or lipid markers were detected.';
    action = 'Monitor blood pressure regularly and review dietary saturated fat intake.';
  }

  const dataQuality = (sbp && ldl) ? 'RELIABLE' : 'PARTIAL';

  return {
    domain: 'cardiovascular',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: dataQuality,
    rule_version: RISK_RULE_VERSION
  };
}

// -------------------------------------------------------------
// 2. METABOLIC RISK EVALUATION
// -------------------------------------------------------------
export function evaluateMetabolicRisk(measurements: MeasurementRecord[]): RiskResult {
  const obs = extractCanonicalObservations(measurements);

  const glucose = obs.get('fasting_glucose') || obs.get('serum_glucose');
  const hba1c = obs.get('hba1c');
  const bmi = obs.get('bmi');

  const hasAnyMetabolic = glucose || hba1c || bmi;

  if (!hasAnyMetabolic) {
    return {
      domain: 'metabolic',
      level: 'GREY',
      label: 'Insufficient Information',
      evidence: buildEvidenceJson(
        'Missing Glucose, HbA1c, and BMI measurements to evaluate metabolic risk.',
        'Upload blood chemistry or diabetic panel reports containing blood glucose or HbA1c.',
        [],
        ['Fasting Glucose', 'HbA1c', 'BMI']
      ),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  const metabolicObs = [glucose, hba1c, bmi].filter(Boolean) as ParsedObservation[];
  if (metabolicObs.some(o => o.validationStatus && o.validationStatus !== 'VALIDATED')) {
    return {
      domain: 'metabolic',
      level: 'GREY',
      label: 'Unreliable Data',
      evidence: buildEvidenceJson(
        'One or more critical metabolic measurements have not been validated.',
        'Review and validate pending clinical measurements before computing risk assessment.',
        [],
        ['Validated Measurements']
      ),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0;
  const evidenceList: any[] = [];
  const missingRequirements: string[] = [];

  // Glucose Evaluation (ADA Diagnostic Thresholds)
  if (glucose) {
    const val = glucose.canonicalValue;
    let gReason = 'Normal Fasting Glycemia (70-99 mg/dL)';
    if (val >= 126) {
      maxRisk = Math.max(maxRisk, 3);
      gReason = 'Diabetes Range (>=126 mg/dL)';
    } else if (val >= 100) {
      maxRisk = Math.max(maxRisk, 1);
      gReason = 'Impaired Fasting Glucose / Prediabetes (100-125 mg/dL)';
    }

    evidenceList.push({
      parameter: glucose.displayName,
      value: `${val.toFixed(1)} ${glucose.canonicalUnit}`,
      date: glucose.date,
      report: glucose.report,
      page: glucose.page,
      reason: gReason
    });
  } else {
    missingRequirements.push('Blood Glucose');
  }

  // HbA1c Evaluation
  if (hba1c) {
    const val = hba1c.canonicalValue;
    let a1cReason = 'Normal Glycated Hemoglobin (<5.7%)';
    if (val >= 6.5) {
      maxRisk = Math.max(maxRisk, 3);
      a1cReason = 'Diabetes Diagnostic Threshold (>=6.5%)';
    } else if (val >= 5.7) {
      maxRisk = Math.max(maxRisk, 1);
      a1cReason = 'Prediabetes Range (5.7-6.4%)';
    }

    evidenceList.push({
      parameter: 'HbA1c',
      value: `${val.toFixed(1)}%`,
      date: hba1c.date,
      report: hba1c.report,
      page: hba1c.page,
      reason: a1cReason
    });
  } else {
    missingRequirements.push('HbA1c');
  }

  // BMI Evaluation
  if (bmi) {
    const val = bmi.canonicalValue;
    let bmiReason = 'Normal Body Mass Index (18.5-24.9 kg/m²)';
    if (val >= 35) {
      maxRisk = Math.max(maxRisk, 3);
      bmiReason = 'Class 2+ Obesity (>=35 kg/m²)';
    } else if (val >= 30) {
      maxRisk = Math.max(maxRisk, 2);
      bmiReason = 'Obesity (30-34.9 kg/m²)';
    } else if (val >= 25) {
      maxRisk = Math.max(maxRisk, 1);
      bmiReason = 'Overweight (25-29.9 kg/m²)';
    }

    evidenceList.push({
      parameter: 'Body Mass Index (BMI)',
      value: `${val.toFixed(1)} kg/m²`,
      date: bmi.date,
      report: bmi.report,
      page: bmi.page,
      reason: bmiReason
    });
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'Optimal Indicators';
  let explanation = 'Your blood sugar and metabolic markers are currently within optimal healthy bounds.';
  let action = 'Maintain a balanced diet and regular physical activity.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant Indicators Detected';
    explanation = 'Metabolic markers (such as fasting glucose or HbA1c) are consistent with diabetes or metabolic syndrome.';
    action = 'Consult an endocrinologist or primary care physician for a glycemic management plan.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated Indicators';
    explanation = 'Metabolic markers indicate notable metabolic or weight elevation.';
    action = 'Discuss weight and metabolic strategies with your healthcare provider.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Mild Indicators';
    explanation = 'Mild elevations in glycemic markers or BMI (e.g. prediabetes range).';
    action = 'Focus on dietary improvements, reducing refined sugars, and regular exercise.';
  }

  const dataQuality = (glucose && (hba1c || bmi)) ? 'RELIABLE' : 'PARTIAL';

  return {
    domain: 'metabolic',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: dataQuality,
    rule_version: RISK_RULE_VERSION
  };
}

// -------------------------------------------------------------
// 3. RENAL RISK EVALUATION
// -------------------------------------------------------------
export function evaluateRenalRisk(measurements: MeasurementRecord[]): RiskResult {
  const obs = extractCanonicalObservations(measurements);

  const creatinine = obs.get('creatinine');
  const bun = obs.get('bun');
  const egfr = obs.get('egfr');

  const hasAnyRenal = creatinine || bun || egfr;

  if (!hasAnyRenal) {
    return {
      domain: 'renal',
      level: 'GREY',
      label: 'Insufficient Information',
      evidence: buildEvidenceJson(
        'Missing Serum Creatinine and Renal Panel indicators to assess kidney function.',
        'Upload comprehensive metabolic panel (CMP) or renal function panel reports.',
        [],
        ['Serum Creatinine', 'BUN']
      ),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  const renalObs = [creatinine, bun, egfr].filter(Boolean) as ParsedObservation[];
  if (renalObs.some(o => o.validationStatus && o.validationStatus !== 'VALIDATED')) {
    return {
      domain: 'renal',
      level: 'GREY',
      label: 'Unreliable Data',
      evidence: buildEvidenceJson(
        'One or more renal function measurements have not been validated.',
        'Review and validate pending clinical measurements before computing risk assessment.',
        [],
        ['Validated Measurements']
      ),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0;
  const evidenceList: any[] = [];
  const missingRequirements: string[] = [];

  if (creatinine) {
    const val = creatinine.canonicalValue;
    let crReason = 'Normal Serum Creatinine (0.6-1.2 mg/dL)';
    if (val >= 2.0) {
      maxRisk = Math.max(maxRisk, 3);
      crReason = 'Marked Creatinine Elevation (>=2.0 mg/dL)';
    } else if (val >= 1.3) {
      maxRisk = Math.max(maxRisk, 2);
      crReason = 'Mild to Moderate Creatinine Elevation (1.3-1.9 mg/dL)';
    }

    evidenceList.push({
      parameter: 'Serum Creatinine',
      value: `${val.toFixed(2)} ${creatinine.canonicalUnit}`,
      date: creatinine.date,
      report: creatinine.report,
      page: creatinine.page,
      reason: crReason
    });
  } else {
    missingRequirements.push('Serum Creatinine');
  }

  if (bun) {
    const val = bun.canonicalValue;
    let bunReason = 'Normal BUN (7-20 mg/dL)';
    if (val >= 30) {
      maxRisk = Math.max(maxRisk, 2);
      bunReason = 'Elevated Blood Urea Nitrogen (>=30 mg/dL)';
    } else if (val >= 21) {
      maxRisk = Math.max(maxRisk, 1);
      bunReason = 'Mildly Elevated BUN (21-29 mg/dL)';
    }

    evidenceList.push({
      parameter: 'Blood Urea Nitrogen (BUN)',
      value: `${val.toFixed(1)} ${bun.canonicalUnit}`,
      date: bun.date,
      report: bun.report,
      page: bun.page,
      reason: bunReason
    });
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'Optimal Indicators';
  let explanation = 'Renal filtration markers (creatinine/BUN) are within healthy physiological ranges.';
  let action = 'Maintain adequate hydration and routine metabolic health screenings.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant Indicators Detected';
    explanation = 'Serum creatinine is substantially elevated, indicating significant reduction in renal clearance.';
    action = 'Consult a nephrologist or physician promptly for renal diagnostic assessment.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated Indicators';
    explanation = 'Kidney filtration biomarkers are moderately elevated above normal target baselines.';
    action = 'Review hydration, medications (NSAIDs), and schedule a follow-up kidney panel.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Mild Indicators';
    explanation = 'Mild elevations observed in BUN or filtration markers.';
    action = 'Ensure good hydration and recheck on next routine panel.';
  }

  return {
    domain: 'renal',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: creatinine ? 'RELIABLE' : 'PARTIAL',
    rule_version: RISK_RULE_VERSION
  };
}

// -------------------------------------------------------------
// 4. HEMATOLOGIC RISK EVALUATION
// -------------------------------------------------------------
export function evaluateHematologicRisk(measurements: MeasurementRecord[]): RiskResult {
  const obs = extractCanonicalObservations(measurements);

  const hb = obs.get('hemoglobin');
  const plt = obs.get('platelets');
  const wbc = obs.get('wbc');
  const pcv = obs.get('hematocrit');

  const hasAnyHem = hb || plt || wbc || pcv;

  if (!hasAnyHem) {
    return {
      domain: 'hematologic',
      level: 'GREY',
      label: 'Insufficient Information',
      evidence: buildEvidenceJson(
        'Missing Complete Blood Count (CBC) measurements to evaluate hematologic health.',
        'Upload complete blood count (CBC) or hemogram laboratory reports.',
        [],
        ['Hemoglobin', 'Platelet Count', 'WBC']
      ),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  const hemObs = [hb, plt, wbc, pcv].filter(Boolean) as ParsedObservation[];
  if (hemObs.some(o => o.validationStatus && o.validationStatus !== 'VALIDATED')) {
    return {
      domain: 'hematologic',
      level: 'GREY',
      label: 'Unreliable Data',
      evidence: buildEvidenceJson(
        'One or more hematologic measurements have not been validated.',
        'Review and validate pending clinical measurements before computing risk assessment.',
        [],
        ['Validated Measurements']
      ),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0;
  const evidenceList: any[] = [];
  const missingRequirements: string[] = [];

  if (hb) {
    const val = hb.canonicalValue;
    let hbReason = 'Normal Hemoglobin (12.0-17.5 g/dL)';
    if (val < 7.0) {
      maxRisk = Math.max(maxRisk, 3);
      hbReason = 'Severe Anemia (<7.0 g/dL)';
    } else if (val < 10.0) {
      maxRisk = Math.max(maxRisk, 2);
      hbReason = 'Moderate Anemia (7.0-9.9 g/dL)';
    } else if (val < 12.0) {
      maxRisk = Math.max(maxRisk, 1);
      hbReason = 'Mild Anemia (10.0-11.9 g/dL)';
    } else if (val > 18.5) {
      maxRisk = Math.max(maxRisk, 2);
      hbReason = 'Elevated Hemoglobin / Polycythemia (>18.5 g/dL)';
    }

    evidenceList.push({
      parameter: 'Hemoglobin',
      value: `${val.toFixed(1)} ${hb.canonicalUnit}`,
      date: hb.date,
      report: hb.report,
      page: hb.page,
      reason: hbReason
    });
  } else {
    missingRequirements.push('Hemoglobin');
  }

  if (plt) {
    const val = plt.canonicalValue;
    let pltReason = 'Normal Platelet Count (150-450 x10^3/µL)';
    if (val < 50) {
      maxRisk = Math.max(maxRisk, 3);
      pltReason = 'Severe Thrombocytopenia (<50 x10^3/µL)';
    } else if (val < 100) {
      maxRisk = Math.max(maxRisk, 2);
      pltReason = 'Moderate Thrombocytopenia (50-99 x10^3/µL)';
    } else if (val < 150) {
      maxRisk = Math.max(maxRisk, 1);
      pltReason = 'Mild Thrombocytopenia (100-149 x10^3/µL)';
    } else if (val > 500) {
      maxRisk = Math.max(maxRisk, 2);
      pltReason = 'Thrombocytosis (>500 x10^3/µL)';
    }

    evidenceList.push({
      parameter: 'Platelet Count',
      value: `${val.toFixed(0)} ${plt.canonicalUnit}`,
      date: plt.date,
      report: plt.report,
      page: plt.page,
      reason: pltReason
    });
  } else {
    missingRequirements.push('Platelets');
  }

  if (wbc) {
    const val = wbc.canonicalValue;
    let wbcReason = 'Normal Leukocyte Count (4.5-11.0 x10^3/µL)';
    if (val > 20.0 || val < 2.0) {
      maxRisk = Math.max(maxRisk, 3);
      wbcReason = 'Marked Leukocytosis / Leukopenia';
    } else if (val > 15.0 || val < 3.5) {
      maxRisk = Math.max(maxRisk, 2);
      wbcReason = 'Moderate WBC Elevation / Leukopenia';
    } else if (val > 11.0) {
      maxRisk = Math.max(maxRisk, 1);
      wbcReason = 'Mild Leukocytosis (11.1-15.0 x10^3/µL)';
    }

    evidenceList.push({
      parameter: 'Total WBC Count',
      value: `${val.toFixed(1)} ${wbc.canonicalUnit}`,
      date: wbc.date,
      report: wbc.report,
      page: wbc.page,
      reason: wbcReason
    });
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'Optimal Indicators';
  let explanation = 'Complete blood count markers (hemoglobin, platelets, WBC) are within healthy parameters.';
  let action = 'Continue routine wellness screening.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant Indicators Detected';
    explanation = 'Hematologic indicators show marked deviation (such as severe anemia or thrombocytopenia).';
    action = 'Consult a hematologist or primary care physician promptly.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated Indicators';
    explanation = 'Moderate deviations detected in hemoglobin, cell counts, or platelets.';
    action = 'Discuss blood counts and iron/vitamin status with your healthcare provider.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Mild Indicators';
    explanation = 'Mild variations in complete blood count parameters.';
    action = 'Monitor dietary intake and review on your next routine test.';
  }

  return {
    domain: 'hematologic',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: (hb && plt) ? 'RELIABLE' : 'PARTIAL',
    rule_version: RISK_RULE_VERSION
  };
}

// -------------------------------------------------------------
// CENTRAL DISPATCHER: ALL DOMAINS
// -------------------------------------------------------------
export function evaluateRiskAllDomains(measurements: MeasurementRecord[]): RiskResult[] {
  return [
    evaluateCardiovascularRisk(measurements),
    evaluateMetabolicRisk(measurements),
    evaluateRenalRisk(measurements),
    evaluateHematologicRisk(measurements)
  ];
}
