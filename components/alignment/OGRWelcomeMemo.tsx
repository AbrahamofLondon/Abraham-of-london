"use client";

import React from "react";

interface MemoProps {
  organisationName: string;
  ceoName: string;
}

export default function OGRWelcomeMemo({ organisationName, ceoName }: MemoProps) {
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="mx-auto max-w-3xl bg-[#FDFBF7] p-16 shadow-2xl border border-[#D4C5A8]/30 my-20 font-serif">
      
      {/* 1. The Header: Institutional Dispatch */}
      <div className="flex justify-between items-start border-b-2 border-[#2C2416] pb-8 mb-12">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tighter text-[#2C2416] uppercase">
            Abraham <span className="italic text-[#8A6A2F]">of</span> London
          </h2>
          <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-[#B8A77C]">
            Strategic Intelligence // Institutional Flow
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] text-[#C0B190] uppercase tracking-widest leading-relaxed">
            Dispatch №: OGR-PH2-INIT<br />
            {currentDate}
          </div>
        </div>
      </div>

      {/* 2. The Memo Body */}
      <div className="space-y-8 text-[#2C2416]">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F]">Memorandum For:</p>
          <p className="text-xl font-medium underline decoration-[#D4C5A8] underline-offset-8">
            {ceoName}, {organisationName}
          </p>
        </div>

        <div className="space-y-4 leading-relaxed text-[15px]">
          <p>
            It is a distinct pleasure to acknowledge the authorization of the **Order Geometry Resonance (OGR)** Phase 2 sequence. Your commitment to institutional synchronization marks the transition from structural observation to kinetic execution.
          </p>
          
          <p>
            The diagnostic phase identified the "drag" within your operating environment. Phase 2 is designed to remove it. We do not seek incremental improvement; we seek **Resonance**—where leadership intent and operational output occupy the same geometric space with total fidelity.
          </p>

          <p className="italic text-[#5C4E36] bg-[#F9F6EF] p-6 border-l-2 border-[#8A6A2F]">
            "The architecture of a great institution is not found in its pillars, but in the harmony of the space between them."
          </p>
        </div>

        {/* 3. Immediate Next Step Protocol */}
        <div className="space-y-4 pt-4">
          <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#8A6A2F] border-b border-[#F5F2EA] pb-2">
            The 72-Hour Protocol
          </h4>
          <ul className="space-y-3 font-sans text-xs text-[#5C4E36]">
            <li className="flex gap-4">
              <span className="font-serif italic text-[#D4C5A8]">01</span>
              <span>Your dedicated OGR Architect will finalize the Stage 01 Synthesis schedule.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-serif italic text-[#D4C5A8]">02</span>
              <span>Encrypted access for the forensic data trace will be established.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-serif italic text-[#D4C5A8]">03</span>
              <span>The first Executive Core session will be convened to align the Phase 2 narrative.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Signature & Authentication */}
      <div className="mt-20 flex justify-between items-end">
        <div className="space-y-1">
          <div className="h-px w-24 bg-[#D4C5A8] mb-4" />
          <p className="font-serif text-lg italic text-[#2C2416]">Abraham of London</p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F]">Principal Architect</p>
        </div>
        
        {/* The OGR Seal of Authentication */}
        <div className="relative h-16 w-16 opacity-30">
          <svg viewBox="0 0 100 100" className="animate-[spin_20s_linear_infinite]">
            <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
            <text className="font-mono text-[8px] uppercase tracking-[0.2em] fill-[#8A6A2F]">
              <textPath xlinkHref="#circlePath">
                ORDER GEOMETRY RESONANCE • PHASE II • 
              </textPath>
            </text>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-[10px] italic text-[#8A6A2F]">AOL</span>
          </div>
        </div>
      </div>
    </div>
  );
}