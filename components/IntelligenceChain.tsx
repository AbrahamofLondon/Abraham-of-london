// components/IntelligenceChain.tsx — HARDENED (Series Progression Logic)
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers, Target } from 'lucide-react';
import clsx from 'clsx';

interface ChainLink {
  title: string;
  href: string;
  isCurrent: boolean;
  status: 'completed' | 'current' | 'locked';
}

interface IntelligenceChainProps {
  seriesTitle: string;
  currentStep: number;
  totalSteps: number;
  links: ChainLink[];
}

export default function IntelligenceChain({ 
  seriesTitle, 
  currentStep, 
  totalSteps, 
  links 
}: IntelligenceChainProps) {
  
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <nav className="w-full border-b border-white/5 bg-zinc-950/30 backdrop-blur-md sticky top-[72px] z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* 1. SERIES IDENTIFIER */}
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-2 border border-amber-500/20">
              <Layers size={14} className="text-amber-500" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-0.5">
                Strategic Series // {currentStep} of {totalSteps}
              </p>
              <h4 className="font-serif italic text-sm text-zinc-200">{seriesTitle}</h4>
            </div>
          </div>

          {/* 2. VISUAL PROGRESS TRACKER */}
          <div className="flex-1 max-w-md hidden lg:block px-12">
            <div className="relative h-[2px] w-full bg-white/5">
              <div 
                className="absolute h-full bg-amber-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
              <div className="absolute inset-0 flex justify-between -top-[3px]">
                {links.map((link, i) => (
                  <div 
                    key={i}
                    className={clsx(
                      "h-2 w-2 rounded-full border transition-all duration-500",
                      link.isCurrent ? "bg-amber-500 border-amber-500 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                      i < currentStep ? "bg-zinc-800 border-zinc-700" : "bg-black border-white/10"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 3. TACTICAL NAVIGATION */}
          <div className="flex items-center gap-2">
            {links[currentStep - 2] ? (
              <Link 
                href={links[currentStep - 2].href}
                className="flex items-center gap-2 px-3 py-2 border border-white/5 hover:border-white/20 transition-all group"
              >
                <ChevronLeft size={14} className="text-zinc-600 group-hover:text-amber-500" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Prev</span>
              </Link>
            ) : (
              <div className="px-3 py-2 border border-white/5 opacity-20 cursor-not-allowed">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-800 text-zinc-500">Origin</span>
              </div>
            )}

            {links[currentStep] ? (
              <Link 
                href={links[currentStep].href}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black hover:bg-white transition-all group"
              >
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest">Next Dispatch</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 border border-amber-500/50 text-amber-500">
                <Target size={14} />
                <span className="font-mono text-[9px] uppercase tracking-widest">Objective Met</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}