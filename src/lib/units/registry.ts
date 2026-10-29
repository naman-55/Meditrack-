/**
 * MediTrack Universal Unit Conversion System - Authoritative Unit Registry
 * Central catalog of physical units, aliases, dimensions, and analyte-specific conversion parameters.
 */

import { UnitDefinition, ParameterUnitRule } from './types';

/**
 * Standard Physical Units Catalog
 */
export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
  // === LENGTH ===
  mm: {
    id: 'mm',
    symbol: 'mm',
    name: 'Millimeter',
    dimension: 'length',
    system: 'SI',
    aliases: ['mm', 'millimeter', 'millimeters'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  cm: {
    id: 'cm',
    symbol: 'cm',
    name: 'Centimeter',
    dimension: 'length',
    system: 'SI',
    aliases: ['cm', 'centimeter', 'centimeters'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  m: {
    id: 'm',
    symbol: 'm',
    name: 'Meter',
    dimension: 'length',
    system: 'SI',
    aliases: ['m', 'meter', 'meters', 'metre', 'metres'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  in: {
    id: 'in',
    symbol: 'in',
    name: 'Inch',
    dimension: 'length',
    system: 'US_CUSTOMARY',
    aliases: ['in', 'inch', 'inches', '"'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  ft: {
    id: 'ft',
    symbol: 'ft',
    name: 'Foot',
    dimension: 'length',
    system: 'US_CUSTOMARY',
    aliases: ['ft', 'foot', 'feet', "'"],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === MASS / BODY WEIGHT ===
  ug: {
    id: 'ug',
    symbol: 'µg',
    name: 'Microgram',
    dimension: 'mass',
    system: 'SI',
    aliases: ['µg', 'ug', 'mcg', 'microgram', 'micrograms'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  mg: {
    id: 'mg',
    symbol: 'mg',
    name: 'Milligram',
    dimension: 'mass',
    system: 'SI',
    aliases: ['mg', 'milligram', 'milligrams'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  g: {
    id: 'g',
    symbol: 'g',
    name: 'Gram',
    dimension: 'mass',
    system: 'SI',
    aliases: ['g', 'gm', 'gram', 'grams'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  kg: {
    id: 'kg',
    symbol: 'kg',
    name: 'Kilogram',
    dimension: 'mass',
    system: 'SI',
    aliases: ['kg', 'kgs', 'kilogram', 'kilograms'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  lb: {
    id: 'lb',
    symbol: 'lb',
    name: 'Pound',
    dimension: 'mass',
    system: 'US_CUSTOMARY',
    aliases: ['lb', 'lbs', 'pound', 'pounds'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  oz: {
    id: 'oz',
    symbol: 'oz',
    name: 'Ounce',
    dimension: 'mass',
    system: 'US_CUSTOMARY',
    aliases: ['oz', 'ounce', 'ounces'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === TEMPERATURE ===
  celsius: {
    id: 'celsius',
    symbol: '°C',
    name: 'Degree Celsius',
    dimension: 'temperature',
    system: 'SI',
    aliases: ['°c', 'c', 'celsius', 'centigrade', 'deg c', 'degree c'],
    defaultDecimals: 1,
    allowNegative: true,
    physicalMinimum: -273.15
  },
  fahrenheit: {
    id: 'fahrenheit',
    symbol: '°F',
    name: 'Degree Fahrenheit',
    dimension: 'temperature',
    system: 'US_CUSTOMARY',
    aliases: ['°f', 'f', 'fahrenheit', 'deg f', 'degree f'],
    defaultDecimals: 1,
    allowNegative: true,
    physicalMinimum: -459.67
  },
  kelvin: {
    id: 'kelvin',
    symbol: 'K',
    name: 'Kelvin',
    dimension: 'temperature',
    system: 'SI',
    aliases: ['k', 'kelvin'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === VOLUME ===
  ul: {
    id: 'ul',
    symbol: 'µL',
    name: 'Microliter',
    dimension: 'volume',
    system: 'SI',
    aliases: ['µl', 'ul', 'microliter', 'microlitre', 'microliters'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  ml: {
    id: 'ml',
    symbol: 'mL',
    name: 'Milliliter',
    dimension: 'volume',
    system: 'SI',
    aliases: ['ml', 'milliliter', 'millilitre', 'cc'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  dl: {
    id: 'dl',
    symbol: 'dL',
    name: 'Deciliter',
    dimension: 'volume',
    system: 'SI',
    aliases: ['dl', 'deciliter', 'decilitre'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  l: {
    id: 'l',
    symbol: 'L',
    name: 'Liter',
    dimension: 'volume',
    system: 'SI',
    aliases: ['l', 'liter', 'litre', 'liters'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  us_fl_oz: {
    id: 'us_fl_oz',
    symbol: 'US fl oz',
    name: 'US Fluid Ounce',
    dimension: 'volume',
    system: 'US_CUSTOMARY',
    aliases: ['fl oz', 'us fl oz', 'fluid ounce'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  us_cup: {
    id: 'us_cup',
    symbol: 'US cup',
    name: 'US Customary Cup',
    dimension: 'volume',
    system: 'US_CUSTOMARY',
    aliases: ['cup', 'cups', 'us cup'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === PRESSURE ===
  pa: {
    id: 'pa',
    symbol: 'Pa',
    name: 'Pascal',
    dimension: 'pressure',
    system: 'SI',
    aliases: ['pa', 'pascal'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  kpa: {
    id: 'kpa',
    symbol: 'kPa',
    name: 'Kilopascal',
    dimension: 'pressure',
    system: 'SI',
    aliases: ['kpa', 'kilopascal'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  mmhg: {
    id: 'mmhg',
    symbol: 'mmHg',
    name: 'Millimeter of Mercury',
    dimension: 'pressure',
    system: 'CONVENTIONAL',
    aliases: ['mmhg', 'mm hg', 'torr'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  bar: {
    id: 'bar',
    symbol: 'bar',
    name: 'Bar',
    dimension: 'pressure',
    system: 'SI',
    aliases: ['bar'],
    defaultDecimals: 3,
    allowNegative: false,
    physicalMinimum: 0
  },
  atm: {
    id: 'atm',
    symbol: 'atm',
    name: 'Standard Atmosphere',
    dimension: 'pressure',
    system: 'CONVENTIONAL',
    aliases: ['atm', 'atmosphere'],
    defaultDecimals: 3,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === FREQUENCY AND RATE ===
  per_sec: {
    id: 'per_sec',
    symbol: 's⁻¹',
    name: 'Per Second',
    dimension: 'frequency',
    system: 'SI',
    aliases: ['s-1', 's⁻¹', '/s', 'per sec'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  per_min: {
    id: 'per_min',
    symbol: 'min⁻¹',
    name: 'Per Minute',
    dimension: 'frequency',
    system: 'CONVENTIONAL',
    aliases: ['min-1', 'min⁻¹', '/min', 'per min'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  bpm: {
    id: 'bpm',
    symbol: 'bpm',
    name: 'Beats per Minute',
    dimension: 'frequency',
    system: 'CLINICAL',
    aliases: ['bpm', 'beats/min', 'beats per minute'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  breaths_per_min: {
    id: 'breaths_per_min',
    symbol: 'breaths/min',
    name: 'Respirations per Minute',
    dimension: 'frequency',
    system: 'CLINICAL',
    aliases: ['breaths/min', 'resp/min', 'breaths per minute', 'rpm'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },

  // === CLINICAL CONCENTRATIONS & ENZYMATICS ===
  mg_dl: {
    id: 'mg_dl',
    symbol: 'mg/dL',
    name: 'Milligrams per Deciliter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['mg/dl', 'mg%', 'mg/100ml', 'mg/100 ml'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  mmol_l: {
    id: 'mmol_l',
    symbol: 'mmol/L',
    name: 'Millimoles per Liter',
    dimension: 'analyte_concentration',
    system: 'SI',
    aliases: ['mmol/l', 'mm/l', 'millimoles/l'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  umol_l: {
    id: 'umol_l',
    symbol: 'µmol/L',
    name: 'Micromoles per Liter',
    dimension: 'analyte_concentration',
    system: 'SI',
    aliases: ['µmol/l', 'umol/l', 'micromol/l', 'umol/L'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  nmol_l: {
    id: 'nmol_l',
    symbol: 'nmol/L',
    name: 'Nanomoles per Liter',
    dimension: 'analyte_concentration',
    system: 'SI',
    aliases: ['nmol/l', 'nanomoles/l'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  pmol_l: {
    id: 'pmol_l',
    symbol: 'pmol/L',
    name: 'Picomoles per Liter',
    dimension: 'analyte_concentration',
    system: 'SI',
    aliases: ['pmol/l', 'picomoles/l'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  g_dl: {
    id: 'g_dl',
    symbol: 'g/dL',
    name: 'Grams per Deciliter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['g/dl', 'gm/dl', 'g%', 'gm%'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  g_l: {
    id: 'g_l',
    symbol: 'g/L',
    name: 'Grams per Liter',
    dimension: 'analyte_concentration',
    system: 'SI',
    aliases: ['g/l', 'gm/l'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  meq_l: {
    id: 'meq_l',
    symbol: 'mEq/L',
    name: 'Milliequivalents per Liter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['meq/l', 'meq / l'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  ng_dl: {
    id: 'ng_dl',
    symbol: 'ng/dL',
    name: 'Nanograms per Deciliter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['ng/dl'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  ng_ml: {
    id: 'ng_ml',
    symbol: 'ng/mL',
    name: 'Nanograms per Milliliter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['ng/ml'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  pg_ml: {
    id: 'pg_ml',
    symbol: 'pg/mL',
    name: 'Picograms per Milliliter',
    dimension: 'analyte_concentration',
    system: 'CONVENTIONAL',
    aliases: ['pg/ml'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  u_l: {
    id: 'u_l',
    symbol: 'U/L',
    name: 'Units per Liter',
    dimension: 'enzymatic_activity',
    system: 'CLINICAL',
    aliases: ['u/l', 'iu/l', 'u / l', 'iu / l'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  percent: {
    id: 'percent',
    symbol: '%',
    name: 'Percent',
    dimension: 'proportion',
    system: 'CONVENTIONAL',
    aliases: ['%', 'vol%', 'percent'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  fractional_proportion: {
    id: 'fractional_proportion',
    symbol: 'L/L',
    name: 'Volume Fraction (L/L)',
    dimension: 'proportion',
    system: 'SI',
    aliases: ['l/l', 'fraction'],
    defaultDecimals: 3,
    allowNegative: false,
    physicalMinimum: 0
  },
  cells_per_ul: {
    id: 'cells_per_ul',
    symbol: '/µL',
    name: 'Cells per Microliter',
    dimension: 'cell_count',
    system: 'CLINICAL',
    aliases: ['/µl', '/ul', 'cells/µl', 'cells/ul', 'cell/ul'],
    defaultDecimals: 0,
    allowNegative: false,
    physicalMinimum: 0
  },
  thousands_per_ul: {
    id: 'thousands_per_ul',
    symbol: 'x10³/µL',
    name: 'Thousands per Microliter',
    dimension: 'cell_count',
    system: 'CLINICAL',
    aliases: ['x10^3/µl', 'x10^3/ul', '10^3/ul', 'x103/ul', 'thousand/µl', 'k/ul'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  },
  lakh_per_ul: {
    id: 'lakh_per_ul',
    symbol: 'lakh/µL',
    name: 'Lakh per Microliter',
    dimension: 'cell_count',
    system: 'CONVENTIONAL',
    aliases: ['lakh/µl', 'lakh/ul', 'lac/ul', 'lakhs/ul'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  millions_per_ul: {
    id: 'millions_per_ul',
    symbol: 'million/µL',
    name: 'Million per Microliter',
    dimension: 'cell_count',
    system: 'CLINICAL',
    aliases: ['million/µl', 'million/ul', 'x10^6/µl', 'x10^6/ul', 'x10^12/l', '10^6/ul'],
    defaultDecimals: 2,
    allowNegative: false,
    physicalMinimum: 0
  },
  bmi_unit: {
    id: 'bmi_unit',
    symbol: 'kg/m²',
    name: 'Kilogram per square meter',
    dimension: 'clinical_index',
    system: 'CLINICAL',
    aliases: ['kg/m²', 'kg/m2'],
    defaultDecimals: 1,
    allowNegative: false,
    physicalMinimum: 0
  }
};

/**
 * Authoritative Parameter Registry with Dimension and Clinical Conversion Constants
 */
export const CLINICAL_PARAMETER_RULES: Record<string, ParameterUnitRule> = {
  // === GLUCOSE ===
  fasting_glucose: {
    parameter: 'fasting_glucose',
    displayName: 'Fasting Blood Glucose',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 180.156, // g/mol (D-glucose)
    standardSource: 'ADA Clinical Practice Recommendations: 1 mmol/L = 18.0182 mg/dL'
  },
  serum_glucose: {
    parameter: 'serum_glucose',
    displayName: 'Random / Serum Glucose',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 180.156,
    standardSource: 'ADA Clinical Practice Recommendations: 1 mmol/L = 18.0182 mg/dL'
  },

  // === LIPID PANEL ===
  total_cholesterol: {
    parameter: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 386.65, // g/mol (Cholesterol)
    standardSource: 'AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)'
  },
  ldl: {
    parameter: 'ldl',
    displayName: 'LDL Cholesterol',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 386.65,
    standardSource: 'AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)'
  },
  hdl: {
    parameter: 'hdl',
    displayName: 'HDL Cholesterol',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 386.65,
    standardSource: 'AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)'
  },
  triglycerides: {
    parameter: 'triglycerides',
    displayName: 'Serum Triglycerides',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 885.4, // g/mol (triolein standard)
    standardSource: 'NCEP ATP III: 1 mmol/L = 88.57 mg/dL (factor 0.01129)'
  },

  // === RENAL PANEL ===
  creatinine: {
    parameter: 'creatinine',
    displayName: 'Serum Creatinine',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'µmol/L'],
    precision: 2,
    molarMass: 113.12, // g/mol
    standardSource: 'NKF KDOQI Clinical Guidelines: 1 mg/dL = 88.4 µmol/L'
  },
  bun: {
    parameter: 'bun',
    displayName: 'Blood Urea Nitrogen',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 28.014, // 2 nitrogens in urea
    standardSource: '1 mg/dL BUN = 0.357 mmol/L urea nitrogen'
  },
  serum_urea: {
    parameter: 'serum_urea',
    displayName: 'Serum Urea',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 60.06, // intact urea molecule (NH2)2CO
    standardSource: '1 mg/dL Urea = 0.1665 mmol/L intact urea'
  },
  uacr: {
    parameter: 'uacr',
    displayName: 'Urine Albumin-to-Creatinine Ratio',
    dimension: 'substance_ratio',
    canonicalUnit: 'mg/g',
    compatibleUnits: ['mg/g', 'mg/mmol'],
    precision: 1,
    standardSource: 'KDIGO CKD Guidelines: 1 mg/g = 0.113 mg/mmol'
  },

  // === HEMATOLOGY & CBC ===
  hemoglobin: {
    parameter: 'hemoglobin',
    displayName: 'Hemoglobin',
    dimension: 'analyte_concentration',
    canonicalUnit: 'g/dL',
    compatibleUnits: ['g/dL', 'g/L'],
    precision: 1,
    standardSource: 'WHO Diagnostic Criteria: 1 g/dL = 10 g/L'
  },
  hematocrit: {
    parameter: 'hematocrit',
    displayName: 'Hematocrit (PCV)',
    dimension: 'proportion',
    canonicalUnit: '%',
    compatibleUnits: ['%', 'L/L'],
    precision: 1,
    standardSource: 'Standard Hematology: 1% = 0.01 L/L'
  },
  platelets: {
    parameter: 'platelets',
    displayName: 'Platelet Count',
    dimension: 'cell_count',
    canonicalUnit: 'x10³/µL',
    compatibleUnits: ['x10³/µL', 'lakh/µL', '/µL', 'x10⁹/L'],
    precision: 1,
    standardSource: 'International Society on Thrombosis and Haemostasis: 1 lakh/µL = 100 x10³/µL'
  },
  wbc: {
    parameter: 'wbc',
    displayName: 'Total White Blood Cell Count',
    dimension: 'cell_count',
    canonicalUnit: '/µL',
    compatibleUnits: ['/µL', 'x10³/µL', 'x10⁹/L'],
    precision: 0,
    standardSource: 'Standard Automated Hematology Counters: 1 x10³/µL = 1000 /µL'
  },
  rbc: {
    parameter: 'rbc',
    displayName: 'Red Blood Cell Count',
    dimension: 'cell_count',
    canonicalUnit: 'million/µL',
    compatibleUnits: ['million/µL', 'x10¹²/L'],
    precision: 2,
    standardSource: 'Standard Hematology: 1 million/µL = 1 x10¹²/L'
  },

  // === HEPATIC / LIVER ENZYMES ===
  alt: {
    parameter: 'alt',
    displayName: 'Alanine Aminotransferase (ALT/SGPT)',
    dimension: 'enzymatic_activity',
    canonicalUnit: 'U/L',
    compatibleUnits: ['U/L', 'IU/L'],
    precision: 0,
    standardSource: 'IFCC Reference Measurement: U/L = IU/L'
  },
  ast: {
    parameter: 'ast',
    displayName: 'Aspartate Aminotransferase (AST/SGOT)',
    dimension: 'enzymatic_activity',
    canonicalUnit: 'U/L',
    compatibleUnits: ['U/L', 'IU/L'],
    precision: 0,
    standardSource: 'IFCC Reference Measurement: U/L = IU/L'
  },
  alp: {
    parameter: 'alp',
    displayName: 'Alkaline Phosphatase (ALP)',
    dimension: 'enzymatic_activity',
    canonicalUnit: 'U/L',
    compatibleUnits: ['U/L', 'IU/L'],
    precision: 0,
    standardSource: 'IFCC Reference Measurement: U/L = IU/L'
  },
  ggt: {
    parameter: 'ggt',
    displayName: 'Gamma-Glutamyl Transferase (GGT)',
    dimension: 'enzymatic_activity',
    canonicalUnit: 'U/L',
    compatibleUnits: ['U/L', 'IU/L'],
    precision: 0,
    standardSource: 'IFCC Reference Measurement: U/L = IU/L'
  },
  total_bilirubin: {
    parameter: 'total_bilirubin',
    displayName: 'Total Bilirubin',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'µmol/L'],
    precision: 2,
    molarMass: 584.66,
    standardSource: '1 mg/dL = 17.1 µmol/L'
  },
  direct_bilirubin: {
    parameter: 'direct_bilirubin',
    displayName: 'Direct Bilirubin',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'µmol/L'],
    precision: 2,
    molarMass: 584.66,
    standardSource: '1 mg/dL = 17.1 µmol/L'
  },
  total_protein: {
    parameter: 'total_protein',
    displayName: 'Total Protein',
    dimension: 'analyte_concentration',
    canonicalUnit: 'g/dL',
    compatibleUnits: ['g/dL', 'g/L'],
    precision: 1,
    standardSource: '1 g/dL = 10 g/L'
  },
  albumin: {
    parameter: 'albumin',
    displayName: 'Serum Albumin',
    dimension: 'analyte_concentration',
    canonicalUnit: 'g/dL',
    compatibleUnits: ['g/dL', 'g/L'],
    precision: 1,
    standardSource: '1 g/dL = 10 g/L'
  },

  // === ELECTROLYTES & CHEMISTRY ===
  sodium: {
    parameter: 'sodium',
    displayName: 'Serum Sodium (Na⁺)',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mEq/L',
    compatibleUnits: ['mEq/L', 'mmol/L'],
    precision: 0,
    standardSource: 'Monovalent ion: 1 mEq/L = 1 mmol/L'
  },
  potassium: {
    parameter: 'potassium',
    displayName: 'Serum Potassium (K⁺)',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mEq/L',
    compatibleUnits: ['mEq/L', 'mmol/L'],
    precision: 1,
    standardSource: 'Monovalent ion: 1 mEq/L = 1 mmol/L'
  },
  chloride: {
    parameter: 'chloride',
    displayName: 'Serum Chloride (Cl⁻)',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mEq/L',
    compatibleUnits: ['mEq/L', 'mmol/L'],
    precision: 0,
    standardSource: 'Monovalent ion: 1 mEq/L = 1 mmol/L'
  },
  calcium: {
    parameter: 'calcium',
    displayName: 'Total Serum Calcium',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 40.078,
    standardSource: '1 mg/dL = 0.2495 mmol/L (factor 4.008)'
  },
  magnesium: {
    parameter: 'magnesium',
    displayName: 'Serum Magnesium',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 2,
    molarMass: 24.305,
    standardSource: '1 mg/dL = 0.4114 mmol/L (factor 2.43)'
  },
  phosphate: {
    parameter: 'phosphate',
    displayName: 'Inorganic Phosphorus',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'mmol/L'],
    precision: 1,
    molarMass: 30.974,
    standardSource: '1 mg/dL = 0.3229 mmol/L (factor 3.097)'
  },
  uric_acid: {
    parameter: 'uric_acid',
    displayName: 'Serum Uric Acid',
    dimension: 'analyte_concentration',
    canonicalUnit: 'mg/dL',
    compatibleUnits: ['mg/dL', 'µmol/L'],
    precision: 1,
    molarMass: 168.11,
    standardSource: '1 mg/dL = 59.48 µmol/L'
  },

  // === ENDOCRINE & VITAMINS ===
  tsh: {
    parameter: 'tsh',
    displayName: 'Thyroid Stimulating Hormone (TSH)',
    dimension: 'analyte_concentration',
    canonicalUnit: 'µIU/mL',
    compatibleUnits: ['µIU/mL', 'mIU/L'],
    precision: 2,
    standardSource: 'WHO International Standard: 1 µIU/mL = 1 mIU/L'
  },
  vitamin_d: {
    parameter: 'vitamin_d',
    displayName: '25-Hydroxy Vitamin D',
    dimension: 'analyte_concentration',
    canonicalUnit: 'ng/mL',
    compatibleUnits: ['ng/mL', 'nmol/L'],
    precision: 1,
    molarMass: 400.64,
    standardSource: 'Endocrine Society Guidelines: 1 ng/mL = 2.496 nmol/L'
  },
  vitamin_b12: {
    parameter: 'vitamin_b12',
    displayName: 'Vitamin B12 (Cobalamin)',
    dimension: 'analyte_concentration',
    canonicalUnit: 'pg/mL',
    compatibleUnits: ['pg/mL', 'pmol/L'],
    precision: 0,
    molarMass: 1355.37,
    standardSource: '1 pg/mL = 0.7378 pmol/L'
  },
  hba1c: {
    parameter: 'hba1c',
    displayName: 'Glycated Hemoglobin (HbA1c)',
    dimension: 'proportion',
    canonicalUnit: '%',
    compatibleUnits: ['%', 'mmol/mol'],
    precision: 1,
    standardSource: 'NGSP to IFCC master equation: IFCC = (NGSP - 2.15) * 10.929'
  },

  // === BIOMETRICS & VITALS ===
  height: {
    parameter: 'height',
    displayName: 'Height',
    dimension: 'length',
    canonicalUnit: 'cm',
    compatibleUnits: ['cm', 'm', 'in', 'ft'],
    precision: 1,
    standardSource: '1 in = 2.54 cm exact SI definition'
  },
  weight: {
    parameter: 'weight',
    displayName: 'Body Weight',
    dimension: 'mass',
    canonicalUnit: 'kg',
    compatibleUnits: ['kg', 'lb'],
    precision: 1,
    standardSource: '1 lb = 0.45359237 kg exact international avoirdupois definition'
  },
  temperature: {
    parameter: 'temperature',
    displayName: 'Body Temperature',
    dimension: 'temperature',
    canonicalUnit: '°C',
    compatibleUnits: ['°C', '°F', 'K'],
    precision: 1,
    standardSource: 'Standard thermometry: °F = (°C * 9/5) + 32'
  },
  blood_pressure: {
    parameter: 'blood_pressure',
    displayName: 'Blood Pressure',
    dimension: 'pressure',
    canonicalUnit: 'mmHg',
    compatibleUnits: ['mmHg', 'kPa'],
    precision: 0,
    standardSource: 'AHA/ACC Hypertension Guidelines: 1 mmHg = 0.133322 kPa'
  },
  blood_pressure_systolic: {
    parameter: 'blood_pressure_systolic',
    displayName: 'Systolic Blood Pressure',
    dimension: 'pressure',
    canonicalUnit: 'mmHg',
    compatibleUnits: ['mmHg', 'kPa'],
    precision: 0,
    standardSource: '1 mmHg = 0.133322 kPa'
  },
  blood_pressure_diastolic: {
    parameter: 'blood_pressure_diastolic',
    displayName: 'Diastolic Blood Pressure',
    dimension: 'pressure',
    canonicalUnit: 'mmHg',
    compatibleUnits: ['mmHg', 'kPa'],
    precision: 0,
    standardSource: '1 mmHg = 0.133322 kPa'
  },
  heart_rate: {
    parameter: 'heart_rate',
    displayName: 'Heart Rate (Pulse)',
    dimension: 'frequency',
    canonicalUnit: 'bpm',
    compatibleUnits: ['bpm', 'beats/min', '/min'],
    precision: 0,
    standardSource: '1 bpm = 1 beat/min'
  },
  respiratory_rate: {
    parameter: 'respiratory_rate',
    displayName: 'Respiratory Rate',
    dimension: 'frequency',
    canonicalUnit: 'breaths/min',
    compatibleUnits: ['breaths/min', '/min'],
    precision: 0,
    standardSource: '1 breath/min = 1 respiration/min'
  },
  spo2: {
    parameter: 'spo2',
    displayName: 'Oxygen Saturation (SpO₂)',
    dimension: 'proportion',
    canonicalUnit: '%',
    compatibleUnits: ['%'],
    precision: 1,
    standardSource: 'SpO2 is percentage saturation; not convertible to arterial partial pressure (PaO2)'
  },
  bmi: {
    parameter: 'bmi',
    displayName: 'Body Mass Index (BMI)',
    dimension: 'clinical_index',
    canonicalUnit: 'kg/m²',
    compatibleUnits: ['kg/m²'],
    precision: 1,
    standardSource: 'WHO Adult Anthropometric Stratification: weight(kg) / [height(m)]²'
  }
};
