/**
 * Clinical reference ranges, diagnostic evaluation, and biomarker styling registry.
 * Grounded in standard clinical laboratory references and validated medical logic.
 */

export interface ClinicalReferenceRange {
  canonicalName: string;
  displayName: string;
  category: 'liver' | 'renal' | 'metabolic' | 'lipid' | 'hematology' | 'vitals';
  standardUnit: string;
  minNormal?: number;
  maxNormal?: number;
  lowAlertThreshold?: number;
  highAlertThreshold?: number;
  elevatedThreshold?: number;
  description: string;
  organSystem: string;
}

export const CLINICAL_REFERENCE_RANGES: Record<string, ClinicalReferenceRange> = {
  alt: {
    canonicalName: 'alt',
    displayName: 'ALT (SGPT)',
    category: 'liver',
    standardUnit: 'U/L',
    minNormal: 7,
    maxNormal: 40,
    elevatedThreshold: 41,
    highAlertThreshold: 56,
    description: 'Alanine Aminotransferase — Primary enzyme indicator of hepatocellular integrity and liver cell status.',
    organSystem: 'Liver & Hepatic System'
  },
  ast: {
    canonicalName: 'ast',
    displayName: 'AST (SGOT)',
    category: 'liver',
    standardUnit: 'U/L',
    minNormal: 10,
    maxNormal: 40,
    elevatedThreshold: 41,
    highAlertThreshold: 50,
    description: 'Aspartate Aminotransferase — Enzyme associated with liver parenchymal cells and cellular tissue turnover.',
    organSystem: 'Liver & Hepatic System'
  },
  creatinine: {
    canonicalName: 'creatinine',
    displayName: 'Creatinine',
    category: 'renal',
    standardUnit: 'mg/dL',
    minNormal: 0.70,
    maxNormal: 1.20,
    lowAlertThreshold: 0.50,
    highAlertThreshold: 1.30,
    description: 'Serum Creatinine — Breakdown byproduct of creatine phosphate in muscle, key marker of glomerular filtration rate (GFR).',
    organSystem: 'Renal & Kidney Function'
  },
  fasting_glucose: {
    canonicalName: 'fasting_glucose',
    displayName: 'Fasting Glucose',
    category: 'metabolic',
    standardUnit: 'mg/dL',
    minNormal: 70,
    maxNormal: 99,
    elevatedThreshold: 100, // 100-125 prediabetes
    highAlertThreshold: 126, // >=126 diabetes criteria
    lowAlertThreshold: 65,
    description: 'Fasting Blood Sugar — Core diagnostic metric for glycemic control, insulin sensitivity, and diabetes screening.',
    organSystem: 'Endocrine & Metabolic Function'
  },
  hdl: {
    canonicalName: 'hdl',
    displayName: 'HDL Cholesterol',
    category: 'lipid',
    standardUnit: 'mg/dL',
    minNormal: 40,
    maxNormal: 90,
    lowAlertThreshold: 40, // <40 is suboptimal
    description: 'High-Density Lipoprotein — "Protective" cholesterol transporting excess lipids from vascular walls back to the liver.',
    organSystem: 'Cardiovascular & Lipid Panel'
  },
  ldl: {
    canonicalName: 'ldl',
    displayName: 'LDL Cholesterol',
    category: 'lipid',
    standardUnit: 'mg/dL',
    minNormal: 0,
    maxNormal: 100,
    elevatedThreshold: 100,
    highAlertThreshold: 130,
    description: 'Low-Density Lipoprotein — Primary atherogenic lipoprotein circulating cholesterol to peripheral tissues.',
    organSystem: 'Cardiovascular & Lipid Panel'
  },
  total_cholesterol: {
    canonicalName: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    category: 'lipid',
    standardUnit: 'mg/dL',
    minNormal: 120,
    maxNormal: 200,
    elevatedThreshold: 200,
    highAlertThreshold: 240,
    description: 'Total Serum Cholesterol — Comprehensive measure of circulating sterols.',
    organSystem: 'Cardiovascular & Lipid Panel'
  },
  triglycerides: {
    canonicalName: 'triglycerides',
    displayName: 'Triglycerides',
    category: 'lipid',
    standardUnit: 'mg/dL',
    minNormal: 40,
    maxNormal: 150,
    elevatedThreshold: 150,
    highAlertThreshold: 200,
    description: 'Serum Triglycerides — Major storage form of circulating lipids and energy substrate.',
    organSystem: 'Cardiovascular & Lipid Panel'
  },
  hemoglobin: {
    canonicalName: 'hemoglobin',
    displayName: 'Hemoglobin',
    category: 'hematology',
    standardUnit: 'g/dL',
    minNormal: 13.0,
    maxNormal: 17.0,
    lowAlertThreshold: 12.0,
    highAlertThreshold: 17.5,
    description: 'Hemoglobin — Oxygen-carrying metalloprotein within circulating erythrocytes.',
    organSystem: 'Hematology & CBC'
  },
  hematocrit: {
    canonicalName: 'hematocrit',
    displayName: 'Hematocrit (PCV)',
    category: 'hematology',
    standardUnit: '%',
    minNormal: 38,
    maxNormal: 50,
    lowAlertThreshold: 36,
    highAlertThreshold: 52,
    description: 'Packed Cell Volume — Proportion of blood volume occupied by red blood cells.',
    organSystem: 'Hematology & CBC'
  },
  platelets: {
    canonicalName: 'platelets',
    displayName: 'Platelet Count',
    category: 'hematology',
    standardUnit: 'lakh/µL',
    minNormal: 1.5,
    maxNormal: 4.5,
    lowAlertThreshold: 1.4,
    highAlertThreshold: 4.8,
    description: 'Thrombocyte Count — Cellular fragments critical for primary hemostasis and coagulation.',
    organSystem: 'Hematology & CBC'
  },
  rbc: {
    canonicalName: 'rbc',
    displayName: 'RBC Count',
    category: 'hematology',
    standardUnit: 'million/µL',
    minNormal: 4.5,
    maxNormal: 5.9,
    lowAlertThreshold: 4.2,
    highAlertThreshold: 6.2,
    description: 'Red Blood Cell Count — Absolute concentration of circulating erythrocytes.',
    organSystem: 'Hematology & CBC'
  },
  wbc: {
    canonicalName: 'wbc',
    displayName: 'Total WBC Count',
    category: 'hematology',
    standardUnit: '/µL',
    minNormal: 4000,
    maxNormal: 11000,
    lowAlertThreshold: 3800,
    highAlertThreshold: 11500,
    description: 'White Blood Cell Count — Comprehensive immune and immune-surveillance cellular count.',
    organSystem: 'Hematology & CBC'
  },
  blood_pressure: {
    canonicalName: 'blood_pressure',
    displayName: 'Blood Pressure',
    category: 'vitals',
    standardUnit: 'mmHg',
    minNormal: 90,
    maxNormal: 120,
    elevatedThreshold: 121,
    highAlertThreshold: 130,
    description: 'Systemic Arterial Pressure — Hemodynamic vascular force recorded across cardiac cycles.',
    organSystem: 'Cardiovascular Hemodynamics'
  }
};

