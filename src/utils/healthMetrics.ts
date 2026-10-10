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

/**
 * Calculates BMI and WHO adult classification
 * Formula: weightKg / (heightMeters * heightMeters)
 */
export function calculateBmi(
  heightCm?: number | null,
  weightKg?: number | null
): BmiResult {
  if (
    heightCm === undefined ||
    heightCm === null ||
    weightKg === undefined ||
    weightKg === null ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
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
  } else if (bmi < 25.0) {
    return {
      bmi,
      category: 'Normal',
      categoryColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
      description: 'Healthy adult weight range (18.5 – 24.9)',
      range: '18.5 – 24.9'
    };
  } else if (bmi < 30.0) {
    return {
      bmi,
      category: 'Overweight',
      categoryColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200',
      badgeText: 'text-amber-700',
      description: 'Above standard adult range (25.0 – 29.9)',
      range: '25.0 – 29.9'
    };
  } else {
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
}

/**
 * Converts centimeters to feet and rounded inches
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
 * Converts feet and inches to centimeters
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
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Converts pounds to kilograms
 */
export function lbToKg(lb: number | null | undefined): number | null {
  if (lb === undefined || lb === null || lb <= 0) return null;
  return Math.round((lb / 2.20462) * 10) / 10;
}

/**
 * Formats height for display given user's active unit preference
 */
export function formatHeightDisplay(
  heightCm: number | null | undefined,
  unit: 'cm' | 'ft' = 'cm'
): string {
  if (!heightCm || heightCm <= 0) return 'Not recorded';
  if (unit === 'ft') {
    const { feet, inches } = cmToFtIn(heightCm);
    return `${feet} ft ${inches} in`;
  }
  return `${heightCm} cm`;
}

/**
 * Formats weight for display given user's active unit preference
 */
export function formatWeightDisplay(
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb' = 'kg'
): string {
  if (!weightKg || weightKg <= 0) return 'Not recorded';
  if (unit === 'lb') {
    const lb = kgToLb(weightKg);
    return `${lb} lb`;
  }
  return `${weightKg} kg`;
}
