export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AbnormalFinding {
  parameter: string;
  measuredValue: string | number;
  unit: string;
  referenceRange: string;
  status: 'High' | 'Low' | 'Critical' | 'Borderline';
  clinicalNote?: string;
}

export interface HistoricalComparison {
  parameter: string;
  previousDate: string;
  previousValue: string;
  currentValue: string;
  changeDirection: 'increased' | 'decreased' | 'stable';
}

export interface CanonicalHealthSummary {
  alertId: number | string;
  patientId: string;
  patientName: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  mainReason: string;
  riskClassification?: {
    domain: string;
    level: string;
    label: string;
    score?: number;
  };
  abnormalFindings: AbnormalFinding[];
  historicalChanges: HistoricalComparison[];
  documentedRiskFactors: string[];
  explanation: string;
  limitations: string;
  recommendedActions: string[];
  secureLink: string;
  disclaimer: string;
}

export const MEDICAL_DISCLAIMER =
  'MediTrack Automated Notice: This software-generated risk assessment is compiled for authorized informational and coordination purposes. It is not a clinical diagnosis or medical treatment plan. In case of a medical emergency, please contact local emergency services immediately.';

/**
 * Formats a mobile-friendly, accessible HTML email containing the complete health alert summary.
 */
export function formatEmailHtml(summary: CanonicalHealthSummary): string {
  const severityColors: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: '#FEF2F2', text: '#991B1B', border: '#F87171' },
    HIGH: { bg: '#FFF7ED', text: '#9A3412', border: '#FB923C' },
    MODERATE: { bg: '#FEFCE8', text: '#854D0E', border: '#FACC15' },
    LOW: { bg: '#F0FDF4', text: '#166534', border: '#4ADE80' }
  };

  const currentTheme = severityColors[summary.severity] || severityColors.MODERATE;

  const findingsRows = summary.abnormalFindings.length > 0
    ? summary.abnormalFindings.map(f => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">${escapeHtml(f.parameter)}</td>
        <td style="padding: 10px 12px; color: #0F172A; font-weight: 700;">${escapeHtml(String(f.measuredValue))} ${escapeHtml(f.unit)}</td>
        <td style="padding: 10px 12px; color: #64748B;">${escapeHtml(f.referenceRange || 'Standard')}</td>
        <td style="padding: 10px 12px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${f.status === 'Critical' || f.status === 'High' ? '#FEE2E2' : '#FEF3C7'}; color: ${f.status === 'Critical' || f.status === 'High' ? '#991B1B' : '#92400E'};">
            ${escapeHtml(f.status)}
          </span>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" style="padding: 12px; color: #64748B; text-align: center;">No individual abnormal lab values extracted for this alert.</td></tr>';

  const historySection = summary.historicalChanges.length > 0
    ? `
      <div style="margin-top: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Comparison with Previous Reports</h4>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
          ${summary.historicalChanges.map(h => `
            <li><strong>${escapeHtml(h.parameter)}</strong> changed from ${escapeHtml(h.previousValue)} (${escapeHtml(h.previousDate)}) to <strong>${escapeHtml(h.currentValue)}</strong> (${escapeHtml(h.changeDirection)}).</li>
          `).join('')}
        </ul>
      </div>
    `
    : '';

  const actionsList = summary.recommendedActions.length > 0
    ? summary.recommendedActions.map(a => `<li style="margin-bottom: 6px;">${escapeHtml(a)}</li>`).join('')
    : '<li>Review authorized health record in MediTrack and consult your physician.</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediTrack Health Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1E293B; background-color: #F8FAFC; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: #0F172A; padding: 20px 24px; text-align: left;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #10B981; font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">MediTrack</span>
        <span style="color: #94A3B8; font-size: 12px;">Alert #${escapeHtml(String(summary.alertId))}</span>
      </div>
    </div>

    <!-- Severity Banner -->
    <div style="background-color: ${currentTheme.bg}; border-left: 5px solid ${currentTheme.border}; padding: 16px 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${currentTheme.text};">
          ${summary.severity} PRIORITY HEALTH ALERT
        </span>
        <span style="color: #64748B; font-size: 12px;">${escapeHtml(new Date(summary.timestamp).toLocaleString())}</span>
      </div>
      <h2 style="margin: 8px 0 4px 0; font-size: 18px; color: #0F172A;">${escapeHtml(summary.title)}</h2>
      <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Patient:</strong> ${escapeHtml(summary.patientName)} (${escapeHtml(summary.patientId)})</p>
    </div>

    <!-- Content Body -->
    <div style="padding: 24px;">
      
      <!-- Main Reason -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 6px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Summary of Reason</h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1E293B; background: #F1F5F9; padding: 12px 14px; border-radius: 8px;">
          ${escapeHtml(summary.mainReason)}
        </p>
      </div>

      <!-- Abnormal Findings Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Clinically Relevant Findings</h3>
        <div style="overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; color: #475569;">
                <th style="padding: 10px 12px; font-weight: 600;">Biomarker</th>
                <th style="padding: 10px 12px; font-weight: 600;">Value</th>
                <th style="padding: 10px 12px; font-weight: 600;">Reference</th>
                <th style="padding: 10px 12px; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${findingsRows}
            </tbody>
          </table>
        </div>
      </div>

      ${historySection}

      <!-- System Explanation & Limitations -->
      <div style="margin-top: 20px; padding: 12px 14px; background: #FAF5FF; border-radius: 8px; border: 1px solid #E9D5FF;">
        <h4 style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #6B21A8; letter-spacing: 0.5px;">System Assessment & Notes</h4>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #3B0764; line-height: 1.5;">${escapeHtml(summary.explanation)}</p>
        ${summary.limitations ? `<p style="margin: 0; font-size: 11px; color: #7E22CE; font-style: italic;">Note: ${escapeHtml(summary.limitations)}</p>` : ''}
      </div>

      <!-- Recommended Follow-up Actions -->
      <div style="margin-top: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Recommended Follow-up Actions</h3>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #1E293B;">
          ${actionsList}
        </ol>
      </div>

      <!-- Secure CTA Link -->
      <div style="margin-top: 28px; text-align: center;">
        <a href="${escapeHtml(summary.secureLink)}" style="display: inline-block; background: #059669; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);">
          View Complete Authorized Report &rarr;
        </a>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748B;">Requires authorized sign-in to MediTrack.</p>
      </div>

    </div>

    <!-- Medical Disclaimer & Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; font-size: 11px; color: #64748B; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;"><strong>Medical Disclaimer:</strong> ${escapeHtml(summary.disclaimer)}</p>
      <p style="margin: 0;">Sent by MediTrack Trusted Contact Alert Network. To adjust notification preferences, visit your account settings.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Formats a plain-text alternative of the complete health alert summary.
 */
export function formatEmailText(summary: CanonicalHealthSummary): string {
  const findings = summary.abnormalFindings.length > 0
    ? summary.abnormalFindings.map(f => `  - ${f.parameter}: ${f.measuredValue} ${f.unit} (Ref: ${f.referenceRange || 'Standard'}) [${f.status}]`).join('\n')
    : '  - None extracted';

  const history = summary.historicalChanges.length > 0
    ? '\nHISTORICAL COMPARISON:\n' + summary.historicalChanges.map(h => `  - ${h.parameter}: was ${h.previousValue} on ${h.previousDate}, now ${h.currentValue} (${h.changeDirection})`).join('\n')
    : '';

  const actions = summary.recommendedActions.length > 0
    ? summary.recommendedActions.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
    : '  1. Review health record and consult physician';

  return `
[MEDITRACK] ${summary.severity} HEALTH ALERT
Alert ID: #${summary.alertId}
Date/Time: ${new Date(summary.timestamp).toLocaleString()}
Patient: ${summary.patientName} (${summary.patientId})

MAIN REASON:
${summary.mainReason}

CLINICALLY RELEVANT FINDINGS:
${findings}
${history}

ASSESSMENT:
${summary.explanation}
${summary.limitations ? `Limitations: ${summary.limitations}\n` : ''}
RECOMMENDED ACTIONS:
${actions}

FULL AUTHORIZED SUMMARY & REPORT:
${summary.secureLink}

---
DISCLAIMER:
${summary.disclaimer}
  `.trim();
}

/**
 * Formats a concise, clinically meaningful, and HTML-safe Telegram message.
 * Respects Telegram's 4096 character limit and escapes all special HTML entities.
 */
export function formatTelegram(summary: CanonicalHealthSummary): string {
  const severityEmojis: Record<AlertSeverity, string> = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MODERATE: 'ℹ️',
    LOW: '📋'
  };

  const emoji = severityEmojis[summary.severity] || '⚠️';
  const formattedTime = new Date(summary.timestamp).toLocaleString();

  // Top abnormal findings (up to 4 to stay clean and concise)
  let findingsSection = '';
  if (summary.abnormalFindings && summary.abnormalFindings.length > 0) {
    const topFindings = summary.abnormalFindings.slice(0, 4);
    const findingLines = topFindings.map(f => {
      const ref = f.referenceRange ? ` (Ref: ${escapeHtml(f.referenceRange)})` : '';
      return `• <b>${escapeHtml(f.parameter)}:</b> <code>${escapeHtml(String(f.measuredValue))} ${escapeHtml(f.unit)}</code>${ref} — <i>${escapeHtml(f.status)}</i>`;
    });

    if (summary.abnormalFindings.length > 4) {
      findingLines.push(`• <i>+ ${summary.abnormalFindings.length - 4} additional finding(s) in complete record</i>`);
    }
    findingsSection = `\n<b>Key Findings:</b>\n${findingLines.join('\n')}\n`;
  }

  // Recommended actions (top 2)
  let actionsSection = '';
  if (summary.recommendedActions && summary.recommendedActions.length > 0) {
    const topActions = summary.recommendedActions.slice(0, 2);
    actionsSection = `\n<b>Recommended Next Steps:</b>\n${topActions.map((a, i) => `${i + 1}. ${escapeHtml(a)}`).join('\n')}\n`;
  }

  return (
    `${emoji} <b>${summary.severity} HEALTH ALERT</b> — <b>Patient ${escapeHtml(summary.patientId)}</b>\n` +
    `<i>Recorded: ${escapeHtml(formattedTime)}</i>\n\n` +
    `<b>Reason:</b> ${escapeHtml(summary.mainReason)}\n` +
    findingsSection +
    actionsSection +
    `\n🔗 <a href="${escapeHtml(summary.secureLink)}">View Authorized Report in MediTrack</a>\n\n` +
    `<i>Notice: Automated analysis pending physician review. In an emergency, call emergency services.</i>`
  );
}

