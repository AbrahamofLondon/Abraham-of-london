"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Zap, Lock, RefreshCcw, BarChart3, Fingerprint } from "lucide-react";

interface CoherenceMetrics {
  initialDissonance: number;
  currentDissonance: number;
  resonanceFidelity: number;
  isLocked: boolean;
}

export default function OGRCoherenceLock({ organisationName = "The Institution" }) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<CoherenceMetrics>({
    initialDissonance: 84,
    currentDissonance: 12,
    resonanceFidelity: 96.4,
    isLocked: false
  });

  const handleFinalLock = () => {
    setLoading(true);
    // Simulate the final geometric trace
    setTimeout(() => {
      setMetrics(prev => ({ ...prev, isLocked: true }));
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-5xl bg-white border border-[#D4C5A8]/30 shadow-2xl my-24 overflow-hidden relative">
      
      {/* 1. Status Bar: The "Live" Verification Signal */}
      <div className="bg-[#2C2416] px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${metrics.isLocked ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-[#8A6A2F] animate-pulse'}`} />
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#F9F7F2]">
            System Status: {metrics.isLocked ? "Institutional Resonance Verified" : "Verification in Progress"}
          </span>
        </div>
        <span className="font-mono text-[8px] text-[#8A6A2F] uppercase tracking-widest">AOL-CORE-SECURE</span>
      </div>

      <div className="p-16 space-y-16">
        
        {/* 2. The Verification Delta: Proof of Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-[#F5F2EA] pb-16">
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#8A6A2F] tracking-widest">Initial Dissonance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif text-[#2C2416] opacity-30 italic line-through">{metrics.initialDissonance}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#8A6A2F] tracking-widest">Current Dissonance</span>
            <div className="flex items-baseline gap-2 text-green-700">
              <span className="text-4xl font-serif">{metrics.currentDissonance}%</span>
              <span className="text-xs font-mono lowercase tracking-tighter">post-correction</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#8A6A2F] tracking-widest text-right block">Resonance Fidelity</span>
            <div className="flex items-baseline justify-end gap-2 text-[#2C2416]">
              <span className="text-4xl font-serif italic">{metrics.resonanceFidelity}%</span>
            </div>
          </div>
        </div>

        {/* 3. The Visual "Lock" State */}
        <div className="flex flex-col items-center justify-center space-y-8 py-10 relative">
          
          {/* Decorative Geometry Circles */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <div className="w-[300px] h-[300px] border-[0.5px] border-[#8A6A2F] rounded-full animate-[spin_40s_linear_infinite]" />
             <div className="w-[350px] h-[350px] border-[0.5px] border-[#8A6A2F] rounded-full animate-[spin_60s_linear_infinite_reverse]" />
          </div>

          <div className={`p-10 rounded-full border-2 transition-all duration-1000 ${metrics.isLocked ? 'border-green-600 bg-green-50/50' : 'border-[#D4C5A8] bg-[#FDFBF7]'}`}>
            {loading ? (
              <RefreshCcw className="w-16 h-16 text-[#8A6A2F] animate-spin" />
            ) : metrics.isLocked ? (
              <ShieldCheck className="w-16 h-16 text-green-600 animate-in zoom-in duration-500" />
            ) : (
              <Fingerprint className="w-16 h-16 text-[#D4C5A8]" />
            )}
          </div>

          <div className="text-center max-w-sm space-y-3">
            <h3 className="font-serif text-2xl text-[#2C2416]">
              {metrics.isLocked ? "Institutional Coherence Locked" : "Initialize Coherence Lock"}
            </h3>
            <p className="font-sans text-xs text-[#5C4E36] leading-relaxed">
              {metrics.isLocked 
                ? "The new institutional architecture is now stabilized. Autonomous alignment protocols are active."
                : "Finalize the geometric verification. This will seal the Stage 02 interventions and lock the new operating protocol."
              }
            </p>
          </div>

          {!metrics.isLocked && (
            <button 
              onClick={handleDownloadAccord}
              className="px-16 py-4 bg-[#2C2416] text-white font-mono text-[10px] uppercase tracking-[0.4em] hover:bg-[#8A6A2F] transition-all duration-700 shadow-2xl relative z-10 overflow-hidden"
              onClick={handleFinalLock}
              disabled={loading}
            >
              {loading ? "Tracing Institutional Flow..." : "Lock Final Geometry"}
            </button>
          )}
        </div>

        {/* 4. Strategic Certification Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-[#F5F2EA]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8A6A2F]" />
              <h5 className="font-mono text-[10px] uppercase tracking-widest text-[#2C2416]">Validation Proof</h5>
            </div>
            <p className="font-sans text-[10px] text-neutral-500 leading-relaxed">
              Institutional resonance has been verified against the 75 core intelligence briefs. The variance in {organisationName}'s primary domains is now below the 15% Dissonance Threshold.
            </p>
          </div>
          <div className="flex justify-end items-end space-y-1 text-right">
             <div>
                <p className="font-serif italic text-lg text-[#2C2416]">Abraham of London</p>
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F]">Institutional Architect // MMXXVI</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}