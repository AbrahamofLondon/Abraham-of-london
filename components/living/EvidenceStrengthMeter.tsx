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
import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Props = {
  level: EvidenceTierLevel;
  stagesCompleted: number;
  totalStages?: number;
  /** Bespoke stage checklist — overrides numeric display */
  stages?: StageEntry[];
  whatWouldStrengthen?: string;
  className?: string;
  variant?: LivingThemeVariant;
};

const LEVELS = [
  { key: "insufficient", label: "Insufficient", width: "w-1/5" },
  { key: "single_source", label: "Single-source", width: "w-2/5" },
  { key: "multi_source", label: "Multi-source", width: "w-3/5" },
  { key: "outcome_verified", label: "Outcome-verified", width: "w-4/5" },
  { key: "human_reviewed", label: "Human-reviewed", width: "w-full" },
] as const;

const STATUS_LABEL: Record<StageStatus, { text: string }> = {
  completed: { text: "Completed" },
  not_started: { text: "Not started" },
  pending: { text: "Pending" },
  not_applicable: { text: "Not applicable" },
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
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);
  const currentIndex = LEVELS.findIndex((l) => l.key === level);
  const current = LEVELS[currentIndex] ?? LEVELS[0];
  const stageList = stages ?? DEFAULT_STAGES;
  const showChecklist = Boolean(stages && stages.length > 0);

  const isDark = variant === "dark";

  const meterColors: Record<string, string> = {
    insufficient: isDark ? "bg-zinc-600" : "bg-neutral-300",
    single_source: isDark ? "bg-zinc-500" : "bg-neutral-400",
    multi_source: isDark ? "bg-amber-500/60" : "bg-amber-600/50",
    outcome_verified: isDark ? "bg-emerald-500/60" : "bg-emerald-600/50",
    human_reviewed: isDark ? "bg-blue-500/60" : "bg-blue-600/50",
  };

  const statusColors: Record<StageStatus, string> = {
    completed: isDark ? "text-emerald-400/60" : "text-emerald-700/70",
    not_started: isDark ? "text-zinc-600" : "text-neutral-400",
    pending: isDark ? "text-amber-400/50" : "text-amber-700/60",
    not_applicable: isDark ? "text-zinc-700" : "text-neutral-300",
  };

  const dotColors: Record<string, string> = {
    completed: isDark ? "rgba(110,231,183,0.50)" : "rgba(22,130,80,0.50)",
    pending: isDark ? "rgba(251,191,36,0.40)" : "rgba(180,130,30,0.40)",
    default: isDark ? "rgba(255,255,255,0.10)" : "rgba(64,64,64,0.15)",
  };

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
          Evidence strength
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: theme.muted }}>
          {stagesCompleted}/{totalStages} stages
        </span>
      </div>

      {/* Meter bar */}
      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(64,64,64,0.08)' }}>
        <div className={`h-full ${meterColors[level] ?? meterColors.insufficient} ${current.width} transition-all duration-500 rounded-full`} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px]" style={{ color: theme.muted }}>{current.label}</span>
        {currentIndex < LEVELS.length - 1 && (
          <span className="font-mono text-[9px]" style={{ color: theme.dim }}>
            Next: {LEVELS[currentIndex + 1]?.label}
          </span>
        )}
      </div>

      {/* Bespoke stage checklist */}
      {showChecklist && (
        <div className="space-y-1 pt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          {stageList.map((stage) => (
            <div key={stage.key} className="flex items-start gap-2">
              <span
                className="mt-[5px] h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    stage.status === "completed" ? dotColors.completed :
                    stage.status === "pending" ? dotColors.pending :
                    dotColors.default,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] tracking-[0.08em]" style={{ color: theme.muted }}>
                    {stage.label}
                  </span>
                  <span className={`font-mono text-[8px] tracking-[0.10em] uppercase ${statusColors[stage.status]}`}>
                    {STATUS_LABEL[stage.status].text}
                  </span>
                </div>
                {stage.contribution && stage.status === "completed" && (
                  <p className="text-[11px] leading-[1.5] mt-0.5" style={{ color: theme.body }}>
                    {stage.contribution}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {whatWouldStrengthen && (
        <p className="mt-2 text-xs leading-5" style={{ color: theme.muted }}>
          {whatWouldStrengthen}
        </p>
      )}
    </div>
  );
}

export type { Props as EvidenceStrengthMeterProps, StageEntry, StageStatus, EvidenceTierLevel };