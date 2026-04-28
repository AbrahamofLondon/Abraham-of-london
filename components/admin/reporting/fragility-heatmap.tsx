"use client";

import * as React from "react";
import { calculateFragility } from "@/lib/alignment/fragility-logic";
import { ShieldCheck, Crown } from "lucide-react";

interface TeamSnapshot {
  teamName: string;
  percentScore: number;
  varianceScoresJson: string;
  respondentCount: number;
}

interface FragilityHeatmapProps {
  teams: TeamSnapshot[];
}

type FragilityStatus = "STABLE" | "VOLATILE" | "FRACTURED";

type ProcessedTeam = TeamSnapshot & {
  varianceMagnitude: number;
  fragilityStatus: FragilityStatus;
  fragilityDescription: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return defaultValue;
}

function parseVarianceScores(varianceScoresJson: string): number[] {
  try {
    const parsed = JSON.parse(varianceScoresJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => toNumber(item, Number.NaN))
      .filter((item) => Number.isFinite(item));
  } catch {
    return [];
  }
}

function calculateVarianceMagnitude(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const variance =
    scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / scores.length;
  const deviation = Math.sqrt(variance);
  return clamp(deviation * 10, 0, 95);
}

function normalizeFragilityStatus(status: unknown): FragilityStatus {
  const raw = String(status || "").toUpperCase();
  if (raw === "FRACTURED") return "FRACTURED";
  if (raw === "VOLATILE") return "VOLATILE";
  return "STABLE";
}

function getNodeColor(status: FragilityStatus): string {
  switch (status) {
    case "FRACTURED":
      return "bg-red-500";
    case "VOLATILE":
      return "bg-amber-500";
    case "STABLE":
    default:
      return "bg-emerald-500";
  }
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
    </div>
  );
}

export function FragilityHeatmap({ teams }: FragilityHeatmapProps) {
  const processedTeams = React.useMemo<ProcessedTeam[]>(() => {
    if (!Array.isArray(teams)) return [];

    return teams.map((team) => {
      const varianceScores = parseVarianceScores(team.varianceScoresJson);
      const varianceMagnitude = calculateVarianceMagnitude(varianceScores);
      const fragility = calculateFragility(varianceScores);

      return {
        ...team,
        percentScore: clamp(toNumber(team.percentScore, 0), 0, 100),
        respondentCount: Math.max(0, Math.round(toNumber(team.respondentCount, 0))),
        varianceMagnitude,
        fragilityStatus: normalizeFragilityStatus((fragility as any)?.status),
        fragilityDescription:
          typeof (fragility as any)?.description === "string" &&
          (fragility as any).description.trim()
            ? (fragility as any).description.trim()
            : "Fragility indicator unavailable.",
      };
    });
  }, [teams]);

  return (
    <div className="border border-white/10 bg-black/30 p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
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

          <p className="mt-2 max-w-md text-sm text-white/45">
            Visualising team alignment resonance against internal variance.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <LegendItem color="bg-red-500/80" label="Fractured" />
          <LegendItem color="bg-amber-500/80" label="Volatile" />
          <LegendItem color="bg-emerald-500/80" label="Stable" />
        </div>
      </div>

      <div className="relative mb-8 aspect-video w-full border-b border-l border-white/10 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="pointer-events-none absolute -left-10 top-1/2 origin-center -translate-y-1/2 -rotate-90">
          <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            Volatility (Internal Variance →)
          </span>
        </div>

        <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2">
          <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            Resonance (Alignment Score →)
          </span>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 text-right opacity-30">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-red-400">
            High Risk Zone
          </p>
          <p className="font-mono text-[6px] uppercase text-white/30">
            False Positive Alignment
          </p>
        </div>

        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-white/5" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />

        {processedTeams.map((team) => {
          const xPos = clamp(team.percentScore, 0, 100);
          const yPos = clamp(team.varianceMagnitude, 0, 95);
          const nodeColor = getNodeColor(team.fragilityStatus);

          return (
            <div
              key={team.teamName}
              className="group absolute cursor-pointer transition-all duration-700"
              style={{
                left: `${xPos}%`,
                bottom: `${yPos}%`,
                transform: "translate(-50%, 50%)",
              }}
            >
              <div
                className={cn(
                  "relative h-3 w-3 rounded-full border border-black/30 shadow-lg transition-all duration-300 group-hover:scale-150 group-hover:shadow-xl",
                  nodeColor,
                )}
              >
                <div className="absolute -inset-1 rounded-full bg-amber-400/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
              </div>

              <div className="pointer-events-none absolute bottom-5 left-1/2 z-50 w-56 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-sm">
                  <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-wider text-amber-400/80">
                    {team.teamName}
                  </p>

                  <div className="mb-1.5 flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[10px] text-white/60">Resonance</span>
                    <span className="font-mono text-[10px] text-white">
                      {Math.round(team.percentScore)}%
                    </span>
                  </div>

                  <div className="mb-1.5 flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[10px] text-white/60">Variance</span>
                    <span className="font-mono text-[10px] text-white">
                      {Math.round(team.varianceMagnitude)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Respondents</span>
                    <span className="font-mono text-[10px] text-white">
                      {team.respondentCount}
                    </span>
                  </div>

                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-white/40">
                    {team.fragilityDescription}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400/60" />
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
            Nodes in the upper right indicate high alignment averages masking deep
            internal polarisation.
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Crown className="h-3 w-3 text-amber-400/30" />
          <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
            Abraham of London • Fragility Protocol
          </span>
        </div>
      </div>
    </div>
  );
}

export default FragilityHeatmap;
