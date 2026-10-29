/**
 * MediTrack Universal Unit Conversion System - Core Engine
 * Authoritative mathematical and clinical conversion engine.
 */

import { UNIT_REGISTRY, CLINICAL_PARAMETER_RULES } from './registry';
import { 
  ConversionOptions, 
  ConversionResult, 
  BloodPressureConversionResult, 
  ReferenceRangeConversionResult,
  UnitDefinition,
  ParameterUnitRule
} from './types';

/**
 * Standardizes raw unit string: trims whitespace, lowercases, standardizes Greek mu (µ/μ to u), handles degree symbols
 */
export function sanitizeUnit(unit: string | null | undefined): string {
  if (!unit) return '';
  return unit
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[μµ]/g, 'u')
    .replace(/x10\^?3/g, '10^3')
    .replace(/x10\^?6/g, '10^6')
    .replace(/x10\^?9/g, '10^9')
    .replace(/x10\^?12/g, '10^12')
    .replace(/x10³/g, '10^3')
    .replace(/x10⁶/g, '10^6')
    .replace(/x10⁹/g, '10^9')
    .replace(/x10¹²/g, '10^12');
}

/**
 * Finds UnitDefinition in registry by symbol or alias
 */
export function lookupUnit(rawUnit: string | null | undefined): UnitDefinition | null {
  if (!rawUnit) return null;
  const clean = sanitizeUnit(rawUnit);
  const cleanNoSpaces = clean.replace(/\s+/g, '');

  for (const def of Object.values(UNIT_REGISTRY)) {
    if (sanitizeUnit(def.symbol) === clean || def.symbol.toLowerCase() === clean) {
      return def;
    }
    for (const alias of def.aliases) {
      const cleanAlias = sanitizeUnit(alias);
      if (cleanAlias === clean || cleanAlias.replace(/\s+/g, '') === cleanNoSpaces) {
        return def;
      }
    }
  }

  return null;
}

/**
 * Finds canonical parameter rule in registry by key or alias
 */
export function lookupParameterRule(parameter: string | null | undefined): ParameterUnitRule | null {
  if (!parameter) return null;
  const clean = parameter.toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_');
  
  if (CLINICAL_PARAMETER_RULES[clean]) {
    return CLINICAL_PARAMETER_RULES[clean];
  }

  // Alias checks
  for (const [key, rule] of Object.entries(CLINICAL_PARAMETER_RULES)) {
    if (key === clean || rule.displayName.toLowerCase().includes(parameter.toLowerCase())) {
      return rule;
    }
  }

  // Common substring matches
  if (clean.includes('glucose') || clean.includes('sugar') || clean.includes('fbs') || clean.includes('rbs')) {
    return CLINICAL_PARAMETER_RULES['fasting_glucose'];
  }
  if (clean.includes('total_cholesterol') || (clean.includes('cholesterol') && !clean.includes('hdl') && !clean.includes('ldl'))) {
    return CLINICAL_PARAMETER_RULES['total_cholesterol'];
  }
  if (clean.includes('ldl')) return CLINICAL_PARAMETER_RULES['ldl'];
  if (clean.includes('hdl')) return CLINICAL_PARAMETER_RULES['hdl'];
  if (clean.includes('triglyceride')) return CLINICAL_PARAMETER_RULES['triglycerides'];
  if (clean.includes('creatinine')) return CLINICAL_PARAMETER_RULES['creatinine'];
  if (clean.includes('bun') || clean.includes('urea_nitrogen')) return CLINICAL_PARAMETER_RULES['bun'];
  if (clean.includes('urea')) return CLINICAL_PARAMETER_RULES['serum_urea'];
  if (clean.includes('hemoglobin') || clean.includes('hb') || clean.includes('hgb')) return CLINICAL_PARAMETER_RULES['hemoglobin'];
  if (clean.includes('hematocrit') || clean.includes('pcv')) return CLINICAL_PARAMETER_RULES['hematocrit'];
  if (clean.includes('platelet')) return CLINICAL_PARAMETER_RULES['platelets'];
  if (clean.includes('wbc') || clean.includes('leukocyte') || clean.includes('tlc')) return CLINICAL_PARAMETER_RULES['wbc'];
  if (clean.includes('rbc') || clean.includes('erythrocyte')) return CLINICAL_PARAMETER_RULES['rbc'];
  if (clean.includes('alt') || clean.includes('sgpt')) return CLINICAL_PARAMETER_RULES['alt'];
  if (clean.includes('ast') || clean.includes('sgot')) return CLINICAL_PARAMETER_RULES['ast'];
  if (clean.includes('bilirubin')) return CLINICAL_PARAMETER_RULES['total_bilirubin'];
  if (clean.includes('sodium')) return CLINICAL_PARAMETER_RULES['sodium'];
  if (clean.includes('potassium')) return CLINICAL_PARAMETER_RULES['potassium'];
  if (clean.includes('chloride')) return CLINICAL_PARAMETER_RULES['chloride'];
  if (clean.includes('calcium')) return CLINICAL_PARAMETER_RULES['calcium'];
  if (clean.includes('magnesium')) return CLINICAL_PARAMETER_RULES['magnesium'];
  if (clean.includes('phosphate') || clean.includes('phosphorus')) return CLINICAL_PARAMETER_RULES['phosphate'];
  if (clean.includes('uric')) return CLINICAL_PARAMETER_RULES['uric_acid'];
  if (clean.includes('tsh')) return CLINICAL_PARAMETER_RULES['tsh'];
  if (clean.includes('vitamin_d')) return CLINICAL_PARAMETER_RULES['vitamin_d'];
  if (clean.includes('vitamin_b12') || clean.includes('b12')) return CLINICAL_PARAMETER_RULES['vitamin_b12'];
  if (clean.includes('hba1c') || clean.includes('a1c')) return CLINICAL_PARAMETER_RULES['hba1c'];
  if (clean.includes('bp') || clean.includes('blood_pressure')) return CLINICAL_PARAMETER_RULES['blood_pressure'];
  if (clean.includes('pulse') || clean.includes('heart_rate')) return CLINICAL_PARAMETER_RULES['heart_rate'];
  if (clean.includes('respirat')) return CLINICAL_PARAMETER_RULES['respiratory_rate'];
  if (clean.includes('spo2') || clean.includes('oxygen')) return CLINICAL_PARAMETER_RULES['spo2'];
  if (clean.includes('height')) return CLINICAL_PARAMETER_RULES['height'];
  if (clean.includes('weight')) return CLINICAL_PARAMETER_RULES['weight'];
  if (clean.includes('bmi')) return CLINICAL_PARAMETER_RULES['bmi'];

  return null;
}

