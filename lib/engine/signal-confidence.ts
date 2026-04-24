/**
 * SignalConfidence — propagates source-weighted confidence through all outputs.
 *
 * Single-source signals carry less weight than multi-source.
 * Confidence degrades with staleness and increases with corroboration.
 * Every output must expose its confidence basis.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SourceType = "self_report" | "multi_respondent" | "system_computed" | "outcome_verified" | "external_validated";

export type ConfidenceBasis = {
  /** Final confidence score: 0-1 */
  confidence: number;
  /** Human-readable label */
  label: string;
  /** What the confidence is based on */
  sources: Array<{
    type: SourceType;
    count: number;
    weight: number;
  }>;
  /** What would increase confidence */
  strengthenWith: string[];
  /** Whether this confidence level supports the claim being made */
  sufficient: boolean;
};

// ───────��─────────────────────────────────────────────────────────────────────
// SOURCE WEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_WEIGHT: Record<SourceType, number> = {
  self_report: 0.35,
  multi_respondent: 0.70,
  system_computed: 0.50,
  outcome_verified: 0.90,
  external_validated: 0.95,
};

// ─────��───────────────────────────────────────────────────────────────────────
// CONFIDENCE COMPUTATION
// ──────────────────────��──────────────────────────────────────────────────────

/**
 * Compute confidence from a set of evidence sources.
 *
 * Rules:
 * - Single self-report source: max 0.45 confidence
 * - Multi-respondent: max 0.75
 * - Corroborated (2+ source types): bonus
 * - Outcome-verified: near-ceiling
 * - Stale evidence (>30 days): degraded
 */
export function computeConfidence(sources: Array<{
  type: SourceType;
  count: number;
  ageInDays?: number;
}>): ConfidenceBasis {
  if (sources.length === 0) {
    return {
      confidence: 0.10,
      label: "No evidence sources",
      sources: [],
      strengthenWith: ["Submit at least one assessment to establish a baseline signal."],
      sufficient: false,
    };
  }

  // Base confidence from weighted sources
  let totalWeight = 0;
  let totalContribution = 0;
  const sourceSummary: ConfidenceBasis["sources"] = [];

  for (const s of sources) {
    const baseWeight = SOURCE_WEIGHT[s.type] ?? 0.30;
    // Count bonus: more respondents = more weight (diminishing returns)
    const countMultiplier = Math.min(2.0, 1 + Math.log(Math.max(1, s.count)) / Math.log(10));
    // Staleness penalty
    const agePenalty = s.ageInDays && s.ageInDays > 30 ? Math.min(0.3, (s.ageInDays - 30) / 200) : 0;

    const effectiveWeight = Math.max(0.05, baseWeight * countMultiplier - agePenalty);
    totalWeight += effectiveWeight;
    totalContribution += effectiveWeight * s.count;

    sourceSummary.push({ type: s.type, count: s.count, weight: Math.round(effectiveWeight * 100) / 100 });
  }

  // Corroboration bonus: multiple source types increase confidence
  const uniqueTypes = new Set(sources.map((s) => s.type));
  const corroborationBonus = uniqueTypes.size >= 3 ? 0.15 : uniqueTypes.size >= 2 ? 0.08 : 0;

  // Final confidence
  const raw = Math.min(0.95, (totalWeight / sources.length) + corroborationBonus);
  const confidence = Math.round(raw * 100) / 100;

  // Ceiling based on highest source type
  const hasOutcomeVerified = sources.some((s) => s.type === "outcome_verified");
  const hasMultiRespondent = sources.some((s) => s.type === "multi_respondent");
  const onlySelfReport = sources.every((s) => s.type === "self_report");

  const effectiveConfidence = onlySelfReport
    ? Math.min(confidence, 0.45)
    : !hasMultiRespondent && !hasOutcomeVerified
    ? Math.min(confidence, 0.60)
    : confidence;

  // Label
  const label = effectiveConfidence >= 0.80 ? "High confidence — corroborated or verified"
    : effectiveConfidence >= 0.55 ? "Moderate confidence — directional signal"
    : effectiveConfidence >= 0.35 ? "Low confidence — single-source, needs corroboration"
    : "Insufficient confidence — treat as hypothesis only";

  // Strengthening suggestions
  const strengthenWith: string[] = [];
  if (onlySelfReport) strengthenWith.push("Add multi-respondent data to move beyond single-source signal.");
  if (!hasOutcomeVerified) strengthenWith.push("Verify against actual decision outcomes to establish track record.");
  if (sources.some((s) => s.ageInDays && s.ageInDays > 30)) strengthenWith.push("Refresh stale evidence — signals older than 30 days degrade.");
  if (uniqueTypes.size < 2) strengthenWith.push("Cross-reference with a different evidence type for corroboration.");

  return {
    confidence: effectiveConfidence,
    label,
    sources: sourceSummary,
    strengthenWith,
    sufficient: effectiveConfidence >= 0.35,
  };
}
