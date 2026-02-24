'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RuleProps {
  label?: string;
  className?: string;
  slant?: boolean;
  status?: 'DECLASS' | 'SECURE' | 'ARCHIVE';
}

/**
 * SOVEREIGN SYSTEM RULE
 * A technical separator for the 75 Intelligence Briefs.
 * Features a serialized aesthetic and precision-weighted strokes.
 */
export const Rule: React.FC<RuleProps> = ({ 
  label, 
  className, 
  slant = true,
  status = 'SECURE' 
}) => {
  return (
    <div className={cn("relative my-20 flex items-center group", className)}>
      {/* 1. Left Terminal (Origin Point) */}
      <div className="flex items-center">
        <div className="h-1 w-1 bg-amber-500 rotate-45" />
        <div className="h-[1px] w-8 bg-amber-500/40" />
      </div>
      
      {/* 2. Technical Labeling */}
      <div className="px-6 flex flex-col">
        <span className="font-mono text-[8px] font-black uppercase tracking-[0.5em] text-amber-500/80 leading-none">
          {label || "End of Briefing Segment"}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="h-[1px] w-2 bg-zinc-800" />
          <span className="font-mono text-[6px] text-zinc-600 uppercase tracking-widest">
            Ref // {status}_026
          </span>
        </div>
      </div>

      {/* 3. The Main Track (Gradient Dissolve) */}
      <div className="relative h-[1px] flex-grow bg-zinc-900 overflow-hidden">
        {/* Animated Scanning Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent w-1/2 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
        
        {/* Precision Slant Hashes */}
        {slant && (
          <div className="absolute inset-0 flex items-center gap-6 px-10">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="h-2 w-[1px] rotate-[30deg] bg-zinc-800 transition-colors group-hover:bg-amber-500/40" 
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Right Terminal (Termination Point) */}
      <div className="flex items-center gap-2 ml-4">
        <div className="h-[1px] w-4 bg-zinc-800" />
        <div className="flex gap-0.5">
          <div className="h-1 w-[1px] bg-zinc-700" />
          <div className="h-1 w-[1px] bg-zinc-700" />
          <div className="h-1 w-[1px] bg-zinc-700" />
        </div>
      </div>
    </div>
  );
};

export default Rule;