/**
 * Checks whether two units can be converted to one another, optionally within the scope of a parameter
 */
export function areUnitsCompatible(
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  parameter?: string
): boolean {
  if (!fromUnit || !toUnit) return false;
  
  const fromDef = lookupUnit(fromUnit);
  const toDef = lookupUnit(toUnit);

  // Exact same unit
  if (sanitizeUnit(fromUnit) === sanitizeUnit(toUnit)) return true;
  if (fromDef && toDef && fromDef.id === toDef.id) return true;

  // Strict clinical block: SpO2 (%) and PaO2 (mmHg) are completely incompatible
  const cleanFrom = sanitizeUnit(fromUnit);
  const cleanTo = sanitizeUnit(toUnit);
  if ((cleanFrom === '%' && cleanTo === 'mmhg') || (cleanFrom === 'mmhg' && cleanTo === '%')) {
    return false;
  }

  // Parameter-scoped compatibility check
  if (parameter) {
    const rule = lookupParameterRule(parameter);
    if (rule) {
      const compClean = rule.compatibleUnits.map(u => sanitizeUnit(u));
      const isFromCompat = compClean.includes(cleanFrom) || (fromDef && rule.compatibleUnits.some(u => lookupUnit(u)?.id === fromDef.id));
      const isToCompat = compClean.includes(cleanTo) || (toDef && rule.compatibleUnits.some(u => lookupUnit(u)?.id === toDef.id));
      return Boolean(isFromCompat && isToCompat);
    }
  }

  // Cross-dimension check
  if (fromDef && toDef) {
    if (fromDef.dimension !== toDef.dimension) {
      return false;
    }
    // Frequency semantic isolation: heart rate (bpm) cannot convert to respiratory rate (breaths/min)
    if (fromDef.dimension === 'frequency') {
      if ((fromDef.id === 'bpm' && toDef.id === 'breaths_per_min') || (fromDef.id === 'breaths_per_min' && toDef.id === 'bpm')) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Gets all compatible display units for a given parameter
 */
export function getCompatibleUnits(parameter: string): string[] {
  const rule = lookupParameterRule(parameter);
  if (rule) {
    return [...rule.compatibleUnits];
  }
  return [];
}

/**
 * Returns canonical unit symbol for a given parameter
 */
export function getCanonicalUnit(parameter: string): string {
  const rule = lookupParameterRule(parameter);
  return rule ? rule.canonicalUnit : '';
}

/**
 * Returns a list of all supported unit symbols in the registry
 */
export function getSupportedUnits(): string[] {
  return Object.values(UNIT_REGISTRY).map(u => u.symbol);
}

/**
 * Internal rounding utility avoiding floating point inaccuracies
 */
function roundToPrecision(val: number, decimals: number): number {
  if (isNaN(val) || !isFinite(val)) return val;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Universal Unit Conversion Engine
 * Converts a numerical value from fromUnit to toUnit with scientific accuracy and clinical safety.
 */
export function convertUnit(
  value: number | null | undefined,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  options: ConversionOptions = {}
): ConversionResult {
  const { parameter, precision, strict = true } = options;

  // Validate numeric input
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return {
      success: false,
      value: null,
      fromUnit: fromUnit || '',
      toUnit: toUnit || '',
      parameter,
      formula: 'N/A',
      error: `Invalid numerical input: ${value}`
    };
  }

  if (!fromUnit || !toUnit) {
    return {
      success: false,
      value: null,
      fromUnit: fromUnit || '',
      toUnit: toUnit || '',
      parameter,
      formula: 'N/A',
      error: 'Both fromUnit and toUnit must be provided.'
    };
  }

  const sFrom = sanitizeUnit(fromUnit);
  const sTo = sanitizeUnit(toUnit);
  const fromDef = lookupUnit(fromUnit);
  const toDef = lookupUnit(toUnit);

  // Identity conversion
  if (sFrom === sTo || (fromDef && toDef && fromDef.id === toDef.id)) {
    const finalVal = precision !== undefined ? roundToPrecision(value, precision) : value;
    return {
      success: true,
      value: finalVal,
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter,
      formula: 'value',
      factorOrOffset: 1
    };
  }

  // Physical minimum validation
  if (strict && fromDef?.physicalMinimum !== undefined && value < fromDef.physicalMinimum) {
    return {
      success: false,
      value: null,
      fromUnit,
      toUnit,
      parameter,
      formula: 'N/A',
      error: `Value ${value} ${fromUnit} violates physical minimum bound of ${fromDef.physicalMinimum} ${fromDef.symbol}.`
    };
  }

  // =========================================================================
  // 1. PARAMETER-SPECIFIC CLINICAL CONVERSIONS (Analyte Specific)
  // =========================================================================
  const rule = parameter ? lookupParameterRule(parameter) : null;
  const paramKey = rule?.parameter || '';

  // Blood Glucose (fasting or random): mg/dL <-> mmol/L
  // Molecular weight of D-glucose = 180.156 g/mol.
  // 1 mmol/L = 18.0182 mg/dL.
  if (paramKey === 'fasting_glucose' || paramKey === 'serum_glucose') {
    if ((sFrom === 'mg/dl' || sFrom === 'mg%' || sFrom === 'mg/100ml') && sTo === 'mmol/l') {
      const converted = value / 18.0182;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value / 18.0182',
        factorOrOffset: 18.0182
      };
    }
    if (sFrom === 'mmol/l' && (sTo === 'mg/dl' || sTo === 'mg%' || sTo === 'mg/100ml')) {
      const converted = value * 18.0182;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value * 18.0182',
        factorOrOffset: 18.0182
      };
    }
  }

  // Total Cholesterol, HDL, LDL: mg/dL <-> mmol/L
  // Standard factor: 1 mmol/L = 38.67 mg/dL (factor: 0.02586)
  if (paramKey === 'total_cholesterol' || paramKey === 'ldl' || paramKey === 'hdl') {
    if ((sFrom === 'mg/dl' || sFrom === 'mg%') && sTo === 'mmol/l') {
      const converted = value * 0.02586;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.02586',
        factorOrOffset: 0.02586
      };
    }
    if (sFrom === 'mmol/l' && (sTo === 'mg/dl' || sTo === 'mg%')) {
      const converted = value / 0.02586;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.02586',
        factorOrOffset: 0.02586
      };
    }
  }

  // Triglycerides: mg/dL <-> mmol/L
  // Standard factor: 1 mmol/L = 88.57 mg/dL (factor: 0.01129)
  if (paramKey === 'triglycerides') {
    if ((sFrom === 'mg/dl' || sFrom === 'mg%') && sTo === 'mmol/l') {
      const converted = value * 0.01129;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.01129',
        factorOrOffset: 0.01129
      };
    }
    if (sFrom === 'mmol/l' && (sTo === 'mg/dl' || sTo === 'mg%')) {
      const converted = value / 0.01129;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.01129',
        factorOrOffset: 0.01129
      };
    }
  }

  // Creatinine: mg/dL <-> µmol/L
  // Standard factor: 1 mg/dL = 88.4 µmol/L
  if (paramKey === 'creatinine') {
    if ((sFrom === 'mg/dl' || sFrom === 'mg%') && (sTo === 'umol/l' || sTo === 'µmol/l' || sTo === 'micromol/l')) {
      const converted = value * 88.4;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'mg/dL',
        toUnit: 'µmol/L',
        parameter: paramKey,
        formula: 'value * 88.4',
        factorOrOffset: 88.4
      };
    }
    if ((sFrom === 'umol/l' || sFrom === 'µmol/l' || sFrom === 'micromol/l') && (sTo === 'mg/dl' || sTo === 'mg%')) {
      const converted = value / 88.4;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: 'µmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 88.4',
        factorOrOffset: 88.4
      };
    }
  }

  // Blood Urea Nitrogen (BUN): mg/dL <-> mmol/L (urea nitrogen)
  // 1 mg/dL BUN = 0.357 mmol/L
  if (paramKey === 'bun') {
    if (sFrom === 'mg/dl' && sTo === 'mmol/l') {
      const converted = value * 0.357;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.357',
        factorOrOffset: 0.357
      };
    }
    if (sFrom === 'mmol/l' && sTo === 'mg/dl') {
      const converted = value / 0.357;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.357',
        factorOrOffset: 0.357
      };
    }
  }

  // Serum Urea: mg/dL <-> mmol/L (intact urea)
  // 1 mg/dL Urea = 0.1665 mmol/L
  if (paramKey === 'serum_urea') {
    if (sFrom === 'mg/dl' && sTo === 'mmol/l') {
      const converted = value * 0.1665;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.1665',
        factorOrOffset: 0.1665
      };
    }
    if (sFrom === 'mmol/l' && sTo === 'mg/dl') {
      const converted = value / 0.1665;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.1665',
        factorOrOffset: 0.1665
      };
    }
  }

  // Urine Albumin-to-Creatinine Ratio (uACR): mg/g <-> mg/mmol
  // 1 mg/g = 0.113 mg/mmol
  if (paramKey === 'uacr') {
    if (sFrom === 'mg/g' && sTo === 'mg/mmol') {
      const converted = value * 0.113;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/g',
        toUnit: 'mg/mmol',
        parameter: paramKey,
        formula: 'value * 0.113',
        factorOrOffset: 0.113
      };
    }
    if (sFrom === 'mg/mmol' && sTo === 'mg/g') {
      const converted = value / 0.113;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mg/mmol',
        toUnit: 'mg/g',
        parameter: paramKey,
        formula: 'value / 0.113',
        factorOrOffset: 0.113
      };
    }
  }

  // Hemoglobin & Total Protein / Albumin: g/dL <-> g/L
  // 1 g/dL = 10 g/L
  if (paramKey === 'hemoglobin' || paramKey === 'total_protein' || paramKey === 'albumin' ||
      ((sFrom === 'g/dl' || sFrom === 'gm/dl' || sFrom === 'g%') && (sTo === 'g/l' || sTo === 'gm/l')) ||
      ((sFrom === 'g/l' || sFrom === 'gm/l') && (sTo === 'g/dl' || sTo === 'gm/dl' || sTo === 'g%'))) {
    if ((sFrom === 'g/dl' || sFrom === 'gm/dl' || sFrom === 'g%') && (sTo === 'g/l' || sTo === 'gm/l')) {
      const converted = value * 10;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'g/dL',
        toUnit: 'g/L',
        parameter: paramKey || undefined,
        formula: 'value * 10',
        factorOrOffset: 10
      };
    }
    if ((sFrom === 'g/l' || sFrom === 'gm/l') && (sTo === 'g/dl' || sTo === 'gm/dl' || sTo === 'g%')) {
      const converted = value / 10;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'g/L',
        toUnit: 'g/dL',
        parameter: paramKey || undefined,
        formula: 'value / 10',
        factorOrOffset: 10
      };
    }
  }

  // Hematocrit: % <-> L/L
  // 1% = 0.01 L/L
  if (paramKey === 'hematocrit' || (sFrom === '%' && sTo === 'l/l') || (sFrom === 'l/l' && sTo === '%')) {
    if (sFrom === '%' && sTo === 'l/l') {
      const converted = value / 100;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 3),
        fromUnit: '%',
        toUnit: 'L/L',
        parameter: paramKey || undefined,
        formula: 'value / 100',
        factorOrOffset: 100
      };
    }
    if (sFrom === 'l/l' && sTo === '%') {
      const converted = value * 100;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'L/L',
        toUnit: '%',
        parameter: paramKey || undefined,
        formula: 'value * 100',
        factorOrOffset: 100
      };
    }
  }

  // Platelet Count: x10³/µL, lakh/µL, cells/µL, x10⁹/L
  // 1 lakh/µL = 100 x10³/µL; 1 x10⁹/L = 1 x10³/µL; 1000 cells/µL = 1 x10³/µL
  if (paramKey === 'platelets' || sFrom.includes('lakh') || sTo.includes('lakh')) {
    // Helper to normalize to x10³/µL first
    let valInThousands = value;
    if (sFrom.includes('lakh')) {
      valInThousands = value * 100;
    } else if (sFrom === '/µl' || sFrom === '/ul' || sFrom.includes('cells')) {
      valInThousands = value / 1000;
    }

    if (sTo.includes('lakh')) {
      const finalVal = valInThousands / 100;
      return {
        success: true,
        value: roundToPrecision(finalVal, precision ?? 2),
        fromUnit,
        toUnit: 'lakh/µL',
        parameter: 'platelets',
        formula: 'normalized_to_thousands / 100',
        factorOrOffset: 100
      };
    }
    if (sTo === 'x10³/µl' || sTo === '10^3/ul' || sTo === 'x10^9/l' || sTo === 'x10⁹/l') {
      return {
        success: true,
        value: roundToPrecision(valInThousands, precision ?? 1),
        fromUnit,
        toUnit: 'x10³/µL',
        parameter: 'platelets',
        formula: 'value * 100 (if lakh)',
        factorOrOffset: 100
      };
    }
    if (sTo === '/µl' || sTo === '/ul' || sTo.includes('cells')) {
      const finalVal = valInThousands * 1000;
      return {
        success: true,
        value: roundToPrecision(finalVal, precision ?? 0),
        fromUnit,
        toUnit: '/µL',
        parameter: 'platelets',
        formula: 'thousands * 1000',
        factorOrOffset: 1000
      };
    }
  }

  // White Blood Cells (WBC): /µL <-> x10³/µL or x10⁹/L
  if (paramKey === 'wbc') {
    if ((sFrom === '/µl' || sFrom === '/ul' || sFrom.includes('cells')) && (sTo.includes('10^3') || sTo.includes('10^9') || sTo.includes('10³') || sTo.includes('10⁹') || sTo.includes('thousand'))) {
      const converted = value / 1000;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: '/µL',
        toUnit: 'x10³/µL',
        parameter: 'wbc',
        formula: 'value / 1000',
        factorOrOffset: 1000
      };
    }
    if ((sFrom.includes('10^3') || sFrom.includes('10^9') || sFrom.includes('10³') || sFrom.includes('10⁹') || sFrom.includes('thousand')) && (sTo === '/µl' || sTo === '/ul' || sTo.includes('cells'))) {
      const converted = value * 1000;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: 'x10³/µL',
        toUnit: '/µL',
        parameter: 'wbc',
        formula: 'value * 1000',
        factorOrOffset: 1000
      };
    }
  }

  // Total / Direct Bilirubin: mg/dL <-> µmol/L (1 mg/dL = 17.104 µmol/L)
  if (paramKey === 'total_bilirubin' || paramKey === 'direct_bilirubin') {
    if (sFrom === 'mg/dl' && (sTo === 'umol/l' || sTo === 'µmol/l')) {
      const converted = value * 17.104;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mg/dL',
        toUnit: 'µmol/L',
        parameter: paramKey,
        formula: 'value * 17.104',
        factorOrOffset: 17.104
      };
    }
    if ((sFrom === 'umol/l' || sFrom === 'µmol/l') && sTo === 'mg/dl') {
      const converted = value / 17.104;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'µmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 17.104',
        factorOrOffset: 17.104
      };
    }
  }

  // Calcium: mg/dL <-> mmol/L (1 mg/dL = 0.2495 mmol/L; 1 mmol/L = 4.008 mg/dL)
  if (paramKey === 'calcium') {
    if (sFrom === 'mg/dl' && sTo === 'mmol/l') {
      const converted = value * 0.2495;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.2495',
        factorOrOffset: 0.2495
      };
    }
    if (sFrom === 'mmol/l' && sTo === 'mg/dl') {
      const converted = value / 0.2495;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.2495',
        factorOrOffset: 0.2495
      };
    }
  }

  // Magnesium: mg/dL <-> mmol/L (1 mg/dL = 0.4114 mmol/L)
  if (paramKey === 'magnesium') {
    if (sFrom === 'mg/dl' && sTo === 'mmol/l') {
      const converted = value * 0.4114;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.4114',
        factorOrOffset: 0.4114
      };
    }
    if (sFrom === 'mmol/l' && sTo === 'mg/dl') {
      const converted = value / 0.4114;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.4114',
        factorOrOffset: 0.4114
      };
    }
  }

  // Phosphate / Phosphorus: mg/dL <-> mmol/L (1 mg/dL = 0.3229 mmol/L)
  if (paramKey === 'phosphate') {
    if (sFrom === 'mg/dl' && sTo === 'mmol/l') {
      const converted = value * 0.3229;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: 'mg/dL',
        toUnit: 'mmol/L',
        parameter: paramKey,
        formula: 'value * 0.3229',
        factorOrOffset: 0.3229
      };
    }
    if (sFrom === 'mmol/l' && sTo === 'mg/dl') {
      const converted = value / 0.3229;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 0.3229',
        factorOrOffset: 0.3229
      };
    }
  }

  // Uric Acid: mg/dL <-> µmol/L (1 mg/dL = 59.48 µmol/L)
  if (paramKey === 'uric_acid') {
    if (sFrom === 'mg/dl' && (sTo === 'umol/l' || sTo === 'µmol/l')) {
      const converted = value * 59.48;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mg/dL',
        toUnit: 'µmol/L',
        parameter: paramKey,
        formula: 'value * 59.48',
        factorOrOffset: 59.48
      };
    }
    if ((sFrom === 'umol/l' || sFrom === 'µmol/l') && sTo === 'mg/dl') {
      const converted = value / 59.48;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'µmol/L',
        toUnit: 'mg/dL',
        parameter: paramKey,
        formula: 'value / 59.48',
        factorOrOffset: 59.48
      };
    }
  }

  // Vitamin D: ng/mL <-> nmol/L (1 ng/mL = 2.496 nmol/L)
  if (paramKey === 'vitamin_d') {
    if (sFrom === 'ng/ml' && sTo === 'nmol/l') {
      const converted = value * 2.496;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'ng/mL',
        toUnit: 'nmol/L',
        parameter: paramKey,
        formula: 'value * 2.496',
        factorOrOffset: 2.496
      };
    }
    if (sFrom === 'nmol/l' && sTo === 'ng/ml') {
      const converted = value / 2.496;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'nmol/L',
        toUnit: 'ng/mL',
        parameter: paramKey,
        formula: 'value / 2.496',
        factorOrOffset: 2.496
      };
    }
  }

  // Vitamin B12: pg/mL <-> pmol/L (1 pg/mL = 0.7378 pmol/L)
  if (paramKey === 'vitamin_b12') {
    if (sFrom === 'pg/ml' && sTo === 'pmol/l') {
      const converted = value * 0.7378;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'pg/mL',
        toUnit: 'pmol/L',
        parameter: paramKey,
        formula: 'value * 0.7378',
        factorOrOffset: 0.7378
      };
    }
    if (sFrom === 'pmol/l' && sTo === 'pg/ml') {
      const converted = value / 0.7378;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: 'pmol/L',
        toUnit: 'pg/mL',
        parameter: paramKey,
        formula: 'value / 0.7378',
        factorOrOffset: 0.7378
      };
    }
  }

  // HbA1c: % (NGSP) <-> mmol/mol (IFCC)
  // IFCC = (NGSP - 2.15) * 10.929
  // NGSP = (0.09148 * IFCC) + 2.152
  if (paramKey === 'hba1c') {
    if (sFrom === '%' && sTo === 'mmol/mol') {
      const converted = (value - 2.15) * 10.929;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: '%',
        toUnit: 'mmol/mol',
        parameter: paramKey,
        formula: '(value - 2.15) * 10.929',
        factorOrOffset: 10.929
      };
    }
    if (sFrom === 'mmol/mol' && sTo === '%') {
      const converted = 0.09148 * value + 2.152;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: 'mmol/mol',
        toUnit: '%',
        parameter: paramKey,
        formula: '(0.09148 * value) + 2.152',
        factorOrOffset: 0.09148
      };
    }
  }

  // =========================================================================
  // 2. STANDARD PHYSICAL DIMENSIONAL CONVERSIONS
  // =========================================================================

  // Length: mm, cm, m, in, ft
  const lengthToCm: Record<string, number> = {
    mm: 0.1,
    cm: 1,
    m: 100,
    in: 2.54,
    inch: 2.54,
    inches: 2.54,
    ft: 30.48,
    foot: 30.48,
    feet: 30.48
  };
  if (lengthToCm[sFrom] !== undefined && lengthToCm[sTo] !== undefined) {
    const cmValue = value * lengthToCm[sFrom];
    const converted = cmValue / lengthToCm[sTo];
    const targetDecimals = precision ?? (sTo === 'm' || sTo === 'ft' ? 2 : 1);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'length',
      formula: `(value * ${lengthToCm[sFrom]}) / ${lengthToCm[sTo]}`,
      factorOrOffset: lengthToCm[sFrom] / lengthToCm[sTo]
    };
  }

  // Mass / Weight: ug, mg, g, kg, lb, oz
  const massToGrams: Record<string, number> = {
    ug: 0.000001,
    'µg': 0.000001,
    mcg: 0.000001,
    mg: 0.001,
    g: 1,
    gm: 1,
    kg: 1000,
    kgs: 1000,
    lb: 453.59237,
    lbs: 453.59237,
    oz: 28.349523125
  };
  if (massToGrams[sFrom] !== undefined && massToGrams[sTo] !== undefined) {
    const gramValue = value * massToGrams[sFrom];
    const converted = gramValue / massToGrams[sTo];
    const targetDecimals = precision ?? (sTo === 'kg' || sTo === 'lb' ? 1 : 2);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'mass',
      formula: `(value * ${massToGrams[sFrom]}) / ${massToGrams[sTo]}`,
      factorOrOffset: massToGrams[sFrom] / massToGrams[sTo]
    };
  }

  // Temperature: °C, °F, K (with absolute zero safety validation)
  const isTempFrom = sFrom === '°c' || sFrom === 'c' || sFrom === 'celsius' || sFrom === '°f' || sFrom === 'f' || sFrom === 'fahrenheit' || sFrom === 'k' || sFrom === 'kelvin';
  const isTempTo = sTo === '°c' || sTo === 'c' || sTo === 'celsius' || sTo === '°f' || sTo === 'f' || sTo === 'fahrenheit' || sTo === 'k' || sTo === 'kelvin';
  if (isTempFrom && isTempTo) {
    let cValue = value;
    if (sFrom === '°f' || sFrom === 'f' || sFrom === 'fahrenheit') {
      cValue = (value - 32) * (5 / 9);
    } else if (sFrom === 'k' || sFrom === 'kelvin') {
      cValue = value - 273.15;
    }

    // Absolute zero constraint
    if (strict && cValue < -273.15) {
      return {
        success: false,
        value: null,
        fromUnit,
        toUnit,
        parameter,
        formula: 'N/A',
        error: `Temperature ${value} ${fromUnit} is below absolute zero (0 K / -273.15 °C).`
      };
    }

    let finalVal = cValue;
    let formula = 'celsius';
    if (sTo === '°f' || sTo === 'f' || sTo === 'fahrenheit') {
      finalVal = cValue * (9 / 5) + 32;
      formula = '(celsius * 9/5) + 32';
    } else if (sTo === 'k' || sTo === 'kelvin') {
      finalVal = cValue + 273.15;
      formula = 'celsius + 273.15';
    }

    const targetDecimals = precision ?? 1;
    return {
      success: true,
      value: roundToPrecision(finalVal, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'temperature',
      formula,
      factorOrOffset: formula
    };
  }

  // Volume: µL, mL, dL, L, US fl oz, US cup
  const volumeToMl: Record<string, number> = {
    ul: 0.001,
    'µl': 0.001,
    ml: 1,
    cc: 1,
    dl: 100,
    l: 1000,
    'fl oz': 29.5735295625,
    'us fl oz': 29.5735295625,
    cup: 236.5882365,
    'us cup': 236.5882365
  };
  if (volumeToMl[sFrom] !== undefined && volumeToMl[sTo] !== undefined) {
    const mlValue = value * volumeToMl[sFrom];
    const converted = mlValue / volumeToMl[sTo];
    const targetDecimals = precision ?? (sTo === 'l' ? 3 : 1);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'volume',
      formula: `(value * ${volumeToMl[sFrom]}) / ${volumeToMl[sTo]}`,
      factorOrOffset: volumeToMl[sFrom] / volumeToMl[sTo]
    };
  }

  // Pressure: Pa, kPa, mmHg, bar, atm
  const pressureToPa: Record<string, number> = {
    pa: 1,
    kpa: 1000,
    mmhg: 133.322387415,
    'mm hg': 133.322387415,
    torr: 133.322387415,
    bar: 100000,
    atm: 101325
  };
  if (pressureToPa[sFrom] !== undefined && pressureToPa[sTo] !== undefined) {
    const paValue = value * pressureToPa[sFrom];
    const converted = paValue / pressureToPa[sTo];
    const targetDecimals = precision ?? (sTo === 'mmhg' ? 0 : 2);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'pressure',
      formula: `(value * ${pressureToPa[sFrom]}) / ${pressureToPa[sTo]}`,
      factorOrOffset: pressureToPa[sFrom] / pressureToPa[sTo]
    };
  }

  // Frequency: s⁻¹ <-> min⁻¹
  if ((sFrom === 's-1' || sFrom === '/s') && (sTo === 'min-1' || sTo === '/min')) {
    return {
      success: true,
      value: roundToPrecision(value * 60, precision ?? 0),
      fromUnit: 's⁻¹',
      toUnit: 'min⁻¹',
      parameter: parameter || 'frequency',
      formula: 'value * 60',
      factorOrOffset: 60
    };
  }
  if ((sFrom === 'min-1' || sFrom === '/min') && (sTo === 's-1' || sTo === '/s')) {
    return {
      success: true,
      value: roundToPrecision(value / 60, precision ?? 2),
      fromUnit: 'min⁻¹',
      toUnit: 's⁻¹',
      parameter: parameter || 'frequency',
      formula: 'value / 60',
      factorOrOffset: 60
    };
  }

  // Catalytic enzyme activity equivalent: U/L <-> IU/L
  if ((sFrom === 'u/l' || sFrom === 'iu/l') && (sTo === 'u/l' || sTo === 'iu/l')) {
    return {
      success: true,
      value: roundToPrecision(value, precision ?? 0),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || 'enzymatic_activity',
      formula: 'value (1:1 international catalytic activity)',
      factorOrOffset: 1
    };
  }

  // Monovalent electrolytes equivalent: mEq/L <-> mmol/L
  if ((sFrom === 'meq/l' || sFrom === 'mmol/l') && (sTo === 'meq/l' || sTo === 'mmol/l') &&
      (!paramKey || paramKey === 'sodium' || paramKey === 'potassium' || paramKey === 'chloride')) {
    return {
      success: true,
      value: roundToPrecision(value, precision ?? 1),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: paramKey || 'monovalent_electrolyte',
      formula: 'value (1:1 monovalent ion relationship)',
      factorOrOffset: 1
    };
  }

  // Incompatible dimensions rejection
  const fromDim = fromDef?.dimension || 'unknown';
  const toDim = toDef?.dimension || 'unknown';
  return {
    success: false,
    value: null,
    fromUnit,
    toUnit,
    parameter,
    formula: 'N/A',
    error: `Incompatible conversion from '${fromUnit}' (${fromDim}) to '${toUnit}' (${toDim})${parameter ? ` for parameter '${parameter}'` : ''}.`
  };
}

