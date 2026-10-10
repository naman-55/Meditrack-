/**
 * Centralized, clinically grounded Unit Conversion and Harmonization Registry
 * Supports safe conversion between compatible clinical units for each canonical parameter.
 */

export interface CanonicalParamMeta {
  canonicalName: string;
  displayName: string;
  canonicalUnit: string;
  supportedUnits: string[];
}

export const CANONICAL_PARAMETERS: Record<string, CanonicalParamMeta> = {
  hemoglobin: {
    canonicalName: 'hemoglobin',
    displayName: 'Hemoglobin',
    canonicalUnit: 'g/dL',
    supportedUnits: ['g/dL', 'g/L', 'gm/dL', 'g%']
  },
  fasting_glucose: {
    canonicalName: 'fasting_glucose',
    displayName: 'Fasting Glucose',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L', 'mg%']
  },
  serum_glucose: {
    canonicalName: 'serum_glucose',
    displayName: 'Random / Serum Glucose',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L', 'mg%']
  },
  total_cholesterol: {
    canonicalName: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L']
  },
  ldl: {
    canonicalName: 'ldl',
    displayName: 'LDL Cholesterol',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L']
  },
  hdl: {
    canonicalName: 'hdl',
    displayName: 'HDL Cholesterol',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L']
  },
  triglycerides: {
    canonicalName: 'triglycerides',
    displayName: 'Triglycerides',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'mmol/L']
  },
  creatinine: {
    canonicalName: 'creatinine',
    displayName: 'Creatinine',
    canonicalUnit: 'mg/dL',
    supportedUnits: ['mg/dL', 'µmol/L', 'umol/L', 'micromol/L']
  },
  alt: {
    canonicalName: 'alt',
    displayName: 'ALT (SGPT)',
    canonicalUnit: 'U/L',
    supportedUnits: ['U/L', 'IU/L', 'u/l', 'iu/l']
  },
  ast: {
    canonicalName: 'ast',
    displayName: 'AST (SGOT)',
    canonicalUnit: 'U/L',
    supportedUnits: ['U/L', 'IU/L', 'u/l', 'iu/l']
  },
  hematocrit: {
    canonicalName: 'hematocrit',
    displayName: 'Hematocrit (PCV)',
    canonicalUnit: '%',
    supportedUnits: ['%', 'vol%', 'L/L', 'l/l']
  },
  platelets: {
    canonicalName: 'platelets',
    displayName: 'Platelet Count',
    canonicalUnit: 'x10^3/µL',
    supportedUnits: ['lakh/µL', 'lakh/uL', 'x10^3/µL', 'x10^3/uL', '10^3/uL', 'thousand/µL', '/µL', '/uL', 'cells/µL']
  },
  wbc: {
    canonicalName: 'wbc',
    displayName: 'Total WBC Count',
    canonicalUnit: '/µL',
    supportedUnits: ['/µL', '/uL', 'cells/µL', 'cells/uL', 'x10^3/µL', 'thousand/µL']
  },
  rbc: {
    canonicalName: 'rbc',
    displayName: 'RBC Count',
    canonicalUnit: 'million/µL',
    supportedUnits: ['million/µL', 'million/uL', 'x10^6/µL', 'x10^6/uL', 'x10^12/L']
  },
  blood_pressure_systolic: {
    canonicalName: 'blood_pressure_systolic',
    displayName: 'Systolic Blood Pressure',
    canonicalUnit: 'mmHg',
    supportedUnits: ['mmHg', 'mm Hg']
  },
  blood_pressure_diastolic: {
    canonicalName: 'blood_pressure_diastolic',
    displayName: 'Diastolic Blood Pressure',
    canonicalUnit: 'mmHg',
    supportedUnits: ['mmHg', 'mm Hg']
  },
  weight: {
    canonicalName: 'weight',
    displayName: 'Weight',
    canonicalUnit: 'kg',
    supportedUnits: ['kg', 'lbs', 'lb']
  },
  height: {
    canonicalName: 'height',
    displayName: 'Height',
    canonicalUnit: 'cm',
    supportedUnits: ['cm', 'm', 'meter', 'inches', 'in']
  },
  heart_rate: {
    canonicalName: 'heart_rate',
    displayName: 'Heart Rate',
    canonicalUnit: 'bpm',
    supportedUnits: ['bpm', 'beats/min', '/min']
  },
  spo2: {
    canonicalName: 'spo2',
    displayName: 'Oxygen Saturation (SpO2)',
    canonicalUnit: '%',
    supportedUnits: ['%']
  },
  bmi: {
    canonicalName: 'bmi',
    displayName: 'Body Mass Index',
    canonicalUnit: 'kg/m²',
    supportedUnits: ['kg/m²', 'kg/m2']
  }
};

