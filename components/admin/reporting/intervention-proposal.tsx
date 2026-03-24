'use client';

import React from 'react';
import { generateMandate, InterventionDomain } from "@/lib/alignment/intervention-engine";
import { ArrowRight, Briefcase, ShieldAlert, Zap } from "lucide-react";

interface DomainMetric {
  label: string;
  intent: number;
  reality: number;
}

interface InterventionProposalProps {
  metrics: DomainMetric[];
}

export function InterventionProposal({ metrics }: InterventionProposalProps) {
  // 1. Identify the domain with the highest dissonance (Delta)
  const sortedMetrics = [...metrics].sort((a, b) => (b.intent - b.reality) - (a.intent - a.reality));
  const topIssue = sortedMetrics[0];

  if (!topIssue) return null;

  const delta = topIssue.intent - topIssue.reality;
  
  // 2. Fetch the mandated strategy from your alignment engine
  const mandate = generateMandate(
    topIssue.label.toUpperCase().replace(/\s/g, '_') as InterventionDomain, 
    delta
  );

  if (!mandate) return null;

  return (
    <div className="mt-12 bg-[#8A6A2F] text-white p-10 relative overflow-hidden group shadow-2xl transition-all hover:shadow-black/20 font-sans">
      
      {/* INSTITUTIONAL BACKGROUND GRAPHICS */}
      <Briefcase className="absolute -bottom-12 -right-12 w-64 h-64 opacity-10 rotate-12 group-hover:rotate-[5deg] transition-transform duration-1000 ease-in-out pointer-events-none" />
      <Zap className="absolute top-[-20px] left-[-20px] w-32 h-32 opacity-5 rotate-45 pointer-events-none" />
      
      <div className="relative z-10">
        
        {/* STATUS HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-sm">
            <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-90">
            Mandated Strategic Intervention
          </span>
        </div>
        
        <div className="grid grid-cols-12 gap-10 items-center">
          
          {/* THE MANDATE */}
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 inline-flex items-center px-2 py-0.5 bg-black/30 text-[8px] font-black uppercase tracking-widest border border-white/10">
              Priority: {topIssue.label.replace(/_/g, ' ')}
            </div>
            <h3 className="text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              {mandate.title}
            </h3>
            <p className="text-[13px] font-medium opacity-90 max-w-xl leading-relaxed italic border-l-2 border-white/30 pl-6 py-2">
              "{mandate.description}"
            </p>
          </div>
          
          {/* THE DEPLOYMENT ACTION */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            
            {/* VALUE RECOVERY PROJECTION */}
            <div className="bg-black/20 p-6 border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Projected Recovery</p>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <p className="text-3xl font-black tracking-tighter">
                + {Math.round(delta * 0.85)}% <span className="text-sm font-light opacity-50 uppercase tracking-widest">Efficiency</span>
              </p>
              <div className="mt-4 w-full h-1 bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-white opacity-40 transition-all duration-[2000ms]" 
                  style={{ width: `${Math.round(delta * 0.85)}%` }} 
                />
              </div>
            </div>
            
            {/* CTA */}
            <button 
              className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-xl"
              onClick={() => { /* Deployment Logic */ }}
            >
              Deploy Alignment Protocol <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className="text-[8px] text-center uppercase tracking-widest opacity-40 font-bold">
              Final authorization required via Sovereign Key-MD5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}