/**
 * Blood Pressure Conversion
 * Preserves the systolic/diastolic pair (e.g., '120/80 mmHg') and converts both components safely.
 */
export function convertBloodPressure(
  bpString: string | null | undefined,
  fromUnit: string = 'mmHg',
  toUnit: string = 'mmHg'
): BloodPressureConversionResult {
  if (!bpString) {
    return { success: false, systolic: null, diastolic: null, formatted: '—', fromUnit, toUnit, error: 'Empty blood pressure string' };
  }

  const parts = bpString.trim().split('/');
  if (parts.length < 2) {
    return { success: false, systolic: null, diastolic: null, formatted: bpString, fromUnit, toUnit, error: 'Invalid blood pressure format. Expected sys/dia (e.g. 120/80)' };
  }

  const sysNum = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
  const diaNum = parseFloat(parts[1].replace(/[^0-9.]/g, ''));

  if (isNaN(sysNum) || isNaN(diaNum)) {
    return { success: false, systolic: null, diastolic: null, formatted: bpString, fromUnit, toUnit, error: 'Could not parse systolic/diastolic values' };
  }

  const sysConv = convertUnit(sysNum, fromUnit, toUnit, { parameter: 'blood_pressure_systolic', precision: toUnit.toLowerCase() === 'kpa' ? 1 : 0 });
  const diaConv = convertUnit(diaNum, fromUnit, toUnit, { parameter: 'blood_pressure_diastolic', precision: toUnit.toLowerCase() === 'kpa' ? 1 : 0 });

  if (!sysConv.success || !diaConv.success) {
    return { success: false, systolic: null, diastolic: null, formatted: bpString, fromUnit, toUnit, error: sysConv.error || diaConv.error };
  }

  return {
    success: true,
    systolic: sysConv.value,
    diastolic: diaConv.value,
    formatted: `${sysConv.value}/${diaConv.value} ${toUnit}`,
    fromUnit,
    toUnit
  };
}

