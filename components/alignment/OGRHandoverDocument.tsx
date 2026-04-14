"use client";

import React from "react";
import { Award, BookOpen, ShieldCheck, TrendingDown, Crown, Compass, Lock } from "lucide-react";

interface HandoverProps {
  organisationName: string;
  ceoName: string;
  finalResonanceScore: number;
  handoverDate?: string;
  reference?: string;
}

export default function OGRHandoverDocument({ 
  organisationName = "The Institution", 
  ceoName = "Chief Executive",
  finalResonanceScore = 96.4,
  handoverDate,
  reference = "AOL-FIN-2026-075"
}: HandoverProps) {
  
  const currentDate = handoverDate || new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="print-handover mx-auto max-w-4xl bg-[#FEFCF8] shadow-[0_35px_70px_-35px_rgba(0,0,0,0.35)] my-24 relative overflow-hidden print:shadow-none">
      
      {/* Premium Cover Border */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-4 border border-[#D4C5A8]/30" />
        <div className="absolute inset-8 border border-[#E8E0D4]/40" />
      </div>

      {/* Wax Seal Effect */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#D4C5A8] to-[#B8A77C] opacity-20 shadow-xl" />
      
      {/* 1. Archive Header with Embossing */}
      <div className="relative pt-20 px-16">
        <div className="flex justify-between items-end border-b-2 border-[#E8E0D4] pb-12 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#8A6A2F]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.5em] text-[#8A6A2F]">
                Archive Record
              </span>
            </div>
            <h1 className="font-serif text-5xl text-[#2C2416] tracking-tight leading-[1.1]">
              Institutional<br />
              <span className="italic text-[#8A6A2F]">Handover</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9B8A6B]">
              OGR Phase II • Certification of Completion
            </p>
          </div>
          <div className="text-right font-mono text-[9px] text-[#B8A77C] leading-relaxed space-y-1">
            <div>REF: {reference}</div>
            <div>{currentDate}</div>
            <div className="pt-2">
              <div className="h-px w-full bg-[#E8E0D4] mb-1" />
              <span className="text-[7px] uppercase tracking-[0.3em]">Copy № 01</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary of Impact */}
      <div className="px-16 space-y-14">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-gradient-to-br from-[#F5F2EA] to-[#EFEAE0] border border-[#E8E0D4]">
              <Award className="w-5 h-5 text-[#8A6A2F]" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#2C2416]">Certification of Resonance</h3>
              <div className="h-px w-12 bg-[#8A6A2F] mt-1" />
            </div>
          </div>
          
          <div className="ml-12 space-y-4">
            <p className="font-serif text-base leading-relaxed text-[#5C4E36]">
              This document certifies that <span className="font-bold text-[#2C2416]">{organisationName}</span> has successfully completed the 12-week OGR Calibration Sequence. Through the synthesis of leadership narratives and the forensic correction of operational protocols, the institution has achieved a verified Resonance Fidelity of
            </p>
            
            <div className="flex items-baseline gap-4 py-4">
              <span className="font-serif text-7xl font-light text-[#8A6A2F]">{finalResonanceScore}%</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9B8A6B]">Resonance Fidelity</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#E8E0D4] to-transparent" />
            </div>
            
            <p className="font-serif text-sm italic leading-relaxed text-[#6B5A3E]">
              A score exceeding 94% indicates structural integrity, operational coherence, and autonomous alignment capacity.
            </p>
          </div>
        </section>

        {/* 3. The Stabilized Geometry */}
        <div className="grid grid-cols-2 gap-12 py-8 border-y border-[#F5F2EA] bg-gradient-to-r from-[#FEFCF8] via-[#FDFBF7] to-[#FEFCF8]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-[#F5F2EA]">
                <TrendingDown className="w-4 h-4 text-[#C44D4D]" />
              </div>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#2C2416]">
                Friction Eradication
              </h4>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[#6B5A3E]">
              Initial diagnostic traces indicated significant structural drag. Post-intervention analytics confirm a <span className="font-bold text-[#2C2416]">72% reduction</span> in decision latency and a <span className="font-bold text-[#2C2416]">90% increase</span> in cross-domain information flow.
            </p>
            <div className="mt-2 h-px w-12 bg-[#E8E0D4]" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-[#F5F2EA]">
                <ShieldCheck className="w-4 h-4 text-[#5C8A5C]" />
              </div>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#2C2416]">
                Autonomous Alignment
              </h4>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[#6B5A3E]">
              Institutional geometries are now stabilized. The "Coherence Lock" protocol ensures future strategic pivots remain aligned with the core mission without manual oversight. Sustained resonance is now the default state.
            </p>
            <div className="mt-2 h-px w-12 bg-[#E8E0D4]" />
          </div>
        </div>

        {/* 4. The Architect's Closing Note */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-gradient-to-br from-[#F5F2EA] to-[#EFEAE0] border border-[#E8E0D4]">
              <BookOpen className="w-5 h-5 text-[#8A6A2F]" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#2C2416]">Future Stewardship</h3>
              <div className="h-px w-12 bg-[#8A6A2F] mt-1" />
            </div>
          </div>
          
          <div className="ml-12">
            <div className="relative py-8 px-6 bg-gradient-to-r from-[#FDFBF7] to-transparent border-l-4 border-[#8A6A2F]">
              <div className="absolute -top-3 left-6 text-6xl font-serif text-[#E8E0D4]">"</div>
              <p className="font-serif text-base italic leading-relaxed text-[#5C4E36] relative z-10">
                The architecture of {organisationName} is now in its most efficient form. 
                Your role as {ceoName} is no longer to manage friction, but to lead the flow. 
                The geometry is set; the resonance is yours to maintain.
              </p>
              <div className="absolute -bottom-3 right-6 text-6xl font-serif text-[#E8E0D4]">"</div>
            </div>
            <div className="mt-4 flex items-center gap-3 justify-end">
              <div className="h-px w-8 bg-[#E8E0D4]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#9B8A6B]">The Architect</span>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Final Execution Block */}
      <div className="mt-20 px-16">
        <div className="border-t-2 border-[#E8E0D4] pt-12">
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-3">
              <div className="border-b border-[#2C2416]/20 pb-3">
                <span className="font-serif italic text-lg text-[#2C2416]">{ceoName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-[#B8A77C]" />
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F]">
                  Institutional Custodian
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="border-b border-[#8A6A2F]/30 pb-3">
                <span className="font-serif italic text-lg text-[#8A6A2F]">Abraham of London</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-3 h-3 text-[#B8A77C]" />
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F]">
                  Principal Architect
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Footer with Institutional Seal */}
      <div className="mt-20 mb-16 px-16">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8E0D4] to-transparent" />
          
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-4 border border-[#E8E0D4] px-8 py-3 bg-[#FDFBF7]">
              <Compass className="w-4 h-4 text-[#8A6A2F]" />
              <p className="font-mono text-[7px] uppercase tracking-[0.5em] text-[#B8A77C]">
                MMXXVI // OGR-75-CERTIFIED // NO FURTHER ACTION REQUIRED
              </p>
              <div className="w-px h-4 bg-[#E8E0D4]" />
              <span className="font-mono text-[7px] text-[#B8A77C]">ARCHIVE-CLOSED</span>
            </div>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E8E0D4] to-transparent" />
        </div>
        
        <div className="mt-6 text-center">
          <span className="font-mono text-[6px] uppercase tracking-[0.5em] text-[#D4C5A8]">
            This document constitutes the official record. No further certification required.
          </span>
        </div>
      </div>

      {/* Subtle Background Watermark */}
      <div className="absolute -bottom-16 -right-16 opacity-[0.02] rotate-12 pointer-events-none select-none">
        <span className="font-serif text-[280px] font-bold italic tracking-tighter text-[#2C2416]">OGR</span>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <style {...({ jsx: true, global: true } as any)}>{`
        @media print {
          .print-handover {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-handover .bg-gradient-to-r,
          .print-handover .bg-gradient-to-br {
            background: none !important;
          }
        }
      `}</style>
    </div>
  );
}