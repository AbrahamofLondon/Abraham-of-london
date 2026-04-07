'use client';

import React from 'react';
import { calculateFragility } from '@/lib/alignment/fragility-logic';
import { AlertCircle, ShieldCheck, Zap, Crown } from 'lucide-react';

// Aligned with your Prisma TeamAssessmentSnapshot model
interface TeamSnapshot {
  teamName: string;
  percentScore: number;
  varianceScoresJson: string; // Contains the distribution data
  respondentCount: number;
}

interface FragilityHeatmapProps {
  teams: TeamSnapshot[];
}

// Parse variance scores from JSON string
function parseVarianceScores(varianceScoresJson: string): number[] {
  try {
    const parsed = JSON.parse(varianceScoresJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Calculate variance magnitude from scores
function calculateVarianceMagnitude(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scores.length;
  return Math.min(Math.sqrt(variance) * 10, 95); // Scale to 0-95 range
}

export function FragilityHeatmap({ teams }: FragilityHeatmapProps) {
  const processedTeams = teams.map(team => {
    const varianceScores = parseVarianceScores(team.varianceScoresJson);
    const varianceMagnitude = calculateVarianceMagnitude(varianceScores);
    
    const fragility = calculateFragility(varianceScores);
    
    return {
      ...team,
      varianceMagnitude,
      fragilityStatus: fragility.status,
      fragilityDescription: fragility.description,
    };
  });

  return (
    <div className="border border-white/10 bg-black/30 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-5 w-px bg-amber-400/40" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/60">
              Institutional Risk Map
            </span>
          </div>
          <h3 className="mt-3 font-serif text-2xl text-white md:text-3xl">
            Fragility Heatmap
          </h3>
          <p className="mt-2 text-sm text-white/45 max-w-md">
            Visualising team alignment resonance against internal variance
          </p>
        </div>
        
        <div className="flex gap-4">
          <LegendItem color="bg-red-500/80" label="Fractured" />
          <LegendItem color="bg-amber-500/80" label="Volatile" />
          <LegendItem color="bg-emerald-500/80" label="Stable" />
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative aspect-video w-full border-l border-b border-white/10 mb-8 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px]">
        
        {/* Axis Labels */}
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
            Volatility (Internal Variance →)
          </span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
            Resonance (Alignment Score →)
          </span>
        </div>

        {/* Quadrant Indicators */}
        <div className="absolute top-3 right-3 text-right opacity-30 pointer-events-none">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-red-400">
            High Risk Zone
          </p>
          <p className="text-[6px] font-mono uppercase text-white/30">
            False Positive Alignment
          </p>
        </div>

        {/* Grid Lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />

        {/* Team Nodes */}
        {processedTeams.map((team) => {
          // X = Resonance Score (0-100)
          const xPos = team.percentScore;
          // Y = Variance Magnitude (0-95, inverted so higher variance = higher on chart)
          const yPos = team.varianceMagnitude;

          // Determine node color based on fragility status
          const nodeColor = 
            team.fragilityStatus === 'FRACTURED' ? 'bg-red-500' :
            team.fragilityStatus === 'VOLATILE' ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div 
              key={team.teamName}
              className="absolute transition-all duration-700 group cursor-pointer"
              style={{ left: `${xPos}%`, bottom: `${yPos}%`, transform: 'translate(-50%, 50%)' }}
            >
              {/* Node */}
              <div className={cn(
                "w-3 h-3 rounded-full border border-black/30 shadow-lg transition-all duration-300 group-hover:scale-150 group-hover:shadow-xl",
                nodeColor
              )}>
                <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-amber-400/20 blur-sm" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-black/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-sm">
                  <p className="font-mono text-[9px] font-medium text-amber-400/80 uppercase tracking-wider mb-2">
                    {team.teamName}
                  </p>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="text-[10px] text-white/60">Resonance</span>
                    <span className="text-[10px] font-mono text-white">{team.percentScore}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="text-[10px] text-white/60">Variance</span>
                    <span className="text-[10px] font-mono text-white">{Math.round(team.varianceMagnitude)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/60">Respondents</span>
                    <span className="text-[10px] font-mono text-white">{team.respondentCount}</span>
                  </div>
                  <p className="mt-2 text-[8px] font-mono uppercase tracking-[0.1em] text-white/40">
                    {team.fragilityDescription}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Footer */}
      <div className="border-t border-white/10 pt-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400/60" />
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
            Nodes in the upper right indicate high alignment averages masking deep internal polarisation.
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Crown className="h-3 w-3 text-amber-400/30" />
          <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
            Abraham of London • Fragility Protocol
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
    </div>
  );
}

function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}