export interface ClinicalEvaluation {
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'ELEVATED' | 'INSUFFICIENT' | 'REVIEW';
  statusLabel: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    icon: string;
  };
  referenceRangeText: string;
  explanation: string;
}

/**
 * Normalizes parameter string to look up standard metadata
 */
export function normalizeParamKey(raw: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();

  // Multi-word / specific checks first before generic substrings!
  if (lower.includes('fasting') || lower.includes('glucose') || lower.includes('blood sugar') || lower.includes('sugar') || lower.includes('fbs') || lower.includes('rbs')) {
    return 'fasting_glucose';
  }
  if (lower.includes('hdl')) return 'hdl';
  if (lower.includes('ldl')) return 'ldl';
  if (lower.includes('total cholesterol') || (lower.includes('total') && lower.includes('cholesterol'))) {
    return 'total_cholesterol';
  }
  if (lower.includes('triglyceride')) return 'triglycerides';
  if (lower.includes('cholesterol')) return 'total_cholesterol';
  if (lower.includes('creatinine')) return 'creatinine';
  if (lower.includes('alt') || lower.includes('sgpt')) return 'alt';
  if (lower.includes('sgot') || lower.startsWith('ast') || lower.includes('(sgot)') || /\bast\b/.test(lower)) {
    return 'ast';
  }
  if (lower.includes('hemoglobin') || lower.includes('hb') || lower.includes('hgb')) return 'hemoglobin';
  if (lower.includes('hematocrit') || lower.includes('pcv')) return 'hematocrit';
  if (lower.includes('platelet')) return 'platelets';
  if (lower.includes('wbc') || lower.includes('leukocyte')) return 'wbc';
  if (lower.includes('rbc') || lower.includes('erythrocyte')) return 'rbc';
  if (lower.includes('blood pressure') || lower.includes('bp')) return 'blood_pressure';
  if (lower.includes('bmi')) return 'bmi';
  if (lower.includes('weight')) return 'weight';
  if (lower.includes('height')) return 'height';
  return lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Determine clinical status using lab source text, reference ranges, and numerical values
 */
export function evaluateBiomarkerStatus(
  parameterName: string,
  numericValue: number | null,
  unit?: string,
  sourceText?: string | null
): ClinicalEvaluation {
  const normKey = normalizeParamKey(parameterName);
  const ref = CLINICAL_REFERENCE_RANGES[normKey];
  const sourceUpper = (sourceText || '').toUpperCase();

  // 1. First priority: Explicit lab notes/flags on the authenticated laboratory document
  if (sourceUpper.includes('HIGH') || sourceUpper.includes('ABNORMAL HIGH') || sourceUpper.includes('CRITICAL HIGH')) {
    return {
      status: 'HIGH',
      statusLabel: 'HIGH',
      badgeStyle: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200/90',
        icon: '!'
      },
      referenceRangeText: ref ? `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}` : 'Lab flag',
      explanation: 'Result exceeds laboratory standard physiological upper limit.'
    };
  }

  if (sourceUpper.includes('LOW') || sourceUpper.includes('ABNORMAL LOW')) {
    return {
      status: 'LOW',
      statusLabel: 'LOW',
      badgeStyle: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200/90',
        icon: '↓'
      },
      referenceRangeText: ref ? `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}` : 'Lab flag',
      explanation: 'Result is below laboratory physiological lower boundary.'
    };
  }

  if (sourceUpper.includes('ELEVATED') || sourceUpper.includes('BORDERLINE')) {
    return {
      status: 'ELEVATED',
      statusLabel: 'ELEVATED',
      badgeStyle: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200/90',
        icon: '!'
      },
      referenceRangeText: ref ? `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}` : 'Lab flag',
      explanation: 'Biomarker is mildly elevated above baseline target threshold.'
    };
  }

  // 2. Numerical evaluation against validated clinical reference ranges
  if (numericValue !== null && !isNaN(numericValue) && ref) {
    // High alert check
    if (ref.highAlertThreshold !== undefined && numericValue >= ref.highAlertThreshold) {
      return {
        status: 'HIGH',
        statusLabel: 'HIGH',
        badgeStyle: {
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200/90',
          icon: '!'
        },
        referenceRangeText: `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}`,
        explanation: `Observed value (${numericValue}) exceeds healthy threshold of ${ref.maxNormal} ${ref.standardUnit}.`
      };
    }

    // Elevated check (e.g. glucose 100-125 prediabetes)
    if (ref.elevatedThreshold !== undefined && numericValue >= ref.elevatedThreshold) {
      return {
        status: 'ELEVATED',
        statusLabel: 'ELEVATED',
        badgeStyle: {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200/90',
          icon: '!'
        },
        referenceRangeText: `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}`,
        explanation: `Observed value (${numericValue}) is in elevated/borderline range.`
      };
    }

    // Low alert check
    if (ref.lowAlertThreshold !== undefined && numericValue < ref.lowAlertThreshold) {
      return {
        status: 'LOW',
        statusLabel: 'LOW',
        badgeStyle: {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200/90',
          icon: '↓'
        },
        referenceRangeText: `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}`,
        explanation: `Observed value (${numericValue}) is below target threshold of ${ref.minNormal} ${ref.standardUnit}.`
      };
    }

    // Normal range check
    const isAboveMin = ref.minNormal === undefined || numericValue >= ref.minNormal;
    const isBelowMax = ref.maxNormal === undefined || numericValue <= ref.maxNormal;

    if (isAboveMin && isBelowMax) {
      return {
        status: 'NORMAL',
        statusLabel: 'NORMAL',
        badgeStyle: {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200/90',
          icon: '✔'
        },
        referenceRangeText: `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}`,
        explanation: `Within clinical reference range (${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}).`
      };
    }
  }

  // 3. Fallback when data or ranges are indeterminate
  if (numericValue === null || isNaN(numericValue)) {
    return {
      status: 'INSUFFICIENT',
      statusLabel: 'INSUFFICIENT DATA',
      badgeStyle: {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        icon: '?'
      },
      referenceRangeText: 'Reference unavailable',
      explanation: 'Numerical measurement could not be extracted.'
    };
  }

  return {
    status: 'REVIEW',
    statusLabel: 'REVIEW',
    badgeStyle: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: '?'
    },
    referenceRangeText: ref ? `${ref.minNormal ?? 0}–${ref.maxNormal} ${ref.standardUnit}` : 'Standard Lab Range',
    explanation: 'Value requires physician context or custom demographic adjustment.'
  };
}

