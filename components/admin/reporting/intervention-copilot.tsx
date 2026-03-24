'use client';

import React from 'react';
import { Zap, MessageSquare, ArrowUpRight } from 'lucide-react';
import { DomainDiagnostic } from '@/lib/alignment/domain-diagnostic';

export function InterventionCopilot({ diagnostics }: { diagnostics: DomainDiagnostic[] }) {
  const sorted = [...diagnostics].sort((a, b) => b.effortIndex - a.effortIndex);

  return (
    <div className="space-y-5 font-serif">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-base font-light tracking-tight text-neutral-800">Intervention Strategy</h3>
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
            Prescriptive Actions
          </p>
        </div>
        <span className="text-[6px] font-mono bg-neutral-100 text-neutral-500 px-2 py-1 uppercase tracking-wider">
          AI-Assisted
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sorted.map((item) => (
          <div key={item.domain} className="bg-white border border-neutral-100 hover:border-neutral-200 transition-all overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              
              {/* Left: Signal */}
              <div className="p-5 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-neutral-100 bg-neutral-50/30">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">{item.domain}</span>
                  <div className={`${item.trajectory === 'IMPROVING' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    <ArrowUpRight className={`w-3 h-3 ${item.trajectory === 'DECAYING' ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-light text-neutral-800">{item.score}%</span>
                  <span className="text-[7px] font-mono text-neutral-400 uppercase">Resonance</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[7px] font-mono uppercase">
                    <span className="text-neutral-500">Effort</span>
                    <span className="text-neutral-600">{item.effortIndex}%</span>
                  </div>
                  <div className="h-1 w-full bg-neutral-100">
                    <div className="h-full bg-neutral-500 transition-all duration-700" style={{ width: `${item.effortIndex}%` }} />
                  </div>
                </div>
              </div>

              {/* Right: Intervention */}
              <div className="p-5 lg:w-2/3 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-2.5 h-2.5 text-neutral-500" />
                    <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
                      {item.recommendedAction}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-neutral-600 mb-3">
                    {item.interventionScript}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-neutral-800 text-white text-[7px] font-mono uppercase tracking-wider py-2 flex items-center justify-center gap-1.5 hover:bg-neutral-700 transition-all">
                    <MessageSquare className="w-2.5 h-2.5" /> Copy Script
                  </button>
                  <button className="flex-1 border border-neutral-200 text-[7px] font-mono uppercase tracking-wider py-2 hover:border-neutral-300 transition-all">
                    View Data
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}