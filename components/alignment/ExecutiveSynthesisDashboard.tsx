"use client";

import React, { useState } from "react";
import { MoveRight, MousePointer2, Target, MessageSquare, Layers } from "lucide-react";

export default function ExecutiveSynthesisDashboard() {
  const [activeNarrative, setActiveNarrative] = useState(0);

  const narratives = [
    {
      title: "The Legacy Core",
      variance: "12%",
      alignment: "High",
      description: "Focuses on historical stability and institutional reputation.",
      risk: "Stagnation in high-velocity markets."
    },
    {
      title: "The Innovation Vector",
      variance: "44%",
      alignment: "Low",
      description: "Prioritizes aggressive expansion and digital transformation.",
      risk: "Operational 'drag' due to rapid decoupling from core values."
    },
    {
      title: "The Operational Floor",
      variance: "28%",
      alignment: "Moderate",
      description: "Focused on immediate efficiency and friction removal.",
      risk: "Short-termism at the expense of long-term resonance."
    }
  ];

  const activeNarrativeItem = narratives[activeNarrative] ?? narratives[0]!;

  return (
    <div className="mx-auto max-w-6xl bg-[#0A0A0A] p-12 shadow-3xl border border-brand-gold/10 min-h-screen">
      
      {/* 1. Dashboard Navigation Header */}
      <div className="flex justify-between items-center mb-16 border-b border-brand-gold/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-brand-gold flex items-center justify-center font-serif italic text-brand-gold">
            01
          </div>
          <div>
            <h1 className="font-serif text-2xl text-brand-cream tracking-tight">Executive <span className="italic">Synthesis</span></h1>
            <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-brand-gold/40">Stage 01 // Narrative Alignment</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-brand-gold/5 border border-brand-gold/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="font-mono text-[9px] text-brand-gold uppercase tracking-widest">Live Session Active</span>
          </div>
        </div>
      </div>

      {/* 2. The Geometric Variance Map (Visual Centerpiece) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Sidebar: Narrative Profiles */}
        <div className="space-y-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gold/60 mb-6">Narrative Profiles</h3>
          {narratives.map((n, i) => (
            <button
              key={i}
              onClick={() => setActiveNarrative(i)}
              className={`w-full text-left p-6 border transition-all duration-500 ${
                activeNarrative === i 
                ? "bg-brand-gold/10 border-brand-gold border-l-4" 
                : "bg-transparent border-brand-gold/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-serif text-lg text-brand-cream">{n.title}</span>
                <span className="font-mono text-[10px] text-brand-gold">{n.variance} Variance</span>
              </div>
              <p className="font-sans text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                {n.description}
              </p>
            </button>
          ))}
        </div>

        {/* Central Map: The Resonance Target */}
        <div className="lg:col-span-2 bg-brand-charcoal/30 border border-brand-gold/5 relative overflow-hidden flex flex-col items-center justify-center p-20 min-h-[500px]">
          {/* Concentric Circles representing Resonance Layers */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] border border-brand-gold/5 rounded-full" />
            <div className="w-[300px] h-[300px] border border-brand-gold/10 rounded-full" />
            <div className="w-[200px] h-[200px] border border-brand-gold/20 rounded-full" />
            <div className="w-[100px] h-[100px] border border-brand-gold/40 rounded-full bg-brand-gold/5" />
          </div>

          {/* Active Narrative Vector (Geometric Visual) */}
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-4xl text-brand-cream italic">{activeNarrativeItem.title}</h2>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-brand-gold/60">Alignment</span>
                  <span className="font-serif text-xl text-brand-cream">{activeNarrativeItem.alignment}</span>
                </div>
                <div className="w-px h-8 bg-brand-gold/20" />
                <div className="text-center">
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-brand-gold/60">Risk Profile</span>
                  <span className="font-serif text-xl text-brand-gold">Critical</span>
                </div>
              </div>
            </div>
            
            <p className="font-sans text-xs text-neutral-400 max-w-md mx-auto leading-relaxed border-t border-brand-gold/10 pt-8">
              {activeNarrativeItem.risk} This variance requires immediate synchronization in Stage 01 to prevent Phase 2 friction.
            </p>

            <button className="px-8 py-3 bg-brand-gold text-brand-charcoal font-mono text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-brand-cream transition-all">
              Initialize Narrative Fusion
            </button>
          </div>

          {/* Abstract Data Trace (Bottom Right) */}
          <div className="absolute bottom-8 right-8 font-mono text-[7px] text-brand-gold/20 uppercase tracking-[0.5em] flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Tracing Institutional Logic // MMXXVI
          </div>
        </div>
      </div>

      {/* 3. Session Controls: Facilitation Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 border border-brand-gold/10 flex items-center gap-4 group cursor-pointer hover:bg-brand-gold/5 transition-all">
          <MessageSquare className="w-5 h-5 text-brand-gold" />
          <div>
            <span className="block font-mono text-[9px] uppercase text-brand-gold/60">Facilitation</span>
            <span className="font-serif text-sm text-brand-cream">Invite Collaborators</span>
          </div>
        </div>
        <div className="p-6 border border-brand-gold/10 flex items-center gap-4 group cursor-pointer hover:bg-brand-gold/5 transition-all">
          <Target className="w-5 h-5 text-brand-gold" />
          <div>
            <span className="block font-mono text-[9px] uppercase text-brand-gold/60">Mapping</span>
            <span className="font-serif text-sm text-brand-cream">Plot Resonance Points</span>
          </div>
        </div>
        <div className="p-6 border border-brand-gold/10 flex items-center gap-4 group cursor-pointer hover:bg-brand-gold/5 transition-all">
          <MoveRight className="w-5 h-5 text-brand-gold" />
          <div>
            <span className="block font-mono text-[9px] uppercase text-brand-gold/60">Next Sequence</span>
            <span className="font-serif text-sm text-brand-cream">Transition to Stage 02</span>
          </div>
        </div>
      </div>
    </div>
  );
}