export interface ChangeAnalysis {
  diff: number;
  formattedDiff: string;
  firstValueStr: string;
  latestValueStr: string;
  bracketText: string;
  interpretationText: string;
  direction: 'stable' | 'increased' | 'decreased';
  iconType: 'minus' | 'up' | 'down';
}

/**
 * Calculates precise absolute change, bracket string, and interpretation text
 */
export function calculateBiomarkerChange(
  firstVal: number | null,
  latestVal: number | null,
  parameterName: string
): ChangeAnalysis {
  if (firstVal === null || latestVal === null || isNaN(firstVal) || isNaN(latestVal)) {
    return {
      diff: 0,
      formattedDiff: '0',
      firstValueStr: '—',
      latestValueStr: '—',
      bracketText: 'No comparative baseline',
      interpretationText: 'Single observation recorded',
      direction: 'stable',
      iconType: 'minus'
    };
  }

  const diff = latestVal - firstVal;
  
  // Format based on decimal precision of the numbers
  const decimals = Math.max(
    countDecimals(firstVal),
    countDecimals(latestVal)
  );

  const formattedDiff = Math.abs(diff) < 0.00001
    ? '0'
    : (diff > 0 ? `+${diff.toFixed(decimals)}` : `${diff.toFixed(decimals)}`);

  const firstStr = firstVal.toFixed(decimals);
  const latestStr = latestVal.toFixed(decimals);
  const bracketText = `${formattedDiff} (${firstStr} → ${latestStr})`;

  // Direction interpretation
  if (Math.abs(diff) < 0.00001) {
    return {
      diff,
      formattedDiff,
      firstValueStr: firstStr,
      latestValueStr: latestStr,
      bracketText,
      interpretationText: 'No significant change',
      direction: 'stable',
      iconType: 'minus'
    };
  }

  if (diff < 0) {
    const isSmallChange = Math.abs(diff) / (firstVal || 1) < 0.05;
    return {
      diff,
      formattedDiff,
      firstValueStr: firstStr,
      latestValueStr: latestStr,
      bracketText,
      interpretationText: isSmallChange ? 'Slight decrease' : 'Decreased',
      direction: 'decreased',
      iconType: 'down'
    };
  }

  const isSmallIncrease = Math.abs(diff) / (firstVal || 1) < 0.05;
  return {
    diff,
    formattedDiff,
    firstValueStr: firstStr,
    latestValueStr: latestStr,
    bracketText,
    interpretationText: isSmallIncrease ? 'Slight increase' : 'Increased',
    direction: 'increased',
    iconType: 'up'
  };
}

