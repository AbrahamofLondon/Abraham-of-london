'use client';

import React from 'react';
import { TrendingUp, ShieldCheck, ArrowUpRight, Target, Zap } from 'lucide-react';

interface SuccessMetricsProps {
  domain: string;
  preIntervention: number;
  postIntervention: number;
  interventionCost?: string;
}

export function ValueRecoveryReport({ domain, preIntervention, postIntervention, interventionCost }: SuccessMetricsProps) {
  const recoveryDelta = postIntervention - preIntervention;
  const recoveryRate = Math.round((recoveryDelta / (100 - preIntervention)) * 100);
  const isSuccessful = recoveryDelta > 0;

  return (
    <div className="bg-white border border-neutral-100 overflow-hidden font-serif">
      {/* Header */}
      <div className="p-8 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-3 h-3 text-neutral-400" />
          <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neutral-400">Post-Intervention Audit</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-neutral-900">Value Recovery</h2>
            <p className="text-[10px] font-mono text-neutral-400 mt-1">{domain}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-mono text-neutral-400">Protocol</p>
            <p className="text-xs font-medium text-neutral-600">{interventionCost || 'Standard Cycle'}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3">
        {/* Metric 1: Recovery */}
        <div className="p-6 border-r border-neutral-100">
          <p className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider mb-4">Alignment Shift</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-light tracking-tight ${isSuccessful ? 'text-neutral-900' : 'text-neutral-400'}`}>
              {isSuccessful ? '+' : ''}{recoveryDelta}%
            </span>
            <TrendingUp className={`w-4 h-4 ${isSuccessful ? 'text-neutral-500' : 'text-neutral-300'}`} />
          </div>
          <p className="text-[8px] font-mono text-neutral-400 mt-3">Baseline: {preIntervention}%</p>
        </div>

        {/* Metric 2: Recovery Rate */}
        <div className="p-6 border-r border-neutral-100 bg-neutral-50/30">
          <p className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider mb-4">Efficiency Recovered</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tight text-neutral-700">{recoveryRate}%</span>
            <ArrowUpRight className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-[8px] font-mono text-neutral-400 mt-3">of potential regained</p>
        </div>

        {/* Metric 3: Current State */}
        <div className="p-6">
          <p className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider mb-4">Current Resonance</p>
          <div className="space-y-2">
            <div className="h-1 w-full bg-neutral-100">
              <div className="h-full bg-neutral-800 transition-all duration-700" style={{ width: `${postIntervention}%` }} />
            </div>
            <span className="text-3xl font-light tracking-tight text-neutral-900">{postIntervention}%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-neutral-100 bg-neutral-50/20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
            <Zap className="w-3 h-3 text-neutral-500" />
          </div>
          <p className="text-[9px] font-mono text-neutral-500 flex-1">
            Intervention recovered {recoveryDelta}% of latent resonance previously lost to friction.
          </p>
          <button className="px-4 py-2 border border-neutral-200 text-[8px] font-mono uppercase tracking-wider text-neutral-500 hover:border-neutral-300 transition-colors">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}