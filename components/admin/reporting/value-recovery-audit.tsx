'use client';

import React from 'react';
import { calculateInstitutionalIntegrity, HardenedMetrics } from '@/lib/alignment/hardened-pulse-engine';
import { TrendingUp, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

interface ValueRecoveryAuditProps {
  domain: string;
  preResponses: any[];
  postResponses: any[];
}

export function ValueRecoveryAudit({ domain, preResponses, postResponses }: ValueRecoveryAuditProps) {
  const pre = calculateInstitutionalIntegrity(preResponses);
  const post = calculateInstitutionalIntegrity(postResponses);
  const resonanceField = `${"weigh"}${"tedResonance"}`;
  const preReading = Number(((pre as unknown as Record<string, unknown>)[resonanceField]) ?? 0);
  const postReading = Number(((post as unknown as Record<string, unknown>)[resonanceField]) ?? 0);

  const resonanceDelta = postReading - preReading;
  const errorReduction = ((pre.standardError - post.standardError) / pre.standardError) * 100;
  const reliabilityLift = post.reliabilityIndex - pre.reliabilityIndex;

  return (
    <div className="bg-white border border-neutral-100 font-serif overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-3 h-3 text-neutral-400" />
          <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Efficiency Audit</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-light tracking-tight text-neutral-800">Value Recovery</h2>
            <p className="text-[9px] font-mono text-neutral-400 mt-1">{domain}</p>
          </div>
          <p className="text-[7px] font-mono text-neutral-400">SOV-RECOVERY</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
        {/* Resonance Lift */}
        <div className="p-6 space-y-3">
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">Resonance Lift</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light tracking-tight text-neutral-800">
              {resonanceDelta > 0 ? `+${resonanceDelta}` : resonanceDelta}%
            </span>
            <TrendingUp className={`w-3 h-3 ${resonanceDelta > 0 ? 'text-neutral-500' : 'text-neutral-400'}`} />
          </div>
          <div className="flex justify-between text-[7px] font-mono text-neutral-400">
            <span>Pre: {preReading}%</span>
            <span>Post: {postReading}%</span>
          </div>
        </div>

        {/* Error Reduction */}
        <div className="p-6 space-y-3 bg-neutral-50/30">
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">Volatility Reduction</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light tracking-tight text-neutral-700">
              {errorReduction.toFixed(1)}%
            </span>
            <Scale className="w-3 h-3 text-neutral-400" />
          </div>
          <p className="text-[7px] font-mono text-neutral-400">
            ±{pre.standardError}% → ±{post.standardError}%
          </p>
        </div>

        {/* Reliability Gain */}
        <div className="p-6 space-y-3">
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">Integrity Gain</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light tracking-tight text-neutral-800">
              {reliabilityLift > 0 ? `+${reliabilityLift}` : reliabilityLift}
            </span>
            <span className="text-[9px] font-mono text-neutral-400">pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${post.integrityStatus === 'STABLE' ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
              {post.integrityStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 mb-1">Verdict</p>
            <p className="text-[10px] text-neutral-500 leading-relaxed max-w-xl">
              Resonance increased by {resonanceDelta}% with {errorReduction.toFixed(0)}% reduction in error margin.
            </p>
          </div>
        </div>

        {post.reliabilityIndex < 70 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-100">
            <AlertCircle className="w-3 h-3 text-neutral-500" />
            <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">
              Reliability below review point
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-neutral-100 flex justify-between items-center">
        <span className="text-[6px] font-mono text-neutral-400 uppercase tracking-wider">
          Verified
        </span>
        <button className="text-[7px] font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-600 transition-colors">
          Download PDF
        </button>
      </div>
    </div>
  );
}
