export const PARAMETER_ALIASES: Record<string, string[]> = {
  hemoglobin: ["hemoglobin", "hb", "hgb", "haemoglobin"],
  fasting_glucose: ["fasting glucose", "fasting blood sugar", "fbs", "glucose fasting"],
  serum_glucose: ["glucose", "random glucose", "blood glucose", "rbs", "serum glucose"],
  total_cholesterol: ["total cholesterol", "cholesterol", "serum cholesterol"],
  ldl: ["ldl", "ldl cholesterol", "low density lipoprotein"],
  hdl: ["hdl", "hdl cholesterol", "high density lipoprotein"],
  triglycerides: ["triglycerides", "tg", "serum triglycerides"],
  creatinine: ["creatinine", "serum creatinine"],
  alt: ["alt", "sgpt", "alt (sgpt)", "alanine aminotransferase", "alanine transaminase"],
  ast: ["ast", "sgot", "ast (sgot)", "aspartate aminotransferase", "aspartate transaminase"],
  hematocrit: ["hematocrit", "pcv", "hematocrit (pcv)", "packed cell volume"],
  platelets: ["platelet count", "platelets", "plt"],
  wbc: ["wbc", "white blood cell count", "total wbc count", "total leukocyte count", "tlc"],
  rbc: ["rbc", "rbc count", "red blood cell count", "total rbc count"],
  blood_pressure: ["blood pressure", "bp", "blood_pressure"],
  blood_pressure_systolic: ["systolic", "sys", "systolic blood pressure", "sbp", "bp systolic"],
  blood_pressure_diastolic: ["diastolic", "dia", "diastolic blood pressure", "dbp", "bp diastolic"],
  weight: ["weight", "body weight", "wt"],
  height: ["height", "ht"],
  heart_rate: ["heart rate", "pulse", "pulse rate", "hr"],
  spo2: ["spo2", "oxygen saturation", "o2 sat"],
  bmi: ["bmi", "body mass index"]
};

export function normalizeParameterName(rawName: string): string {
  if (!rawName) return '';
  const cleaned = rawName.trim().toLowerCase();
  
  // Exact match search across alias lists
  for (const [standardName, aliases] of Object.entries(PARAMETER_ALIASES)) {
    if (aliases.includes(cleaned)) {
      return standardName;
    }
  }

  // Substring or pattern search if exact didn't match
  // E.g. "ALT (SGPT)" or "ALT/SGPT"
  if (cleaned.includes('sgpt') || cleaned.startsWith('alt ') || cleaned.includes('(sgpt)')) {
    return 'alt';
  }
  if (cleaned.includes('sgot') || cleaned.startsWith('ast ') || cleaned.includes('(sgot)')) {
    return 'ast';
  }
  if (cleaned.includes('hematocrit') || cleaned.includes('pcv')) {
    return 'hematocrit';
  }
  if (cleaned.includes('systolic')) {
    return 'blood_pressure_systolic';
  }
  if (cleaned.includes('diastolic')) {
    return 'blood_pressure_diastolic';
  }
  if (cleaned.includes('fasting') && cleaned.includes('glucose')) {
    return 'fasting_glucose';
  }
  if (cleaned.includes('cholesterol') && cleaned.includes('total')) {
    return 'total_cholesterol';
  }

  return cleaned.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function getParameterDisplayName(canonicalName: string): string {
  const displayNames: Record<string, string> = {
    hemoglobin: 'Hemoglobin',
    fasting_glucose: 'Fasting Glucose',
    serum_glucose: 'Random Blood Glucose',
    total_cholesterol: 'Total Cholesterol',
    ldl: 'LDL Cholesterol',
    hdl: 'HDL Cholesterol',
    triglycerides: 'Triglycerides',
    creatinine: 'Creatinine',
    alt: 'ALT (SGPT)',
    ast: 'AST (SGOT)',
    hematocrit: 'Hematocrit (PCV)',
    platelets: 'Platelet Count',
    wbc: 'Total WBC Count',
    rbc: 'RBC Count',
    blood_pressure_systolic: 'Systolic Blood Pressure',
    blood_pressure_diastolic: 'Diastolic Blood Pressure',
    weight: 'Weight',
    height: 'Height',
    heart_rate: 'Heart Rate',
    spo2: 'Oxygen Saturation (SpO2)',
    bmi: 'Body Mass Index'
  };
  return displayNames[canonicalName] || canonicalName.replace(/_/g, ' ').toUpperCase();
}
