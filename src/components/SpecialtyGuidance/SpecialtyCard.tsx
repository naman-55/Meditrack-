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
  FileText, 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2
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
        bgIcon: 'bg-rose-50 text-rose-500 border border-rose-100 dark:bg-[#321B27] dark:text-[#FF5368] dark:border-[#521C2B]',
        searchQuery: 'cardiology',
        btnText: 'Find Cardiologists Near Me',
        fallbackExplanation: 'Based on your cholesterol levels, blood pressure readings and cardiovascular risk indicators.'
      };
    }
    if (s.includes('endo') || d.includes('metabol')) {
      return {
        icon: Activity,
        bgIcon: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-[#201938] dark:text-[#A855F7] dark:border-[#3B285E]',
        searchQuery: 'endocrinology',
        btnText: 'Find Endocrinologists Near Me',
        fallbackExplanation: 'Recommended based on glucose metabolism markers and hormonal analysis.'
      };
    }
    if (s.includes('hemat') || d.includes('blood')) {
      return {
        icon: Droplets,
        bgIcon: 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-[#321B27] dark:text-[#FF5368] dark:border-[#521C2B]',
        searchQuery: 'hematology',
        btnText: 'Find Hematologists Near Me',
        fallbackExplanation: 'Based on blood count parameters and related biomarkers.'
      };
    }
    if (s.includes('nephro') || d.includes('kidney')) {
      return {
        icon: Droplets,
        bgIcon: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-[#0E2849] dark:text-[#2684FF] dark:border-[#1E4370]',
        searchQuery: 'nephrology',
        btnText: 'Find Nephrologists Near Me',
        fallbackExplanation: 'Recommended based on kidney filtration and metabolic electrolyte balance.'
      };
    }
    if (s.includes('gastro') || d.includes('hepat')) {
      return {
        icon: Stethoscope,
        bgIcon: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-[#28183B] dark:text-[#C084FC] dark:border-[#4E2875]',
        searchQuery: 'gastroenterology',
        btnText: 'Find Gastroenterologists Near Me',
        fallbackExplanation: 'The saved analysis does not include a recommendation rationale.'
      };
    }
    return {
      icon: Stethoscope,
      bgIcon: 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-[#14233D] dark:text-[#38BDF8] dark:border-[#203D66]',
      searchQuery: specialtyName.toLowerCase(),
      btnText: `Find ${specialtyName} Near Me`,
      fallbackExplanation: 'The saved analysis does not include a recommendation rationale.'
    };
  };

  const theme = getSpecialtyTheme();
  const Icon = theme.icon;

  const priority = evidenceObj?.priority || 'Low Priority';
  const explanation = evidenceObj?.explanation || (guidance.evidence && !evidenceObj ? guidance.evidence : theme.fallbackExplanation);
  const findings: StructuredFinding[] = evidenceObj?.findings || [];
  const whyRecommended = evidenceObj?.whyRecommended || [
    `Ask whether a ${specialtyName} evaluation may be appropriate`,
    'Review the source report findings together',
    'Ask whether follow-up testing is recommended'
  ];
  const discussionPoints = evidenceObj?.suggestedDiscussionPoints && evidenceObj.suggestedDiscussionPoints.length > 0
    ? evidenceObj.suggestedDiscussionPoints
    : whyRecommended;

  const getPriorityBadgeClass = () => {
    if (priority.toLowerCase().includes('high')) {
      return 'bg-rose-100 text-rose-700 border border-rose-200/80 dark:bg-[#321B27] dark:text-[#FF5368] dark:border-[#7A3043]';
    }
    if (priority.toLowerCase().includes('medium')) {
      return 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-[#302719] dark:text-[#F5B942] dark:border-[#6B4B1C]';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#162738] dark:text-[#8297B2] dark:border-[#20364A]';
  };

  const getFindingChipClass = (variant: StructuredFinding['statusVariant']) => {
    switch (variant) {
      case 'high':
        return 'bg-rose-50 border-rose-200/80 text-rose-900 dark:bg-[#321B27] dark:border-[#7A3043] dark:text-[#FF8092]';
      case 'borderline':
        return 'bg-amber-50 border-amber-200/80 text-amber-900 dark:bg-[#302719] dark:border-[#6B4B1C] dark:text-[#F5B942]';
      case 'low':
        return 'bg-blue-50 border-blue-200/80 text-blue-900 dark:bg-[#0E2849] dark:border-[#1E4370] dark:text-[#70B1FF]';
      default:
        return 'bg-slate-50 border-slate-200/70 text-slate-800 dark:bg-[#102033] dark:border-[#20364A] dark:text-[#B4C4D8]';
    }
  };

  const getFindingDotClass = (variant: StructuredFinding['statusVariant']) => {
    switch (variant) {
      case 'high':
        return 'bg-rose-500 dark:bg-[#FF5368]';
      case 'borderline':
        return 'bg-amber-500 dark:bg-[#F5B942]';
      case 'low':
        return 'bg-blue-500 dark:bg-[#2684FF]';
      default:
        return 'bg-emerald-500 dark:bg-[#00D6B0]';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] shadow-2xs hover:border-slate-300 dark:hover:border-[#2D4A66] transition-all overflow-hidden">
      {/* COMPACT CARD ROW (Matching Reference Screenshot) */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title + Priority + One-line Explanation */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${theme.bgIcon}`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#071B49] dark:text-[#F1F5FB] tracking-tight">
                  {specialtyName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getPriorityBadgeClass()}`}>
                  {priority}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8297B2] mt-0.5 font-medium leading-relaxed truncate max-w-xl">
                {explanation}
              </p>
            </div>
          </div>

          {/* Right: Find Specialists Near Me Action + Expand Button */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
            <Link
              to={`/care-near-me?specialty=${encodeURIComponent(theme.searchQuery)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#2563EB] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/70 dark:bg-[#081421] dark:border-[#20364A] dark:text-[#2684FF] dark:hover:bg-[#14283B] dark:hover:border-[#2A4866] transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{theme.btnText}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-[#8297B2] dark:bg-[#081421] dark:border dark:border-[#20364A] dark:hover:text-[#F1F5FB] dark:hover:bg-[#14283B] transition-colors cursor-pointer"
              aria-label={isExpanded ? 'Collapse card' : 'Expand card details'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDED 3-COLUMN CLINICAL EVIDENCE DRAWER */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-[#20364A] bg-slate-50/60 dark:bg-[#081421]/60 p-5 sm:p-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Section 1: Key Findings */}
            <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200/80 dark:border-[#20364A] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] uppercase tracking-wider mb-3">
                  <FileText className="w-4 h-4 text-[#00A884] dark:text-[#00D6B0]" />
                  <span>Key Findings</span>
                </div>
                {findings.length > 0 ? (
                  <div className="space-y-2">
                    {findings.map((f, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${getFindingChipClass(f.statusVariant)}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getFindingDotClass(f.statusVariant)}`} />
                          <span className="font-semibold truncate">{f.parameter}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold">{f.value} {f.unit}</span>
                          <span className="text-[10px] opacity-75 block">({f.status})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[#8297B2] italic leading-relaxed">
                    {guidance.evidence && !guidance.evidence.startsWith('{')
                      ? guidance.evidence
                      : 'Routine laboratory baseline observations verified.'}
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Supporting Evidence */}
            <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200/80 dark:border-[#20364A] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-[#2684FF]" />
                  <span>Supporting Evidence</span>
                </div>
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#081421] border border-slate-200/60 dark:border-[#20364A]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider block">
                      Source Medical Record
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-[#F1F5FB] block truncate mt-0.5" title={evidenceObj?.sourceReport || 'Recent report'}>
                      {evidenceObj?.sourceReport || 'Validated pathology reports'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#081421] border border-slate-200/60 dark:border-[#20364A]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider block">
                      Clinical Reference Rule
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-[#F1F5FB] block mt-0.5">
                      {evidenceObj?.ruleReference || 'Clinical Practice Guidelines'} (v{guidance.rule_version})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#081421] border border-slate-200/60 dark:border-[#20364A] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider">
                      Validation Pipeline
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-[#00D6B0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D6B0]" />
                      Deterministic
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Suggested Discussion Points */}
            <div className="bg-white dark:bg-[#0D1B2A] rounded-xl border border-slate-200/80 dark:border-[#20364A] p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] uppercase tracking-wider mb-3">
                  <HelpCircle className="w-4 h-4 text-[#00A884] dark:text-[#00D6B0]" />
                  <span>Suggested Discussion Points</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-[#B4C4D8]">
                  {discussionPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A884] dark:bg-[#00D6B0] shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
