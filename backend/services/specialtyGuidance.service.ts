import { db } from '../db/db.js';

export interface StructuredFinding {
  parameter: string;
  value: string;
  unit: string;
  status: string;
  statusVariant: 'high' | 'borderline' | 'normal' | 'low';
  date?: string;
  report?: string;
  trend?: string;
}

export interface StructuredEvidence {
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  explanation: string;
  findings: StructuredFinding[];
  whyRecommended: string[];
  ruleReference: string;
  sourceReport?: string;
  suggestedDiscussionPoints?: string[];
}

export interface SpecialtyGuidanceRecord {
  id: number;
  user_id: number;
  domain: string;
  suggested_specialty: string;
  evidence: string; // JSON string of StructuredEvidence or fallback text
  rule_version: string;
  created_at: string;
}

export interface HealthSnapshotStats {
  reportCount: number;
  measurementCount: number;
  parametersAnalyzed: number;
  abnormalResults: number;
  trendsToMonitor: number;
  specialtiesSuggested: number;
  lastUpdated: string;
  status: 'Analysis up to date' | 'Analysis needs refresh' | 'Analysis processing' | 'No medical data';
}

interface MeasurementRow {
  id: number;
  parameter: string;
  raw_value: string;
  normalized_value: string;
  unit: string;
  report_date: string;
  validation_status?: string;
  filename?: string;
}

function normalizeKey(param: string): string {
  const p = (param || '').toLowerCase().trim();
  if (p.includes('fasting') && p.includes('glucose')) return 'fasting_glucose';
  if (p.includes('glucose') || p.includes('sugar')) return 'fasting_glucose';
  if (p.includes('hba1c') || p.includes('glycated')) return 'hba1c';
  if (p.includes('tsh') || p.includes('thyroid')) return 'tsh';
  if (p.includes('ldl')) return 'ldl';
  if (p.includes('hdl')) return 'hdl';
  if (p.includes('total cholesterol') || p === 'cholesterol') return 'total_cholesterol';
  if (p.includes('triglyceride')) return 'triglycerides';
  if (p.includes('pressure') || p.includes('bp') || p.includes('blood_pressure')) return 'blood_pressure';
  if (p.includes('creatinine')) return 'creatinine';
  if (p.includes('egfr') || p.includes('gfr')) return 'egfr';
  if (p.includes('alt') || p.includes('sgpt')) return 'alt';
  if (p.includes('ast') || p.includes('sgot')) return 'ast';
  if (p.includes('hemoglobin') || p.includes('hb')) return 'hemoglobin';
  if (p.includes('wbc') || p.includes('leukocyte')) return 'wbc';
  if (p.includes('platelet')) return 'platelets';
  if (p.includes('rbc') || p.includes('erythrocyte')) return 'rbc';
  if (p.includes('hematocrit') || p.includes('pcv')) return 'hematocrit';
  return p;
}