export interface ConversionResult {
  success: boolean;
  convertedValue: number | null;
  canonicalUnit: string;
  originalUnit: string;
  conversionApplied: string;
  error?: string;
}

/**
 * Clean and standardize unit strings, mapping Greek mu (μ: 956) and micro (µ: 181) to standard 'u'
 */
export function sanitizeUnit(unit: string | null | undefined): string {
  if (!unit) return '';
  return unit
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[μµ]/g, 'u');
}

/**
 * Convert a value from its reported unit to the canonical unit of the parameter.
 * Returns failure if the unit is unsupported or incompatible.
 */
export function convertToCanonicalUnit(
  canonicalParam: string,
  value: number,
  reportedUnit: string | null | undefined
): ConversionResult {
  const meta = CANONICAL_PARAMETERS[canonicalParam];
  const unit = (reportedUnit || '').trim();
  const sUnit = sanitizeUnit(unit);

  if (!meta) {
    // If not in standard registry, preserve as-is with raw unit
    return {
      success: true,
      convertedValue: value,
      canonicalUnit: unit || 'units',
      originalUnit: unit,
      conversionApplied: 'none'
    };
  }

  const canonicalUnit = meta.canonicalUnit;

  // If no unit provided, we cannot guess safely
  if (!unit) {
    return {
      success: false,
      convertedValue: null,
      canonicalUnit,
      originalUnit: '',
      conversionApplied: 'missing_unit',
      error: `Missing unit for parameter ${canonicalParam}`
    };
  }

  // Parameter-specific conversion rules
  switch (canonicalParam) {
    case 'fasting_glucose':
    case 'serum_glucose':
      if (sUnit === 'mg/dl' || sUnit === 'mg%' || sUnit === 'mg/100ml') {
        return { success: true, convertedValue: value, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'mmol/l') {
        // 1 mmol/L glucose = 18.0182 mg/dL
        const converted = Math.round(value * 18.0182 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'value * 18.0182' };
      }
      break;

    case 'creatinine':
      if (sUnit === 'mg/dl' || sUnit === 'mg%') {
        return { success: true, convertedValue: value, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'µmol/l' || sUnit === 'umol/l' || sUnit === 'micromol/l') {
        // 1 mg/dL creatinine = 88.4 µmol/L => µmol/L / 88.4 = mg/dL
        const converted = Math.round((value / 88.4) * 100) / 100;
        return { success: true, convertedValue: converted, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'value / 88.4' };
      }
      break;

    case 'hemoglobin':
      if (sUnit === 'g/dl' || sUnit === 'gm/dl' || sUnit === 'g%' || sUnit === 'gm%') {
        return { success: true, convertedValue: value, canonicalUnit: 'g/dL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'g/l' || sUnit === 'gm/l') {
        // 1 g/dL = 10 g/L => g/L / 10 = g/dL
        const converted = Math.round((value / 10) * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'g/dL', originalUnit: unit, conversionApplied: 'value / 10' };
      }
      break;

    case 'total_cholesterol':
    case 'ldl':
    case 'hdl':
      if (sUnit === 'mg/dl' || sUnit === 'mg%') {
        return { success: true, convertedValue: value, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'mmol/l') {
        // 1 mmol/L cholesterol = 38.67 mg/dL
        const converted = Math.round(value * 38.67 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'value * 38.67' };
      }
      break;

    case 'triglycerides':
      if (sUnit === 'mg/dl' || sUnit === 'mg%') {
        return { success: true, convertedValue: value, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'mmol/l') {
        // 1 mmol/L triglycerides = 88.57 mg/dL
        const converted = Math.round(value * 88.57 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'mg/dL', originalUnit: unit, conversionApplied: 'value * 88.57' };
      }
      break;

    case 'platelets':
      // Canonical is x10^3/µL (thousands per microliter, e.g. 150-450)
      if (sUnit === 'lakh/µl' || sUnit === 'lakh/ul' || sUnit === 'lac/ul' || sUnit === 'lakhs/ul') {
        // 1 lakh = 100,000 cells/µL = 100 x10^3/µL (e.g. 2.75 lakh = 275 thousand)
        const converted = Math.round(value * 100);
        return { success: true, convertedValue: converted, canonicalUnit: 'x10^3/µL', originalUnit: unit, conversionApplied: 'value * 100 (lakh to x10^3/µL)' };
      }
      if (sUnit === 'x10^3/µl' || sUnit === 'x10^3/ul' || sUnit === '10^3/ul' || sUnit === 'thousand/µl' || sUnit === 'k/ul') {
        return { success: true, convertedValue: value, canonicalUnit: 'x10^3/µL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === '/µl' || sUnit === '/ul' || sUnit === 'cells/µl' || sUnit === 'cells/ul') {
        // Raw count e.g. 275000 -> 275
        const converted = Math.round(value / 1000);
        return { success: true, convertedValue: converted, canonicalUnit: 'x10^3/µL', originalUnit: unit, conversionApplied: 'value / 1000' };
      }
      break;

    case 'wbc':
      // Canonical is /µL (e.g. 7100)
      if (sUnit === '/µl' || sUnit === '/ul' || sUnit === 'cells/µl' || sUnit === 'cells/ul') {
        return { success: true, convertedValue: value, canonicalUnit: '/µL', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'x10^3/µl' || sUnit === 'x10^3/ul' || sUnit === 'thousand/µl' || sUnit === 'k/ul') {
        const converted = Math.round(value * 1000);
        return { success: true, convertedValue: converted, canonicalUnit: '/µL', originalUnit: unit, conversionApplied: 'value * 1000' };
      }
      break;

    case 'rbc':
      // Canonical is million/µL
      if (sUnit === 'million/µl' || sUnit === 'million/ul' || sUnit === 'x10^6/µl' || sUnit === 'x10^6/ul' || sUnit === 'x10^12/l') {
        return { success: true, convertedValue: value, canonicalUnit: 'million/µL', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;

    case 'hematocrit':
      if (sUnit === '%' || sUnit === 'vol%') {
        return { success: true, convertedValue: value, canonicalUnit: '%', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'l/l') {
        // 0.42 L/L = 42%
        const converted = Math.round(value * 100 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: '%', originalUnit: unit, conversionApplied: 'value * 100' };
      }
      break;

    case 'alt':
    case 'ast':
      if (sUnit === 'u/l' || sUnit === 'iu/l') {
        return { success: true, convertedValue: value, canonicalUnit: 'U/L', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;

    case 'blood_pressure_systolic':
    case 'blood_pressure_diastolic':
      if (sUnit === 'mmhg' || sUnit === 'mm hg') {
        return { success: true, convertedValue: value, canonicalUnit: 'mmHg', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;

    case 'weight':
      if (sUnit === 'kg' || sUnit === 'kgs') {
        return { success: true, convertedValue: value, canonicalUnit: 'kg', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'lb' || sUnit === 'lbs') {
        const converted = Math.round((value / 2.20462) * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'kg', originalUnit: unit, conversionApplied: 'value / 2.20462' };
      }
      break;

    case 'height':
      if (sUnit === 'cm') {
        return { success: true, convertedValue: value, canonicalUnit: 'cm', originalUnit: unit, conversionApplied: 'identity' };
      }
      if (sUnit === 'm' || sUnit === 'meter') {
        const converted = Math.round(value * 100 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'cm', originalUnit: unit, conversionApplied: 'value * 100' };
      }
      if (sUnit === 'in' || sUnit === 'inches') {
        const converted = Math.round(value * 2.54 * 10) / 10;
        return { success: true, convertedValue: converted, canonicalUnit: 'cm', originalUnit: unit, conversionApplied: 'value * 2.54' };
      }
      break;

    case 'heart_rate':
      if (sUnit === 'bpm' || sUnit === 'beats/min' || sUnit === '/min') {
        return { success: true, convertedValue: value, canonicalUnit: 'bpm', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;

    case 'spo2':
      if (sUnit === '%') {
        return { success: true, convertedValue: value, canonicalUnit: '%', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;

    case 'bmi':
      if (sUnit === 'kg/m²' || sUnit === 'kg/m2') {
        return { success: true, convertedValue: value, canonicalUnit: 'kg/m²', originalUnit: unit, conversionApplied: 'identity' };
      }
      break;
  }

  // If unit matches canonical ignoring casing/symbols, accept identity
  if (sUnit === sanitizeUnit(canonicalUnit)) {
    return { success: true, convertedValue: value, canonicalUnit, originalUnit: unit, conversionApplied: 'identity' };
  }

  return {
    success: false,
    convertedValue: null,
    canonicalUnit,
    originalUnit: unit,
    conversionApplied: 'unsupported_unit',
    error: `Incompatible or unsupported unit '${unit}' for parameter ${canonicalParam} (expected ${canonicalUnit} or convertible equivalent)`
  };
}
