/**
 * Universal Health Metrics Utilities for MediTrack
 * - Age calculation from DOB
 * - BMI calculation & WHO Adult Category stratification
 * - Unit conversions (cm <-> ft/in, kg <-> lb)
 * - Controlled clinical options (Gender, Blood Group, Relationship)
 */

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say'
] as const;

export const BLOOD_GROUP_OPTIONS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown'
] as const;

export const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Relative',
  'Guardian',
  'Other'
] as const;

export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obesity';

export interface BmiResult {
  bmi: number | null;
  category: BmiCategory | null;
  categoryColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  range: string;
}

/**
 * Calculates current age dynamically based on Date of Birth.
 * Automatically increments when birthday passes.
 */
export function calculateAge(dobString?: string | null): number | null {
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 && age <= 125 ? age : null;
}

/**
 * Formats a Date of Birth string (YYYY-MM-DD) into human-readable clinical format:
 * e.g., "15 Aug 2003"
 */
export function formatDobDisplay(dobString?: string | null): string {
  if (!dobString) return 'Not recorded';
  const parts = dobString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return dobString;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export {
  calculateBmi,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  formatHeightDisplay,
  formatWeightDisplay,
  formatTemperatureDisplay
} from '../lib/units';

