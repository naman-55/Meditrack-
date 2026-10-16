/**
 * MediTrack Universal Unit Conversion System - Type Definitions
 * Authoritative types for scientific and clinical unit transformations.
 */

export type MeasurementDimension =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'volume'
  | 'pressure'
  | 'frequency'
  | 'analyte_concentration'
  | 'proportion'
  | 'enzymatic_activity'
  | 'cell_count'
  | 'substance_ratio'
  | 'clinical_index';

export interface UnitDefinition {
  /** Unique stable identifier (e.g., 'mg_dl', 'mmol_l', 'celsius') */
  id: string;
  /** Primary display symbol (e.g., 'mg/dL', 'mmol/L', '°C') */
  symbol: string;
  /** Full descriptive name (e.g., 'Milligrams per deciliter') */
  name: string;
  /** Physical or scientific dimension */
  dimension: MeasurementDimension;
  /** System of measurement (e.g., 'SI', 'US_CUSTOMARY', 'IMPERIAL', 'CLINICAL') */
  system: 'SI' | 'US_CUSTOMARY' | 'IMPERIAL' | 'CLINICAL' | 'CONVENTIONAL';
  /** Alternative representations and aliases encountered in OCR / lab documents */
  aliases: string[];
  /** Default display decimal places */
  defaultDecimals: number;
  /** Whether negative values are physically meaningful (e.g., false for mass, length; true for Celsius) */
  allowNegative: boolean;
  /** Lower bound where physically impossible (e.g., 0 K for temperature, 0 for concentrations) */
  physicalMinimum?: number;
}

export interface ParameterUnitRule {
  /** Canonical parameter key (e.g., 'fasting_glucose', 'creatinine') */
  parameter: string;
  /** Clinically friendly display name */
  displayName: string;
  /** Measurement dimension */
  dimension: MeasurementDimension;
  /** Authoritative internal/canonical unit */
  canonicalUnit: string;
  /** List of valid, clinically convertible units */
  compatibleUnits: string[];
  /** Default display precision */
  precision: number;
  /** Analyte-specific molecular weight (g/mol) if applicable */
  molarMass?: number;
  /** Clinical justification or authoritative standard source */
  standardSource?: string;
}

export interface ConversionOptions {
  /** Target decimal precision for rounding (undefined leaves unrounded) */
  precision?: number;
  /** Canonical parameter key to apply analyte-specific rules */
  parameter?: string;
  /** Whether to strictly enforce physical constraints (e.g., >= 0) */
  strict?: boolean;
}

export interface ConversionResult {
  /** Whether conversion succeeded */
  success: boolean;
  /** Converted numerical value (null if failed) */
  value: number | null;
  /** Source unit symbol */
  fromUnit: string;
  /** Target unit symbol */
  toUnit: string;
  /** Parameter context used, if any */
  parameter?: string;
  /** Mathematical formula applied in human-readable notation */
  formula: string;
  /** Specific conversion factor or offset applied */
  factorOrOffset?: number | string;
  /** Explanatory warning or failure reason */
  error?: string;
}

export interface BloodPressureConversionResult {
  success: boolean;
  systolic: number | null;
  diastolic: number | null;
  formatted: string;
  fromUnit: string;
  toUnit: string;
  error?: string;
}

export interface ReferenceRangeConversionResult {
  success: boolean;
  minNormal?: number;
  maxNormal?: number;
  formattedRange: string;
  fromUnit: string;
  toUnit: string;
  parameter?: string;
  error?: string;
}
