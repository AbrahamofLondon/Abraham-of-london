"use client";

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import FormulaInspector from "@/components/debug/FormulaInspector";
import ComparisonDelta from "@/components/analysis/ComparisonDelta";
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Landmark, 
  RefreshCcw, 
  FileCheck, 
  Scale,
  ChevronRight
} from "lucide-react";

export default function OGRStressTest() {
  const { 
    resonanceScore, 
    marketFriction, 
    targetRevenue, 
    computed, 
    setResonance, 
    setFriction, 
    setRevenue, 
    commitReport 
  } = useOGRStore();

  const handleManualCommit = async () => {
    const res = await commitReport();
    if (res.success) {
      alert(`ARCHIVED TO PORTFOLIO: ${res.id}`);
    } else {
      alert("CRITICAL: Transmission Failure to OGR Node.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] p-6 lg:p-20 font-mono selection:bg-[#8A6A2F] selection:text-white">
      
      {/* --- HEADER PROTOCOL --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-white/10 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-5 h-5 text-[#8A6A2F] animate-pulse" />
              <div className="absolute inset-0 bg-[#8A6A2F]/20 blur-lg animate-ping" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#8A6A2F] font-bold">
              Institutional Stress Test // OGR-V3
            </span>
          </div>
          <h1 className="text-4xl font-serif italic uppercase text-white tracking-tighter">
            Exhaustive <span className="not-italic font-sans font-black">Resonance Audit</span>
          </h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest max-w-xl leading-relaxed">
            Simulating geometric efficiency within the Sovereign Engine. Adjust variables below to calculate 
            real-time Alpha yields and execution certainty.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
           <button 
             onClick={handleManualCommit} 
             className="flex items-center gap-3 px-6 py-3 bg-[#8A6A2F] text-white text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-[#A68B56] active:scale-95 transition-all shadow-[0_0_20px_rgba(138,106,47,0.3)]"
           >
             <FileCheck className="w-4 h-4" /> Commit Snapshot
           </button>
           <button 
             onClick={() => { setResonance(92.5); setFriction(65); setRevenue(100); }} 
             className="flex items-center gap-3 px-6 py-3 border border-white/10 text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:bg-white/5 hover:text-white transition-all"
           >
             <RefreshCcw className="w-4 h-4" /> Hard Reset
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* --- LEFT COLUMN: CONTROL & DELTA --- */}
        <aside className="lg:col-span-4 space-y-12">
          
          {/* Comparison Delta View */}
          <ComparisonDelta />

          {/* Control Deck */}
          <div className="space-y-12 bg-white/[0.03] p-10 border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Scale className="w-12 h-12 text-[#8A6A2F]" />
            </div>
            
            <h2 className="text-[11px] text-[#8A6A2F] font-bold tracking-[0.3em] border-b border-white/10 pb-4 uppercase flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Constraints
            </h2>

            <ControlGroup 
              label="Core Resonance" 
              value={resonanceScore} 
              min={0} 
              max={100} 
              step={0.1} 
              onChange={setResonance} 
              color="#8A6A2F" 
              description="Alignment of internal resources to OGR protocols."
            />

            <ControlGroup 
              label="Market Friction" 
              value={marketFriction} 
              min={0} 
              max={99.9} 
              step={0.1} 
              onChange={setFriction} 
              color="#C44D4D" 
              description="External resistance and legacy drag coefficient."
            />

            <ControlGroup 
              label="Revenue Baseline" 
              value={targetRevenue} 
              min={10} 
              max={5000} 
              step={10} 
              onChange={setRevenue} 
              color="#FFFFFF" 
              unit="M"
              description="Total capital at risk within this execution cycle."
            />
          </div>
        </aside>

        {/* --- RIGHT COLUMN: DERIVED OUTPUTS --- */}
        <main className="lg:col-span-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <FormulaInspector type="tax">
              <MetricBlock 
                icon={<ShieldAlert className="w-5 h-5" />} 
                label="Integration Tax" 
                value={`${computed.integrationTax}%`} 
                sub="Capital Dissonance Cost" 
                isCritical={computed.integrationTax > 25} 
              />
            </FormulaInspector>
            
            <FormulaInspector type="velocity">
              <MetricBlock 
                icon={<Zap className="w-5 h-5" />} 
                label="Velocity Multiplier" 
                value={`${computed.velocityMultiplier}x`} 
                sub="Growth Efficiency Vector" 
                isCritical={computed.velocityMultiplier < 1.2} 
              />
            </FormulaInspector>

            <FormulaInspector type="alpha">
              <MetricBlock 
                icon={<Landmark className="w-5 h-5" />} 
                label="Resonance Alpha" 
                value={`$${computed.resonanceAlpha}M`} 
                sub="Geometric Profit Surplus" 
                isCritical={computed.resonanceAlpha < 0} 
              />
            </FormulaInspector>

            <FormulaInspector type="certainty">
              <div className={`p-10 border transition-all duration-700 relative overflow-hidden group ${
                computed.isAuthorizedToExecute 
                ? 'border-[#8A6A2F]/40 bg-[#8A6A2F]/5' 
                : 'border-red-900/40 bg-red-900/10'
              }`}>
                <div className="relative z-10">
                  <span className="text-[10px] uppercase text-neutral-500 block mb-2 tracking-[0.2em]">
                    Sovereign Certainty Index
                  </span>
                  <span className="text-7xl font-serif italic block mb-6 tracking-tighter text-white">
                    {computed.sovereignCertainty}%
                  </span>
                  
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${
                        computed.isAuthorizedToExecute ? 'bg-[#8A6A2F]' : 'bg-red-800'
                      }`} 
                      style={{ width: `${computed.sovereignCertainty}%` }} 
                    />
                  </div>
                </div>
                {/* Decorative UI element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              </div>
            </FormulaInspector>

          </div>

          {/* Institutional Validation Checklist */}
          <div className="p-10 border border-white/5 bg-white/[0.01] backdrop-blur-sm">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.4em] border-b border-white/10 pb-6 mb-8">
              Protocol Integrity Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <StatusItem label="Symmetry Gate" active={resonanceScore > 85} desc="High internal alignment" />
              <StatusItem label="Friction Absorption" active={computed.integrationTax < 20} desc="Efficient entropy handling" />
              <StatusItem label="Alpha Positive" active={computed.resonanceAlpha > 0} desc="Capital generation active" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** --- SUB-COMPONENTS --- **/

function ControlGroup({ label, value, min, max, step, onChange, color, unit = "%", description }: any) {
  return (
    <div className="space-y-6 group">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest group-hover:text-white transition-colors">
            {label}
          </span>
          <p className="text-[8px] text-neutral-600 italic uppercase tracking-tighter uppercase">
            {description}
          </p>
        </div>
        <span className="text-lg font-serif tabular-nums" style={{ color }}>
          {unit === 'M' ? `$${value}${unit}` : `${value}${unit}`}
        </span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-all"
        style={{ accentColor: color }} 
      />
    </div>
  );
}

function MetricBlock({ icon, label, value, sub, isCritical }: any) {
  return (
    <div className={`p-10 border transition-all duration-500 cursor-help relative group ${
      isCritical 
      ? 'border-red-900/50 bg-red-900/5 hover:bg-red-900/10' 
      : 'border-white/5 hover:border-[#8A6A2F]/40 bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      <div className={`${isCritical ? 'text-red-500' : 'text-[#8A6A2F]'} mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] uppercase text-neutral-500 block mb-1 tracking-[0.2em]">
        {label}
      </span>
      <span className="text-4xl font-serif text-white block mb-3 group-hover:translate-x-1 transition-transform">
        {value}
      </span>
      <span className="text-[9px] italic text-neutral-600 uppercase tracking-tighter">
        {sub}
      </span>
    </div>
  );
}

function StatusItem({ label, active, desc }: { label: string, active: boolean, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-1.5 w-2 h-2 rounded-full transition-all duration-1000 ${
        active 
        ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' 
        : 'bg-red-900 opacity-30'
      }`} />
      <div className="space-y-1">
        <span className={`block text-[10px] uppercase tracking-widest font-bold ${active ? 'text-white' : 'text-neutral-700'}`}>
          {label}
        </span>
        <span className="block text-[8px] text-neutral-600 uppercase tracking-tighter">
          {desc}
        </span>
      </div>
    </div>
  );
}