"use client";

/**
 * EvidenceTierBadge — surfaces evidence quality from the existing
 * outcome verification model and decision ledger.
 *
 * Maps to: lib/outcomes/outcome-model.ts (OutcomeClassification)
 *          lib/decision-ledger/ledger-service.ts (CreditProfile)
 *          components/diagnostics/results/OutcomeVerification.tsx
 *
 * Used on assessment results to honestly label evidence strength.
 */

export type EvidenceTier =
  | "single_source"
  | "multi_source"
  | "outcome_verified"
  | "human_reviewed";

type Props = {
  tier: EvidenceTier;
  className?: string;
  showLabel?: boolean;
  /** Optional: number of respondents for multi-source */
  respondentCount?: number;
  /** Optional: outcome classification from outcome-model.ts */
  outcomeClassification?: "resolved" | "improved" | "stable" | "deteriorated" | null;
};

const TIER_CONFIG: Record<EvidenceTier, { label: string; color: string; description: string }> = {
  single_source: {
    label: "Single-source",
    color: "border-zinc-600 text-zinc-400",
    description: "Based on one respondent's perspective",
  },
  multi_source: {
    label: "Multi-source",
    color: "border-amber-500/40 text-amber-400/80",
    description: "Cross-validated from multiple respondent inputs",
  },
  outcome_verified: {
    label: "Outcome-verified",
    color: "border-emerald-500/40 text-emerald-400/80",
    description: "Validated against real-world outcomes via outcome verification model",
  },
  human_reviewed: {
    label: "Human-reviewed",
    color: "border-blue-500/40 text-blue-400/80",
    description: "Reviewed by a qualified analyst through operator review or Strategy Room",
  },
};

export default function EvidenceTierBadge({
  tier,
  className = "",
  showLabel = true,
  respondentCount,
  outcomeClassification,
}: Props) {
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  let extendedLabel = config.label;
  if (tier === "multi_source" && respondentCount && respondentCount > 1) {
    extendedLabel = `${config.label} (${respondentCount})`;
  }
  if (tier === "outcome_verified" && outcomeClassification) {
    extendedLabel = `${config.label} · ${outcomeClassification}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] border px-2 py-1 ${config.color} ${className}`}
      title={config.description}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {showLabel && extendedLabel}
    </span>
  );
}

/**
 * Determines the evidence tier based on available data.
 * Use this to auto-resolve the tier from assessment context.
 */
export function resolveEvidenceTier(params: {
  respondentCount: number;
  hasOutcomeVerification: boolean;
  hasHumanReview: boolean;
}): EvidenceTier {
  if (params.hasHumanReview) return "human_reviewed";
  if (params.hasOutcomeVerification) return "outcome_verified";
  if (params.respondentCount > 1) return "multi_source";
  return "single_source";
}

export function EvidenceTierExplainer({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
        Evidence strength tiers
      </p>
      {(Object.entries(TIER_CONFIG) as [EvidenceTier, typeof TIER_CONFIG[EvidenceTier]][]).map(
        ([key, config]) => (
          <div key={key} className="flex items-center gap-3">
            <EvidenceTierBadge tier={key} />
            <span className="text-xs text-zinc-500">{config.description}</span>
          </div>
        )
      )}
      <p className="text-xs text-zinc-600 pt-2">
        Stronger tiers require more evidence. Single-source readings can be
        strengthened through multi-respondent validation, outcome tracking, or
        operator review.
      </p>
    </div>
  );
}
