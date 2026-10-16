import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  Activity, 
  Droplets, 
  Stethoscope, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { SpecialtyGuidance, StructuredEvidence, StructuredFinding } from '../../api/reports';

interface SpecialtyCardProps {
  guidance: SpecialtyGuidance;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ guidance }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse evidence JSON safely or build fallback
  let evidenceObj: StructuredEvidence | null = null;
  try {
    if (guidance.evidence && guidance.evidence.startsWith('{')) {
      evidenceObj = JSON.parse(guidance.evidence);
    }
  } catch (e) {
    evidenceObj = null;
  }

  // Derive specialty name and domain
  const specialtyName = guidance.suggested_specialty.includes('/')
    ? guidance.suggested_specialty.split('/').pop()?.trim() || guidance.suggested_specialty
    : guidance.suggested_specialty;

  // Icons and color tokens based on specialty domain
  const getSpecialtyTheme = () => {
    const s = specialtyName.toLowerCase();
    const d = guidance.domain.toLowerCase();

    if (s.includes('cardio') || d.includes('cardio')) {
      return {
        icon: HeartPulse,
        bgIcon: 'bg-rose-50 text-rose-500 border border-rose-100',
        searchQuery: 'cardiology',
        btnText: 'Find Cardiologists Near Me',
        fallbackExplanation: 'Based on your cholesterol levels, blood pressure readings and cardiovascular risk indicators.'
      };
    }
    if (s.includes('endo') || d.includes('metabol')) {
      return {
        icon: Activity,
        bgIcon: 'bg-teal-50 text-teal-600 border border-teal-100',
        searchQuery: 'endocrinology',
        btnText: 'Find Endocrinologists Near Me',
        fallbackExplanation: 'Based on your glucose metabolism and thyroid indicators.'
      };
    }
    if (s.includes('nephro') || d.includes('kidney')) {
      return {
        icon: Droplets,
        bgIcon: 'bg-blue-50 text-blue-600 border border-blue-100',
        searchQuery: 'nephrology',
        btnText: 'Find Nephrologists Near Me',
        fallbackExplanation: 'Based on your kidney function indicators.'
      };
    }
    if (s.includes('gastro') || d.includes('hepat')) {
      return {
        icon: Stethoscope,
        bgIcon: 'bg-purple-50 text-purple-600 border border-purple-100',
        searchQuery: 'gastroenterology',
        btnText: 'Find Gastroenterologists Near Me',
        fallbackExplanation: 'Based on your liver function tests and gastrointestinal indicators.'
      };
    }
    return {
      icon: Stethoscope,
      bgIcon: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      searchQuery: specialtyName.toLowerCase(),
      btnText: `Find ${specialtyName} Near Me`,
      fallbackExplanation: `Based on your ${guidance.domain} domain clinical indicators.`
    };
  };

  const theme = getSpecialtyTheme();
  const Icon = theme.icon;

  const priority = evidenceObj?.priority || 'Low Priority';
  const explanation = evidenceObj?.explanation || theme.fallbackExplanation;
  const findings: StructuredFinding[] = evidenceObj?.findings || [];
  const whyRecommended = evidenceObj?.whyRecommended || [
    `Evaluate ${specialtyName} parameters`,
    'Discuss preventive health optimizations',
    'Follow up on longitudinal trends'
  ];

  const getPriorityBadgeClass = () => {
    if (priority.toLowerCase().includes('high')) {
      return 'bg-rose-100 text-rose-700 border border-rose-200/80';
    }
    if (priority.toLowerCase().includes('medium')) {
      return 'bg-amber-100 text-amber-800 border border-amber-200/80';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const getFindingChipClass = (variant: StructuredFinding['statusVariant']) => {
    switch (variant) {
      case 'high':
        return 'bg-rose-50 border-rose-200/80 text-rose-900';
      case 'borderline':
        return 'bg-amber-50 border-amber-200/80 text-amber-900';
      case 'low':
        return 'bg-blue-50 border-blue-200/80 text-blue-900';
      default:
        return 'bg-slate-50 border-slate-200/70 text-slate-800';
    }
  };

  const getFindingDotClass = (variant: StructuredFinding['statusVariant']) => {
    switch (variant) {
      case 'high':
        return 'bg-rose-500';
      case 'borderline':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="bg-white dark:bg-[#081729] rounded-2xl border border-[#DCE5EC] dark:border-[#152A42] shadow-xs hover:shadow-sm transition-shadow overflow-hidden">
      {/* CARD HEADER */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title + Priority + Subtitle */}
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${theme.bgIcon}`}>
              <Icon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-[#071B49] dark:text-white tracking-tight">
                  {specialtyName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityBadgeClass()}`}>
                  {priority}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] mt-1 font-medium leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>

          {/* Right: Find Near Me Button + Expand Chevron */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
            <Link
              to={`/care-near-me?specialty=${encodeURIComponent(theme.searchQuery)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#2563EB] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/70 dark:bg-[#081E3B] dark:text-[#2684FF] dark:border-[#1B4582] dark:hover:bg-[#0B2554] transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{theme.btnText}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-slate-400 dark:text-[#647A96] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0D2038] transition-colors"
              aria-label={isExpanded ? 'Collapse card' : 'Expand card details'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CARD BODY: 2 Columns (Key Findings + Why Recommended) */}
      <div className="px-5 sm:px-6 pb-5 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-[#152A42]">
          {/* Column 1: Key Findings */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#071B49] uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5 text-[#00A884]" />
              <span>Key Findings</span>
            </div>

            {findings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {findings.map((f, i) => (
                  <div
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${getFindingChipClass(f.statusVariant)}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getFindingDotClass(f.statusVariant)}`} />
                    <span className="font-semibold text-slate-800">{f.parameter}</span>
                    <span className="text-slate-700">{f.value} {f.unit}</span>
                    <span className="text-[11px] opacity-80">({f.status})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {guidance.evidence && !guidance.evidence.startsWith('{')
                  ? guidance.evidence
                  : 'Routine laboratory baseline available.'}
              </p>
            )}
          </div>

          {/* Column 2: Why Recommended */}
          <div className="space-y-2 md:pl-2">
            <div className="text-xs font-bold text-[#071B49] uppercase tracking-wider mb-2">
              Why Recommended
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              {whyRecommended.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00A884] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* EXPANDED SUPPORTING EVIDENCE DRAWER */}
      {isExpanded && (
        <div className="bg-[#F8FAFC] border-t border-slate-200/80 p-5 text-xs text-slate-700 space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Source Medical Record
              </span>
              <span className="font-semibold text-slate-800 block truncate" title={evidenceObj?.sourceReport || 'Recent report'}>
                {evidenceObj?.sourceReport || 'Validated pathology reports'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Clinical Reference Rule
              </span>
              <span className="font-semibold text-slate-800 block">
                {evidenceObj?.ruleReference || 'Clinical Practice Guidelines'} (v{guidance.rule_version})
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Analysis Mode
              </span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Evidence-Based Deterministic
              </span>
            </div>
          </div>

          {/* Suggested Discussion Points */}
          {evidenceObj?.suggestedDiscussionPoints && evidenceObj.suggestedDiscussionPoints.length > 0 && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Suggested Questions to Discuss with Your Doctor
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-600">
                {evidenceObj.suggestedDiscussionPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
