/**
 * Structural Failure Diagnostic Canvas — governed instrument engine.
 *
 * 6 structural dimensions. Identifies whether the issue is strategic,
 * operational, authority-based, execution-based, or governance-based.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type FailureDimension = "strategyClarity" | "operationalExecution" | "authorityStructure" | "resourceAllocation" | "governanceIntegrity" | "stakeholderAlignment";

export type FailureInput = Record<FailureDimension, number>; // 0-10 each (10 = strong, 0 = failing)

export type FailurePattern = "STRATEGIC_FAILURE" | "OPERATIONAL_FAILURE" | "AUTHORITY_FAILURE" | "RESOURCE_FAILURE" | "GOVERNANCE_FAILURE" | "ALIGNMENT_FAILURE" | "COMPOUND_FAILURE";

export type FailureResult = {
  healthScore: number;
  failurePattern: FailurePattern;
  rootCause: string;
  interventionPriority: string[];
  repairPath: string;
  dimensionScores: Record<FailureDimension, { raw: number; inverted: number }>;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const DIMENSION_LABELS: Record<FailureDimension, string> = {
  strategyClarity: "Strategy clarity",
  operationalExecution: "Operational execution",
  authorityStructure: "Authority structure",
  resourceAllocation: "Resource allocation",
  governanceIntegrity: "Governance integrity",
  stakeholderAlignment: "Stakeholder alignment",
};

const DIMENSION_FAILURE_MAP: Record<FailureDimension, FailurePattern> = {
  strategyClarity: "STRATEGIC_FAILURE",
  operationalExecution: "OPERATIONAL_FAILURE",
  authorityStructure: "AUTHORITY_FAILURE",
  resourceAllocation: "RESOURCE_FAILURE",
  governanceIntegrity: "GOVERNANCE_FAILURE",
  stakeholderAlignment: "ALIGNMENT_FAILURE",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreStructuralFailure(input: FailureInput): FailureResult {
  const dimensions: Record<FailureDimension, { raw: number; inverted: number }> = {} as any;
  let totalHealth = 0;
  let weakestDim: FailureDimension = "strategyClarity";
  let weakestScore = 11;
  const failingDims: FailureDimension[] = [];

  for (const dim of Object.keys(DIMENSION_LABELS) as FailureDimension[]) {
    const raw = clamp(input[dim] ?? 5);
    const inverted = 10 - raw; // higher inverted = more failure
    dimensions[dim] = { raw, inverted };
    totalHealth += raw;

    if (raw < weakestScore) {
      weakestScore = raw;
      weakestDim = dim;
    }
    if (raw <= 3) failingDims.push(dim);
  }

  const healthScore = Math.round((totalHealth / 60) * 100);

  // Determine failure pattern
  const failurePattern: FailurePattern = failingDims.length >= 3
    ? "COMPOUND_FAILURE"
    : DIMENSION_FAILURE_MAP[weakestDim];

  // Root cause
  const rootCause = failingDims.length >= 3
    ? `Multiple structural dimensions are failing simultaneously (${failingDims.map((d) => DIMENSION_LABELS[d]).join(", ")}). This is not a single-point failure — it is compound structural decay.`
    : `The primary structural weakness is ${DIMENSION_LABELS[weakestDim]} (${weakestScore}/10). This is the root cause that other dimensions are likely compensating for.`;

  // Intervention priority
  const interventionPriority = (Object.keys(dimensions) as FailureDimension[])
    .sort((a, b) => dimensions[a].raw - dimensions[b].raw)
    .slice(0, 3)
    .map((dim) => `${DIMENSION_LABELS[dim]}: ${dimensions[dim].raw}/10 — address first`);

  // Repair path
  const repairPath = healthScore >= 70
    ? "Structure is viable. Monitor the weakest dimension and prevent drift."
    : healthScore >= 45
      ? `Address ${DIMENSION_LABELS[weakestDim]} within 30 days. The structure can hold but is under pressure.`
      : `Structural intervention required. ${DIMENSION_LABELS[weakestDim]} has failed below minimum viability. Strategy Room recommended.`;

  const recommendation = healthScore >= 70
    ? `Structural health is acceptable (${healthScore}/100). ${DIMENSION_LABELS[weakestDim]} is the monitoring priority.`
    : healthScore >= 45
      ? `Structural health is under pressure (${healthScore}/100). ${DIMENSION_LABELS[weakestDim]} requires intervention before the condition compounds.`
      : `Structural failure is active (${healthScore}/100). ${failurePattern.replace(/_/g, " ").toLowerCase()} detected. Executive Reporting recommended to price the full consequence.`;

  const decisionKernel = evaluateDecision({
    id: `structural-failure:${healthScore}`,
    source: healthScore < 45 ? "strategy_room" : "executive_reporting",
    condition: `${failurePattern.replace(/_/g, " ").toLowerCase()} — structural health ${healthScore}/100`,
    decisionRequired: recommendation,
    evidenceChain: (Object.keys(dimensions) as FailureDimension[]).map((dim) => ({
      inputSource: "structural_failure_canvas",
      observedPattern: `${DIMENSION_LABELS[dim]} scored ${dimensions[dim].raw}/10`,
      weight: 1 / 6,
      explanation: "Structural failure canvas measures institutional health across 6 dimensions.",
    })),
    internalContradictions: failingDims.length > 1
      ? [`${failingDims.length} dimensions below minimum viability`]
      : [],
    scores: Object.fromEntries(
      (Object.keys(dimensions) as FailureDimension[]).map((dim) => [dim, dimensions[dim].raw * 10]),
    ),
    signalStrength: healthScore < 30 ? "STRONG" : healthScore < 50 ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: repairPath,
  });

  return {
    healthScore,
    failurePattern,
    rootCause,
    interventionPriority,
    repairPath,
    dimensionScores: dimensions,
    recommendation,
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}
