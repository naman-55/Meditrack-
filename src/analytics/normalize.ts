import { Measurement, MedicalReport } from '../api/reports';
import { NormalizedParameter, NormalizedReport } from './types';
import { normalizeParameterName } from './parameters';
import { convertToCanonicalUnit } from '../lib/units';

export interface ClinicalRange {
  min?: number;
  max?: number;
  canonicalUnit: string;
}

export const CLINICAL_REFERENCE_RANGES: Record<string, ClinicalRange> = {
  fasting_glucose: { min: 70, max: 99, canonicalUnit: 'mg/dL' },
  serum_glucose: { min: 70, max: 140, canonicalUnit: 'mg/dL' },
  hba1c: { min: 4.0, max: 5.6, canonicalUnit: '%' },
  total_cholesterol: { max: 200, canonicalUnit: 'mg/dL' },
  ldl: { max: 100, canonicalUnit: 'mg/dL' },
  hdl: { min: 40, max: 60, canonicalUnit: 'mg/dL' },
  triglycerides: { max: 150, canonicalUnit: 'mg/dL' },
  blood_pressure_systolic: { min: 90, max: 120, canonicalUnit: 'mmHg' },
  blood_pressure_diastolic: { min: 60, max: 80, canonicalUnit: 'mmHg' },
  creatinine: { min: 0.6, max: 1.2, canonicalUnit: 'mg/dL' },
  bun: { min: 7, max: 20, canonicalUnit: 'mg/dL' },
  hemoglobin: { min: 12.0, max: 17.5, canonicalUnit: 'g/dL' },
  platelets: { min: 150, max: 450, canonicalUnit: 'x10^3/µL' },
  wbc: { min: 4.5, max: 11.0, canonicalUnit: 'x10^3/µL' },
  rbc: { min: 4.0, max: 5.9, canonicalUnit: 'x10^6/µL' },
  hematocrit: { min: 36, max: 50, canonicalUnit: '%' },
  alt: { min: 7, max: 45, canonicalUnit: 'U/L' },
  ast: { min: 8, max: 40, canonicalUnit: 'U/L' },
  heart_rate: { min: 60, max: 100, canonicalUnit: 'bpm' },
  spo2: { min: 95, max: 100, canonicalUnit: '%' },
  bmi: { min: 18.5, max: 24.9, canonicalUnit: 'kg/m²' }
};

export function classifyParameterStatus(
  paramCanonical: string, 
  value: number, 
  unit?: string
): 'high' | 'low' | 'normal' | 'unknown' {
  const range = CLINICAL_REFERENCE_RANGES[paramCanonical];
  if (!range || value === null || isNaN(value)) return 'unknown';

  let canonicalVal = value;
  const conv = convertToCanonicalUnit(paramCanonical, value, unit);
  if (conv.success && conv.convertedValue !== null) {
    canonicalVal = conv.convertedValue;
  }

  if (range.max !== undefined && canonicalVal > range.max) return 'high';
  if (range.min !== undefined && canonicalVal < range.min) return 'low';
  return 'normal';
}

export function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  
  let str = value.toString().trim();
  str = str.replace(/,/g, '');
  const match = str.match(/-?\d+(\.\d+)?/);
  if (match) {
    const num = parseFloat(match[0]);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }
  return null;
}

export function normalizeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().split('T')[0];
}

export function normalizeReports(reports: MedicalReport[]): NormalizedReport[] {
  return reports.map(r => ({
    id: r.id,
    reportName: r.filename,
    testedAt: normalizeDate(r.report_date),
    processingStatus: r.processing_status
  })).sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime());
}

export function normalizeMeasurements(measurements: Measurement[]): NormalizedParameter[] {
  const result: NormalizedParameter[] = [];
  
  for (const m of measurements) {
    const date = normalizeDate(m.report_date);
    const normName = normalizeParameterName(m.parameter);
    const strVal = m.normalized_value || m.raw_value;
    
    // Blood pressure compound format (e.g. 120/80)
    if (normName === 'blood_pressure' || strVal?.includes('/')) {
      const parts = strVal.split('/');
      if (parts.length >= 2) {
        const sys = parseNumericValue(parts[0]);
        const dia = parseNumericValue(parts[1]);
        if (sys !== null && dia !== null) {
          result.push({
            id: m.id,
            testedAt: date,
            name: m.parameter + ' (Systolic)',
            normalizedName: 'blood_pressure_systolic',
            value: sys,
            unit: m.unit || 'mmHg',
            status: classifyParameterStatus('blood_pressure_systolic', sys, 'mmHg')
          });
          result.push({
            id: m.id + 1000000,
            testedAt: date,
            name: m.parameter + ' (Diastolic)',
            normalizedName: 'blood_pressure_diastolic',
            value: dia,
            unit: m.unit || 'mmHg',
            status: classifyParameterStatus('blood_pressure_diastolic', dia, 'mmHg')
          });
        }
      }
      continue;
    }
    
    const val = parseNumericValue(strVal);
    if (val !== null) {
      let finalVal = val;
      let finalUnit = m.unit;

      const conv = convertToCanonicalUnit(normName, val, m.unit);
      if (conv.success && conv.convertedValue !== null) {
        finalVal = conv.convertedValue;
        finalUnit = conv.canonicalUnit;
      }

      const status = classifyParameterStatus(normName, finalVal, finalUnit);

      result.push({
        id: m.id,
        testedAt: date,
        name: m.parameter,
        normalizedName: normName,
        value: finalVal,
        unit: finalUnit,
        status
      });
    }
  }
  
  return result.sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime());
}
