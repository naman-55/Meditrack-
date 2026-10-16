/**
 * MediTrack Alert Classification & Clinical Rule Engine
 * Classifies medical measurements and laboratory findings into validated severity tiers:
 * - INFORMATIONAL: Routine records, upload confirmations, normal notifications
 * - WARNING: Out-of-reference range, non-urgent follow-up recommended
 * - HIGH_PRIORITY: Clinically significant finding requiring prompt attention
 * - CRITICAL: Clinically urgent finding or panic lab value requiring immediate medical action
 */

import crypto from 'crypto';
import { normalizeParameterName, getParameterDisplayName } from '../../src/analytics/parameters.js';
import { convertToCanonicalUnit } from '../../src/analytics/unitRegistry.js';

export type AlertSeverity = 'INFORMATIONAL' | 'WARNING' | 'HIGH_PRIORITY' | 'CRITICAL';

export interface ClassifiedAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
  parameter: string;
  displayName: string;
  measuredValue: string;
  unit: string;
  canonicalValue: number | null;
  canonicalUnit: string;
  referenceRange: string;
  explanation: string;
  recommendedAction: string;
  sourceReportId?: number;
  sourceText?: string;
  idempotencyKey: string;
}

export interface RawMeasurementInput {
  parameter: string;
  raw_value: string;
  normalized_value?: string;
  unit?: string;
  normalized_unit?: string;
  source_page?: string;
  source_text?: string;
  validation_status?: string;
  extraction_confidence?: number;
}

/**
 * Validated Clinical Threshold Definitions
 * Grounded in AHA, ADA, NKF, and CAP Critical Values Clinical Guidelines.
 * Note: If a parameter is outside these rules, it is not given an invented emergency severity.
 */
interface ClinicalRuleDefinition {
  canonicalUnit: string;
  normalMin?: number;
  normalMax?: number;
  highPriorityMin?: number;
  highPriorityMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  formatRange: string;
  criticalExplanationLow?: string;
  criticalExplanationHigh?: string;
  highPriorityExplanation?: string;
  warningExplanation?: string;
  criticalAction: string;
  highPriorityAction: string;
  warningAction: string;
}

