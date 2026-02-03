// components/VaultStats.tsx — HARDENED (Registry Metrics & Oversight)
'use client';

import React from 'react';
import { 
  BarChart3, 
  Shield, 
  FileBox, 
  Activity,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

interface VaultStatsProps {
  stats: {
    total: number;
    classifiedCount: number;
    publicCount: number;
    byCategory: Record<string, number>;
  };
}

export default function VaultStats({ stats }: VaultStatsProps) {
  // Calculate distribution percentages
  const classifiedPct = (stats.classifiedCount / stats.total) * 100;
  
  return (
    <section className="w-full py-12 border-y border-white/5 bg-zinc-950/20 mb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* STAT 1: VOLUME */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-500">
              <FileBox size={14} />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Registry Volume</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif italic text-white">{stats.total}</span>
              <span className="text-zinc-600 font-mono text-[10px]">DISPATCHES</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 font-mono text-[9px]">
              <ChevronUp size={12} />
              <span>PORTFOLIO ACTIVE</span>
            </div>
          </div>

          {/* STAT 2: CLASSIFICATION MIX */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-500">
              <Shield size={14} />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Intelligence Mix</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000" 
                style={{ width: `${classifiedPct}%` }} 
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
              <span className="text-amber-500">{Math.round(classifiedPct)}% Classified</span>
              <span className="text-zinc-600">{Math.round(100 - classifiedPct)}% Public</span>
            </div>
          </div>

          {/* STAT 3: CORE PILLARS */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-zinc-500 mb-2">
              <BarChart3 size={14} />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Categorical Weighting</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stats.byCategory).slice(0, 6).map(([cat, count]) => (
                <div key={cat} className="border-l border-white/10 pl-4 py-1">
                  <div className="text-zinc-300 font-serif italic text-sm capitalize">
                    {cat.replace('-', ' ')}
                  </div>
                  <div className="text-zinc-600 font-mono text-[10px] uppercase mt-1">
                    {count} Assets
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity size={12} className="text-amber-500 animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-700">
              Real-time Metadata Sync: Operational
            </span>
          </div>
          <div className="hidden md:block font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-800">
             Abraham of London // Secure Registry v8.2
          </div>
        </div>
      </div>
    </section>
  );
}