function parseNumeric(val: string): number | null {
  if (!val) return null;
  const match = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

export async function calculateHealthSnapshot(userId: number): Promise<HealthSnapshotStats> {
  const reportsRes = await db.execute({
    sql: 'SELECT id, report_date, upload_date FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC',
    args: [userId]
  });

  const reports = reportsRes.rows;
  if (reports.length === 0) {
    return {
      reportCount: 0,
      measurementCount: 0,
      parametersAnalyzed: 0,
      abnormalResults: 0,
      trendsToMonitor: 0,
      specialtiesSuggested: 0,
      lastUpdated: new Date().toISOString(),
      status: 'No medical data'
    };
  }

  const measurementsRes = await db.execute({
    sql: `SELECT m.parameter, m.raw_value, m.normalized_value, m.unit, r.report_date
          FROM measurements m
          JOIN medical_reports r ON m.report_id = r.id
          WHERE r.user_id = ?
          ORDER BY r.report_date DESC`,
    args: [userId]
  });

  const measurements = measurementsRes.rows as unknown as MeasurementRow[];
  const uniqueParams = new Set<string>();
  let abnormalCount = 0;
  const paramDateCount: Record<string, Set<string>> = {};

  for (const m of measurements) {
    const key = normalizeKey(m.parameter);
    uniqueParams.add(key);

    if (!paramDateCount[key]) paramDateCount[key] = new Set();
    paramDateCount[key].add(m.report_date);

    const num = parseNumeric(m.normalized_value || m.raw_value);
    if (num !== null) {
      if (key === 'fasting_glucose' && (num >= 100 || num < 70)) abnormalCount++;
      else if (key === 'ldl' && num >= 130) abnormalCount++;
      else if (key === 'total_cholesterol' && num >= 200) abnormalCount++;
      else if (key === 'triglycerides' && num >= 150) abnormalCount++;
      else if (key === 'hdl' && num < 40) abnormalCount++;
      else if (key === 'creatinine' && num > 1.2) abnormalCount++;
      else if (key === 'alt' && num > 45) abnormalCount++;
      else if (key === 'ast' && num > 40) abnormalCount++;
      else if (key === 'hemoglobin' && (num < 12.0 || num > 17.5)) abnormalCount++;
      else if (key === 'wbc' && (num < 4000 || num > 11000)) abnormalCount++;
      else if (key === 'platelets' && (num < 1.5 || num > 4.5)) abnormalCount++;
    }
  }

  // Count trends (parameters observed on >= 2 distinct dates)
  let trendsCount = 0;
  for (const key in paramDateCount) {
    if (paramDateCount[key].size >= 2) trendsCount++;
  }

  const guidancesRes = await db.execute({
    sql: 'SELECT count(*) as count FROM specialty_guidance WHERE user_id = ?',
    args: [userId]
  });
  const specialtiesCount = Number(guidancesRes.rows[0]?.count || 0);

  const latestReport = reports[0];
  const lastUpdated = (latestReport?.report_date || latestReport?.upload_date || new Date().toISOString()) as string;

  return {
    reportCount: reports.length,
    measurementCount: measurements.length,
    parametersAnalyzed: uniqueParams.size,
    abnormalResults: abnormalCount,
    trendsToMonitor: trendsCount,
    specialtiesSuggested: specialtiesCount,
    lastUpdated,
    status: 'Analysis up to date'
  };
}

export async function generateSpecialtyGuidance(userId: number): Promise<SpecialtyGuidanceRecord[]> {
  // Fetch latest measurements
  const measurementsRes = await db.execute({
    sql: `SELECT m.*, r.filename, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? 
          ORDER BY r.report_date DESC`,
    args: [userId]
  });

  const measurements = measurementsRes.rows as unknown as MeasurementRow[];
  if (measurements.length === 0) {
    return [];
  }

  // Group latest value per normalized parameter
  const latestByParam: Record<string, MeasurementRow> = {};
  const historyByParam: Record<string, MeasurementRow[]> = {};

  for (const m of measurements) {
    const key = normalizeKey(m.parameter);
    if (!latestByParam[key]) {
      latestByParam[key] = m;
    }
    if (!historyByParam[key]) {
      historyByParam[key] = [];
    }
    historyByParam[key].push(m);
  }

  // Check risk assessment rows for elevated risks if present
  const riskRes = await db.execute({
    sql: 'SELECT domain, level, label, evidence FROM risk_assessment WHERE user_id = ?',
    args: [userId]
  });
  const risks = riskRes.rows;
  const riskByDomain: Record<string, any> = {};
  for (const r of risks) {
    riskByDomain[String(r.domain).toLowerCase()] = r;
  }

  const now = new Date().toISOString();
  const generatedRecords: SpecialtyGuidanceRecord[] = [];

  // Helper to build structured domain guidance
  const evaluateDomain = (domain: string, specialtyName: string, ruleRef: string) => {
    let hasRelevantData = false;
    let priority: 'High Priority' | 'Medium Priority' | 'Low Priority' = 'Low Priority';
    let explanation = '';
    const findings: StructuredFinding[] = [];
    let whyRecommended: string[] = [];
    let sourceReport = '';

    if (domain === 'cardiovascular') {
      const ldl = latestByParam['ldl'];
      const tc = latestByParam['total_cholesterol'];
      const hdl = latestByParam['hdl'];
      const tg = latestByParam['triglycerides'];
      const bp = latestByParam['blood_pressure'];

      if (ldl || tc || bp || hdl || tg) {
        hasRelevantData = true;
        sourceReport = ldl?.filename || tc?.filename || bp?.filename || '';
        explanation = 'Based on your cholesterol levels, blood pressure readings and cardiovascular risk indicators.';
        whyRecommended = [
          'Discuss cardiovascular risk assessment',
          'Consider lifestyle modifications',
          'Evaluate need for additional tests'
        ];

        let isElevated = false;
        let isBorderline = false;

        if (ldl) {
          const val = parseNumeric(ldl.normalized_value || ldl.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val >= 130) {
            status = 'High';
            statusVariant = 'high';
            isElevated = true;
          } else if (val !== null && val >= 100) {
            status = 'Optimal';
            statusVariant = 'normal';
          }
          findings.push({
            parameter: 'LDL Cholesterol',
            value: `${val !== null ? val : ldl.raw_value}`,
            unit: ldl.unit || 'mg/dL',
            status,
            statusVariant,
            date: ldl.report_date,
            report: ldl.filename
          });
        }

        if (bp) {
          const bpVal = bp.normalized_value || bp.raw_value;
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          const parts = bpVal.split('/');
          if (parts.length === 2) {
            const sys = parseInt(parts[0]);
            const dia = parseInt(parts[1]);
            if (sys >= 140 || dia >= 90) {
              status = 'High';
              statusVariant = 'high';
              isElevated = true;
            } else if (sys >= 130 || dia >= 85) {
              status = 'Borderline high';
              statusVariant = 'borderline';
              isBorderline = true;
            }
          }
          findings.push({
            parameter: 'Blood Pressure',
            value: bpVal,
            unit: bp.unit || 'mmHg',
            status,
            statusVariant,
            date: bp.report_date,
            report: bp.filename
          });
        }

        if (tc) {
          const val = parseNumeric(tc.normalized_value || tc.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val >= 200) {
            status = 'Elevated';
            statusVariant = 'high';
            isElevated = true;
          }
          findings.push({
            parameter: 'Total Cholesterol',
            value: `${val !== null ? val : tc.raw_value}`,
            unit: tc.unit || 'mg/dL',
            status,
            statusVariant,
            date: tc.report_date,
            report: tc.filename
          });
        }

        // Check cardiovascular risk level
        const cvRisk = riskByDomain['cardiovascular'];
        if (cvRisk && ['ORANGE', 'RED'].includes(String(cvRisk.level).toUpperCase())) {
          priority = 'High Priority';
        } else if (isElevated) {
          priority = 'High Priority';
        } else if (isBorderline || (cvRisk && cvRisk.level === 'YELLOW')) {
          priority = 'Medium Priority';
        } else {
          priority = 'Low Priority';
        }
      }
    } else if (domain === 'metabolic') {
      const glu = latestByParam['fasting_glucose'];
      const a1c = latestByParam['hba1c'];
      const tsh = latestByParam['tsh'];

      if (glu || a1c || tsh) {
        hasRelevantData = true;
        sourceReport = glu?.filename || a1c?.filename || '';
        explanation = 'Based on your glucose metabolism and thyroid indicators.';
        whyRecommended = [
          'Discuss glucose metabolism and diabetes risk',
          'Monitor glycemic stability and lifestyle factors',
          'Consider lifestyle and dietary changes'
        ];

        let isElevated = false;
        let isBorderline = false;

        if (glu) {
          const val = parseNumeric(glu.normalized_value || glu.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val >= 126) {
            status = 'High';
            statusVariant = 'high';
            isElevated = true;
          } else if (val !== null && val >= 100) {
            status = 'Borderline';
            statusVariant = 'borderline';
            isBorderline = true;
          }
          findings.push({
            parameter: 'Fasting Glucose',
            value: `${val !== null ? val : glu.raw_value}`,
            unit: glu.unit || 'mg/dL',
            status,
            statusVariant,
            date: glu.report_date,
            report: glu.filename
          });
        }

        if (a1c) {
          const val = parseNumeric(a1c.normalized_value || a1c.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val >= 6.5) {
            status = 'High';
            statusVariant = 'high';
            isElevated = true;
          } else if (val !== null && val >= 5.7) {
            status = 'Borderline';
            statusVariant = 'borderline';
            isBorderline = true;
          }
          findings.push({
            parameter: 'HbA1c',
            value: `${val !== null ? val : a1c.raw_value}`,
            unit: a1c.unit || '%',
            status,
            statusVariant,
            date: a1c.report_date,
            report: a1c.filename
          });
        }

        if (tsh) {
          const val = parseNumeric(tsh.normalized_value || tsh.raw_value);
          findings.push({
            parameter: 'TSH',
            value: `${val !== null ? val : tsh.raw_value}`,
            unit: tsh.unit || 'µIU/mL',
            status: 'Normal',
            statusVariant: 'normal',
            date: tsh.report_date,
            report: tsh.filename
          });
        }

        const metaRisk = riskByDomain['metabolic'];
        if (metaRisk && ['ORANGE', 'RED'].includes(String(metaRisk.level).toUpperCase())) {
          priority = 'High Priority';
        } else if (isElevated) {
          priority = 'High Priority';
        } else if (isBorderline || (metaRisk && metaRisk.level === 'YELLOW')) {
          priority = 'Medium Priority';
        } else {
          priority = 'Low Priority';
        }
      }
    } else if (domain === 'kidney-related') {
      const cr = latestByParam['creatinine'];
      const egfr = latestByParam['egfr'];

      if (cr || egfr) {
        hasRelevantData = true;
        sourceReport = cr?.filename || egfr?.filename || '';
        explanation = 'Based on your kidney function indicators.';
        whyRecommended = [
          'Monitor kidney function',
          'Maintain hydration and healthy lifestyle'
        ];

        let isElevated = false;
        let isBorderline = false;

        if (cr) {
          const val = parseNumeric(cr.normalized_value || cr.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val > 1.3) {
            status = 'Elevated';
            statusVariant = 'high';
            isElevated = true;
          } else if (val !== null && val >= 1.1) {
            status = 'Upper normal';
            statusVariant = 'borderline';
            isBorderline = true;
          }
          findings.push({
            parameter: 'Creatinine',
            value: `${val !== null ? val : cr.raw_value}`,
            unit: cr.unit || 'mg/dL',
            status,
            statusVariant,
            date: cr.report_date,
            report: cr.filename
          });
        }

        if (egfr) {
          const val = parseNumeric(egfr.normalized_value || egfr.raw_value);
          findings.push({
            parameter: 'eGFR',
            value: `${val !== null ? val : egfr.raw_value}`,
            unit: egfr.unit || 'mL/min',
            status: 'Normal',
            statusVariant: 'normal',
            date: egfr.report_date,
            report: egfr.filename
          });
        }

        if (isElevated) priority = 'High Priority';
        else if (isBorderline) priority = 'Medium Priority';
        else priority = 'Low Priority';
      }
    } else if (domain === 'hepatic') {
      const alt = latestByParam['alt'];
      const ast = latestByParam['ast'];

      if (alt || ast) {
        hasRelevantData = true;
        sourceReport = alt?.filename || ast?.filename || '';
        explanation = 'Based on your liver function tests and gastrointestinal indicators.';
        whyRecommended = [
          'Monitor liver function',
          'Discuss if you have related symptoms'
        ];

        let isElevated = false;
        if (alt) {
          const val = parseNumeric(alt.normalized_value || alt.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val > 55) {
            status = 'Elevated';
            statusVariant = 'high';
            isElevated = true;
          }
          findings.push({
            parameter: 'ALT (SGPT)',
            value: `${val !== null ? val : alt.raw_value}`,
            unit: alt.unit || 'U/L',
            status,
            statusVariant,
            date: alt.report_date,
            report: alt.filename
          });
        }

        if (ast) {
          const val = parseNumeric(ast.normalized_value || ast.raw_value);
          let status = 'Normal';
          let statusVariant: StructuredFinding['statusVariant'] = 'normal';
          if (val !== null && val > 50) {
            status = 'Elevated';
            statusVariant = 'high';
            isElevated = true;
          }
          findings.push({
            parameter: 'AST (SGOT)',
            value: `${val !== null ? val : ast.raw_value}`,
            unit: ast.unit || 'U/L',
            status,
            statusVariant,
            date: ast.report_date,
            report: ast.filename
          });
        }

        if (isElevated) priority = 'High Priority';
        else priority = 'Low Priority';
      }
    }

    if (hasRelevantData) {
      const evidenceObj: StructuredEvidence = {
        priority,
        explanation,
        findings,
        whyRecommended,
        ruleReference: ruleRef,
        sourceReport,
        suggestedDiscussionPoints: [
          `Review findings in ${specialtyName}`,
          'Discuss follow-up schedule and lifestyle factors'
        ]
      };

      return {
        domain,
        specialty: specialtyName,
        evidence: JSON.stringify(evidenceObj),
        rule_version: '1.0'
      };
    }

    return null;
  };

  // Evaluate the standard 4 primary clinical domains
  const domainConfigs = [
    { domain: 'cardiovascular', specialty: 'Cardiology', ruleRef: 'AHA/ACC Guidelines' },
    { domain: 'metabolic', specialty: 'Endocrinology', ruleRef: 'ADA Standards of Care' },
    { domain: 'kidney-related', specialty: 'Nephrology', ruleRef: 'KDIGO Guidelines' },
    { domain: 'hepatic', specialty: 'Gastroenterology', ruleRef: 'ACG Clinical Guidelines' }
  ];

  // Clear previous records for user
  await db.execute({
    sql: 'DELETE FROM specialty_guidance WHERE user_id = ?',
    args: [userId]
  });

  for (const cfg of domainConfigs) {
    const evaluated = evaluateDomain(cfg.domain, cfg.specialty, cfg.ruleRef);
    if (evaluated) {
      const insertRes = await db.execute({
        sql: `INSERT INTO specialty_guidance (user_id, domain, suggested_specialty, evidence, rule_version, created_at)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [userId, evaluated.domain, evaluated.specialty, evaluated.evidence, evaluated.rule_version, now]
      });
      generatedRecords.push(insertRes.rows[0] as unknown as SpecialtyGuidanceRecord);
    }
  }

  return generatedRecords;
}
