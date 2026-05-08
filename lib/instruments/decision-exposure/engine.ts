/**
 * Decision Exposure Instrument — live scoring engine.
 *
 * 5 dimensions, each 0-10. Weighted composite 0-100.
 * Band: LOW / MODERATE / HIGH / CRITICAL.
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type ExposureDimension = "financial" | "operational" | "reputational" | "strategic" | "temporal";

export type ExposureInput = Record<ExposureDimension, number>; // 0-10 each

export type ExposureResult = {
  exposureScore: number;
  exposureBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  weakestDimension: ExposureDimension;
  dimensionScores: Record<ExposureDimension, { raw: number; weighted: number }>;
  projectedMonthlyCost: number | null;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const WEIGHTS: Record<ExposureDimension, number> = {
  financial: 0.30,
  operational: 0.25,
  reputational: 0.15,
  strategic: 0.20,
  temporal: 0.10,
};

const DIMENSION_LABELS: Record<ExposureDimension, string> = {
  financial: "Financial exposure",
  operational: "Operational disruption",
  reputational: "Reputational risk",
  strategic: "Strategic misalignment",
  temporal: "Time pressure",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreExposure(input: ExposureInput, monthlyCostAnchor?: number): ExposureResult {
  const dimensions: Record<ExposureDimension, { raw: number; weighted: number }> = {} as any;
  let composite = 0;
  let weakest: ExposureDimension = "financial";
  let highestWeighted = 0;

  for (const dim of Object.keys(WEIGHTS) as ExposureDimension[]) {
    const raw = clamp(input[dim] ?? 0);
    const weighted = raw * WEIGHTS[dim] * 10; // scale to contribute to 0-100
    dimensions[dim] = { raw, weighted: Math.round(weighted * 10) / 10 };
    composite += weighted;

    if (weighted > highestWeighted) {
      highestWeighted = weighted;
      weakest = dim;
    }
  }

  const score = Math.round(Math.min(100, composite));

  const band: ExposureResult["exposureBand"] =
    score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 30 ? "MODERATE" : "LOW";

  // Project cost if anchor provided
  let projectedMonthlyCost: number | null = null;
  if (monthlyCostAnchor && monthlyCostAnchor > 0) {
    const multiplier = score >= 75 ? 1.5 : score >= 50 ? 1.2 : score >= 30 ? 1.0 : 0.8;
    projectedMonthlyCost = Math.round(monthlyCostAnchor * multiplier);
  }

  const recommendations: Record<ExposureResult["exposureBand"], string> = {
    LOW: "Exposure is manageable at current levels. Monitor for escalation triggers.",
    MODERATE: `${DIMENSION_LABELS[weakest]} is the primary exposure vector. Address within 30 days before it compounds.`,
    HIGH: `Multiple exposure vectors are active. ${DIMENSION_LABELS[weakest]} requires immediate attention. Executive Reporting recommended to price the full consequence.`,
    CRITICAL: `Exposure is critical across multiple dimensions. ${DIMENSION_LABELS[weakest]} is the most acute. Delay beyond 7 days will shift this from operational to structural damage. Strategy Room entry recommended.`,
  };
  const decisionKernel = evaluateDecision({
    id: `decision-exposure:${score}`,
    source: band === "CRITICAL" ? "strategy_room" : "executive_reporting",
    condition: `${band} decision exposure`,
    decisionRequired: recommendations[band],
    evidenceChain: (Object.keys(dimensions) as ExposureDimension[]).map((dim) => ({
      inputSource: "decision_exposure",
      observedPattern: `${DIMENSION_LABELS[dim]} scored ${dimensions[dim].raw}/10`,
      weight: Math.min(0.9, 0.35 + dimensions[dim].weighted / 100),
      explanation: "The exposure engine quantifies which consequence vectors are already live.",
    })),
    internalContradictions: score >= 50 ? [`${DIMENSION_LABELS[weakest]} is the acute exposure vector.`] : [],
    scores: Object.fromEntries(
      (Object.keys(dimensions) as ExposureDimension[]).map((dim) => [dim, dimensions[dim].weighted]),
    ),
    signalStrength: band === "CRITICAL" ? "STRONG" : band === "HIGH" ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed", count: 1 }],
    expectedOutcome: recommendationForBand(band, weakest),
  });

  return {
    exposureScore: score,
    exposureBand: band,
    weakestDimension: weakest,
    dimensionScores: dimensions,
    projectedMonthlyCost,
    recommendation: recommendations[band],
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}

function recommendationForBand(
  band: ExposureResult["exposureBand"],
  weakest: ExposureDimension,
): string {
  if (band === "CRITICAL") return `Escalate against ${DIMENSION_LABELS[weakest]}.`;
  if (band === "HIGH") return `Price consequence around ${DIMENSION_LABELS[weakest]}.`;
  if (band === "MODERATE") return `Contain ${DIMENSION_LABELS[weakest]} before it compounds.`;
  return "Monitor for new exposure triggers.";
}
