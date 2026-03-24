// app/admin/organisations/[id]/dashboard/ogr-interactive-view.tsx

"use client";

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  Zap,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DomainDrillDown {
  domain: string;
  score: number;
  questions: { question: string; passRate: number; status: 'critical' | 'stable' }[];
}

export function OGRInteractiveView({ data }: { data: any }) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const { organisationSnapshot } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
      
      {/* LEFT COLUMN: THE MATRIX LIST */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-6 bg-black text-white mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A6A2F] mb-2">
            System Diagnostics
          </h3>
          <p className="text-xl font-black italic tracking-tighter">Operational Resonance Matrix</p>
        </div>

        {organisationSnapshot.domainScores.map((ds: any) => (
          <button
            key={ds.domain}
            onClick={() => setSelectedDomain(ds.domain)}
            className={`w-full text-left p-4 transition-all border-l-4 group ${
              selectedDomain === ds.domain 
                ? "bg-white border-[#8A6A2F] shadow-lg" 
                : "bg-neutral-50 border-transparent hover:border-neutral-300"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-[#8A6A2F]">
                  {ds.percentScore < 60 ? 'Fragility Detected' : 'Resonant'}
                </p>
                <h4 className="text-sm font-black uppercase tracking-tight">{ds.domain.replace(/_/g, ' ')}</h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black font-sans">{Math.round(ds.percentScore)}%</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedDomain === ds.domain ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* RIGHT COLUMN: THE DRILL-DOWN INTELLIGENCE */}
      <div className="lg:col-span-7 bg-white border border-neutral-100 p-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedDomain ? (
            <motion.div
              key={selectedDomain}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-start border-b border-neutral-100 pb-6">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                    {selectedDomain.replace(/_/g, ' ')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Deep-Dive Intelligence
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-[#8A6A2F]">Domain Score</p>
                  <p className="text-4xl font-black tracking-tighter">
                    {Math.round(organisationSnapshot.domainScores.find((d: any) => d.domain === selectedDomain)?.percentScore)}%
                  </p>
                </div>
              </div>

              {/* MOCK QUESTIONS SECTION (This would pull from your raw Audit database) */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                  <BarChart3 className="w-4 h-4" /> Root Cause Analysis
                </h5>
                
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-neutral-50 bg-[#FCFCFA] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                    <div className="max-w-[80%]">
                      <p className="text-xs font-medium text-neutral-600 italic mb-1">Audit Stimulus 0{i}:</p>
                      <p className="text-sm font-black uppercase tracking-tight leading-tight">
                        "Resources are allocated based on strategic priority rather than internal politics."
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-red-600 mb-1">42% PASS</p>
                      <div className="w-12 h-1 bg-neutral-200 overflow-hidden">
                        <div className="w-[42%] h-full bg-red-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTION CALLOUT */}
              <div className="mt-12 p-6 bg-[#8A6A2F] text-white flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black uppercase">Initiate Recovery Protocol</h4>
                  <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">Deploy Strategic Intervention v3</p>
                </div>
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-300 space-y-4">
              <Zap className="w-12 h-12 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a Domain to Begin Diagnostic</p>
            </div>
          )}
        </AnimatePresence>

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
    </div>
  );
}