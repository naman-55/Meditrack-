import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#F0F7FF] dark:bg-[#081B38] border border-[#BFDBFE]/80 dark:border-[#1B4582] rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 shadow-2xs relative text-xs sm:text-sm text-slate-700 dark:text-[#94A9C2] animate-in fade-in">
      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-[#0B203E] text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0 mt-0.5">
        <Info className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <span className="font-bold text-[#071B49] dark:text-white mr-1.5">Important Note:</span>
        <span className="text-[#334155] dark:text-[#94A9C2] leading-relaxed">
          These recommendations are based on your available medical information and should not be considered a diagnosis. Consult a qualified healthcare professional for appropriate evaluation and treatment.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 dark:text-[#647A96] hover:text-slate-600 dark:hover:text-white hover:bg-blue-100/50 dark:hover:bg-[#0B203E] transition-colors"
        aria-label="Dismiss disclaimer note"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