export const VALIDATED_CLINICAL_RULES: Record<string, ClinicalRuleDefinition> = {
  // Blood Glucose (Fasting)
  fasting_glucose: {
    canonicalUnit: 'mg/dL',
    normalMin: 70,
    normalMax: 99,
    highPriorityMin: 126,
    criticalMin: 50,
    criticalMax: 400,
    formatRange: '70 - 99 mg/dL',
    criticalExplanationLow: 'Severe hypoglycemia (<50 mg/dL) carries immediate risk of neuroglycopenia, loss of consciousness, and acute metabolic shock.',
    criticalExplanationHigh: 'Severe hyperglycemia (>400 mg/dL) indicates profound glycemic decompensation with risk of diabetic ketoacidosis (DKA) or hyperosmolar hyperglycemic state (HHS).',
    highPriorityExplanation: 'Fasting glucose meets or exceeds diagnostic thresholds for diabetes (>=126 mg/dL).',
    warningExplanation: 'Impaired fasting glucose (100-125 mg/dL) indicating elevated glycemic resistance / prediabetes.',
    criticalAction: 'Urgent medical attention is recommended. If experiencing confusion, tremors, or severe fatigue, seek immediate emergency care.',
    highPriorityAction: 'Schedule a prompt consultation with an endocrinologist or primary care physician for a glycemic management plan.',
    warningAction: 'Consult your physician for follow-up testing (HbA1c) and discuss diet and lifestyle interventions.'
  },

  // Serum / Random Glucose
  serum_glucose: {
    canonicalUnit: 'mg/dL',
    normalMin: 70,
    normalMax: 140,
    highPriorityMin: 200,
    criticalMin: 50,
    criticalMax: 400,
    formatRange: '70 - 140 mg/dL',
    criticalExplanationLow: 'Critical hypoglycemia (<50 mg/dL) poses acute risk to brain function and requires rapid glucose correction.',
    criticalExplanationHigh: 'Random blood glucose >400 mg/dL represents severe uncontrolled hyperglycemia.',
    highPriorityExplanation: 'Random glucose >=200 mg/dL suggests significant blood sugar dysregulation.',
    warningExplanation: 'Random glucose is moderately elevated (141-199 mg/dL).',
    criticalAction: 'Urgent medical evaluation is needed. If symptomatic, administer fast-acting carbohydrates and seek emergency services.',
    highPriorityAction: 'Contact your healthcare provider promptly for diagnostic evaluation.',
    warningAction: 'Monitor your blood sugar levels and schedule a routine medical evaluation.'
  },

  // Systolic Blood Pressure
  blood_pressure_systolic: {
    canonicalUnit: 'mmHg',
    normalMin: 90,
    normalMax: 120,
    highPriorityMin: 140,
    criticalMin: 70,
    criticalMax: 180,
    formatRange: '90 - 120 mmHg',
    criticalExplanationLow: 'Systolic blood pressure <70 mmHg indicates severe hypotension and possible circulatory shock.',
    criticalExplanationHigh: 'Systolic blood pressure >=180 mmHg represents a Hypertensive Crisis requiring immediate emergency evaluation.',
    highPriorityExplanation: 'Systolic blood pressure >=140 mmHg indicates Stage 2 Hypertension.',
    warningExplanation: 'Systolic blood pressure (121-139 mmHg) is in the elevated or Stage 1 hypertension range.',
    criticalAction: 'Immediate emergency medical care is strongly advised. Rest quietly and contact emergency services if experiencing headache, chest pain, or vision changes.',
    highPriorityAction: 'Consult a cardiologist or primary care physician promptly to discuss antihypertensive management.',
    warningAction: 'Re-measure after resting, keep a blood pressure log, and review with your physician.'
  },

  // Diastolic Blood Pressure
  blood_pressure_diastolic: {
    canonicalUnit: 'mmHg',
    normalMin: 60,
    normalMax: 80,
    highPriorityMin: 90,
    criticalMin: 40,
    criticalMax: 120,
    formatRange: '60 - 80 mmHg',
    criticalExplanationLow: 'Diastolic blood pressure <40 mmHg indicates severe vascular compromise.',
    criticalExplanationHigh: 'Diastolic blood pressure >=120 mmHg represents acute hypertensive crisis with risk of end-organ damage.',
    highPriorityExplanation: 'Diastolic blood pressure >=90 mmHg indicates Stage 2 Hypertension.',
    warningExplanation: 'Diastolic blood pressure (81-89 mmHg) is in the Stage 1 hypertension range.',
    criticalAction: 'Immediate medical evaluation is needed. Contact emergency services or visit an emergency room.',
    highPriorityAction: 'Contact your physician promptly for formal blood pressure evaluation.',
    warningAction: 'Record repeated readings and consult your healthcare provider.'
  },

  // Hemoglobin
  hemoglobin: {
    canonicalUnit: 'g/dL',
    normalMin: 12.0,
    normalMax: 17.5,
    criticalMin: 7.0,
    criticalMax: 20.0,
    formatRange: '12.0 - 17.5 g/dL',
    criticalExplanationLow: 'Hemoglobin <7.0 g/dL is severe critical anemia approaching blood transfusion threshold with risk of cardiac ischemia.',
    criticalExplanationHigh: 'Hemoglobin >20.0 g/dL indicates severe polycythemia with increased blood hyperviscosity and thrombosis risk.',
    highPriorityExplanation: 'Hemoglobin is significantly reduced (7.0-9.9 g/dL), representing moderate to severe anemia.',
    warningExplanation: 'Hemoglobin is mildly below normal reference range (10.0-11.9 g/dL).',
    criticalAction: 'Urgent evaluation by a hematologist or emergency department is recommended for immediate clinical stabilization.',
    highPriorityAction: 'Consult a physician promptly for anemia workup (ferritin, iron panel, B12/folate, occult blood).',
    warningAction: 'Review iron intake and discuss mild anemia with your healthcare provider at your next visit.'
  },

  // Platelets
  platelets: {
    canonicalUnit: 'x10^3/µL',
    normalMin: 150,
    normalMax: 450,
    criticalMin: 20,
    criticalMax: 1000,
    formatRange: '150 - 450 x10^3/µL',
    criticalExplanationLow: 'Platelet count <20 x10^3/µL represents severe critical thrombocytopenia with high risk of spontaneous major hemorrhage.',
    criticalExplanationHigh: 'Platelet count >1,000 x10^3/µL represents extreme thrombocytosis with paradoxical bleeding and thrombosis risk.',
    highPriorityExplanation: 'Platelets are moderately reduced (20-99 x10^3/µL) or elevated (>500 x10^3/µL).',
    warningExplanation: 'Platelet count is mildly out of standard reference range (100-149 x10^3/µL).',
    criticalAction: 'Seek emergency hematology care immediately. Avoid trauma, sharp objects, and anticoagulants/aspirin.',
    highPriorityAction: 'Consult a hematologist or primary care physician promptly for a peripheral blood smear and repeat CBC.',
    warningAction: 'Follow up with your physician to monitor platelet trends on your next routine test.'
  },

  // Serum Creatinine
  creatinine: {
    canonicalUnit: 'mg/dL',
    normalMin: 0.6,
    normalMax: 1.2,
    highPriorityMin: 2.0,
    criticalMax: 4.0,
    formatRange: '0.6 - 1.2 mg/dL',
    criticalExplanationHigh: 'Serum creatinine >=4.0 mg/dL represents severe acute kidney injury or end-stage renal impairment requiring urgent nephrology care.',
    highPriorityExplanation: 'Creatinine is substantially elevated (2.0-3.9 mg/dL), indicating significant impairment in renal filtration.',
    warningExplanation: 'Creatinine is mildly elevated (1.3-1.9 mg/dL) above the standard baseline.',
    criticalAction: 'Urgent nephrology evaluation or emergency medical assessment is strongly advised.',
    highPriorityAction: 'Consult a nephrologist or physician promptly; review medications (especially NSAIDs/ACEi) and hydration.',
    warningAction: 'Ensure adequate hydration and discuss kidney function monitoring with your doctor.'
  },

  // Total Cholesterol
  total_cholesterol: {
    canonicalUnit: 'mg/dL',
    normalMax: 200,
    highPriorityMin: 240,
    formatRange: '< 200 mg/dL',
    highPriorityExplanation: 'Total cholesterol is markedly high (>=240 mg/dL), significantly increasing long-term atherosclerotic cardiovascular risk.',
    warningExplanation: 'Total cholesterol is borderline high (200-239 mg/dL).',
    criticalAction: 'Consult a physician regarding cardiovascular lipid management.',
    highPriorityAction: 'Consult a physician or cardiologist to evaluate cardiovascular risk and potential statin therapy.',
    warningAction: 'Adopt dietary improvements reducing saturated fats, increase physical activity, and retest in 3-6 months.'
  },

  // LDL Cholesterol
  ldl: {
    canonicalUnit: 'mg/dL',
    normalMax: 100,
    highPriorityMin: 160,
    criticalMax: 190,
    formatRange: '< 100 mg/dL',
    criticalExplanationHigh: 'LDL cholesterol >=190 mg/dL represents severe hypercholesterolemia (often familial) requiring intensive lipid-lowering therapy.',
    highPriorityExplanation: 'LDL cholesterol is high (160-189 mg/dL), accelerating vascular plaque deposition.',
    warningExplanation: 'LDL cholesterol is borderline elevated (100-159 mg/dL).',
    criticalAction: 'Consult a cardiologist or lipidologist for comprehensive cardiovascular evaluation.',
    highPriorityAction: 'Consult your physician to discuss lipid-lowering interventions and lifestyle modifications.',
    warningAction: 'Review heart-healthy dietary habits and schedule routine cardiovascular screening.'
  },

  // Oxygen Saturation (SpO2)
  spo2: {
    canonicalUnit: '%',
    normalMin: 95,
    normalMax: 100,
    criticalMin: 88,
    formatRange: '95 - 100%',
    criticalExplanationLow: 'Oxygen saturation (SpO2) <88% represents severe hypoxemia with inadequate tissue oxygenation.',
    highPriorityExplanation: 'SpO2 is low (88-92%), indicating respiratory compromise.',
    warningExplanation: 'SpO2 is slightly below normal (93-94%).',
    criticalAction: 'Emergency medical care and supplemental oxygen are urgently required. Seek emergency medical attention.',
    highPriorityAction: 'Contact your healthcare provider or urgent care promptly for respiratory assessment.',
    warningAction: 'Rest, check sensor positioning, and contact your doctor if shortness of breath persists.'
  },

  // Heart Rate
  heart_rate: {
    canonicalUnit: 'bpm',
    normalMin: 60,
    normalMax: 100,
    criticalMin: 40,
    criticalMax: 140,
    formatRange: '60 - 100 bpm',
    criticalExplanationLow: 'Resting heart rate <40 bpm represents critical bradycardia with risk of syncope or circulatory collapse.',
    criticalExplanationHigh: 'Resting heart rate >140 bpm represents critical tachycardia with hemodynamic stress.',
    highPriorityExplanation: 'Heart rate is markedly elevated (101-139 bpm) or reduced (40-50 bpm).',
    warningExplanation: 'Heart rate is mildly outside the standard resting range (51-59 or 101-110 bpm).',
    criticalAction: 'Immediate medical evaluation is needed. If experiencing dizziness, shortness of breath, or chest pain, call emergency services.',
    highPriorityAction: 'Consult a physician or cardiologist for an electrocardiogram (ECG/EKG).',
    warningAction: 'Re-measure while relaxed and discuss resting pulse rates with your physician.'
  }
};

