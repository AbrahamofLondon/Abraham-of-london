"use client";

/**
 * EvidenceStrengthMeter — bespoke evidence stage checklist with contributions.
 *
 * Shows completed/missing stages by name with what each stage contributed.
 * Makes evidence progression feel bespoke and governed, not gamified.
 *
 * Types imported from canonical contract: lib/product/evidence-stage-contract.ts
 */

import type { EvidenceTierLevel, StageStatus, StageEntry } from "@/lib/product/evidence-stage-contract";

type Props = {
  level: EvidenceTierLevel;
  stagesCompleted: number;
  totalStages?: number;
  /** Bespoke stage checklist — overrides numeric display */
  stages?: StageEntry[];
  whatWouldStrengthen?: string;
  className?: string;
};

const LEVELS = [
  { key: "insufficient", label: "Insufficient", color: "bg-zinc-600", width: "w-1/5" },
  { key: "single_source", label: "Single-source", color: "bg-zinc-500", width: "w-2/5" },
  { key: "multi_source", label: "Multi-source", color: "bg-amber-500/60", width: "w-3/5" },
  { key: "outcome_verified", label: "Outcome-verified", color: "bg-emerald-500/60", width: "w-4/5" },
  { key: "human_reviewed", label: "Human-reviewed", color: "bg-blue-500/60", width: "w-full" },
] as const;

const STATUS_LABEL: Record<StageStatus, { text: string; color: string }> = {
  completed: { text: "Completed", color: "text-emerald-400/60" },
  not_started: { text: "Not started", color: "text-zinc-600" },
  pending: { text: "Pending", color: "text-amber-400/50" },
  not_applicable: { text: "Not applicable", color: "text-zinc-700" },
};

/**
 * Default stage definitions for the canonical ladder.
 * Pass `stages` prop to override with bespoke contributions.
 */
const DEFAULT_STAGES: StageEntry[] = [
  { key: "fast_diagnostic", label: "Fast Diagnostic", status: "not_started" },
  { key: "purpose_alignment", label: "Purpose Alignment", status: "not_started" },
  { key: "constitutional", label: "Constitutional Diagnostic", status: "not_started" },
  { key: "team", label: "Team Assessment", status: "not_started" },
  { key: "enterprise", label: "Enterprise Assessment", status: "not_started" },
  { key: "executive_reporting", label: "Executive Reporting", status: "not_started" },
  { key: "strategy_room", label: "Strategy Room", status: "not_started" },
  { key: "outcome_verification", label: "Outcome Verification", status: "not_started" },
];

export default function EvidenceStrengthMeter({
  level,
  stagesCompleted,
  totalStages = 8,
  stages,
  whatWouldStrengthen,
  className = "",
}: Props) {
  const currentIndex = LEVELS.findIndex((l) => l.key === level);
  const current = LEVELS[currentIndex] ?? LEVELS[0];
  const stageList = stages ?? DEFAULT_STAGES;
  const showChecklist = Boolean(stages && stages.length > 0);

  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Evidence strength
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          {stagesCompleted}/{totalStages} stages
        </span>
      </div>

      {/* Meter bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${current.color} ${current.width} transition-all duration-500 rounded-full`} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-zinc-400">{current.label}</span>
        {currentIndex < LEVELS.length - 1 && (
          <span className="font-mono text-[9px] text-zinc-600">
            Next: {LEVELS[currentIndex + 1]?.label}
          </span>
        )}
      </div>

      {/* Bespoke stage checklist */}
      {showChecklist && (
        <div className="space-y-1 border-t border-white/[0.05] pt-3">
          {stageList.map((stage) => (
            <div key={stage.key} className="flex items-start gap-2">
              <span
                className="mt-[5px] h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    stage.status === "completed" ? "rgba(110,231,183,0.50)" :
                    stage.status === "pending" ? "rgba(251,191,36,0.40)" :
                    "rgba(255,255,255,0.10)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] tracking-[0.08em] text-zinc-400">
                    {stage.label}
                  </span>
                  <span className={`font-mono text-[8px] tracking-[0.10em] uppercase ${STATUS_LABEL[stage.status].color}`}>
                    {STATUS_LABEL[stage.status].text}
                  </span>
                </div>
                {stage.contribution && stage.status === "completed" && (
                  <p className="text-[11px] leading-[1.5] text-zinc-500 mt-0.5">
                    {stage.contribution}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {whatWouldStrengthen && (
        <p className="mt-2 text-xs text-zinc-500 leading-5">
          {whatWouldStrengthen}
        </p>
      )}
    </div>
  );
}

export type { Props as EvidenceStrengthMeterProps, StageEntry, StageStatus, EvidenceTierLevel };