/**
 * Formats one concise SMS message with the highest-priority findings and secure link.
 */
export function formatSms(summary: CanonicalHealthSummary): string {
  const topFindings = summary.abnormalFindings.slice(0, 2).map(f => `${f.parameter} ${f.measuredValue} ${f.unit}`).join(', ');
  const findingsText = topFindings ? ` Key findings: ${topFindings}.` : '';
  const topAction = summary.recommendedActions[0] || 'Prompt clinical review advised.';

  // Standard concise SMS format
  return `MediTrack | ${summary.severity} alert for Patient ${summary.patientId} at ${formatTimeShort(summary.timestamp)}.${findingsText} ${topAction} Full authorized summary: ${summary.secureLink}`;
}

/**
 * Formats a privacy-conscious push notification payload.
 */
export function formatPush(summary: CanonicalHealthSummary): { title: string; body: string; data: Record<string, any> } {
  const privacyPatient = summary.patientName
    ? summary.patientName.split(' ')[0] + ' ' + (summary.patientName.split(' ')[1]?.[0] || '') + '.'
    : summary.patientId;

  return {
    title: `MediTrack ${summary.severity} Health Alert`,
    body: `${summary.severity} priority alert generated for ${privacyPatient}: ${summary.mainReason.slice(0, 90)}... Tap to review securely.`,
    data: {
      alertId: summary.alertId,
      severity: summary.severity,
      patientId: summary.patientId,
      timestamp: summary.timestamp,
      url: summary.secureLink
    }
  };
}

function formatTimeShort(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'recent';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
