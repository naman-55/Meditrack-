import { Measurement, MedicalReport } from '../api/reports';
import { NormalizedParameter, NormalizedReport } from './types';
import { normalizeParameterName } from './parameters';

export function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  
  let str = value.toString().trim();
  // Remove commas
  str = str.replace(/,/g, '');
  // Extract first number found
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
            status: 'unknown'
          });
          result.push({
            id: m.id + 1000000,
            testedAt: date,
            name: m.parameter + ' (Diastolic)',
            normalizedName: 'blood_pressure_diastolic',
            value: dia,
            unit: m.unit || 'mmHg',
            status: 'unknown'
          });
        }
      }
      continue;
    }
    
    const val = parseNumericValue(strVal);
    if (val !== null) {
      result.push({
        id: m.id,
        testedAt: date,
        name: m.parameter,
        normalizedName: normName,
        value: val,
        unit: m.unit,
        status: "unknown"
      });
    }
  }
  
  return result.sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime());
}
