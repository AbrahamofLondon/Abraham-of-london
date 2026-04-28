'use client';

import React from 'react';
import { DrillDownMatrix } from '@/components/admin/reporting/drill-down-matrix';
import { FragilityHeatmap } from '@/components/admin/reporting/fragility-heatmap';
import { InterventionScheduler } from '@/components/admin/reporting/intervention-scheduler';
import { FileText, Download, Share2, ShieldCheck, Zap } from 'lucide-react';

// Mock Data for the Command Center
const GLOBAL_DATA = {
  respondentCount: 72,
  band: 'FRAGMENTED' as const,
  percentScore: 68,
  fragilitySignal: 'VOLATILE',
  rawReadingDistribution: [85, 40, 92, 55, 78, 30, 88, 62, 95, 45],
  domainScoresJson: [
    { domain: 'Strategic Alignment', percentScore: 72 },
    { domain: 'Operational Velocity', percentScore: 58 },
    { domain: 'Cultural Resonance', percentScore: 64 },
    { domain: 'Resource Fluidity', percentScore: 81 },
  ]
};

// ✅ FIX: Added varianceScoresJson to match TeamSnapshot type
const TEAM_SNAPSHOTS = [
  {
    teamName: 'Engineering Alpha',
    respondentCount: 14,
    band: 'ALIGNED' as const,
    percentScore: 88,
    rawReadingDistribution: [90, 85, 92, 88, 87, 89, 91],
    domainScoresJson: [
      { domain: 'Strategic Alignment', percentScore: 92 },
      { domain: 'Operational Velocity', percentScore: 85 },
      { domain: 'Cultural Resonance', percentScore: 90 },
      { domain: 'Resource Fluidity', percentScore: 86 },
    ],
    // ✅ Added required varianceScoresJson field
    varianceScoresJson: JSON.stringify([
      { domain: 'Strategic Alignment', variance: 8 },
      { domain: 'Operational Velocity', variance: 12 },
      { domain: 'Cultural Resonance', variance: 6 },
      { domain: 'Resource Fluidity', variance: 9 },
    ])
  },
  {
    teamName: 'Marketing Core',
    respondentCount: 22,
    band: 'DISORDERED' as const,
    percentScore: 42,
    rawReadingDistribution: [10, 80, 15, 90, 20, 75, 12],
    domainScoresJson: [
      { domain: 'Strategic Alignment', percentScore: 45 },
      { domain: 'Operational Velocity', percentScore: 38 },
      { domain: 'Cultural Resonance', percentScore: 50 },
      { domain: 'Resource Fluidity', percentScore: 35 },
    ],
    // ✅ Added required varianceScoresJson field
    varianceScoresJson: JSON.stringify([
      { domain: 'Strategic Alignment', variance: 35 },
      { domain: 'Operational Velocity', variance: 42 },
      { domain: 'Cultural Resonance', variance: 28 },
      { domain: 'Resource Fluidity', variance: 31 },
    ])
  }
];

export default function ExecutiveSnapshotPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] p-8 lg:p-16 font-sans text-neutral-900">
      
      {/* 1. TOP NAVIGATION & SYSTEM STATUS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#8A6A2F] fill-current" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Sovereign Intelligence v2.0</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Executive Command</h1>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all">
            <Download className="w-3.5 h-3.5" /> Export Audit
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
            <Share2 className="w-3.5 h-3.5 text-[#8A6A2F]" /> Share Briefing
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12">
        
        {/* 2. PRIMARY ANALYSIS COLUMN (LEFT 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-neutral-200" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 italic">Dissonance & Drill-Down</h2>
            </div>
            <DrillDownMatrix globalData={GLOBAL_DATA} teamSnapshots={TEAM_SNAPSHOTS} />
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-neutral-200" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 italic">Deployment Command</h2>
            </div>
            <InterventionScheduler 
              targetTeam="Marketing Core" 
              delta={48} 
              fragilityScore={32} 
            />
          </section>
        </div>

        {/* 3. CONTEXTUAL SIDEBAR (RIGHT 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-12">
          
          <section>
             <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 italic whitespace-nowrap">Institutional Risk Map</h2>
              <div className="h-[1px] flex-1 bg-neutral-200" />
            </div>
            <FragilityHeatmap teams={TEAM_SNAPSHOTS} />
          </section>

          <section className="bg-white border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-4 h-4 text-[#8A6A2F]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">System Memo</h3>
            </div>
            <p className="text-[12px] leading-relaxed text-neutral-500 italic mb-6">
              "The current delta in Marketing Core suggests a structural collapse in operational intent. 
              The 'Fractured' condition indicates that the team is moving in opposing directions, 
              rendering traditional top-down directives ineffective."
            </p>
            <div className="pt-6 border-t border-neutral-100 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Governance Verified Protocol</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
