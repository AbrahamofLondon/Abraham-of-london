"use client";

import React from "react";

interface RoadmapProps {
  organisationName: string;
  primaryVarianceDomain: string; // Tailored based on Phase 1
}

export default function OGRStrategicRoadmap({ organisationName, primaryVarianceDomain }: RoadmapProps) {
  
  const timelineStages = [
    {
      id: "01",
      title: "Executive Synthesis",
      window: "Week 1–4",
      milestone: "Authorization of Unified Leadership Narrative",
      tailoredAction: `Forensic deconstruction of OGR findings with C-Suite, mapping leadership intent against data reality.`
    },
    {
      id: "02",
      title: "Structural Alignment",
      window: "Week 5–8",
      milestone: "Stabilization of High-Variance Vectors",
      // We tailer the description based on Phase 1's weakest domain
      tailoredAction: `Tailored intervention in the ${primaryVarianceDomain?.replace(/_/g, " ")} domain, addressing specific root causes of dissonance.`
    },
    {
      id: "03",
      title: "Institutional Resonance",
      window: "Week 9–12",
      milestone: "Verification of Autonmous Strategic Flow",
      tailoredAction: "Verification trace (post-intervention) to measure Dissonance reduction. Goal: 100% Kinetic Output."
    }
  ];

  return (
    <div className="mx-auto max-w-5xl bg-white p-16 shadow-2xl border-t-[1px] border-[#D4C5A8] print:shadow-none print:border-none my-12">
      
      {/* 1. Header: The Blueprint Aesthetic */}
      <div className="flex justify-between items-start mb-20 border-b border-[#E8E0D4] pb-10">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">
            Phase 2 // Strategic Roadmap
          </span>
          <h2 className="font-serif text-3xl text-[#2C2416] tracking-tight">
            Institutional Calibration <span className="italic">Sequence</span>
          </h2>
          <p className="font-sans text-xs text-[#5C4E36] mt-2 tracking-wide uppercase">
            {organisationName} // AOL-OGR-2026-RMP
          </p>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#B8A77C] text-right">
          Authorized // ARCHITECT ONLY
        </div>
      </div>

      {/* 2. The Kinetic Timeline */}
      <div className="relative space-y-16">
        
        {/* The Continuity Line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#D4C5A8] to-transparent hidden md:block" />

        {timelineStages.map((stage, index) => (
          <div key={stage.id} className="grid grid-cols-1 md:grid-cols-12 gap-10 relative group">
            
            {/* The Timeline Node */}
            <div className="md:col-span-1 relative flex items-center justify-center hidden md:flex">
              <div className="h-9 w-9 bg-white border border-[#D4C5A8] rounded-full flex items-center justify-center font-serif text-xl italic text-[#8A6A2F] group-hover:bg-[#F9F6EF] transition-colors z-10">
                {stage.id}
              </div>
            </div>

            {/* Stage Title & Window */}
            <div className="md:col-span-3 border-l md:border-none pl-6 md:pl-0 space-y-1 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8A6A2F]">
                {stage.window}
              </span>
              <h4 className="font-serif text-xl text-[#2C2416]">
                {stage.title}
              </h4>
            </div>

            {/* The Tailored Action (The Prescription) */}
            <div className="md:col-span-5 space-y-2">
              <p className="font-sans text-xs leading-relaxed text-[#5C4E36]">
                {stage.tailoredAction}
              </p>
            </div>

            {/* Milestone Label */}
            <div className="md:col-span-3 flex items-start justify-end pt-1">
              <div className="px-4 py-2 border border-[#E8E0D4] font-mono text-[8px] uppercase tracking-[0.2em] text-[#9B8A6B] text-center w-full bg-[#F9F7F2]">
                {stage.milestone}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* 3. The Endorsement Seal */}
      <div className="mt-20 text-center border-t border-[#E8E0D4] pt-12">
        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full border border-[#D4C5A8] mb-6 shadow-xl relative">
          <span className="font-serif text-[40px] italic opacity-5 bg-gradient-to-br from-[#E8E0D4] to-transparent p-2">OGR</span>
          <div className="absolute inset-0 border-[0.5px] border-[#8A6A2F]/5 rounded-full animate-ping" />
        </div>
        <blockquote className="font-serif text-base italic leading-relaxed text-[#4A3E2C] max-w-xl mx-auto">
          "Order creates the foundation. Geometry measures the flow. Resonance unlocks the output. The OGR Calibration Sequence is not a choice; it is the inevitable next step toward institutional mastery."
        </blockquote>
        <div className="mt-6 font-mono text-[7px] uppercase tracking-[0.5em] text-[#C0B190]">
          MMXXVI // Abraham of London // OGR-CERTIFIED
        </div>
      </div>

    </div>
  );
}