function countDecimals(val: number): number {
  if (Math.floor(val) === val) return 0;
  const str = val.toString();
  if (str.indexOf('.') !== -1) {
    return Math.min(2, str.split('.')[1].length);
  }
  return 0;
}

export interface MetricVisualTheme {
  primaryColor: string;
  chartColor: string;
  iconBg: string;
  iconColor: string;
  cardBorderHover: string;
  gradientFrom: string;
  gradientTo: string;
  topAccentLine: string;
}

export function getMetricVisualTheme(parameterName: string): MetricVisualTheme {
  const normKey = normalizeParamKey(parameterName);

  switch (normKey) {
    case 'alt':
    case 'ast':
      return {
        primaryColor: '#EF4444',
        chartColor: '#EF4444',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-500',
        cardBorderHover: 'hover:border-rose-200',
        gradientFrom: '#EF4444',
        gradientTo: 'rgba(239, 68, 68, 0.02)',
        topAccentLine: 'bg-rose-500/20'
      };
    case 'creatinine':
      return {
        primaryColor: '#10B981',
        chartColor: '#10B981',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-500',
        cardBorderHover: 'hover:border-emerald-200',
        gradientFrom: '#10B981',
        gradientTo: 'rgba(16, 185, 129, 0.02)',
        topAccentLine: 'bg-emerald-500/20'
      };
    case 'fasting_glucose':
      return {
        primaryColor: '#F59E0B',
        chartColor: '#F59E0B',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        cardBorderHover: 'hover:border-amber-200',
        gradientFrom: '#F59E0B',
        gradientTo: 'rgba(245, 158, 11, 0.02)',
        topAccentLine: 'bg-amber-500/20'
      };
    case 'hdl':
      return {
        primaryColor: '#8B5CF6',
        chartColor: '#8B5CF6',
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-500',
        cardBorderHover: 'hover:border-purple-200',
        gradientFrom: '#8B5CF6',
        gradientTo: 'rgba(139, 92, 246, 0.02)',
        topAccentLine: 'bg-purple-500/20'
      };
    case 'ldl':
    case 'total_cholesterol':
    case 'triglycerides':
      return {
        primaryColor: '#6366F1',
        chartColor: '#6366F1',
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-500',
        cardBorderHover: 'hover:border-indigo-200',
        gradientFrom: '#6366F1',
        gradientTo: 'rgba(99, 102, 241, 0.02)',
        topAccentLine: 'bg-indigo-500/20'
      };
    case 'hemoglobin':
    case 'hematocrit':
    case 'rbc':
      return {
        primaryColor: '#E11D48',
        chartColor: '#E11D48',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-500',
        cardBorderHover: 'hover:border-rose-200',
        gradientFrom: '#E11D48',
        gradientTo: 'rgba(225, 29, 72, 0.02)',
        topAccentLine: 'bg-rose-500/20'
      };
    case 'wbc':
      return {
        primaryColor: '#0284C7',
        chartColor: '#0284C7',
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-500',
        cardBorderHover: 'hover:border-sky-200',
        gradientFrom: '#0284C7',
        gradientTo: 'rgba(2, 132, 199, 0.02)',
        topAccentLine: 'bg-sky-500/20'
      };
    case 'platelets':
      return {
        primaryColor: '#D97706',
        chartColor: '#D97706',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        cardBorderHover: 'hover:border-amber-200',
        gradientFrom: '#D97706',
        gradientTo: 'rgba(217, 119, 6, 0.02)',
        topAccentLine: 'bg-amber-500/20'
      };
    default:
      return {
        primaryColor: '#64748B',
        chartColor: '#64748B',
        iconBg: 'bg-slate-50',
        iconColor: 'text-slate-500',
        cardBorderHover: 'hover:border-slate-300',
        gradientFrom: '#64748B',
        gradientTo: 'rgba(100, 116, 139, 0.02)',
        topAccentLine: 'bg-slate-500/20'
      };
  }
}

