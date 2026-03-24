'use client';

import React, { useMemo } from 'react';
import { analyzeDomainVariance } from '@/lib/alignment/domain-diagnostic';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';

export function ManagerDrillDown({ rawResponses }: { rawResponses: any[] }) {
  const diagnostics = useMemo(() => analyzeDomainVariance(rawResponses), [rawResponses]);

  return (
    <div className="space-y-4 font-serif">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-3 h-3 text-neutral-400" />
        <h3 className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Domain Diagnostic</h3>
      </div>

      <div className="grid grid-cols-1 gap-px bg-neutral-100 border border-neutral-100">
        {diagnostics.map((d) => (
          <div key={d.domain} className="bg-white p-5 flex flex-col md:flex-row justify-between items-center gap-5 hover:bg-neutral-50 transition-colors">
            
            {/* Domain */}
            <div className="flex-1">
              <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Domain</p>
              <h4 className="text-sm font-medium tracking-tight text-neutral-700 uppercase">{d.domain}</h4>
            </div>

            {/* Metrics */}
            <div className="flex gap-8 items-center">
              <div className="text-center">
                <p className="text-[6px] font-mono text-neutral-400 uppercase mb-1">Resonance</p>
                <p className="text-xl font-light text-neutral-800">{d.score}%</p>
              </div>
              
              <div className="h-6 w-px bg-neutral-100" />

              <div className="text-center">
                <p className="text-[6px] font-mono text-neutral-400 uppercase mb-1">Dissonance</p>
                <p className={`text-xl font-light ${d.status === 'CRITICAL' ? 'text-neutral-600' : 'text-neutral-700'}`}>
                  {d.dissonance}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className={`min-w-[140px] px-3 py-2 border flex items-center justify-between ${
              d.status === 'STABLE' ? 'border-neutral-200 bg-neutral-50' : 
              d.status === 'FRACTURED' ? 'border-neutral-200 bg-neutral-50' : 
              'border-neutral-200 bg-neutral-50'
            }`}>
              <div className="flex items-center gap-1.5">
                {d.status === 'STABLE' ? <CheckCircle2 className="w-3 h-3 text-neutral-500" /> : <AlertCircle className="w-3 h-3 text-neutral-500" />}
                <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-600">{d.status}</span>
              </div>
              <button className="text-[6px] font-mono uppercase underline text-neutral-400 hover:text-neutral-600">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-[7px] text-neutral-400 italic">
        Dissonance above 15 indicates significant variance.
      </p>
    </div>
  );
}