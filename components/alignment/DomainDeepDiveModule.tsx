"use client";

import React, { useState } from "react";
import { Microscope, Activity, Hexagon, ChevronRight, AlertCircle, Share2, DollarSign, ShieldAlert } from "lucide-react";

interface FrictionPoint {
  id: string;
  symptom: string;
  rootCause: string;
  impactScore: number;
  inertiaCost: string; // The "Resonance Tax"
  contagionTarget: string; // Where the friction leaks to
  status: "identified" | "analyzing" | "resolved";
}

export default function DomainDeepDiveModule({ domainName = "Operational_Integrity" }) {
  const [activeFriction, setActiveFriction] = useState<string | null>("FP-01");

  const frictionPoints: FrictionPoint[] = [
    {
      id: "FP-01",
      symptom: "Decision Latency",
      rootCause: "Over-centralized authorization vectors creating a 14-day bottleneck.",
      impactScore: 88,
      inertiaCost: "$12,400 / week",
      contagionTarget: "Strategic Agility",
      status: "analyzing"
    },
    {
      id: "FP-02",
      symptom: "Knowledge Siloing",
      rootCause: "Asymmetric information flow between Strategy and Execution units.",
      impactScore: 72,
      inertiaCost: "15% Talent Attrition Risk",
      contagionTarget: "Institutional Trust",
      status: "identified"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl bg-[#FDFBF7] min-h-screen border-x border-[#D4C5A8]/20 shadow-2xl">
      
      {/* 1. Forensic Header with Contagion Warning */}
      <div className="bg-[#1A160F] p-12 text-[#F9F7F2] relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
           <svg width="400" height="400" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#8A6A2F" strokeWidth="0.5" strokeDasharray="2 2" /></svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-[#8A6A2F]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">
                Stage 02 // Forensic Deep-Dive
              </span>
            </div>
            <h2 className="font-serif text-3xl tracking-tight">
              Domain: <span className="italic capitalize">{domainName.replace(/_/g, ' ')}</span>
            </h2>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                <span className="block font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F] mb-1">Resonance Tax</span>
                <span className="font-serif text-xl text-[#F9F7F2]">High Friction</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* 2. Left Rail: The Friction Catalog */}
        <div className="lg:col-span-4 border-r border-[#D4C5A8]/30 bg-[#F5F2EA]/30">
          <div className="p-6 border-b border-[#D4C5A8]/20 bg-[#F5F2EA]">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#5C4E36]">Active Dissonance Vectors</h3>
          </div>
          <div className="divide-y divide-[#D4C5A8]/20">
            {frictionPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setActiveFriction(point.id)}
                className={`w-full text-left p-8 transition-all duration-300 relative ${
                  activeFriction === point.id ? "bg-white shadow-xl scale-[1.02] z-20" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] text-[#8A6A2F] font-bold">{point.id}</span>
                    {point.status === "analyzing" && <Activity className="w-3 h-3 text-[#8A6A2F] animate-pulse" />}
                  </div>
                  <h4 className="font-serif text-lg text-[#2C2416]">{point.symptom}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[7px] uppercase tracking-widest bg-[#8A6A2F]/10 text-[#8A6A2F] px-2 py-0.5">Impact: {point.impactScore}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. The Core Analysis & Intervention (The "Value-Add" Engine) */}
        <div className="lg:col-span-8 p-16 bg-white">
          {activeFriction ? (
            <div className="max-w-3xl space-y-16">
              
              {/* Gap 1 & 2: Contagion & Inertia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#8A6A2F]">
                    <Share2 className="w-4 h-4" />
                    <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold">Domain Contagion</h5>
                  </div>
                  <div className="p-4 border border-[#F5F2EA] bg-[#FDFBF7] flex items-center justify-between">
                    <span className="font-serif text-sm italic">{domainName.replace(/_/g, ' ')}</span>
                    <MoveRight className="w-4 h-4 text-[#D4C5A8]" />
                    <span className="font-serif text-sm text-[#8A6A2F] font-bold">
                      {frictionPoints.find(f => f.id === activeFriction)?.contagionTarget}
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-neutral-400">If unresolved, this friction will inevitably degrade the target domain within 90 days.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#C44D4D]">
                    <DollarSign className="w-4 h-4" />
                    <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold">The Inertia Cost</h5>
                  </div>
                  <div className="p-4 border border-[#F5F2EA] bg-[#FFF8F8] text-[#C44D4D]">
                    <span className="font-serif text-xl font-bold">
                      {frictionPoints.find(f => f.id === activeFriction)?.inertiaCost}
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-neutral-400">The calculated weekly loss of institutional capital by maintaining the status quo.</p>
                </div>
              </div>

              {/* Gap 3: Protocol Correction (The Real Fix) */}
              <div className="space-y-6 pt-12 border-t border-[#F5F2EA]">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-[#8A6A2F]" />
                  <h3 className="font-serif text-2xl text-[#2C2416]">Proposed <span className="italic">Protocol Correction</span></h3>
                </div>
                <div className="bg-[#F9F6EF] p-8 font-mono text-xs leading-relaxed text-[#5C4E36] border border-[#D4C5A8]/20 shadow-inner">
                  <span className="block text-[#8A6A2F] mb-4 uppercase tracking-[0.2em] font-bold">// ARCHITECT'S SCRIPTED CORRECTION</span>
                  "Deploy a Distributed Authorization Matrix. Revoke centralized signing rights for transactions under $50k. Implement a 24-hour 'Silence is Consent' rule for Level-2 stakeholders."
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button className="flex-1 py-4 bg-[#2C2416] text-white font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-[#8A6A2F] transition-all shadow-xl">
                  Deploy Correction
                </button>
                <button className="px-10 py-4 border border-[#D4C5A8] text-[#8A6A2F] font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-[#F9F6EF] transition-all">
                  Request Forensic Deep-Trace
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <Hexagon className="w-12 h-12 text-[#D4C5A8]" />
              <p className="font-serif italic text-xl">Awaiting Selection</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 border-t border-[#D4C5A8]/20 bg-[#F9F6EF] text-center">
        <p className="font-mono text-[7px] uppercase tracking-[0.6em] text-[#B8A77C]">
          Abraham of London // Institutional Forensics // MMXXVI
        </p>
      </div>
    </div>
  );
}

function MoveRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8L22 12L18 16" /><path d="M2 12H22" />
    </svg>
  );
}