/**
 * Reference Range Conversion
 * Parses numerical boundaries (e.g., '70 - 99', '< 200', '>= 18.5', '13.0 - 17.0') and converts bounds safely.
 */
export function convertReferenceRange(
  rangeStr: string | null | undefined,
  fromUnit: string,
  toUnit: string,
  parameter?: string
): ReferenceRangeConversionResult {
  if (!rangeStr || !rangeStr.trim()) {
    return { success: false, formattedRange: '—', fromUnit, toUnit, parameter, error: 'Empty range' };
  }

  const clean = rangeStr.trim();

  // If units are already identical, preserve text
  if (sanitizeUnit(fromUnit) === sanitizeUnit(toUnit)) {
    return { success: true, formattedRange: clean, fromUnit, toUnit, parameter };
  }

  // Pattern: "min - max" or "min – max" or "min to max"
  const rangeMatch = clean.match(/^([<>=~]?\s*[\d.]+)\s*(?:-|–|to)\s*([<>=~]?\s*[\d.]+)$/i);
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1].replace(/[^0-9.]/g, ''));
    const maxVal = parseFloat(rangeMatch[2].replace(/[^0-9.]/g, ''));

    const minConv = convertUnit(minVal, fromUnit, toUnit, { parameter });
    const maxConv = convertUnit(maxVal, fromUnit, toUnit, { parameter });

    if (minConv.success && maxConv.success) {
      return {
        success: true,
        minNormal: minConv.value!,
        maxNormal: maxConv.value!,
        formattedRange: `${minConv.value} – ${maxConv.value} ${toUnit}`,
        fromUnit,
        toUnit,
        parameter
      };
    }
  }

  // Pattern: single boundary e.g. "< 200", "<= 100", "> 40", ">= 60"
  const singleMatch = clean.match(/^([<>]=?|≤|≥)\s*([\d.]+)$/);
  if (singleMatch) {
    const op = singleMatch[1];
    const val = parseFloat(singleMatch[2]);
    const conv = convertUnit(val, fromUnit, toUnit, { parameter });
    if (conv.success) {
      return {
        success: true,
        minNormal: op.includes('>') || op.includes('≥') ? conv.value! : undefined,
        maxNormal: op.includes('<') || op.includes('≤') ? conv.value! : undefined,
        formattedRange: `${op} ${conv.value} ${toUnit}`,
        fromUnit,
        toUnit,
        parameter
      };
    }
  }

  return {
    success: false,
    formattedRange: `${clean} (${fromUnit})`,
    fromUnit,
    toUnit,
    parameter,
    error: `Could not parse structured bounds from range: '${rangeStr}'`
  };
}

