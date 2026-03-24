"use client";

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  Zap, 
  Anchor, 
  XCircle,
  TrendingUp
} from "lucide-react";

export default function ComparisonDelta() {
  const { 
    computed, 
    baseline, 
    setBaseline, 
    clearBaseline, 
    resonanceScore 
  } = useOGRStore();

  // Initial State: Lock Button
  if (!baseline) {
    return (
      <button 
        onClick={setBaseline}
        className="w-full py-12 border-2 border-dashed border-[#8A6A2F]/20 bg-white/[0.01] hover:bg-[#8A6A2F]/5 hover:border-[#8A6A2F]/40 transition-all group relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col items-center">
          <Anchor className="w-8 h-8 mb-4 text-[#8A6A2F] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500 group-hover:text-[#8A6A2F] transition-colors">
            Initialize Delta Baseline
          </span>
          <p className="text-[8px] text-neutral-700 uppercase mt-2 tracking-tighter">
            Snapshot current state for strategic comparison
          </p>
        </div>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#8A6A2F]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  // Active State: Comparison Math
  const deltas = {
    alpha: computed.resonanceAlpha - baseline.resonanceAlpha,
    certainty: computed.sovereignCertainty - baseline.sovereignCertainty,
    velocity: computed.velocityMultiplier - baseline.velocityMultiplier,
  };

  const resonanceDiff = resonanceScore - baseline.resonanceScore;

  return (
    <div className="bg-[#0A0C10] border border-[#8A6A2F]/30 p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background Watermark */}
      <Target className="absolute -right-10 -bottom-10 w-48 h-48 text-white/[0.02] rotate-12 pointer-events-none" />

      {/* Header Section */}
      <div className="flex justify-between items-start mb-10 border-b border-white/10 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-[#8A6A2F]" />
            <h3 className="font-serif italic text-2xl text-white tracking-tight">
              Delta <span className="not-italic font-sans font-bold text-[#8A6A2F]">Projection</span>
            </h3>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
            Audit vs. Locked Baseline Snapshot
          </p>
        </div>
        <button 
          onClick={clearBaseline} 
          className="group flex items-center gap-2 text-[9px] uppercase font-bold text-neutral-500 hover:text-red-500 transition-colors"
        >
          <XCircle className="w-3 h-3 transition-transform group-hover:rotate-90" />
          Release Lock
        </button>
      </div>

      {/* Delta Rows */}
      <div className="space-y-10 relative z-10">
        <DeltaRow 
          label="Alpha Yield Delta" 
          value={`$${Math.abs(deltas.alpha).toFixed(2)}M`} 
          isPositive={deltas.alpha >= 0} 
          sub={`Baseline: $${baseline.resonanceAlpha}M`}
        />
        <DeltaRow 
          label="Sovereign Certainty" 
          value={`${Math.abs(deltas.certainty).toFixed(2)}%`} 
          isPositive={deltas.certainty >= 0} 
          sub={`Baseline: ${baseline.sovereignCertainty}%`}
        />
        <DeltaRow 
          label="Execution Velocity" 
          value={`${Math.abs(deltas.velocity).toFixed(2)}x`} 
          isPositive={deltas.velocity >= 0} 
          sub={`Baseline: ${baseline.velocityMultiplier}x`}
        />
      </div>

      {/* Footer Insight */}
      <div className="mt-12 pt-8 border-t border-white/5 bg-gradient-to-r from-transparent via-[#8A6A2F]/5 to-transparent -mx-10 px-10">
        <div className="flex items-center gap-4 text-[#8A6A2F]">
          <div className="relative">
            <Zap className="w-4 h-4 animate-pulse" />
            <div className="absolute inset-0 bg-[#8A6A2F]/40 blur-md animate-ping" />
          </div>
          <div className="space-y-0.5">
            <span className="block font-mono text-[10px] uppercase tracking-widest font-bold">
              Strategic Optimization
            </span>
            <span className="block font-mono text-[9px] text-neutral-500 lowercase">
              {resonanceDiff >= 0 ? 'gained' : 'sacrificed'} {Math.abs(resonanceDiff).toFixed(1)}% core resonance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeltaRow({ label, value, isPositive, sub }: any) {
  return (
    <div className="flex justify-between items-center group/row">
      <div className="space-y-1">
        <span className="block font-mono text-[10px] uppercase text-neutral-400 tracking-[0.1em] group-hover/row:text-white transition-colors">
          {label}
        </span>
        <span className="block font-mono text-[8px] uppercase text-neutral-600 italic tracking-tighter">
          {sub}
        </span>
      </div>
      <div className={`text-right px-4 py-2 border-l-2 ${
        isPositive ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'
      }`}>
        <div className="flex items-center justify-end gap-2">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 animate-bounce" />
          ) : (
            <ArrowDownRight className="w-4 h-4 animate-bounce" />
          )}
          <span className="text-3xl font-serif tabular-nums tracking-tighter">
            {isPositive ? '+' : '-'}{value}
          </span>
        </div>
      </div>
    </div>
  );
}