'use client';

import React from 'react';
import { Trophy, TrendingDown, Zap, BarChart, ShieldCheck } from 'lucide-react';
import { SuccessMetric } from '@/lib/alignment/intervention-tracker';

export function SuccessTrackerView({ metrics }: { metrics: SuccessMetric[] }) {
  return (
    <div className="bg-white border border-neutral-100 font-serif overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-3 h-3 text-neutral-400" />
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Leadership Impact</span>
            </div>
            <h2 className="text-xl font-light tracking-tight text-neutral-800">Intervention ROI</h2>
          </div>
          <div className="border border-neutral-100 px-3 py-1.5">
            <p className="text-[7px] font-mono text-neutral-500">Protocol Active</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
        {metrics.map((m) => (
          <div key={m.domain} className="p-6 space-y-4">
            <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">{m.domain}</p>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[6px] font-mono text-neutral-400 uppercase">Friction Reduction</span>
                  <span className="text-[9px] font-mono text-neutral-600">-{m.frictionDecay}%</span>
                </div>
                <div className="h-0.5 w-full bg-neutral-100">
                  <div className="h-full bg-neutral-500" style={{ width: `${Math.min(m.frictionDecay, 100)}%` }} />
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[6px] font-mono text-neutral-400 uppercase mb-1">Impact</p>
                  <p className="text-2xl font-light tracking-tight text-neutral-800">{m.impactScore}</p>
                </div>
                <div className={`text-[6px] font-mono uppercase px-2 py-1 border ${
                  m.velocityStatus === 'ACCELERATING' ? 'border-neutral-300 text-neutral-600' : 'border-neutral-200 text-neutral-400'
                }`}>
                  {m.velocityStatus}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Line */}
      <div className="p-6 border-t border-neutral-100 flex flex-col lg:flex-row justify-between items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-[9px] text-neutral-500 leading-relaxed max-w-md">
            Friction reduced by average {metrics.reduce((acc, m) => acc + m.frictionDecay, 0) / metrics.length}% this cycle.
          </p>
        </div>
        <button className="px-6 py-2 border border-neutral-300 text-[7px] font-mono uppercase tracking-wider text-neutral-600 hover:border-neutral-400 transition-all">
          Generate Review
        </button>
      </div>
    </div>
  );
}