export function getYAxisConfig(parameterName: string) {
  const norm = normalizeParamKey(parameterName);
  switch (norm) {
    case 'alt':
    case 'ast':
      return { domain: [0, 30], ticks: [0, 10, 20, 30] };
    case 'creatinine':
      return { domain: [0, 1.2], ticks: [0, 0.4, 0.8, 1.2] };
    case 'fasting_glucose':
      return { domain: [0, 120], ticks: [0, 40, 80, 120] };
    case 'hdl':
      return { domain: [0, 80], ticks: [0, 20, 40, 60, 80] };
    case 'ldl':
    case 'total_cholesterol':
      return { domain: [0, 240], ticks: [0, 80, 160, 240] };
    case 'triglycerides':
      return { domain: [0, 200], ticks: [0, 50, 100, 150, 200] };
    case 'hemoglobin':
      return { domain: [0, 20], ticks: [0, 5, 10, 15, 20] };
    case 'hematocrit':
      return { domain: [0, 60], ticks: [0, 20, 40, 60] };
    case 'platelets':
      return { domain: [0, 5], ticks: [0, 1, 2, 3, 4, 5] };
    case 'rbc':
      return { domain: [0, 7], ticks: [0, 2, 4, 6] };
    case 'wbc':
      return { domain: [0, 12000], ticks: [0, 4000, 8000, 12000] };
    default:
      return { domain: ['auto', 'auto'], ticks: undefined };
  }
}

