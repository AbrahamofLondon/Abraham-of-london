'use client';

import React from 'react';
import { calculateFragility } from '@/lib/alignment/fragility-logic';
import { AlertCircle, ShieldCheck, Zap } from 'lucide-react';

interface TeamSnapshot {
  teamName: string;
  percentScore: number;
  rawScoreDistribution: number[];
}

interface FragilityHeatmapProps {
  teams: TeamSnapshot[];
}

export function FragilityHeatmap({ teams }: FragilityHeatmapProps) {
  const processedTeams = teams.map(team => ({
    ...team,
    fragility: calculateFragility(team.rawScoreDistribution)
  }));

  return (
    <div className="bg-white border border-neutral-200 shadow-sm p-8 font-sans">
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A6A2F]">Institutional Risk Map</span>
          <h3 className="text-2xl font-black uppercase tracking-tighter mt-1 text-black">Fragility Heatmap</h3>
        </div>
        <div className="flex gap-4">
          <LegendItem color="bg-red-600" label="Fractured" />
          <LegendItem color="bg-[#8A6A2F]" label="Volatile" />
          <LegendItem color="bg-emerald-600" label="Stable" />
        </div>
      </div>

      {/* THE GRID CONTAINER */}
      <div className="relative aspect-video w-full border-l-2 border-b-2 border-neutral-100 mb-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
        
        {/* AXIS LABELS */}
        <div className="absolute -left-12 top-1/2 -rotate-90 text-[8px] font-black uppercase tracking-widest text-neutral-400">
          Volatility (Variance ↑)
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-neutral-400">
          Resonance (Alignment →)
        </div>

        {/* TEAM NODES */}
        {processedTeams.map((team) => {
          // Normalize coordinates (0-100)
          // X = Resonance Score | Y = Variance Score (capped for visual)
          const xPos = team.percentScore;
          const yPos = Math.min(team.fragility.score * 2.5, 95); 

          return (
            <div 
              key={team.teamName}
              className="absolute transition-all duration-1000 group cursor-crosshair"
              style={{ left: `${xPos}%`, bottom: `${yPos}%` }}
            >
              {/* The Visual Node */}
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-xl transition-transform group-hover:scale-150 z-20 ${
                team.fragility.status === 'FRACTURED' ? 'bg-red-600' : 
                team.fragility.status === 'VOLATILE' ? 'bg-[#8A6A2F]' : 'bg-emerald-600'
              }`} />
              
              {/* Hover Tooltip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-black p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                <p className="text-[8px] font-black text-[#8A6A2F] uppercase tracking-widest mb-1">{team.teamName}</p>
                <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                  <span className="text-[10px] text-white font-bold">Resonance</span>
                  <span className="text-[10px] text-white">{team.percentScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-bold">Variance</span>
                  <span className="text-[10px] text-white">{team.fragility.score}%</span>
                </div>
                <p className="text-[7px] text-neutral-400 uppercase mt-2 italic">
                  {team.fragility.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* QUADRANT INDICATORS */}
        <div className="absolute top-4 right-4 text-right opacity-20 pointer-events-none">
          <p className="text-[10px] font-black uppercase text-red-600">High Risk Zone</p>
          <p className="text-[7px] uppercase text-neutral-500">False Positive Alignment</p>
        </div>
      </div>

      <div className="p-4 bg-neutral-50 border border-neutral-100 flex items-center gap-4">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-tight">
          Nodes in the <span className="text-black font-black italic">Upper Right</span> indicate high alignment averages masking deep internal polarization.
        </p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
    </div>
  );
}