import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#F0F7FF] border border-[#BFDBFE]/80 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 shadow-2xs relative text-xs sm:text-sm text-slate-700 animate-in fade-in">
      <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
        <Info className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <span className="font-bold text-[#071B49] mr-1.5">Important Note:</span>
        <span className="text-[#334155] leading-relaxed">
          These recommendations are based on your available medical information and should not be considered a diagnosis. Consult a qualified healthcare professional for appropriate evaluation and treatment.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-blue-100/50 transition-colors"
        aria-label="Dismiss disclaimer note"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
