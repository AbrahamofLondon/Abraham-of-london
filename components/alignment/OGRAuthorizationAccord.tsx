"use client";

import React from "react";

interface AccordProps {
  organisationName: string;
  representativeName: string;
  date: string;
}

export default function OGRAuthorizationAccord({ organisationName, representativeName, date }: AccordProps) {
  return (
    <div className="mx-auto max-w-4xl bg-white p-20 shadow-2xl border border-[#E8E0D4] relative overflow-hidden my-24 print:shadow-none print:border-black/10">
      
      {/* Background Watermark: The Hexagon of Resonance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <svg width="600" height="600" viewBox="0 0 100 100">
          <polygon points="50,1 95,25 95,75 50,99 5,75 5,25" fill="none" stroke="#8A6A2F" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-[0.5px] border-[#D4C5A8] pb-12 mb-16">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8A6A2F]">
              Phase 2 // Strategic Accord
            </span>
            <h1 className="font-serif text-4xl text-[#2C2416] tracking-tighter">
              Authorization of <span className="italic text-[#8A6A2F]">Resonance</span>
            </h1>
          </div>
          <div className="text-right font-mono text-[9px] text-[#C0B190] leading-loose">
            DOCUMENT REF: AOL-OGR-ACCORD-2026<br />
            STATUS: RESTRICTED EXECUTION
          </div>
        </div>

        {/* The Articles of Synchronization */}
        <div className="space-y-12 mb-20">
          <section className="space-y-4">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#2C2416] border-b border-[#F5F2EA] pb-2">
              Article I: Objective
            </h3>
            <p className="font-serif text-sm leading-relaxed text-[#5C4E36]">
              By executing this Accord, <span className="font-bold text-[#2C2416] underline decoration-[#D4C5A8] underline-offset-4">{organisationName}</span> authorizes the initiation of the OGR Phase 2 Calibration Sequence. The primary objective is the systemic reduction of the identified Dissonance Area through the three-stage roadmap of Synthesis, Alignment, and Resonance.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#2C2416] border-b border-[#F5F2EA] pb-2">
              Article II: Access & Forensic Fidelity
            </h3>
            <p className="font-serif text-sm leading-relaxed text-[#5C4E36]">
              Abraham of London shall be granted the necessary institutional access to conduct the Domain Deep-Dives and Executive Synthesis sessions. This ensures the forensic fidelity of the calibration remains absolute.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#2C2416] border-b border-[#F5F2EA] pb-2">
              Article III: Expected Outcome
            </h3>
            <p className="font-serif text-sm leading-relaxed text-[#5C4E36]">
              Success is defined as the stabilization of institutional geometries. The target threshold for post-calibration resonance is a 95% strategic fidelity rate across all primary operating vectors.
            </p>
          </section>
        </div>

        {/* Execution Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-32 border-t-[0.5px] border-[#D4C5A8] pt-16">
          <div className="space-y-8">
            <div className="h-16 border-b border-[#2C2416]/20 relative">
              <span className="absolute bottom-2 left-0 font-serif italic text-2xl text-[#2C2416]/10 pointer-events-none uppercase">
                {representativeName}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A6A2F]">For the Institution</p>
              <p className="font-serif text-xs text-[#5C4E36]">Authorized Signature</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="h-16 border-b border-[#2C2416]/20 flex items-end pb-2">
               <span className="font-serif text-lg italic text-[#8A6A2F]">Abraham of London</span>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A6A2F]">For the Architect</p>
              <p className="font-serif text-xs text-[#5C4E36]">Verification of Sequence</p>
            </div>
          </div>
        </div>

        {/* Date Stamp */}
        <div className="mt-16 flex justify-center">
          <div className="px-6 py-2 border border-[#F5F2EA] bg-[#FDFBF7]">
            <span className="font-mono text-[10px] text-[#B8A77C]">
              EXECUTED ON THIS DAY: {date}
            </span>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-12 text-center">
          <p className="font-mono text-[7px] uppercase tracking-[0.5em] text-neutral-300">
            CONFIDENTIAL // RESTRICTED DISPATCH // MMXXVI
          </p>
        </div>
      </div>
    </div>
  );
}