/**
 * Execution Risk Index — governed instrument engine.
 *
 * 8 execution factors. Measures whether a decision can survive execution reality.
 * Produces risk index, decay projection, authority gap, and execution vulnerability.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type ExecutionFactor = "ownerClarity" | "resourceAvailability" | "timelineRealism" | "dependencyRisk" | "stakeholderBuyIn" | "priorFailureHistory" | "consequenceVisibility" | "escalationReadiness";

export type ExecutionRiskInput = Record<ExecutionFactor, number>; // 0-10 each (10 = strong/low risk)

export type ExecutionRiskResult = {
  riskIndex: number; // 0-100 (higher = more risk)
  riskBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  decayProjection: string;
  authorityGap: boolean;
  executionVulnerability: string;
  weakestFactors: string[];
  recommendation: string;
  dimensionScores: Record<ExecutionFactor, { raw: number; riskContribution: number }>;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const WEIGHTS: Record<ExecutionFactor, number> = {
  ownerClarity: 0.15,
  resourceAvailability: 0.15,
  timelineRealism: 0.10,
  dependencyRisk: 0.15,
  stakeholderBuyIn: 0.10,
  priorFailureHistory: 0.15,
  consequenceVisibility: 0.10,
  escalationReadiness: 0.10,
};

const FACTOR_LABELS: Record<ExecutionFactor, string> = {
  ownerClarity: "Owner clarity",
  resourceAvailability: "Resource availability",
  timelineRealism: "Timeline realism",
  dependencyRisk: "Dependency risk",
  stakeholderBuyIn: "Stakeholder buy-in",
  priorFailureHistory: "Prior failure history",
  consequenceVisibility: "Consequence visibility",
  escalationReadiness: "Escalation readiness",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreExecutionRisk(input: ExecutionRiskInput): ExecutionRiskResult {
  const dimensions: Record<ExecutionFactor, { raw: number; riskContribution: number }> = {} as any;
  let riskComposite = 0;

  for (const factor of Object.keys(WEIGHTS) as ExecutionFactor[]) {
    const raw = clamp(input[factor] ?? 5);
    const inverted = 10 - raw; // higher inverted = more risk
    const contribution = inverted * WEIGHTS[factor] * 10;
    dimensions[factor] = { raw, riskContribution: Math.round(contribution * 10) / 10 };
    riskComposite += contribution;
  }

  const riskIndex = Math.round(Math.min(100, riskComposite));

  const riskBand: ExecutionRiskResult["riskBand"] =
    riskIndex >= 75 ? "CRITICAL" : riskIndex >= 50 ? "HIGH" : riskIndex >= 30 ? "MODERATE" : "LOW";

  const authorityGap = input.ownerClarity <= 3 || input.escalationReadiness <= 3;

  // Decay projection
  const decayProjection = riskIndex >= 75
    ? "Without intervention, execution capacity will degrade within 7-14 days. Options are narrowing."
    : riskIndex >= 50
      ? "Execution risk is accumulating. Within 30 days, current constraints will likely force a suboptimal path."
      : riskIndex >= 30
        ? "Execution risk is present but manageable. Monitor for escalation triggers over the next 60 days."
        : "Execution risk is within acceptable bounds. No immediate decay projected.";

  // Vulnerability
  const weakestFactors = (Object.keys(dimensions) as ExecutionFactor[])
    .sort((a, b) => dimensions[a].raw - dimensions[b].raw)
    .slice(0, 3)
    .map((f) => `${FACTOR_LABELS[f]} (${dimensions[f].raw}/10)`);

  const executionVulnerability = weakestFactors.length > 0
    ? `Primary vulnerability: ${weakestFactors[0]}. Execution will likely fail at this point first.`
    : "No acute vulnerability detected.";

  const recommendations: Record<ExecutionRiskResult["riskBand"], string> = {
    LOW: "Execution risk is manageable. Proceed with standard governance.",
    MODERATE: `${weakestFactors[0]} is the primary execution risk. Strengthen this before committing resources.`,
    HIGH: `Execution risk is high across multiple factors. ${authorityGap ? "Authority gap detected — escalation may be blocked." : ""} Executive Reporting recommended to price the full execution risk.`,
    CRITICAL: `Execution is at critical risk. ${weakestFactors[0]} has failed below minimum viability. Strategy Room intervention recommended before further commitment.`,
  };

  const decisionKernel = evaluateDecision({
    id: `execution-risk:${riskIndex}`,
    source: riskBand === "CRITICAL" ? "strategy_room" : "executive_reporting",
    condition: `${riskBand.toLowerCase()} execution risk (index ${riskIndex}/100)`,
    decisionRequired: recommendations[riskBand],
    evidenceChain: (Object.keys(dimensions) as ExecutionFactor[]).map((factor) => ({
      inputSource: "execution_risk_index",
      observedPattern: `${FACTOR_LABELS[factor]} scored ${dimensions[factor].raw}/10`,
      weight: WEIGHTS[factor],
      explanation: "Execution risk index measures whether a decision can survive execution reality.",
    })),
    internalContradictions: authorityGap ? ["Authority gap detected — execution owner unclear or escalation not ready"] : [],
    scores: Object.fromEntries(
      (Object.keys(dimensions) as ExecutionFactor[]).map((f) => [f, dimensions[f].riskContribution]),
    ),
    signalStrength: riskBand === "CRITICAL" ? "STRONG" : riskBand === "HIGH" ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: decayProjection,
  });

  return {
    riskIndex,
    riskBand,
    decayProjection,
    authorityGap,
    executionVulnerability,
    weakestFactors,
    recommendation: recommendations[riskBand],
    dimensionScores: dimensions,
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}
