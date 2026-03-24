'use client';

import React from 'react';
import { AlertTriangle, ChevronRight, Target, Zap } from 'lucide-react';

interface DomainMetric {
  label: string;
  intent: number; // Executive perception
  reality: number; // Anonymized data average
}

interface DissonanceMatrixProps {
  metrics: DomainMetric[];
}

export function DissonanceMatrix({ metrics }: DissonanceMatrixProps) {
  return (
    <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden font-sans">
      {/* HEADER: SYSTEM STATUS */}
      <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-end">
        <div>
          <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-[0.2em]">Matrix v1.0</span>
          <h3 className="text-2xl font-black uppercase tracking-tighter mt-2">Dissonance Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Aggregate Cohort</p>
          <p className="text-3xl font-black text-[#8A6A2F]">N={metrics.length > 0 ? '72' : '0'}</p>
        </div>
      </div>

      {/* MATRIX TABLE: DOMAIN ANALYSIS */}
      <div className="divide-y divide-neutral-100">
        {metrics.map((m) => {
          const delta = m.intent - m.reality;
          const isCritical = delta > 20;

          return (
            <div key={m.label} className="grid grid-cols-12 group hover:bg-[#F9F9F7] transition-colors">
              
              {/* DOMAIN IDENTIFIER */}
              <div className="col-span-12 md:col-span-4 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-100 bg-white group-hover:bg-[#F9F9F7] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  {isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                  ) : (
                    <Zap className="w-4 h-4 text-[#8A6A2F]" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Strategic Domain</span>
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight leading-none">
                  {m.label.replace(/_/g, ' ')}
                </h4>
              </div>

              {/* VISUALIZATION: THE RESONANCE GAP */}
              <div className="col-span-12 md:col-span-8 p-8 flex flex-col justify-center">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                  <span className="text-neutral-300 flex items-center gap-1.5 font-bold">
                    <Target className="w-3 h-3" /> Intent ({m.intent}%)
                  </span>
                  <span className="text-black flex items-center gap-1.5 font-bold">
                    Reality ({m.reality}%) <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                {/* DYNAMIC BAR SYSTEM */}
                <div className="relative w-full h-8 bg-neutral-100 overflow-hidden ring-1 ring-inset ring-neutral-200/50">
                  {/* Intent Marker (Dashed vertical line) */}
                  <div 
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-neutral-400 z-20" 
                    style={{ left: `${m.intent}%` }} 
                  />
                  
                  {/* Reality Fill (Solid progress) */}
                  <div 
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-in-out z-10 ${
                      isCritical ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-[#8A6A2F]'
                    }`}
                    style={{ width: `${m.reality}%` }} 
                  />
                  
                  {/* Delta Overlay (The "Friction Zone" between Reality and Intent) */}
                  {m.intent > m.reality && (
                    <div 
                      className="absolute top-0 bottom-0 bg-black/[0.07] z-0" 
                      style={{ left: `${m.reality}%`, width: `${m.intent - m.reality}%` }} 
                    />
                  )}
                </div>

                {/* TELEMETRY SUBTEXT */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-600' : 'bg-[#8A6A2F]'}`} />
                     <p className="text-[9px] font-bold text-neutral-500 uppercase italic tracking-tighter">
                       {isCritical ? "Structural failure likely: High energy loss." : "Functional alignment: Stable resonance."}
                     </p>
                  </div>
                  <div className={`flex items-baseline gap-1 px-3 py-1 font-mono ${isCritical ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-black'}`}>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Delta</span>
                    <span className="text-[11px] font-black">-{delta}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SYSTEM FOOTER */}
      <div className="p-6 bg-black text-white/40 text-[9px] font-bold uppercase tracking-widest flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8A6A2F] animate-pulse" />
          <span>Data anonymized via Sovereign Scrubber Protocol. No individual identifiers present.</span>
        </div>
        <div className="hidden md:block">
          Ref: SN-Matrix-2026
        </div>
      </div>
    </div>
  );
}