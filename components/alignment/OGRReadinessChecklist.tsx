"use client";

import React from "react";
import { Check, Shield, Zap, Users, Target, BarChart } from "lucide-react";

export default function OGRReadinessChecklist() {
  const requirements = [
    {
      icon: <Users className="w-4 h-4" />,
      title: "Executive Core Availability",
      desc: "Identification of the 5-7 key stakeholders for the Stage 01 Synthesis sessions.",
      metric: "4 Hours / Month"
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: "Forensic Data Transparency",
      desc: "Authorization for deep-layer access to internal communication flow and operational KPIs.",
      metric: "Full Access"
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Internal Narrative Alignment",
      desc: "A brief internal memo from the CEO announcing the 'Resonance' initiative to prevent friction.",
      metric: "Pre-Launch"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Intervention Window",
      desc: "Confirmation of a 12-week strategic window free from major structural pivots or M&A activity.",
      metric: "Q3/Q4 2026"
    },
    {
      icon: <BarChart className="w-4 h-4" />,
      title: "Verification Benchmarks",
      desc: "Defined success metrics for what 'Institutional Flow' looks like for your specific industry.",
      metric: "Defined by CEO"
    }
  ];

  return (
    <div className="mx-auto max-w-4xl bg-[#0A0A0A] border border-brand-gold/20 p-16 shadow-[0_0_50px_rgba(184,155,110,0.05)] my-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="space-y-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-brand-gold/60">
            Phase 2 // Deployment Pre-Flight
          </span>
          <h2 className="font-serif text-3xl text-brand-cream tracking-tight">
            Readiness <span className="italic text-brand-gold">Audit</span>
          </h2>
        </div>
        <div className="font-mono text-[9px] text-brand-gold/40 border-l border-brand-gold/20 pl-6 hidden md:block uppercase tracking-widest leading-relaxed">
          Protocol: OGR-75-READY<br />
          System: AOL-ARCHITECT
        </div>
      </div>

      {/* The Checklist Grid */}
      <div className="space-y-4">
        {requirements.map((item, i) => (
          <div 
            key={i} 
            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-brand-charcoal/20 border border-brand-gold/10 hover:border-brand-gold/40 transition-all duration-500 gap-4"
          >
            <div className="flex items-start gap-6">
              <div className="mt-1 p-2 bg-brand-gold/5 border border-brand-gold/20 text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-charcoal transition-all duration-500">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-brand-cream">{item.title}</h4>
                <p className="font-sans text-[11px] text-neutral-500 leading-relaxed max-w-md">
                  {item.desc}
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 border-brand-gold/5 pt-4 md:pt-0">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-gold/80 block mb-1">Requirement</span>
              <span className="font-mono text-[10px] text-brand-cream bg-brand-gold/10 px-3 py-1 rounded-sm">
                {item.metric}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Call to Action */}
      <div className="mt-16 flex flex-col items-center space-y-6">
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
        <p className="font-serif text-sm italic text-neutral-400 text-center max-w-lg">
          "Resonance is not found; it is engineered. Ensure these pillars are stable before the first trace begins."
        </p>
        <button className="px-10 py-3 bg-brand-gold text-brand-charcoal font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-brand-cream transition-all duration-300 font-bold">
          Submit Readiness Confirmation
        </button>
      </div>
    </div>
  );
}