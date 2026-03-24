"use client";

import React from "react";
import { Globe, Crosshair, Zap, BarChart3, TrendingUp } from "lucide-react";

export default function MarketCaptureDashboard() {
  const targetMarkets = [
    { name: "Sector Alpha", alignment: 82, potential: "High", risk: "Low" },
    { name: "Global Logistics", alignment: 44, potential: "Critical", risk: "Med" },
    { name: "Digital Infrastructure", alignment: 91, potential: "Max", risk: "Low" },
  ];

  return (
    <div className="mx-auto max-w-6xl bg-[#050505] p-12 border border-brand-gold/30 shadow-[0_0_80px_rgba(184,155,110,0.1)] my-20">
      
      {/* Header: The Expansion Mandate */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-px bg-brand-gold" />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-brand-gold">
              Phase III // External Expansion
            </span>
          </div>
          <h2 className="font-serif text-4xl text-brand-cream italic">
            Market Capture <span className="not-italic text-white">Resonance</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-3 border border-brand-gold/10 bg-brand-gold/5 text-right">
             <span className="block font-mono text-[8px] uppercase text-brand-gold/60">Expansion Velocity</span>
             <span className="font-serif text-xl text-brand-cream">4.2x Baseline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* The Visual Engine: The Expansion Radar */}
        <div className="lg:col-span-7 relative h-[500px] border border-brand-gold/5 bg-gradient-to-b from-white/[0.02] to-transparent flex items-center justify-center overflow-hidden">
          {/* Animated Concentric Waves */}
          <div className="absolute w-24 h-24 bg-brand-gold/20 rounded-full blur-2xl animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="absolute border border-brand-gold/10 rounded-full animate-[ping_4s_linear_infinite]"
              style={{ 
                width: `${i * 150}px`, 
                height: `${i * 150}px`,
                animationDelay: `${i * 1}s`
              }}
            />
          ))}
          
          <div className="relative z-10 text-center">
            <Globe className="w-12 h-12 text-brand-gold mx-auto mb-4 opacity-80" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-gold">Central Core: Stabilized</span>
          </div>

          {/* Floating Data Points */}
          <div className="absolute top-20 right-20 flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 border border-brand-gold/20">
             <Crosshair className="w-4 h-4 text-brand-gold" />
             <span className="font-mono text-[8px] uppercase text-brand-cream">Target: Sector Alpha</span>
          </div>
        </div>

        {/* The Target Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-brand-gold/60 mb-8 border-b border-brand-gold/10 pb-4">
            Expansion Vectors
          </h3>
          
          {targetMarkets.map((market, i) => (
            <div key={i} className="group p-6 border border-white/5 hover:border-brand-gold/30 transition-all duration-500 cursor-pointer">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-serif text-xl text-brand-cream">{market.name}</h4>
                <TrendingUp className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block font-mono text-[7px] uppercase text-neutral-500">Resonance Fit</span>
                  <div className="w-full bg-white/5 h-1">
                    <div className="bg-brand-gold h-full" style={{ width: `${market.alignment}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-[7px] uppercase text-neutral-500">Yield Potential</span>
                  <span className="font-serif text-sm text-brand-cream">{market.potential}</span>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full py-4 mt-8 bg-brand-gold text-brand-charcoal font-mono text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-brand-cream transition-all">
            Execute Global Synthesis
          </button>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-16 pt-8 border-t border-brand-gold/10 flex justify-between items-center">
        <div className="flex gap-8">
           <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-brand-gold" />
              <span className="font-mono text-[8px] uppercase text-neutral-500">Market Displacement Active</span>
           </div>
           <div className="flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-brand-gold" />
              <span className="font-mono text-[8px] uppercase text-neutral-500">Protocol: OGR-76-GLOBAL</span>
           </div>
        </div>
        <p className="font-serif italic text-xs text-brand-gold/40">Abraham of London // The Expansion Doctrine</p>
      </div>
    </div>
  );
}