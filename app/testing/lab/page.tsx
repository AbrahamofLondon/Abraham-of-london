/* app/testing/lab/page.tsx — OGR DIAGNOSTIC LAB */
'use client';

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { Terminal, Activity, ShieldAlert, Zap, Landmark, RefreshCcw, FileCheck, Gauge, TrendingUp, TrendingDown } from "lucide-react";

export default function LabPage() {
  const { 
    resonanceScore, 
    marketFriction, 
    targetRevenue, 
    computed, 
    setResonance, 
    setFriction, 
    setRevenue, 
    commitReport,
    setBaseline,
    clearBaseline,
    getDeltaFromBaseline
  } = useOGRStore();

  const delta = getDeltaFromBaseline();

  const handleCommit = async () => {
    const res = await commitReport();
    if (res.success) alert(`Archived: ${res.id}`);
  };

  const handleReset = () => {
    setResonance(92.5);
    setFriction(65);
    setRevenue(100);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] p-12 lg:p-24 font-mono">
      <header className="flex justify-between items-end mb-20 border-b border-white/10 pb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-[#8A6A2F]" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#8A6A2F]">OGR Diagnostic Lab</span>
          </div>
          <h1 className="text-3xl font-serif italic uppercase text-white">Resonance Audit</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={setBaseline} className="flex items-center gap-2 px-4 py-2 border border-white/20 text-[9px] uppercase hover:bg-white/10">
            <Gauge className="w-3 h-3" /> Lock Baseline
          </button>
          <button onClick={clearBaseline} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[9px] uppercase hover:bg-white/5">
            Clear
          </button>
          <button onClick={handleCommit} className="flex items-center gap-2 px-4 py-2 bg-[#8A6A2F] text-white text-[9px] uppercase font-bold hover:brightness-110">
            <FileCheck className="w-3 h-3" /> Commit
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-white/20 text-[9px] uppercase hover:bg-white/10">
            <RefreshCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-16">
          <div className="space-y-10 bg-white/5 p-10 border border-white/5">
            <h2 className="text-[11px] text-[#8A6A2F] font-bold tracking-[0.2em] border-b border-white/10 pb-4 uppercase">Controls</h2>
            <Control label="Resonance" value={resonanceScore} min={0} max={100} step={0.1} onChange={setResonance} color="#8A6A2F" unit="%" />
            <Control label="Friction" value={marketFriction} min={0} max={99.9} step={0.1} onChange={setFriction} color="#C44D4D" unit="%" />
            <Control label="Revenue" value={targetRevenue} min={10} max={5000} step={10} onChange={setRevenue} color="#FFF" unit="M" prefix="$" />
          </div>

          {delta && (
            <div className="bg-white/5 p-6 border border-white/10">
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/40 mb-4">Drift from Baseline</h3>
              <div className="space-y-3">
                <Delta label="Resonance" value={delta.resonanceScore} unit="%" />
                <Delta label="Friction" value={delta.marketFriction} unit="%" />
                <Delta label="Revenue" value={delta.targetRevenue} unit="M" prefix="$" />
                <Delta label="Tax" value={delta.integrationTax} unit="%" />
                <Delta label="Velocity" value={delta.velocityMultiplier} unit="x" />
                <Delta label="Alpha" value={delta.resonanceAlpha} unit="M" prefix="$" />
                <Delta label="Certainty" value={delta.sovereignCertainty} unit="%" />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Metric icon={<ShieldAlert className="w-4 h-4" />} label="Integration Tax" value={`${computed.integrationTax}%`} sub="Dissonance Cost" critical={computed.integrationTax > 25} />
            <Metric icon={<Zap className="w-4 h-4" />} label="Velocity Vector" value={`${computed.velocityMultiplier}x`} sub="Growth Efficiency" critical={computed.velocityMultiplier < 1.2} />
            <Metric icon={<Landmark className="w-4 h-4" />} label="Resonance Alpha" value={`$${computed.resonanceAlpha}M`} sub="Geometric Surplus" critical={computed.resonanceAlpha < 0} />
            
            <div className={`p-10 border ${computed.isAuthorizedToExecute ? 'border-[#8A6A2F]/30 bg-[#8A6A2F]/5' : 'border-red-900/40 bg-red-900/5'}`}>
              <Activity className={`w-4 h-4 mb-6 ${computed.isAuthorizedToExecute ? 'text-[#8A6A2F]' : 'text-red-500'}`} />
              <span className="text-[10px] uppercase text-neutral-500 block mb-1 tracking-[0.2em]">Sovereign Certainty</span>
              <span className="text-6xl font-serif italic block mb-4 text-white">{computed.sovereignCertainty}%</span>
              <div className="h-1 w-full bg-white/5 overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${computed.isAuthorizedToExecute ? 'bg-[#8A6A2F]' : 'bg-red-800'}`} style={{ width: `${computed.sovereignCertainty}%` }} />
              </div>
              <div className="mt-4 text-[8px] text-white/30 uppercase tracking-widest">
                {computed.isAuthorizedToExecute ? "Authorized for Execution" : "Requires Realignment"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Control({ label, value, min, max, step, onChange, color, unit, prefix = "" }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: string; unit: string; prefix?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between text-[10px] font-bold">
        <span className="text-neutral-500 uppercase tracking-widest">{label}</span>
        <span style={{ color }}>{prefix}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full opacity-70 hover:opacity-100" style={{ accentColor: color }} />
    </div>
  );
}

function Metric({ icon, label, value, sub, critical }: { icon: React.ReactNode; label: string; value: string; sub: string; critical: boolean }) {
  return (
    <div className={`p-10 border transition-all ${critical ? 'border-red-900/50 bg-red-900/5' : 'border-white/5 hover:border-[#8A6A2F]/30 bg-white/[0.02]'}`}>
      <div className={`${critical ? 'text-red-500' : 'text-[#8A6A2F]'} mb-6`}>{icon}</div>
      <span className="text-[10px] uppercase text-neutral-500 block mb-1 tracking-[0.2em]">{label}</span>
      <span className="text-3xl font-serif text-white block mb-2">{value}</span>
      <span className="text-[8px] italic text-neutral-600 uppercase tracking-tighter">{sub}</span>
    </div>
  );
}

function Delta({ label, value, unit, prefix = "" }: { label: string; value?: number; unit: string; prefix?: string }) {
  if (value === undefined) return null;
  const isPos = value > 0;
  const isNeg = value < 0;
  const abs = Math.abs(value).toFixed(1);
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-white/50 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        {isPos && <TrendingUp className="w-3 h-3 text-green-500" />}
        {isNeg && <TrendingDown className="w-3 h-3 text-red-500" />}
        <span className={isPos ? "text-green-500" : isNeg ? "text-red-500" : "text-white/40"}>
          {isPos ? "+" : ""}{abs}{unit}
        </span>
      </div>
    </div>
  );
}