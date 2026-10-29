import React from 'react';
import { cn } from '../../utils/cn';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showVersion?: boolean;
  showTagline?: boolean;
  versionText?: string;
  taglineText?: string;
  iconOnly?: boolean;
}

export default function BrandLogo({
  className,
  size = 'md',
  showVersion = true,
  showTagline = true,
  versionText = 'v3.2',
  taglineText = 'Clinical Analytics Suite',
  iconOnly = false
}: BrandLogoProps) {
  const iconDimensions = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl'
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl'
  }[size];

  const badgeSize = {
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-0.5'
  }[size];

  return (
    <div className={cn("inline-flex items-center gap-3 select-none group", className)}>
      {/* Dynamic Emblem with Multi-stop Gradient & Vital Pulse ECG Line */}
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center shadow-md shadow-[#00D6B0]/20 transition-transform duration-200 group-hover:scale-105 overflow-hidden",
          "bg-gradient-to-br from-[#00D6B0] via-[#00A884] to-[#0284C7]",
          iconDimensions
        )}
      >
        {/* Subtle glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        
        {/* Crisp vector ECG heartbeat & clinical cross */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-3/5 h-3/5 text-white drop-shadow-xs relative z-10"
        >
          {/* Subtle vertical alignment markers */}
          <path 
            d="M12 2.5V6.5M12 17.5V21.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeOpacity="0.45"
          />
          {/* Main vital pulse line */}
          <path 
            d="M3 12H7L9 6L13 18L16 9L18 12H21" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("font-extrabold tracking-tight text-slate-900 dark:text-[#FFFFFF] leading-none", textSize)}>
              Medi<span className="text-[#00A884] dark:text-[#00D6B0]">Track</span>
            </span>

            {showVersion && (
              <span className={cn(
                "font-bold uppercase tracking-wider rounded-md border leading-none shrink-0",
                "bg-[#E6F7F3] text-[#008f72] border-[#00A884]/20",
                "dark:bg-[#00D6B0]/15 dark:text-[#00D6B0] dark:border-[#00D6B0]/30",
                badgeSize
              )}>
                {versionText}
              </span>
            )}
          </div>

          {showTagline && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A884] dark:text-[#00D6B0] mt-1 leading-tight">
              {taglineText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
