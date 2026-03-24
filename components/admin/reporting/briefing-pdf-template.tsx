'use client';

import React from 'react';
import { Shield, TrendingUp, Scale } from 'lucide-react';

export function BriefingPDFTemplate({ data }: { data: any }) {
  const { metadata, performance, narrative } = data;

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] text-neutral-800 font-serif border border-neutral-100 mx-auto print:border-none">
      
      {/* Header */}
      <div className="flex justify-between border-b border-neutral-200 pb-6 mb-10">
        <div>
          <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 block mb-2">
            Institutional Intelligence
          </span>
          <h1 className="text-2xl font-light tracking-tight text-neutral-800">
            Strategic Value Audit
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-mono text-neutral-400">{metadata.reportId}</p>
          <p className="text-[7px] font-mono text-neutral-400 mt-1">
            {new Date(metadata.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="border border-neutral-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3 h-3 text-neutral-400" />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">
              Resonance Recovery
            </span>
          </div>
          <span className="text-4xl font-light tracking-tight text-neutral-800">
            {performance.resonanceLift > 0 ? '+' : ''}{performance.resonanceLift}%
          </span>
          <p className="text-[7px] font-mono text-neutral-400 mt-3">
            Weighted Alignment Shift
          </p>
        </div>
        
        <div className="border border-neutral-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-3 h-3 text-neutral-400" />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">
              Error Compression
            </span>
          </div>
          <span className="text-4xl font-light tracking-tight text-neutral-800">
            {performance.volatilityReduction}%
          </span>
          <p className="text-[7px] font-mono text-neutral-400 mt-3">
            Reduction in Predictability Gap
          </p>
        </div>
      </div>

      {/* Integrity Verification */}
      <div className="mb-12 border-t border-b border-neutral-100 py-8">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">
            Data Integrity Audit
          </h3>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-neutral-400" />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
              {metadata.governanceStatus}
            </span>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-neutral-500 border-l-2 border-neutral-300 pl-5 max-w-xl">
          {narrative} Reliability index: {performance.reliabilityIndex}%.
        </p>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-neutral-100">
        <div className="flex justify-between items-center text-[6px] font-mono uppercase tracking-wider text-neutral-400">
          <span>Abraham of London</span>
          <span>End-to-End Verified</span>
          <span>Confidential</span>
        </div>
      </div>
    </div>
  );
}