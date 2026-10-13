import React from 'react';
import { normalizeParamKey } from './clinicalRules';
import { Droplet, HeartPulse, Activity, Shield, TestTubes, Disc, Scale, Heart } from 'lucide-react';

interface BiomarkerIconProps {
  parameterName: string;
  className?: string;
}

export default function BiomarkerIcon({ parameterName, className = "w-5 h-5" }: BiomarkerIconProps) {
  const key = normalizeParamKey(parameterName);

  switch (key) {
    case 'alt':
    case 'ast':
      // Anatomical Liver Icon matching reference mockup
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main hepatic contour: curved superior dome, lateral wedge, inferior notch */}
          <path d="M3.5 13.5C3.5 9 6.8 6 12 6c5.8 0 8.5 2.8 8.5 7.2 0 4.2-3.8 6.8-8.5 6.8-4.8 0-8.5-2.6-8.5-6.5Z" />
          {/* Internal lobar fissure / falciform dividing contour */}
          <path d="M12 6.5c-.8 2.8-1 5.8.5 8" />
        </svg>
      );

    case 'creatinine':
      // Anatomical Kidney Bean Icon matching reference mockup
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Renal cortex and hilum medial notch */}
          <path d="M12.5 4.5c-3.6 0-6 2.5-6 6.2 0 4.8 4 8.8 7 8.8 3.5 0 5.5-2.4 5.5-6 0-3.2-2.2-4.8-4.2-5.2 1.2-1.2 1.2-2.8-.5-3.8-.5 0-1.2 0-1.8 0Z" />
          <path d="M9.8 11.2c1.2.8 1.8 2 1.5 3.5" />
        </svg>
      );

    case 'fasting_glucose':
      return <Droplet className={className} />;

    case 'hdl':
      return <HeartPulse className={className} />;

    case 'ldl':
    case 'total_cholesterol':
    case 'triglycerides':
      return <Activity className={className} />;

    case 'hemoglobin':
    case 'hematocrit':
    case 'rbc':
      return <TestTubes className={className} />;

    case 'wbc':
      return <Shield className={className} />;

    case 'platelets':
      return <Disc className={className} />;

    case 'blood_pressure':
      return <Heart className={className} />;

    case 'bmi':
    case 'weight':
      return <Scale className={className} />;

    default:
      return <Activity className={className} />;
  }
}