/**
 * Backward-compatible helper matching `src/analytics/unitRegistry.ts` interface
 */
export function convertToCanonicalUnit(
  canonicalParam: string,
  value: number,
  reportedUnit: string | null | undefined
): {
  success: boolean;
  convertedValue: number | null;
  canonicalUnit: string;
  originalUnit: string;
  conversionApplied: string;
  error?: string;
} {
  const rule = lookupParameterRule(canonicalParam);
  const targetUnit = rule ? rule.canonicalUnit : (reportedUnit || 'units');
  const unit = (reportedUnit || '').trim();

  if (!unit) {
    return {
      success: false,
      convertedValue: null,
      canonicalUnit: targetUnit,
      originalUnit: '',
      conversionApplied: 'missing_unit',
      error: `Missing unit for parameter ${canonicalParam}`
    };
  }

  const result = convertUnit(value, unit, targetUnit, { parameter: canonicalParam });

  return {
    success: result.success,
    convertedValue: result.value,
    canonicalUnit: targetUnit,
    originalUnit: unit,
    conversionApplied: result.formula,
    error: result.error
  };
}

/**
 * Formats a converted value and unit for clean user presentation
 */
export function formatConvertedValue(
  value: number | null | undefined,
  unit: string,
  options: { precision?: number; showUnit?: boolean } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const { precision, showUnit = true } = options;
  const unitDef = lookupUnit(unit);
  const decimals = precision !== undefined ? precision : (unitDef?.defaultDecimals ?? 1);

  const formattedNum = roundToPrecision(value, decimals).toFixed(decimals);
  // Strip trailing zeros if integer display is cleaner, unless decimals explicitly set
  const cleanNum = precision !== undefined ? formattedNum : parseFloat(formattedNum).toString();

  return showUnit ? `${cleanNum} ${unitDef?.symbol || unit}` : cleanNum;
}

