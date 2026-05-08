"use client";

/**
 * Shows progress through the living intelligence journey.
 * Each completed stage is checked; current stage is highlighted; future stages are dimmed.
 */

type Stage = {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
};

type Props = {
  stages: Stage[];
  className?: string;
};

const CANONICAL_STAGES: Array<{ key: string; label: string }> = [
  { key: "fast_diagnostic", label: "Signal" },
  { key: "purpose_alignment", label: "Alignment" },
  { key: "constitutional", label: "Posture" },
  { key: "team", label: "Team" },
  { key: "enterprise", label: "Enterprise" },
  { key: "executive_reporting", label: "Executive" },
  { key: "strategy_room", label: "Execution" },
  { key: "outcome_verification", label: "Outcome" },
];

export default function LivingSpineProgress({ stages, className = "" }: Props) {
  const resolvedStages = stages.length > 0 ? stages : CANONICAL_STAGES.map((s) => ({
    ...s,
    completed: false,
    current: false,
  }));

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1">
        {resolvedStages.map((stage, i) => (
          <div key={stage.key} className="flex items-center">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                stage.completed
                  ? "w-8 bg-amber-500/60"
                  : stage.current
                    ? "w-8 bg-amber-500/30 animate-pulse"
                    : "w-4 bg-white/8"
              }`}
              title={`${stage.label}${stage.completed ? " (completed)" : stage.current ? " (current)" : ""}`}
            />
            {i < resolvedStages.length - 1 && (
              <div className={`w-1 h-px ${stage.completed ? "bg-amber-500/30" : "bg-white/5"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[9px] text-zinc-600">
          {resolvedStages.filter((s) => s.completed).length} of {resolvedStages.length}
        </span>
        <span className="font-mono text-[9px] text-zinc-600">
          {resolvedStages.find((s) => s.current)?.label ?? ""}
        </span>
      </div>
    </div>
  );
}

/** Helper to build stage list from completed stage keys */
export function buildStageProgress(completedKeys: string[], currentKey?: string): Stage[] {
  return CANONICAL_STAGES.map((s) => ({
    ...s,
    completed: completedKeys.includes(s.key),
    current: s.key === currentKey,
  }));
}
