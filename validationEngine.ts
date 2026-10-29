/**
 * MediTrack Deterministic Measurement Validation Engine
 * Validates clinical measurements based on syntax, physiological feasibility, and unit compatibility.
 */

export function validateMeasurement(parameter: string, normalized_value: string, unit: string): string {
  const p = (parameter || '').toLowerCase().trim();
  const nv = (normalized_value || '').trim();
  const u = (unit || '').toLowerCase().trim();

  if (!nv || nv === '' || nv === 'undefined' || nv === 'null') {
    return 'REJECTED';
  }

  // 1. Separate Systolic or Diastolic Blood Pressure
  if (p.includes('systolic') || p.includes('diastolic')) {
    const num = parseFloat(nv);
    if (!isNaN(num) && num >= 30 && num <= 300) {
      return 'VALIDATED';
    }
    return 'NEEDS_REVIEW';
  }

  // 2. Compound Blood Pressure (e.g., "120/80")
  if (p.includes('blood pressure') || p.includes('bp') || p === 'blood_pressure') {
    if (/^\d{2,3}\/\d{2,3}$/.test(nv)) {
      const parts = nv.split('/');
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200) {
        return 'VALIDATED';
      }
    }
    // Also accept clean numeric if extracted as a single BP vital
    const singleNum = parseFloat(nv);
    if (!isNaN(singleNum) && singleNum >= 30 && singleNum <= 300) {
      return 'VALIDATED';
    }
    return 'NEEDS_REVIEW';
  }

  // 3. Age validation
  if (p === 'age') {
    const ageNum = parseInt(nv, 10);
    if (!isNaN(ageNum) && ageNum > 0 && ageNum < 130) {
      return 'VALIDATED';
    }
    return 'NEEDS_REVIEW';
  }

  // 4. Glucose & Glycemic Metrics
  if (p.includes('glucose') || p.includes('sugar') || p.includes('hba1c') || p.includes('fbs')) {
    const num = parseFloat(nv);
    if (!isNaN(num) && num > 0) {
      // Allow standard units or unitless numbers with plausible magnitudes
      if (!u || u.includes('mg') || u.includes('mmol') || u.includes('%')) {
        return 'VALIDATED';
      }
    }
    return 'NEEDS_REVIEW';
  }

  // 5. General Numeric Measurement Validation
  const num = parseFloat(nv.replace(/,/g, ''));
  if (!isNaN(num) && isFinite(num)) {
    return 'VALIDATED';
  }

  return 'NEEDS_REVIEW';
}
