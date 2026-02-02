// components/mdx/Rule.tsx — INTEL SPEC
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RuleProps {
  label?: string;
  className?: string;
  slant?: boolean;
}

/**
 * A technical separator for Intelligence Briefs.
 * Uses a monospaced "End of Section" or custom label marker.
 */
export const Rule: React.FC<RuleProps> = ({ label, className, slant = false }) => {
  return (
    <div className={cn("relative my-16 flex items-center", className)}>
      {/* Decorative Left Terminal */}
      <div className="h-[1px] w-4 bg-gold/40" />
      
      {/* Label or Data-Point */}
      <div className="px-4 font-mono text-[9px] uppercase tracking-[0.4em] text-gold/60 whitespace-nowrap">
        {label || "SECTION_END"}
      </div>

      {/* Main Track */}
      <div className="relative h-[1px] flex-grow bg-gradient-to-r from-gold/40 via-gold/10 to-transparent">
        {slant && (
          <div className="absolute -top-[3px] left-10 flex gap-1">
            <div className="h-1.5 w-[1px] rotate-[25deg] bg-gold/40" />
            <div className="h-1.5 w-[1px] rotate-[25deg] bg-gold/40" />
            <div className="h-1.5 w-[1px] rotate-[25deg] bg-gold/40" />
          </div>
        )}
      </div>

      {/* Right Hash (Subtle finish) */}
      <div className="h-[3px] w-[3px] rounded-full bg-gold/20 ml-2" />
    </div>
  );
};

export default Rule;