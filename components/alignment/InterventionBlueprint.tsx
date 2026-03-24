"use client";

import React from "react";

interface BlueprintProps {
  dissonanceArea: number;
  weakestDomains: string[];
  onExplorePhase2?: () => void; // High-impact trigger for the Calibration Roadmap
}

export default function InterventionBlueprint({ 
  dissonanceArea, 
  weakestDomains,
  onExplorePhase2 
}: BlueprintProps) {
  
  // Cleanly format the primary domain for display
  const primaryDomain = weakestDomains?.[0]?.replace(/_/g, ' ') || "Strategic Vectors";

  return (
    <div className="mx-auto max-w-4xl bg-[#FDFBF7] p-16 shadow-sm border border-[#D4C5A8]/20 mt-12 mb-24 relative overflow-hidden">
      
      {/* 1. Header: The Invitation to Mastery */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block border-y border-[#D4C5A8] py-2 px-12">
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#8A6A2F]">
            The Path to Resonance
          </span>
        </div>
        <h2 className="font-serif text-4xl text-[#2C2416] tracking-tight">
          Strategic <span className="italic">Calibration</span>
        </h2>
        <p className="font-serif text-sm text-[#5C4E36] max-w-md mx-auto leading-relaxed">
          The OGR findings identify a unique opportunity to transition from functional alignment to institutional resonance.
        </p>
      </div>

      {/* 2. The Calibration Opportunity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4 border-l border-[#8A6A2F]/20 pl-6">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F]">
            The Current Signal
          </h4>
          <p className="font-sans text-xs leading-relaxed text-[#5C4E36]">
            With a Dissonance Area of <span className="font-bold text-[#2C2416]">{dissonanceArea}</span>, the organization is currently navigating high-velocity change. While resilient, there is measurable "drag" within the <span className="italic capitalize">{primaryDomain}</span> domain.
          </p>
        </div>

        <div className="space-y-4 border-l border-[#8A6A2F]/20 pl-6">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F]">
            The Potential State
          </h4>
          <p className="font-sans text-xs leading-relaxed text-[#5C4E36]">
            By synchronizing these specific vectors, we anticipate a significant reduction in operational friction, allowing the leadership mandate to translate into action with 95%+ fidelity.
          </p>
        </div>
      </div>

      {/* 3. The 3-Stage Calibration Sequence */}
      <div className="bg-[#F9F6EF] p-10 relative overflow-hidden">
        {/* Decorative OGR watermark */}
        <div className="absolute right-[-20px] top-[-20px] font-serif text-[120px] italic opacity-[0.03] pointer-events-none text-[#8A6A2F]">
          OGR
        </div>

        <div className="relative space-y-10">
          {[
            { 
              title: "Executive Synthesis", 
              desc: "A collaborative review of the OGR geometric findings to align the leadership narrative.",
              outcome: "Unified Vision"
            },
            { 
              title: "Domain Deep-Dive", 
              desc: "Targeted focus groups to resolve the specific dissonance identified in your primary gap areas.",
              outcome: "Friction Removal"
            },
            { 
              title: "The Resonance Roadmap", 
              desc: "The final architecture for long-term strategic stability and autonomous alignment.",
              outcome: "Institutional Flow"
            }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-8 group">
              <span className="font-serif text-2xl italic text-[#D4C5A8] group-hover:text-[#8A6A2F] transition-colors duration-500">
                0{i + 1}
              </span>
              <div className="flex-1">
                <h5 className="font-serif text-lg text-[#2C2416]">{item.title}</h5>
                <p className="font-sans text-xs text-[#5C4E36] mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <div className="hidden md:block text-right">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#8A6A2F] bg-white px-3 py-1 border border-[#D4C5A8]/30">
                  {item.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. The "Soft" Closing Action */}
      <div className="mt-16 text-center space-y-8">
        <div className="h-px w-24 bg-[#D4C5A8] mx-auto" />
        <p className="font-serif text-sm italic text-[#5C4E36]">
          Would you like to review the full calibration sequence for next quarter?
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={onExplorePhase2}
            className="px-12 py-4 bg-[#2C2416] text-[#F9F7F2] font-mono text-[10px] uppercase tracking-[0.4em] hover:bg-[#8A6A2F] transition-all duration-500 shadow-xl active:scale-95"
          >
            Explore Phase 2 Calibration
          </button>
          <button className="px-8 py-4 border border-[#D4C5A8] text-[#8A6A2F] font-mono text-[9px] uppercase tracking-[0.3em] hover:bg-[#F5F2EA] transition-all active:scale-95">
            Archive Brief
          </button>
        </div>
      </div>
    </div>
  );
}