// =========================================================================
// 3. ANTHROPOMETRIC & CLINICAL CALCULATORS (Height, Weight, BMI)
// =========================================================================

/**
 * Converts centimeters to compound feet and rounded inches
 */
export function cmToFtIn(cm: number | null | undefined): { feet: number; inches: number } {
  if (!cm || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Converts compound feet and inches to centimeters
 */
export function ftInToCm(feet: number, inches: number): number {
  const safeFeet = Math.max(0, feet || 0);
  const safeInches = Math.max(0, inches || 0);
  const totalInches = safeFeet * 12 + safeInches;
  return Math.round(totalInches * 2.54 * 10) / 10;
}

/**
 * Converts kilograms to pounds
 */
export function kgToLb(kg: number | null | undefined): number | null {
  if (kg === undefined || kg === null || kg <= 0) return null;
  return Math.round(kg * 2.20462262 * 10) / 10;
}

/**
 * Converts pounds to kilograms
 */
export function lbToKg(lb: number | null | undefined): number | null {
  if (lb === undefined || lb === null || lb <= 0) return null;
  return Math.round((lb * 0.45359237) * 10) / 10;
}

/**
 * Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

/**
 * Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * (5 / 9)) * 10) / 10;
}

/**
 * Calculates BMI and WHO adult classification
 * Standard formula: weight(kg) / [height(m)]²
 * Changing display units does not change underlying calculated BMI.
 */
export function calculateBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): {
  bmi: number | null;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity' | null;
  categoryColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  range: string;
} {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: null,
      category: null,
      categoryColor: 'text-slate-400',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      description: 'Enter height and weight to calculate BMI',
      range: '—'
    };
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      categoryColor: 'text-sky-600',
      badgeBg: 'bg-sky-50 border-sky-200',
      badgeText: 'text-sky-700',
      description: 'Below standard body mass index (< 18.5)',
      range: '< 18.5'
    };
  }
  if (bmi < 25.0) {
    return {
      bmi,
      category: 'Normal',
      categoryColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
      description: 'Healthy adult weight range (18.5 – 24.9)',
      range: '18.5 – 24.9'
    };
  }
  if (bmi < 30.0) {
    return {
      bmi,
      category: 'Overweight',
      categoryColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200',
      badgeText: 'text-amber-700',
      description: 'Above standard adult range (25.0 – 29.9)',
      range: '25.0 – 29.9'
    };
  }
  return {
    bmi,
    category: 'Obesity',
    categoryColor: 'text-rose-600',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    description: 'Significantly elevated body mass (≥ 30.0)',
    range: '≥ 30.0'
  };
}

