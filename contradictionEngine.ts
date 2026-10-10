export interface ContradictionRecord {
  parameter: string;
  report_date: string;
  normalized_value: string;
  raw_value: string;
  source_page?: string | number | null;
  r_id: number;
  [key: string]: any;
}

export interface DetectedContradiction {
  parameter: string;
  report_a: number;
  report_b: number;
  value_a: string;
  value_b: string;
  date_a: string;
  date_b: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  source_page_a: string | number | null;
  source_page_b: string | number | null;
  status: string;
}

function normalizeDate(d: string | null | undefined): string {
  if (!d) return '';
  const s = String(d).trim();
  if (s.includes('T')) return s.split('T')[0].trim();
  if (s.includes(' ')) return s.split(' ')[0].trim();
  return s;
}

function normalizeParam(p: string | null | undefined): string {
  if (!p) return '';
  return String(p).toLowerCase().replace(/[\s_-]+/g, ' ').trim();
}

export function areValuesContradictory(valA: string, valB: string, _param?: string): boolean {
  if (valA === undefined || valA === null || valB === undefined || valB === null) return false;
  const cleanA = String(valA).trim();
  const cleanB = String(valB).trim();
  if (!cleanA || !cleanB) return false;
  if (cleanA.toLowerCase() === cleanB.toLowerCase()) return false;

  // Numeric comparison: handle "120" vs "120.0"
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA !== numB;
  }

  // Blood pressure comparison (e.g. 130/80 vs 130/180)
  const bpA = cleanA.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
  const bpB = cleanB.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
  if (bpA && bpB) {
    return bpA[1] !== bpB[1] || bpA[2] !== bpB[2];
  }

  return cleanA !== cleanB;
}

export function evaluateContradictionSeverity(
  parameter: string,
  valA: string,
  valB: string
): { severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string } {
  const p = normalizeParam(parameter);
  const cleanA = String(valA || '').trim();
  const cleanB = String(valB || '').trim();

  // Permanent biological markers that cannot change
  if (
    p.includes('blood type') ||
    p.includes('blood group') ||
    p.includes('rh factor') ||
    p.includes('genotype') ||
    p.includes('sex') ||
    p.includes('gender')
  ) {
    return {
      severity: 'CRITICAL',
      reason: `Permanent physiological marker conflict for ${parameter}: "${cleanA}" vs "${cleanB}"`
    };
  }

  // Blood pressure contradiction
  if (p.includes('blood pressure') || p.includes('bp')) {
    const bpA = cleanA.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
    const bpB = cleanB.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
    if (bpA && bpB) {
      const sysDiff = Math.abs(parseInt(bpA[1], 10) - parseInt(bpB[1], 10));
      const diaDiff = Math.abs(parseInt(bpA[2], 10) - parseInt(bpB[2], 10));
      if (sysDiff >= 40 || diaDiff >= 30) {
        return {
          severity: 'HIGH',
          reason: `Extreme physiological blood pressure delta on same date (${cleanA} vs ${cleanB})`
        };
      }
    }
    return {
      severity: 'HIGH',
      reason: 'Conflicting measurements for same parameter on the same date'
    };
  }

  // Numeric variance
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB)) {
    const max = Math.max(Math.abs(numA), Math.abs(numB));
    const delta = Math.abs(numA - numB);
    const pct = max > 0 ? (delta / max) * 100 : 0;

    if (pct >= 50) {
      return {
        severity: 'HIGH',
        reason: `Substantial measurement discrepancy (>50%) for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    } else if (pct >= 20) {
      return {
        severity: 'MEDIUM',
        reason: `Measurement discrepancy for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    } else {
      return {
        severity: 'LOW',
        reason: `Minor measurement variance for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    }
  }

  return {
    severity: 'HIGH',
    reason: 'Conflicting measurements for same parameter on the same date'
  };
}

export function detectContradictions(
  currentReportId: number,
  currentReportDate: string,
  allMeasurements: ContradictionRecord[],
  newMeasurements?: ContradictionRecord[]
): DetectedContradiction[] {
  if (!Array.isArray(allMeasurements)) {
    return [];
  }

  const currentMeasurements = newMeasurements && newMeasurements.length > 0
    ? newMeasurements
    : allMeasurements.filter(m => m && m.r_id === currentReportId);

  const otherMeasurements = allMeasurements.filter(m => m && m.r_id !== currentReportId);

  const contradictions: DetectedContradiction[] = [];
  const seenKeys = new Set<string>();

  const targetDate = normalizeDate(currentReportDate);

  for (const curr of currentMeasurements) {
    if (!curr || !curr.parameter) continue;

    const normCurrParam = normalizeParam(curr.parameter);
    const currVal = curr.normalized_value ?? curr.raw_value ?? '';

    const conflicts = otherMeasurements.filter(other => {
      if (!other || !other.parameter) return false;
      const normOtherParam = normalizeParam(other.parameter);
      if (normOtherParam !== normCurrParam) return false;

      const otherDate = normalizeDate(other.report_date);
      if (!otherDate || !targetDate || otherDate !== targetDate) return false;

      const otherVal = other.normalized_value ?? other.raw_value ?? '';
      return areValuesContradictory(otherVal, currVal, normCurrParam);
    });

    for (const conflict of conflicts) {
      const pairKey = `${Math.min(conflict.r_id, curr.r_id)}_${Math.max(conflict.r_id, curr.r_id)}_${normCurrParam}`;
      if (seenKeys.has(pairKey)) continue;
      seenKeys.add(pairKey);

      const valA = conflict.raw_value ?? conflict.normalized_value ?? '';
      const valB = curr.raw_value ?? curr.normalized_value ?? '';
      const { severity, reason } = evaluateContradictionSeverity(curr.parameter, valA, valB);

      contradictions.push({
        parameter: curr.parameter,
        report_a: conflict.r_id,
        report_b: curr.r_id,
        value_a: valA,
        value_b: valB,
        date_a: conflict.report_date,
        date_b: curr.report_date || currentReportDate,
        severity,
        reason,
        source_page_a: conflict.source_page ?? null,
        source_page_b: curr.source_page ?? null,
        status: 'PENDING_REVIEW'
      });
    }
  }

  return contradictions;
}
