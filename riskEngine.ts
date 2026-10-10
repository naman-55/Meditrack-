export interface MeasurementRecord {
  parameter: string;
  normalized_value: string;
  validation_status: string;
  report_date: string;
  report: string;
  page: string;
}

export interface RiskResult {
  domain: string;
  level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY';
  label: string;
  evidence: string;
  data_quality: string;
  rule_version: string;
}

export const RISK_RULE_VERSION = '1.0.0';

function extractNumeric(val: string): number | null {
  const match = val.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function buildEvidenceJson(explanation: string, action: string, details: any[]): string {
  return JSON.stringify({ explanation, action, details });
}

export function evaluateCardiovascularRisk(measurements: MeasurementRecord[]): RiskResult {
  const bpMeasurement = measurements.find(m => m.parameter.toLowerCase() === 'blood pressure');
  const ldlMeasurement = measurements.find(m => m.parameter.toLowerCase() === 'ldl' || m.parameter.toLowerCase() === 'cholesterol ldl');
  
  if (!bpMeasurement && !ldlMeasurement) {
    return {
      domain: 'cardiovascular',
      level: 'GREY',
      label: 'Insufficient information',
      evidence: buildEvidenceJson('Missing both Blood Pressure and LDL measurements to evaluate cardiovascular risk.', 'Please upload recent blood pressure and lipid panel reports.', []),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0; // 0=GREEN, 1=YELLOW, 2=ORANGE, 3=RED
  let evidenceList: any[] = [];
  let isUnreliable = false;

  if (bpMeasurement) {
    if (bpMeasurement.validation_status !== 'VALIDATED') {
      isUnreliable = true;
    }
    const parts = bpMeasurement.normalized_value.split('/');
    if (parts.length === 2) {
      const systolic = parseInt(parts[0], 10);
      const diastolic = parseInt(parts[1], 10);
      
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        let reason = 'Normal';
        if (systolic >= 140 || diastolic >= 90) {
          maxRisk = Math.max(maxRisk, 3);
          reason = 'Stage 2 Hypertension';
        } else if (systolic >= 130 || diastolic >= 80) {
          maxRisk = Math.max(maxRisk, 2);
          reason = 'Stage 1 Hypertension';
        } else if (systolic >= 120 && diastolic < 80) {
          maxRisk = Math.max(maxRisk, 1);
          reason = 'Elevated';
        }
        evidenceList.push({
          parameter: 'Blood Pressure',
          value: `${systolic}/${diastolic}`,
          date: bpMeasurement.report_date,
          report: bpMeasurement.report,
          page: bpMeasurement.page,
          reason
        });
      }
    }
  }

  if (ldlMeasurement) {
    if (ldlMeasurement.validation_status !== 'VALIDATED') {
      isUnreliable = true;
    }
    const ldl = extractNumeric(ldlMeasurement.normalized_value);
    if (ldl !== null) {
      let reason = 'Optimal';
      if (ldl >= 160) {
        maxRisk = Math.max(maxRisk, 3);
        reason = 'High';
      } else if (ldl >= 130) {
        maxRisk = Math.max(maxRisk, 2);
        reason = 'Borderline High';
      } else if (ldl >= 100) {
        maxRisk = Math.max(maxRisk, 1);
        reason = 'Near optimal/Above optimal';
      }
      evidenceList.push({
        parameter: 'LDL',
        value: `${ldl}`,
        date: ldlMeasurement.report_date,
        report: ldlMeasurement.report,
        page: ldlMeasurement.page,
        reason
      });
    }
  }

  if (isUnreliable) {
    return {
      domain: 'cardiovascular',
      level: 'GREY',
      label: 'Insufficient information',
      evidence: buildEvidenceJson('Data quality is unreliable for accurate cardiovascular risk assessment (pending OCR verification).', 'Review and manually validate pending measurements.', evidenceList),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'No significant indicators detected';
  let explanation = 'Your cardiovascular metrics are within normal bounds.';
  let action = 'Continue maintaining a healthy lifestyle with regular cardiovascular exercise.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant indicators';
    explanation = 'Major cardiovascular indicators significantly exceed healthy thresholds.';
    action = 'Please consult a cardiologist or primary care physician promptly for a formal evaluation.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated indicators';
    explanation = 'Certain cardiovascular metrics are moderately elevated above normal levels.';
    action = 'Consider lifestyle modifications such as diet and exercise, and schedule a routine checkup.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Some indicators detected';
    explanation = 'Minor elevations in cardiovascular markers were detected.';
    action = 'Monitor your blood pressure and diet to ensure markers do not increase further.';
  }

  return {
    domain: 'cardiovascular',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList),
    data_quality: 'RELIABLE',
    rule_version: RISK_RULE_VERSION
  };
}

export function evaluateMetabolicRisk(measurements: MeasurementRecord[]): RiskResult {
  const glucoseMeasurement = measurements.find(m => m.parameter.toLowerCase() === 'glucose' || m.parameter.toLowerCase() === 'fasting glucose');
  const hba1cMeasurement = measurements.find(m => m.parameter.toLowerCase() === 'hba1c');
  const bmiMeasurement = measurements.find(m => m.parameter.toLowerCase() === 'bmi');

  if (!glucoseMeasurement && !hba1cMeasurement && !bmiMeasurement) {
    return {
      domain: 'metabolic',
      level: 'GREY',
      label: 'Insufficient information',
      evidence: buildEvidenceJson('Missing Glucose, HbA1c, and BMI measurements to evaluate metabolic risk.', 'Please upload recent blood test reports containing glucose or HbA1c metrics.', []),
      data_quality: 'INSUFFICIENT',
      rule_version: RISK_RULE_VERSION
    };
  }

  let maxRisk = 0; 
  let evidenceList: any[] = [];
  let isUnreliable = false;

  if (hba1cMeasurement) {
    if (hba1cMeasurement.validation_status !== 'VALIDATED') isUnreliable = true;
    const hba1c = extractNumeric(hba1cMeasurement.normalized_value);
    if (hba1c !== null) {
      let reason = 'Normal';
      if (hba1c >= 6.5) {
        maxRisk = Math.max(maxRisk, 3);
        reason = 'Diabetes range';
      } else if (hba1c >= 5.7) {
        maxRisk = Math.max(maxRisk, 1);
        reason = 'Prediabetes range';
      }
      evidenceList.push({
        parameter: 'HbA1c',
        value: `${hba1c}%`,
        date: hba1cMeasurement.report_date,
        report: hba1cMeasurement.report,
        page: hba1cMeasurement.page,
        reason
      });
    }
  }

  if (glucoseMeasurement) {
    if (glucoseMeasurement.validation_status !== 'VALIDATED') isUnreliable = true;
    const glucose = extractNumeric(glucoseMeasurement.normalized_value);
    if (glucose !== null) {
      let reason = 'Normal';
      if (glucose >= 126) {
        maxRisk = Math.max(maxRisk, 3);
        reason = 'Diabetes range';
      } else if (glucose >= 100) {
        maxRisk = Math.max(maxRisk, 1);
        reason = 'Prediabetes range';
      }
      evidenceList.push({
        parameter: 'Fasting Glucose',
        value: `${glucose}`,
        date: glucoseMeasurement.report_date,
        report: glucoseMeasurement.report,
        page: glucoseMeasurement.page,
        reason
      });
    }
  }

  if (bmiMeasurement) {
    if (bmiMeasurement.validation_status !== 'VALIDATED') isUnreliable = true;
    const bmi = extractNumeric(bmiMeasurement.normalized_value);
    if (bmi !== null) {
      let reason = 'Normal';
      if (bmi >= 30) {
        maxRisk = Math.max(maxRisk, 2); // Treat as elevated
        reason = 'Obese';
      } else if (bmi >= 25) {
        maxRisk = Math.max(maxRisk, 1);
        reason = 'Overweight';
      }
      evidenceList.push({
        parameter: 'BMI',
        value: `${bmi}`,
        date: bmiMeasurement.report_date,
        report: bmiMeasurement.report,
        page: bmiMeasurement.page,
        reason
      });
    }
  }

  if (isUnreliable) {
    return {
      domain: 'metabolic',
      level: 'GREY',
      label: 'Insufficient information',
      evidence: buildEvidenceJson('Data quality is unreliable for accurate metabolic risk assessment.', 'Validate the pending OCR extractions for metabolic indicators.', evidenceList),
      data_quality: 'UNRELIABLE',
      rule_version: RISK_RULE_VERSION
    };
  }

  let finalLevel: RiskResult['level'] = 'GREEN';
  let finalLabel = 'No significant indicators detected';
  let explanation = 'Your metabolic indicators (blood sugar and BMI) are currently within optimal ranges.';
  let action = 'Maintain your current diet and lifestyle.';

  if (maxRisk === 3) {
    finalLevel = 'RED';
    finalLabel = 'Significant indicators';
    explanation = 'Metabolic markers indicate values consistent with diabetes or significant metabolic syndrome.';
    action = 'Consult an endocrinologist or primary care physician for a comprehensive treatment plan.';
  } else if (maxRisk === 2) {
    finalLevel = 'ORANGE';
    finalLabel = 'Elevated indicators';
    explanation = 'Metabolic markers, particularly BMI, are significantly elevated.';
    action = 'Discuss weight management and metabolic health strategies with your healthcare provider.';
  } else if (maxRisk === 1) {
    finalLevel = 'YELLOW';
    finalLabel = 'Some indicators detected';
    explanation = 'Mild elevations in metabolic markers (such as prediabetes range or overweight BMI).';
    action = 'Focus on dietary improvements, reducing sugar intake, and increasing physical activity.';
  }

  return {
    domain: 'metabolic',
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList),
    data_quality: 'RELIABLE',
    rule_version: RISK_RULE_VERSION
  };
}

export function evaluateRiskAllDomains(measurements: MeasurementRecord[]): RiskResult[] {
  return [
    evaluateCardiovascularRisk(measurements),
    evaluateMetabolicRisk(measurements)
  ];
}