/**
 * Formats height for display given user's active unit preference ('cm' or 'ft & in' / 'ft')
 */
export function formatHeightDisplay(
  heightCm: number | null | undefined,
  unit: 'cm' | 'ft' | 'ft & in' = 'cm'
): string {
  if (!heightCm || heightCm <= 0) return 'Not recorded';
  if (unit === 'ft' || unit === 'ft & in') {
    const { feet, inches } = cmToFtIn(heightCm);
    return `${feet} ft ${inches} in`;
  }
  return `${heightCm} cm`;
}

/**
 * Formats weight for display given user's active unit preference ('kg' or 'lb' / 'lbs')
 */
export function formatWeightDisplay(
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb' | 'lbs' = 'kg'
): string {
  if (!weightKg || weightKg <= 0) return 'Not recorded';
  if (unit === 'lb' || unit === 'lbs') {
    const lb = kgToLb(weightKg);
    return `${lb} lb`;
  }
  return `${weightKg} kg`;
}

/**
 * Formats temperature for display given user's active unit preference ('°C' or '°F')
 */
export function formatTemperatureDisplay(
  tempC: number | null | undefined,
  unit: '°C' | '°F' = '°C'
): string {
  if (tempC === null || tempC === undefined || isNaN(tempC)) return 'Not recorded';
  if (unit === '°F') {
    return `${celsiusToFahrenheit(tempC)} °F`;
  }
  return `${tempC} °C`;
}
