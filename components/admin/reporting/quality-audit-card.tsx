'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import { HardenedMetrics } from '@/lib/alignment/hardened-pulse-engine';

export function QualityAuditCard({ metrics }: { metrics: HardenedMetrics }) {
  const isReliable = metrics.integrityStatus === 'STABLE';

  return (
    <div className="bg-white border border-neutral-100 p-6 font-serif">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-100">
        <div>
          <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Audit Protocol</p>
          <h3 className="text-base font-light tracking-tight text-neutral-700">Data Integrity</h3>
        </div>
        <div className={`text-[8px] font-mono uppercase tracking-wider px-3 py-1 ${
          isReliable ? 'text-neutral-500 bg-neutral-50' : 'text-neutral-500 bg-neutral-50'
        }`}>
          {metrics.integrityStatus}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <AuditMetric 
          icon={<Activity className="w-3 h-3" />}
          label="Reliability" 
          value={`${metrics.reliabilityIndex}%`} 
          desc="Confidence"
        />
        <AuditMetric 
          icon={<BarChart3 className="w-3 h-3" />}
          label="Error Margin" 
          value={`±${metrics.standardError}%`} 
          desc="Precision"
        />
        <AuditMetric 
          icon={<ShieldCheck className="w-3 h-3" />}
          label="Sample" 
          value={metrics.nodeCount} 
          desc="Participants"
        />
        <div className="flex flex-col justify-center pl-6 border-l border-neutral-100">
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Verdict</p>
          <p className="text-[10px] leading-relaxed text-neutral-500">
            {isReliable 
              ? "Statistically significant. Suitable for strategic deployment." 
              : "High volatility detected. Baseline is speculative."}
          </p>
        </div>
      </div>
    </div>
  );
}

function AuditMetric({ label, value, desc, icon }: { label: string, value: string | number, desc: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-neutral-400">
        {icon}
        <span className="text-[7px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-light tracking-tight text-neutral-800">{value}</p>
      <p className="text-[6px] font-mono text-neutral-300 uppercase tracking-wider">{desc}</p>
    </div>
  );
}