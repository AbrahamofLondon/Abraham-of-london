"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, TrendingUp, Landmark, Share2, Layers, ArrowRight } from "lucide-react";

export default function AsymmetricScaleForecast() {
  const [targetRevenue, setTargetRevenue] = useState(100); // In Millions
  const [marketEfficiency, setMarketEfficiency] = useState(70); // Competitor average

  const calculation = useMemo(() => {
    const legacyCost = targetRevenue * (1 - (marketEfficiency / 100));
    const ogrCost = targetRevenue * 0.12; // OGR Fixed Friction Floor (12%)
    const alpha = (legacyCost - ogrCost).toFixed(2);
    const multiplier = (legacyCost / ogrCost).toFixed(1);

    return { legacyCost, ogrCost, alpha, multiplier };
  }, [targetRevenue, marketEfficiency]);

  return (
    <div className="mx-auto max-w-6xl bg-[#FDFBF7] border border-[#D4C5A8]/50 shadow-2xl my-24 overflow-hidden font-sans">
      
      {/* 1. Header: The Capital Mandate */}
      <div className="p-12 bg-[#1A160F] text-white flex justify-between items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#8A6A2F]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#8A6A2F]">
              Stage III.C // Financial Synthesis
            </span>
          </div>
          <h2 className="font-serif text-4xl italic">
            Asymmetric <span className="not-italic text-[#8A6A2F]">Scale Forecast</span>
          </h2>
        </div>
        <div className="hidden md:block p-4 border border-white/10 bg-white/5 backdrop-blur-md">
           <span className="block font-mono text-[8px] uppercase text-[#8A6A2F] mb-1">Portfolio brief</span>
           <span className="font-mono text-xs italic">AOL-RES-076.B</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* 2. Inputs: Scaling Parameters */}
        <div className="lg:col-span-4 p-12 border-r border-[#F5F2EA] space-y-16">
          <div className="space-y-8">
            <div className="space-y-4">
               <label className="block font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F] font-bold">
                 Expansion Target (USD)
               </label>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-serif">${targetRevenue}M</span>
               </div>
               <input 
                 type="range" min="10" max="1000" step="10" value={targetRevenue}
                 onChange={(e) => setTargetRevenue(parseInt(e.target.value))}
                 className="w-full accent-[#2C2416] h-1 bg-[#F5F2EA] appearance-none cursor-pointer"
               />
            </div>

            <div className="space-y-4">
               <label className="block font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                 Legacy Margin Drag
               </label>
               <div className="flex justify-between font-mono text-xs">
                 <span>{marketEfficiency}% Efficiency</span>
               </div>
               <input 
                 type="range" min="40" max="85" value={marketEfficiency}
                 onChange={(e) => setMarketEfficiency(parseInt(e.target.value))}
                 className="w-full accent-[#8A6A2F] h-1 bg-[#F5F2EA] appearance-none cursor-pointer"
               />
            </div>
          </div>

          <div className="pt-8 border-t border-[#F5F2EA] space-y-4">
            <div className="flex items-start gap-3">
              <Share2 className="w-4 h-4 text-[#8A6A2F] mt-1" />
              <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                Ecosystem Integration allows the OGR Core to absorb external partners without replicating their internal friction.
              </p>
            </div>
          </div>
        </div>

        {/* 3. The Alpha Gap: Visualizing the "OGR Premium" */}
        <div className="lg:col-span-8 p-12 bg-white flex flex-col justify-center">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Legacy Cost of Growth</span>
              <p className="text-4xl font-serif text-red-800">${calculation.legacyCost.toFixed(1)}M</p>
              <div className="h-1.5 w-full bg-red-50 rounded-full overflow-hidden">
                 <div className="h-full bg-red-800 w-[70%]" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A6A2F]">OGR Resonant Cost</span>
              <p className="text-4xl font-serif text-[#2C2416]">${calculation.ogrCost.toFixed(1)}M</p>
              <div className="h-1.5 w-full bg-green-50 rounded-full overflow-hidden">
                 <div className="h-full bg-[#8A6A2F] w-[15%]" />
              </div>
            </div>
          </div>

          {/* The "Alpha" Box */}
          <div className="relative p-10 bg-[#FDFBF7] border-2 border-[#D4C5A8] overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-32 h-32 text-[#8A6A2F]" />
             </div>
             
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2">
                   <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8A6A2F] font-bold">Resonance Alpha</h3>
                   <p className="font-serif text-6xl text-[#2C2416] leading-none">${calculation.alpha}M</p>
                   <p className="text-[11px] text-neutral-500 italic uppercase tracking-tighter">Verified Re-investable Capital</p>
                </div>
                
                <div className="h-px w-12 bg-[#D4C5A8] hidden md:block" />

                <div className="text-center md:text-right">
                   <span className="block font-mono text-[9px] uppercase text-[#8A6A2F] mb-1">Efficiency Multiplier</span>
                   <span className="font-serif text-5xl text-[#2C2416] italic">{calculation.multiplier}x</span>
                </div>
             </div>
          </div>

          {/* Practical Next Step */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-l-4 border-[#2C2416] bg-neutral-50">
            <div className="flex items-center gap-4">
              <Layers className="w-6 h-6 text-[#8A6A2F]" />
              <p className="text-xs font-serif text-[#2C2416] leading-relaxed">
                This capital surplus is ready for <span className="font-bold">Stage III.D: Sovereign Market Integration.</span>
              </p>
            </div>
            <button className="flex items-center gap-3 px-8 py-3 bg-[#2C2416] text-white font-mono text-[9px] uppercase tracking-widest hover:bg-[#8A6A2F] transition-all group">
              Initialise Tier-1 Deployment <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-[#F5F2EA] flex justify-center gap-12">
        <div className="flex items-center gap-2">
           <BarChart3 className="w-3 h-3 text-[#8A6A2F]" />
           <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-neutral-400">Resonance Yield Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
           <Share2 className="w-3 h-3 text-[#8A6A2F]" />
           <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-neutral-400">Ecosystem Link Stable</span>
        </div>
      </div>
    </div>
  );
}