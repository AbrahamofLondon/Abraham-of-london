"use client";

import React from "react";
import { Sparkles, Globe, Zap, BarChart3, ArrowUpRight } from "lucide-react";

export default function OGRFutureHorizon() {
  const roadmapSteps = [
    {
      stage: "III.A",
      title: "Market Capture Geometry",
      desc: "Applying resonance protocols to external acquisition and market-share expansion."
    },
    {
      stage: "III.B",
      title: "Asymmetric Scaling",
      desc: "Leveraging the zero-friction internal core to outpace legacy competitors by 3x."
    },
    {
      stage: "III.C",
      title: "Ecosystem Integration",
      desc: "Synchronizing your stabilized geometry with global supply chains and partner networks."
    }
  ];

  return (
    <div className="mx-auto max-w-4xl bg-[#0A0A0A] p-20 shadow-[0_0_100px_rgba(184,155,110,0.1)] my-24 border border-brand-gold/20 relative overflow-hidden group">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] -mr-64 -mt-64 transition-all duration-1000 group-hover:bg-brand-gold/10" />

      {/* 1. The Teaser Header */}
      <div className="relative z-10 space-y-4 mb-20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-brand-gold/60">
            Phase III // The Next Frontier
          </span>
        </div>
        <h2 className="font-serif text-5xl text-brand-cream tracking-tighter leading-tight">
          Market Expansion <br />
          <span className="italic text-brand-gold">Resonance</span>
        </h2>
        <div className="h-px w-24 bg-gradient-to-r from-brand-gold to-transparent mt-8" />
      </div>

      {/* 2. The Thesis: Why Phase III? */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
        <div className="md:col-span-7">
          <p className="font-serif text-lg text-neutral-400 leading-relaxed italic">
            "Internal stability is a prerequisite for external dominance. Now that your core is unified, the organization no longer consumes energy fighting its own friction. That energy must now be weaponized for market capture."
          </p>
        </div>
        <div className="md:col-span-5 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-4 border-l border-brand-gold/20 pl-6">
            <Globe className="w-5 h-5 text-brand-gold/40" />
            <div>
              <span className="block font-mono text-[8px] uppercase text-brand-gold/60">Market Scope</span>
              <span className="font-serif text-brand-cream">Global // Non-Linear</span>
            </div>
          </div>
          <div className="flex items-center gap-4 border-l border-brand-gold/20 pl-6">
            <Zap className="w-5 h-5 text-brand-gold/40" />
            <div>
              <span className="block font-mono text-[8px] uppercase text-brand-gold/60">Velocity Target</span>
              <span className="font-serif text-brand-cream">Resonance-Speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Future Roadmap Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {roadmapSteps.map((step, i) => (
          <div 
            key={i} 
            className="p-8 border border-brand-gold/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 group/item"
          >
            <span className="font-mono text-[10px] text-brand-gold mb-4 block">{step.stage}</span>
            <h4 className="font-serif text-xl text-brand-cream mb-3 group-hover/item:text-brand-gold transition-colors">
              {step.title}
            </h4>
            <p className="font-sans text-[11px] text-neutral-500 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 4. Strategic CTA */}
      <div className="relative z-10 mt-20 flex flex-col items-center">
        <div className="p-8 border border-dashed border-brand-gold/20 w-full text-center hover:border-brand-gold/50 transition-colors cursor-pointer group/cta">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-brand-gold/60 mb-4">
            Request Phase III Briefing
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-serif text-2xl text-brand-cream italic group-hover/cta:mr-4 transition-all duration-500">
              Initialize Market Synthesis
            </span>
            <ArrowUpRight className="w-6 h-6 text-brand-gold" />
          </div>
        </div>
        
        <div className="mt-12 flex items-center gap-6 opacity-40">
           <BarChart3 className="w-4 h-4 text-brand-gold" />
           <span className="font-mono text-[7px] uppercase tracking-[0.6em] text-brand-gold">
             Abraham of London // Intelligence Brief 076 Pending
           </span>
        </div>
      </div>

      {/* Abstract Background Design Element */}
      <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent -translate-y-1/2 rotate-12 pointer-events-none" />
    </div>
  );
}