"use client";

import React, { useState } from "react";
import { Scale, Activity, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen, Target, BarChart4 } from "lucide-react";

interface Criterion {
  id: string;
  category: "Structural" | "Operational" | "Cultural";
  label: string;
  weight: number;
  score: number;
  rationale: string;
}

export default function ResonanceFilter() {
  const [criteria, setCriteria] = useState<Criterion[]>([
    { 
      id: "C1", 
      category: "Structural", 
      label: "Data Architecture Symmetry", 
      weight: 0.25, 
      score: 7,
      rationale: "Measures the cost of mapping legacy silos to the OGR Unified Data Layer."
    },
    { 
      id: "C2", 
      category: "Operational", 
      label: "Decision Latency Match", 
      weight: 0.20, 
      score: 5,
      rationale: "Evaluates if the target's approval speed will act as an anchor on the Core's velocity."
    },
    { 
      id: "C3", 
      category: "Cultural", 
      label: "Resonance Policy Alignment", 
      weight: 0.20, 
      score: 8,
      rationale: "Assesses the target workforce's readiness for autonomous alignment protocols."
    },
    { 
      id: "C4", 
      category: "Structural", 
      label: "Reporting Line Geometry", 
      weight: 0.15, 
      score: 4,
      rationale: "Identifies vertical friction in hierarchy that contradicts OGR's horizontal flow."
    },
    { 
      id: "C5", 
      category: "Operational", 
      label: "Unit Economic Fidelity", 
      weight: 0.20, 
      score: 6,
      rationale: "Validates if the target's margin structure is a geometric fit for the OGR floor."
    },
  ]);

  const updateScore = (id: string, newScore: number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, score: newScore } : c));
  };

  const totalResonance = criteria.reduce((acc, c) => acc + (c.score * c.weight), 0);
  const integrationTax = ((10 - totalResonance) * 1.5).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl bg-[#FDFBF7] border border-[#D4C5A8]/40 shadow-2xl my-20 font-sans text-[#2C2416] overflow-hidden">
      
      {/* 1. THE THESIS: Strategic Justification */}
      <div className="bg-[#1A160F] p-12 text-[#F9F7F2] border-b-4 border-[#8A6A2F]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8A6A2F]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">The Thesis</span>
            </div>
            <h2 className="font-serif text-3xl leading-tight italic">
              Expansion without <span className="text-[#8A6A2F] not-italic">Resonance</span> is simply the accumulation of Drag.
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Phase III assumes that growth is a function of geometric compatibility. We do not seek "synergy" (a qualitative hope); 
              we seek "Resonance" (a quantitative match). This filter prevents the "Infection of Friction" from the target to the Core.
            </p>
          </div>
          <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#8A6A2F]" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A6A2F]">Methodology</span>
            </div>
            <ul className="space-y-3 font-mono text-[8px] uppercase tracking-[0.1em] text-neutral-300">
              <li>• Weighted Factor Analysis (WFA)</li>
              <li>• Geometric Entropy Modelling</li>
              <li>• Integration Tax Forecasting (ITF)</li>
              <li>• Resilience-to-Dissonance Ratio</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* 2. THE DIAGNOSTIC: Verification Matrix */}
        <div className="lg:col-span-7 p-12 border-r border-[#F5F2EA]">
          <div className="flex items-center gap-3 mb-10">
            <Target className="w-5 h-5 text-[#8A6A2F]" />
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#2C2416] font-bold">Resonance Verification Matrix</h3>
          </div>
          
          <div className="space-y-10">
            {criteria.map((c) => (
              <div key={c.id} className="group space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-[#8A6A2F] uppercase font-bold tracking-widest">[{c.category}]</span>
                    <h4 className="font-serif text-lg text-[#2C2416]">{c.label}</h4>
                    <p className="text-[10px] text-neutral-500 italic max-w-md">{c.rationale}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-xl text-[#2C2416]">{c.score}</span>
                    <span className="block text-[8px] uppercase text-neutral-400">Weight: {c.weight * 100}%</span>
                  </div>
                </div>
                <input 
                  type="range" min="1" max="10" value={c.score}
                  onChange={(e) => updateScore(c.id, parseInt(e.target.value))}
                  className="w-full accent-[#8A6A2F] h-1.5 bg-[#F5F2EA] appearance-none cursor-pointer rounded-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. THE OUTCOME: Decision Lock */}
        <div className="lg:col-span-5 p-12 bg-[#F5F2EA]/30 space-y-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart4 className="w-4 h-4 text-[#8A6A2F]" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Projected Outcomes</span>
            </div>

            <div className="bg-white p-8 border border-[#D4C5A8]/30 shadow-sm space-y-2">
               <span className="block font-mono text-[9px] uppercase text-[#8A6A2F]">Resonance Coefficient</span>
               <div className="flex items-baseline gap-2">
                 <span className="font-serif text-6xl font-light">{totalResonance.toFixed(2)}</span>
                 <span className="font-mono text-sm text-neutral-400">/ 10.0</span>
               </div>
            </div>

            <div className="bg-[#FFF8F8] p-8 border border-red-100 space-y-2">
               <div className="flex justify-between items-center text-red-700">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-red-800">Integration Tax</span>
                  <ShieldAlert className="w-4 h-4" />
               </div>
               <p className="text-4xl font-serif text-red-950">{integrationTax}%</p>
               <p className="text-[10px] text-red-800/70 leading-relaxed font-medium">
                  This tax represents the immediate dilution of Core Efficiency. A score below 7.5 suggests the cost of alignment exceeds the target's value.
               </p>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Final Recommendation</h5>
            {totalResonance >= 7.5 ? (
              <div className="p-6 bg-green-50 border border-green-200 text-green-800 space-y-2">
                <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                  <CheckCircle2 className="w-4 h-4" /> Verified: Geometric Fit
                </div>
                <p className="text-[11px] leading-relaxed italic">Proceed to Stage III.B. Target is capable of autonomous synchronization.</p>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                  <AlertTriangle className="w-4 h-4" /> Warning: Dissonance Risk
                </div>
                <p className="text-[11px] leading-relaxed italic">Integration requires manual architectural intervention. Possible value-leakage detected.</p>
              </div>
            )}
          </div>

          <button className="w-full py-5 bg-[#2C2416] text-[#F9F7F2] font-mono text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-[#8A6A2F] transition-all shadow-xl">
            Authorize Briefing 076
          </button>
        </div>
      </div>

      <div className="p-8 border-t border-[#F5F2EA] bg-white flex justify-between items-center px-12">
        <p className="font-mono text-[7px] uppercase tracking-[0.6em] text-[#B8A77C]">
          Abraham of London // Institutional Logic Gate // MMXXVI
        </p>
        <span className="font-serif italic text-[10px] text-neutral-400">Veritas et Geometrica</span>
      </div>
    </div>
  );
}