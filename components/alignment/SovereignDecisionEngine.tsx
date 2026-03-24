"use client";

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { ShieldCheck, Cpu, Network, Binary, ArrowRightCircle, Fingerprint, AlertCircle } from "lucide-react";

export default function SovereignDecisionEngine() {
  const { resonanceScore, marketFriction, computed, setResonance, setFriction } = useOGRStore();
  
  // Deterministic Thresholds
  const isAuthorized = computed.sovereignCertainty >= 90;
  const isHighRisk = computed.sovereignCertainty < 75;

  return (
    <div className="mx-auto max-w-7xl bg-[#F9F7F2] border border-[#2C2416] shadow-2xl my-20 font-sans text-[#2C2416] overflow-hidden">
      
      {/* 1. Header: The Sovereign Authority */}
      <div className={`p-16 text-[#F9F7F2] relative transition-colors duration-700 ${isAuthorized ? 'bg-[#2C2416]' : 'bg-[#3D0C0C]'}`}>
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Fingerprint className="w-40 h-40 text-[#8A6A2F]" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-[#8A6A2F]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.6em] text-[#8A6A2F]">
              Stage III.D // Deterministic Execution
            </span>
          </div>
          <h1 className="font-serif text-5xl italic leading-tight">
            The Sovereign <span className="not-italic text-[#8A6A2F]">Decision Engine</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            {isAuthorized ? "Status: Resonance Lock Achieved" : "Status: Awaiting Geometric Alignment"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* 2. Mechanism Verification (The Inputs) */}
        <div className="lg:col-span-7 p-16 space-y-16 border-r border-[#2C2416]/10 bg-white">
          
          <div className="space-y-8">
            <label className="flex justify-between items-end">
              <span className="font-mono text-[11px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#8A6A2F]" /> I. Internal Resonance Fidelity
              </span>
              <span className="font-mono text-xl">{resonanceScore}%</span>
            </label>
            <input 
              type="range" min="0" max="100" step="0.5" value={resonanceScore}
              onChange={(e) => setResonance(Number(e.target.value))}
              className="w-full accent-[#2C2416] h-1.5 bg-neutral-100 appearance-none cursor-pointer rounded-full"
            />
          </div>

          <div className="space-y-8">
            <label className="flex justify-between items-end">
              <span className="font-mono text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 text-red-900">
                <Network className="w-4 h-4" /> II. External Friction Coefficient
              </span>
              <span className="font-mono text-xl">{marketFriction}%</span>
            </label>
            <input 
              type="range" min="0" max="99.9" step="0.5" value={marketFriction}
              onChange={(e) => setFriction(Number(e.target.value))}
              className="w-full accent-red-900 h-1.5 bg-neutral-100 appearance-none cursor-pointer rounded-full"
            />
          </div>

          <div className="p-8 border border-dashed border-[#8A6A2F]/30 bg-[#FDFBF7] space-y-4">
            <h4 className="font-mono text-[10px] uppercase font-bold text-[#8A6A2F]">System Diagnostics</h4>
            <div className="grid grid-cols-2 gap-8 font-mono text-[9px] uppercase tracking-tighter text-neutral-500">
              <div>Integration Tax: <span className="text-[#2C2416] font-bold">{computed.integrationTax}%</span></div>
              <div>Velocity Multiplier: <span className="text-[#2C2416] font-bold">{computed.velocityMultiplier}x</span></div>
            </div>
          </div>
        </div>

        {/* 3. The Sovereign Result (The Deterministic Truth) */}
        <div className={`lg:col-span-5 p-16 flex flex-col justify-between transition-colors duration-500 ${isAuthorized ? 'bg-[#2C2416] text-[#F9F7F2]' : 'bg-[#1A1A1A] text-white'}`}>
          
          <div className="space-y-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#8A6A2F]">Success Probability Matrix</span>
            <div>
              <div className="text-8xl font-serif font-light tracking-tighter leading-none italic">
                {computed.sovereignCertainty.toFixed(2)}<span className="text-3xl text-[#8A6A2F]">%</span>
              </div>
            </div>

            <div className={`p-6 border flex items-start gap-4 ${isAuthorized ? 'border-[#8A6A2F]/40 bg-white/5' : 'border-red-900/40 bg-red-900/5'}`}>
               {isAuthorized ? <ShieldCheck className="w-6 h-6 text-[#8A6A2F]" /> : <AlertCircle className="w-6 h-6 text-red-600" />}
               <p className="text-[10px] uppercase leading-relaxed tracking-widest font-medium">
                 {isAuthorized 
                   ? "Geometric alignment is verified. The OGR Core will absorb this target with negligible drag." 
                   : "Critical Dissonance Alert. Integration tax exceeds yield potential. Authorization Locked."}
               </p>
            </div>
          </div>

          <div className="pt-12">
            <button 
              disabled={!isAuthorized}
              className={`w-full py-6 font-mono text-[11px] uppercase tracking-[0.5em] font-bold transition-all flex items-center justify-center gap-4 group ${
                isAuthorized 
                ? 'bg-[#8A6A2F] text-white hover:bg-[#B8A77C] cursor-pointer' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
              }`}
            >
              {isAuthorized ? "Authorize Sovereign Move" : "Alignment Required"} 
              <ArrowRightCircle className={`w-5 h-5 ${isAuthorized ? 'group-hover:translate-x-2' : ''} transition-transform`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}