/**
 * Checks if the raw text or extraction contains explicit critical flags from the laboratory.
 */
export function detectLaboratoryCriticalFlag(text: string): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();
  return (
    upper.includes('CRITICAL HIGH') ||
    upper.includes('CRITICAL LOW') ||
    upper.includes('PANIC VALUE') ||
    upper.includes('ALERT VALUE') ||
    upper.includes('*CRIT*') ||
    upper.includes('CRITICAL:') ||
    upper.includes('VALUE CRITICAL')
  );
}

/**
 * Evaluates a single measurement and returns a ClassifiedAlert or null if normal / no rule matches.
 */
export function classifyMeasurement(
  userId: number,
  meas: RawMeasurementInput,
  reportId?: number,
  reportDate?: string
): ClassifiedAlert | null {
  const paramCanonical = normalizeParameterName(meas.parameter);
  const displayName = getParameterDisplayName(paramCanonical);
  const rawVal = String(meas.raw_value || meas.normalized_value || '').trim();
  const unit = String(meas.unit || meas.normalized_unit || '').trim();
  const sourceText = String(meas.source_text || '');

  // 1. Check for explicit laboratory critical flag
  const hasLabCriticalFlag = detectLaboratoryCriticalFlag(sourceText) || detectLaboratoryCriticalFlag(rawVal);

  // 2. Extract numeric value
  let numericVal: number | null = null;
  const numMatch = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (numMatch) {
    numericVal = parseFloat(numMatch[0]);
  }

  // Handle blood pressure compound format (e.g. "185/115")
  if (paramCanonical === 'blood_pressure' || (meas.parameter.toLowerCase().includes('pressure') && rawVal.includes('/'))) {
    const parts = rawVal.split('/');
    if (parts.length === 2) {
      const sbp = parseFloat(parts[0]);
      const dbp = parseFloat(parts[1]);
      if (!isNaN(sbp) && !isNaN(dbp)) {
        // Evaluate systolic first
        const sbpAlert = classifyMeasurement(
          userId,
          { parameter: 'blood_pressure_systolic', raw_value: String(sbp), unit: 'mmHg', source_text: sourceText },
          reportId,
          reportDate
        );
        if (sbpAlert && sbpAlert.severity === 'CRITICAL') return sbpAlert;

        // Evaluate diastolic
        const dbpAlert = classifyMeasurement(
          userId,
          { parameter: 'blood_pressure_diastolic', raw_value: String(dbp), unit: 'mmHg', source_text: sourceText },
          reportId,
          reportDate
        );
        if (dbpAlert && dbpAlert.severity === 'CRITICAL') return dbpAlert;

        // Return the most severe
        return sbpAlert || dbpAlert;
      }
    }
  }

  // If no numeric value could be extracted and no lab flag exists, do NOT invent an alert
  if (numericVal === null && !hasLabCriticalFlag) {
    return null;
  }

  const rule = VALIDATED_CLINICAL_RULES[paramCanonical];

  // Convert to canonical unit if rule exists
  let canonicalVal = numericVal;
  let canonicalUnit = unit || (rule ? rule.canonicalUnit : '');
  if (rule && numericVal !== null) {
    const conv = convertToCanonicalUnit(paramCanonical, numericVal, unit);
    if (conv.success && conv.convertedValue !== null) {
      canonicalVal = conv.convertedValue;
      canonicalUnit = conv.canonicalUnit;
    }
  }

  // 3. Explicit Laboratory Critical Flag Override
  if (hasLabCriticalFlag) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, 'CRITICAL', rawVal);
    return {
      severity: 'CRITICAL',
      title: `Critical Finding: ${displayName}`,
      message: `The laboratory report explicitly flagged ${displayName} (${rawVal} ${unit}) as a CRITICAL/PANIC value.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: rawVal,
      unit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule ? rule.formatRange : 'Flagged by Reporting Laboratory',
      explanation: `The performing laboratory designated this finding as an urgent critical alert requiring immediate clinical intervention.`,
      recommendedAction: rule?.criticalAction || 'Contact your physician or seek immediate urgent care evaluation.',
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }

  // If no validated rule exists for this analyte, do not invent risk thresholds!
  if (!rule || canonicalVal === null) {
    return null;
  }

  // 4. Critical Severity Check
  if (
    (rule.criticalMin !== undefined && canonicalVal < rule.criticalMin) ||
    (rule.criticalMax !== undefined && canonicalVal >= rule.criticalMax)
  ) {
    const isLow = rule.criticalMin !== undefined && canonicalVal < rule.criticalMin;
    const explanation = isLow 
      ? (rule.criticalExplanationLow || `Measured ${displayName} (${canonicalVal} ${canonicalUnit}) is critically low below safety limits.`)
      : (rule.criticalExplanationHigh || `Measured ${displayName} (${canonicalVal} ${canonicalUnit}) is critically elevated above safety limits.`);

    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, 'CRITICAL', String(canonicalVal));
    return {
      severity: 'CRITICAL',
      title: `CRITICAL ALERT: Severe ${displayName} Finding`,
      message: `${displayName} measured at ${rawVal} ${unit || canonicalUnit} (Reference: ${rule.formatRange}). Urgent clinical action required.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation,
      recommendedAction: rule.criticalAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }

  // 5. High Priority Severity Check
  const isHighPriority = 
    (rule.highPriorityMin !== undefined && canonicalVal >= rule.highPriorityMin) ||
    (rule.highPriorityMax !== undefined && canonicalVal <= rule.highPriorityMax);

  if (isHighPriority) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, 'HIGH_PRIORITY', String(canonicalVal));
    return {
      severity: 'HIGH_PRIORITY',
      title: `High Priority: ${displayName} Elevated`,
      message: `${displayName} measured at ${rawVal} ${unit || canonicalUnit} (Standard: ${rule.formatRange}). Prompt follow-up advised.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation: rule.highPriorityExplanation || `The observed value is significantly out of optimal range.`,
      recommendedAction: rule.highPriorityAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }

  // 6. Warning Severity Check
  const isOutOfRange =
    (rule.normalMin !== undefined && canonicalVal < rule.normalMin) ||
    (rule.normalMax !== undefined && canonicalVal > rule.normalMax);

  if (isOutOfRange) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, 'WARNING', String(canonicalVal));
    return {
      severity: 'WARNING',
      title: `Abnormal Result: ${displayName}`,
      message: `${displayName} is outside the standard reference range at ${rawVal} ${unit || canonicalUnit} (Reference: ${rule.formatRange}).`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation: rule.warningExplanation || `Measurement differs from normal physiological reference intervals.`,
      recommendedAction: rule.warningAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }

  // In normal range - no alert created
  return null;
}

/**
 * Creates an informational alert for report completion or milestone.
 */
export function createInformationalAlert(
  userId: number,
  title: string,
  message: string,
  reportId?: number
): ClassifiedAlert {
  const idempotencyKey = generateIdempotencyKey(userId, reportId || 0, 'REPORT_PROCESSED', 'INFORMATIONAL', title);
  return {
    severity: 'INFORMATIONAL',
    title,
    message,
    parameter: 'system',
    displayName: 'Report Processing',
    measuredValue: '',
    unit: '',
    canonicalValue: null,
    canonicalUnit: '',
    referenceRange: 'N/A',
    explanation: 'Automated extraction and validation of your medical report has completed successfully.',
    recommendedAction: 'Review your extracted biomarker records and trend graphs in the Dashboard.',
    sourceReportId: reportId,
    idempotencyKey
  };
}

/**
 * Creates an explicit Test Alert for verifying emergency channels.
 */
export function createEmergencyTestAlert(userId: number, recipientName?: string): ClassifiedAlert {
  const timestamp = Date.now();
  const idempotencyKey = crypto.createHash('sha256').update(`test:${userId}:${timestamp}`).digest('hex');
  return {
    severity: 'CRITICAL',
    title: '[TEST] Emergency Health Alert Verification',
    message: `[TEST ALERT - NO EMERGENCY] This is a verification test of the MediTrack emergency alert system for trusted contact ${recipientName || 'Member'}. No action is required.`,
    parameter: 'emergency_test',
    displayName: 'Emergency Notification Test',
    measuredValue: 'Simulated 185/115 mmHg (TEST)',
    unit: 'mmHg',
    canonicalValue: 185,
    canonicalUnit: 'mmHg',
    referenceRange: '90 - 120 mmHg',
    explanation: 'This test confirms that your emergency contact email and SMS channels are functioning correctly and that delivery policies operate as expected.',
    recommendedAction: 'No medical action required. This test verifies that alert notifications reach your trusted contact in the event of an urgent clinical finding.',
    idempotencyKey
  };
}

/**
 * Deterministic idempotency key generator.
 */
function generateIdempotencyKey(
  userId: number,
  reportId: number,
  param: string,
  severity: string,
  val: string
): string {
  const payload = `${userId}:${reportId}:${param}:${severity}:${val}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}
