/**
 * Escalation Readiness Scorecard — governed instrument engine.
 *
 * 5 escalation dimensions, each 0-10.
 * Determines whether a decision is ready for Executive Reporting,
 * Strategy Room, Counsel, or retained review.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type EscalationDimension = "evidenceDepth" | "consequenceSeverity" | "authorityClarity" | "executionBlockage" | "recurrenceSignal";

export type EscalationInput = Record<EscalationDimension, number>; // 0-10 each

export type EscalationResult = {
  readinessScore: number;
  readinessBand: "NOT_READY" | "APPROACHING" | "READY" | "OVERDUE";
  recommendedEscalation: "MONITOR" | "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "COUNSEL" | "RETAINED_REVIEW";
  dimensionScores: Record<EscalationDimension, { raw: number; weighted: number }>;
  blockers: string[];
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const WEIGHTS: Record<EscalationDimension, number> = {
  evidenceDepth: 0.25,
  consequenceSeverity: 0.25,
  authorityClarity: 0.20,
  executionBlockage: 0.15,
  recurrenceSignal: 0.15,
};

const DIMENSION_LABELS: Record<EscalationDimension, string> = {
  evidenceDepth: "Evidence depth",
  consequenceSeverity: "Consequence severity",
  authorityClarity: "Authority clarity",
  executionBlockage: "Execution blockage",
  recurrenceSignal: "Recurrence signal",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreEscalationReadiness(input: EscalationInput): EscalationResult {
  const dimensions: Record<EscalationDimension, { raw: number; weighted: number }> = {} as any;
  let composite = 0;

  for (const dim of Object.keys(WEIGHTS) as EscalationDimension[]) {
    const raw = clamp(input[dim] ?? 0);
    const weighted = raw * WEIGHTS[dim] * 10;
    dimensions[dim] = { raw, weighted: Math.round(weighted * 10) / 10 };
    composite += weighted;
  }

  const score = Math.round(Math.min(100, composite));

  const band: EscalationResult["readinessBand"] =
    score >= 75 ? "OVERDUE" : score >= 50 ? "READY" : score >= 30 ? "APPROACHING" : "NOT_READY";

  // Determine recommended escalation path
  const escalation: EscalationResult["recommendedEscalation"] =
    score >= 80 && input.recurrenceSignal >= 7 ? "RETAINED_REVIEW"
    : score >= 70 && input.consequenceSeverity >= 8 ? "COUNSEL"
    : score >= 55 ? "STRATEGY_ROOM"
    : score >= 35 ? "EXECUTIVE_REPORTING"
    : "MONITOR";

  // Identify blockers
  const blockers: string[] = [];
  if (input.evidenceDepth < 3) blockers.push("Evidence is too thin for credible escalation.");
  if (input.authorityClarity < 3) blockers.push("Authority is unclear — escalation may land on the wrong person.");
  if (input.consequenceSeverity < 2 && input.executionBlockage < 2) blockers.push("No material consequence or blockage detected — escalation may be premature.");

  const recommendations: Record<EscalationResult["readinessBand"], string> = {
    NOT_READY: "Escalation is not yet justified by the evidence available. Strengthen the evidence base before requesting higher-level review.",
    APPROACHING: `Evidence is developing. ${DIMENSION_LABELS[getWeakest(dimensions)]} is the primary gap. Address this before escalation becomes necessary.`,
    READY: `Escalation conditions are met. ${escalation === "STRATEGY_ROOM" ? "Strategy Room entry" : escalation === "COUNSEL" ? "Counsel review" : "Executive Reporting"} is the recommended next step.`,
    OVERDUE: `Escalation is overdue. Multiple dimensions indicate this decision has exceeded the point where delayed action increases cost. Immediate ${escalation === "COUNSEL" ? "counsel" : "executive"} escalation is recommended.`,
  };

  const decisionKernel = evaluateDecision({
    id: `escalation-readiness:${score}`,
    source: escalation === "STRATEGY_ROOM" || escalation === "COUNSEL" ? "strategy_room" : "executive_reporting",
    condition: `${band.toLowerCase().replace(/_/g, " ")} escalation readiness`,
    decisionRequired: recommendations[band],
    evidenceChain: (Object.keys(dimensions) as EscalationDimension[]).map((dim) => ({
      inputSource: "escalation_readiness",
      observedPattern: `${DIMENSION_LABELS[dim]} scored ${dimensions[dim].raw}/10`,
      weight: WEIGHTS[dim],
      explanation: "Escalation readiness instrument measures whether evidence justifies higher-level review.",
    })),
    internalContradictions: blockers.length > 0 ? [blockers[0]!] : [],
    scores: Object.fromEntries(
      (Object.keys(dimensions) as EscalationDimension[]).map((dim) => [dim, dimensions[dim].weighted]),
    ),
    signalStrength: band === "OVERDUE" ? "STRONG" : band === "READY" ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: recommendations[band],
  });

  return {
    readinessScore: score,
    readinessBand: band,
    recommendedEscalation: escalation,
    dimensionScores: dimensions,
    blockers,
    recommendation: recommendations[band],
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}

function getWeakest(dimensions: Record<EscalationDimension, { raw: number; weighted: number }>): EscalationDimension {
  let weakest: EscalationDimension = "evidenceDepth";
  let lowest = Infinity;
  for (const dim of Object.keys(dimensions) as EscalationDimension[]) {
    if (dimensions[dim].raw < lowest) {
      lowest = dimensions[dim].raw;
      weakest = dim;
    }
  }
  return weakest;
}
