/**
 * Governance Drift Detector — governed instrument engine.
 *
 * 6 governance health dimensions. Detects whether a team, board, or
 * organisation is drifting from its declared governance standard.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type DriftDimension = "decisionCadence" | "reviewDiscipline" | "escalationBehaviour" | "accountabilityClarity" | "evidenceQuality" | "followThroughConsistency";

export type DriftInput = Record<DriftDimension, number>; // 0-10 each (10 = strong adherence)

export type DriftPattern = "STABLE" | "EARLY_DRIFT" | "STRUCTURAL_DRIFT" | "GOVERNANCE_BREAKDOWN";

export type DriftResult = {
  driftScore: number; // 0-100 (higher = more drift)
  driftBand: "STABLE" | "WATCH" | "DRIFTING" | "CRITICAL";
  driftPattern: DriftPattern;
  correctionPriority: string[];
  cadenceRisk: string;
  nextReviewRecommendation: string;
  dimensionScores: Record<DriftDimension, { raw: number; driftContribution: number }>;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const WEIGHTS: Record<DriftDimension, number> = {
  decisionCadence: 0.20,
  reviewDiscipline: 0.20,
  escalationBehaviour: 0.15,
  accountabilityClarity: 0.15,
  evidenceQuality: 0.15,
  followThroughConsistency: 0.15,
};

const DIMENSION_LABELS: Record<DriftDimension, string> = {
  decisionCadence: "Decision cadence",
  reviewDiscipline: "Review discipline",
  escalationBehaviour: "Escalation behaviour",
  accountabilityClarity: "Accountability clarity",
  evidenceQuality: "Evidence quality",
  followThroughConsistency: "Follow-through consistency",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreGovernanceDrift(input: DriftInput): DriftResult {
  const dimensions: Record<DriftDimension, { raw: number; driftContribution: number }> = {} as any;
  let driftComposite = 0;
  const weakDims: DriftDimension[] = [];

  for (const dim of Object.keys(WEIGHTS) as DriftDimension[]) {
    const raw = clamp(input[dim] ?? 5);
    const inverted = 10 - raw;
    const contribution = inverted * WEIGHTS[dim] * 10;
    dimensions[dim] = { raw, driftContribution: Math.round(contribution * 10) / 10 };
    driftComposite += contribution;
    if (raw <= 3) weakDims.push(dim);
  }

  const driftScore = Math.round(Math.min(100, driftComposite));

  const driftBand: DriftResult["driftBand"] =
    driftScore >= 70 ? "CRITICAL" : driftScore >= 50 ? "DRIFTING" : driftScore >= 30 ? "WATCH" : "STABLE";

  const driftPattern: DriftPattern =
    weakDims.length >= 4 ? "GOVERNANCE_BREAKDOWN"
    : weakDims.length >= 2 ? "STRUCTURAL_DRIFT"
    : driftScore >= 40 ? "EARLY_DRIFT"
    : "STABLE";

  const correctionPriority = (Object.keys(dimensions) as DriftDimension[])
    .sort((a, b) => dimensions[a].raw - dimensions[b].raw)
    .slice(0, 3)
    .map((dim) => `${DIMENSION_LABELS[dim]} (${dimensions[dim].raw}/10)`);

  const cadenceRisk = input.decisionCadence <= 3
    ? "Decision cadence has broken down. Reviews are not happening at the declared frequency."
    : input.decisionCadence <= 5
      ? "Decision cadence is slipping. Reviews are happening but inconsistently."
      : "Decision cadence is within acceptable bounds.";

  const nextReviewRecommendation = driftScore >= 70
    ? "Immediate governance review required. Do not wait for the next scheduled cycle."
    : driftScore >= 50
      ? "Schedule a governance review within 14 days. Drift is accumulating."
      : driftScore >= 30
        ? "Monitor governance health. Schedule a quarterly review."
        : "No urgent review needed. Maintain current cadence.";

  const recommendations: Record<DriftResult["driftBand"], string> = {
    STABLE: "Governance is operating within declared standards. Continue monitoring at current cadence.",
    WATCH: `Early drift signals detected. ${DIMENSION_LABELS[weakDims[0] ?? "followThroughConsistency"]} is the first dimension weakening.`,
    DRIFTING: `Governance drift is active. ${correctionPriority[0]} requires correction before the drift becomes structural. Quarterly oversight review recommended.`,
    CRITICAL: `Governance has drifted beyond recovery through normal cadence. ${driftPattern === "GOVERNANCE_BREAKDOWN" ? "Multiple dimensions have failed simultaneously." : "Structural correction is required."} Retained oversight engagement recommended.`,
  };

  const decisionKernel = evaluateDecision({
    id: `governance-drift:${driftScore}`,
    source: driftBand === "CRITICAL" ? "retainer" : "executive_reporting",
    condition: `${driftPattern.replace(/_/g, " ").toLowerCase()} — drift score ${driftScore}/100`,
    decisionRequired: recommendations[driftBand],
    evidenceChain: (Object.keys(dimensions) as DriftDimension[]).map((dim) => ({
      inputSource: "governance_drift_detector",
      observedPattern: `${DIMENSION_LABELS[dim]} scored ${dimensions[dim].raw}/10`,
      weight: WEIGHTS[dim],
      explanation: "Governance drift detector measures adherence to declared governance standards.",
    })),
    internalContradictions: weakDims.length >= 2 ? [`${weakDims.length} governance dimensions below minimum`] : [],
    scores: Object.fromEntries(
      (Object.keys(dimensions) as DriftDimension[]).map((dim) => [dim, dimensions[dim].driftContribution]),
    ),
    signalStrength: driftBand === "CRITICAL" ? "STRONG" : driftBand === "DRIFTING" ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: nextReviewRecommendation,
  });

  return {
    driftScore,
    driftBand,
    driftPattern,
    correctionPriority,
    cadenceRisk,
    nextReviewRecommendation,
    dimensionScores: dimensions,
    recommendation: recommendations[driftBand],
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}
