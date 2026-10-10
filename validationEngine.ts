export function validateMeasurement(parameter: string, normalized_value: string, unit: string) {
  let validationStatus = 'EXTRACTED';
  const p = (parameter || '').toLowerCase();
  const nv = (normalized_value || '').trim();
  const u = (unit || '').toLowerCase();
  
  if (!nv || nv === '' || nv === 'undefined' || nv === 'null') {
     return 'REJECTED';
  }

  // BP Validation
  if (p.includes('blood pressure')) {
     if (/^\d{2,3}\/\d{2,3}$/.test(nv)) {
        validationStatus = 'VALIDATED';
     } else {
        validationStatus = 'NEEDS_REVIEW';
     }
  } 
  // Age validation
  else if (p === 'age') {
     const ageNum = parseInt(nv, 10);
     if (!isNaN(ageNum) && ageNum > 0 && ageNum < 130) {
        validationStatus = 'VALIDATED';
     } else {
        validationStatus = 'NEEDS_REVIEW';
     }
  }
  // Generic numeric validation
  else {
     const num = parseFloat(nv);
     if (!isNaN(num)) {
        validationStatus = 'VALIDATED';
     } else {
        validationStatus = 'NEEDS_REVIEW';
     }
  }
  
  // Unit mismatch checking (basic example)
  if (p === 'glucose' && validationStatus === 'VALIDATED') {
     if (!u.includes('mg') && !u.includes('mmol')) {
        validationStatus = 'NEEDS_REVIEW';
     }
  }

  return validationStatus;
}
