/**
 * Centralized, clinically grounded Unit Conversion and Harmonization Registry
 * Bridges legacy analytics imports to the centralized engine in src/lib/units.
 */

import { 
  CLINICAL_PARAMETER_RULES, 
  sanitizeUnit, 
  convertToCanonicalUnit as centralConvertToCanonicalUnit 
} from '../lib/units';

export interface CanonicalParamMeta {
  canonicalName: string;
  displayName: string;
  canonicalUnit: string;
  supportedUnits: string[];
}

/**
 * Authoritative Canonical Parameters Dictionary derived from the Central Unit Registry
 */
export const CANONICAL_PARAMETERS: Record<string, CanonicalParamMeta> = Object.fromEntries(
  Object.entries(CLINICAL_PARAMETER_RULES).map(([key, rule]) => [
    key,
    {
      canonicalName: rule.parameter,
      displayName: rule.displayName,
      canonicalUnit: rule.canonicalUnit,
      supportedUnits: rule.compatibleUnits
    }
  ])
);

export interface ConversionResult {
  success: boolean;
  convertedValue: number | null;
  canonicalUnit: string;
  originalUnit: string;
  conversionApplied: string;
  error?: string;
}

export { sanitizeUnit };

/**
 * Convert a value from its reported unit to the canonical unit of the parameter.
 * Delegates to the authoritative centralized engine in src/lib/units.
 */
export function convertToCanonicalUnit(
  canonicalParam: string,
  value: number,
  reportedUnit: string | null | undefined
): ConversionResult {
  return centralConvertToCanonicalUnit(canonicalParam, value, reportedUnit);
}
