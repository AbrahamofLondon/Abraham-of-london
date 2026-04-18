/* lib/constitution/rules.ts — V2.2 (Production Grade, Mutation-Aware, Sovereign) */
import { getMutation } from "./rule-mutation-engine";
import { getOperatorScore } from "./operator-score";

export type ConstitutionalRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type ReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";
export type OrgPosture = "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";

export interface ConstitutionInput {
  clarityScore: number;
  authorityType: AuthorityType;
  readinessTier: ReadinessTier;
  posture: OrgPosture;
  failureModeCount: number;
  failureModeSeverity: number;
  narrativeCoherence: number;
  interventionReadiness: number;
  mandateFit?: boolean;
  seriousnessScore?: number;
  operatorOverrideRequested?: boolean;
  operatorKey?: string;
  trustCondition?: number;
  governanceDiscipline?: number;
}

export interface ConstitutionalDecision {
  route: ConstitutionalRoute;
  confidence: number; // 0.0 - 1.0
  thresholds: {
    strategyThreshold: number;
    diagnosticThreshold: number;
  };
  proximity: {
    toStrategy: number;
    toDiagnostic: number;
  };
  disqualifiersTriggered: string[];
  recommendedInterventions: string[];
  rationale: string[];
  postureWeight: number;
  readinessWeight: number;
  escalationAllowed: boolean;
  operatorInfluence?: {
    originalRoute: ConstitutionalRoute;
    originalConfidence: number;
    operatorScore: number;
    penaltyApplied: boolean;
  };
}

export const CONSTITUTIONAL_THRESHOLDS = {
  clarityWeak: 35,
  clarityReject: 20,
  clarityStrategy: 65,
  coherenceCritical: 25,
  coherenceStrategy: 50,
  readinessDiagnostic: 40,
  readinessStrategy: 60,
  failureModeHighCount: 3,
  failureModeRejectCount: 5,
  failureSeverityHigh: 6,
  failureSeverityCritical: 8,
  seriousnessMinimum: 35,
  seriousnessReject: 20,
  confidenceMin: 0.1,
  confidenceMax: 1.0,
  confidenceStrategy: 0.9,
  confidenceDiagnosticBase: 0.62,
  confidenceStrategyFloor: 0.55,
} as const;

type MutatedThresholds = {
  clarityWeak: number;
  clarityReject: number;
  clarityStrategy: number;
  coherenceCritical: number;
  coherenceStrategy: number;
  readinessDiagnostic: number;
  readinessStrategy: number;
  failureModeHighCount: number;
  failureModeRejectCount: number;
  failureSeverityHigh: number;
  failureSeverityCritical: number;
  seriousnessMinimum: number;
  seriousnessReject: number;
  confidenceMin: number;
  confidenceMax: number;
  confidenceStrategy: number;
  confidenceDiagnosticBase: number;
  confidenceStrategyFloor: number;
  authorityStrictness: number;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function integerOrZero(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function isStrategyTier(tier: ReadinessTier): boolean {
  return tier === "EXECUTION_READY" || tier === "SOVEREIGN";
}

function isFragileTier(tier: ReadinessTier): boolean {
  return tier === "FRAGILE" || tier === "EMERGING";
}

function postureWeight(posture: OrgPosture): number {
  const weights: Record<OrgPosture, number> = {
    ORDERED: 1.0,
    DRIFTING: 0.9,
    MISALIGNED: 0.8,
    DISORDERED: 0.65,
  };
  return weights[posture] ?? 0.75;
}

function readinessWeight(tier: ReadinessTier): number {
  const weights: Record<ReadinessTier, number> = {
    FRAGILE: 0.55,
    EMERGING: 0.68,
    STABILIZING: 0.8,
    EXECUTION_READY: 0.93,
    SOVEREIGN: 1.0,
  };
  return weights[tier] ?? 0.7;
}

function getThresholds(): MutatedThresholds {
  const base = CONSTITUTIONAL_THRESHOLDS;
  return {
    clarityWeak: clamp(Number(getMutation("CLARITY_MIN")?.value ?? base.clarityWeak), 0, 100),
    clarityReject: base.clarityReject,
    clarityStrategy: base.clarityStrategy,
    coherenceCritical: base.coherenceCritical,
    coherenceStrategy: base.coherenceStrategy,
    readinessDiagnostic: base.readinessDiagnostic,
    readinessStrategy: base.readinessStrategy,
    failureModeHighCount: integerOrZero(base.failureModeHighCount),
    failureModeRejectCount: integerOrZero(base.failureModeRejectCount),
    failureSeverityHigh: clamp(base.failureSeverityHigh, 0, 10),
    failureSeverityCritical: clamp(base.failureSeverityCritical, 0, 10),
    seriousnessMinimum: base.seriousnessMinimum,
    seriousnessReject: base.seriousnessReject,
    confidenceMin: clamp(base.confidenceMin, 0, 1),
    confidenceMax: clamp(base.confidenceMax, 0, 1),
    confidenceStrategy: clamp(base.confidenceStrategy, 0, 1),
    confidenceDiagnosticBase: clamp(base.confidenceDiagnosticBase, 0, 1),
    confidenceStrategyFloor: clamp(base.confidenceStrategyFloor, 0, 1),
    authorityStrictness: Math.max(1, Number(getMutation("AUTHORITY_STRICTNESS")?.value ?? 1)),
  };
}

function degradeRoute(route: ConstitutionalRoute): ConstitutionalRoute {
  if (route === "STRATEGY") return "DIAGNOSTIC";
  if (route === "DIAGNOSTIC") return "REJECT";
  return "REJECT";
}

/* ======================================================================== */
/* CONSTITUTIONAL ROUTING KERNEL — SOVEREIGN, DETERMINISTIC, EXPLAINABLE     */
/* ======================================================================== */
export function evaluateConstitutionalRoute(
  rawInput: ConstitutionInput
): ConstitutionalDecision {
  const t = getThresholds();
  const input = {
    clarityScore: clamp(rawInput.clarityScore ?? 0, 0, 100),
    authorityType: rawInput.authorityType ?? "UNCLEAR",
    readinessTier: rawInput.readinessTier ?? "EMERGING",
    posture: rawInput.posture ?? "MISALIGNED",
    failureModeCount: integerOrZero(rawInput.failureModeCount),
    failureModeSeverity: clamp(rawInput.failureModeSeverity ?? 0, 0, 10),
    narrativeCoherence: clamp(rawInput.narrativeCoherence ?? 0, 0, 100),
    interventionReadiness: clamp(rawInput.interventionReadiness ?? 0, 0, 100),
    mandateFit: rawInput.mandateFit ?? true,
    seriousnessScore: clamp(rawInput.seriousnessScore ?? 50, 0, 100),
    operatorOverrideRequested: rawInput.operatorOverrideRequested ?? false,
    operatorKey: (rawInput.operatorKey ?? "").trim() || "anonymous",
    trustCondition: clamp(rawInput.trustCondition ?? 50, 0, 100),
    governanceDiscipline: clamp(rawInput.governanceDiscipline ?? 50, 0, 100),
  };

  const disqualifiers: string[] = [];
  const interventions: string[] = [];
  const rationale: string[] = [];

  const pWeight = postureWeight(input.posture);
  const rWeight = readinessWeight(input.readinessTier);

  let route: ConstitutionalRoute = "DIAGNOSTIC";
  let confidence = t.confidenceDiagnosticBase;
  let escalationAllowed = true;

  const originalRoute = route;
  const originalConfidence = confidence;

  // 1. Mandate & Seriousness Gates (Hard Disqualifiers)
  if (!input.mandateFit) {
    disqualifiers.push("Mandate mismatch");
    rationale.push("Clear mismatch with advisory mandate — rejection required.");
    route = "REJECT";
    confidence = 0.15;
    escalationAllowed = false;
  }

  if (input.seriousnessScore < t.seriousnessReject) {
    disqualifiers.push("Below minimum seriousness threshold");
    rationale.push("Signal lacks decision-grade intent.");
    route = "REJECT";
    confidence = 0.16;
    escalationAllowed = false;
  }

  // 2. Clarity & Coherence Collapse
  if (input.clarityScore < t.clarityReject || input.narrativeCoherence < t.coherenceCritical) {
    disqualifiers.push("Critical clarity/coherence failure");
    rationale.push("Signal collapses below constitutional minimum for any escalation.");
    route = "REJECT";
    confidence = 0.18;
    escalationAllowed = false;
  } else if (input.clarityScore < t.clarityWeak) {
    disqualifiers.push("Clarity below live threshold");
    rationale.push(`Clarity (${input.clarityScore}) below constitutional floor.`);
    route = "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.32);
  }

  // 3. Authority Gate
  const authorityStrict = t.authorityStrictness > 1;
  if (input.authorityType === "UNCLEAR" || (authorityStrict && input.authorityType !== "DIRECT")) {
    disqualifiers.push("Insufficient authority");
    rationale.push(authorityStrict 
      ? "Authority strictness elevated — DIRECT required." 
      : "Authority type unclear.");
    route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.35);
    escalationAllowed = false;
  }

  // 4. Structural Failure Density
  if (input.failureModeCount >= t.failureModeRejectCount || 
      input.failureModeSeverity >= t.failureSeverityCritical) {
    disqualifiers.push("Severe structural failure density");
    rationale.push("Failure count/severity exceeds constitutional tolerance.");
    route = "REJECT";
    confidence = 0.22;
    escalationAllowed = false;
  }

  // 5. Posture & Readiness Brakes
  if (input.posture === "DISORDERED" && !isStrategyTier(input.readinessTier)) {
    disqualifiers.push("Disordered posture without sovereign readiness");
    rationale.push("Disordered state requires diagnostic containment.");
    route = "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.38);
    escalationAllowed = false;
  }

  // 6. Strategy Promotion Gate
  const canGoStrategy =
    input.clarityScore >= t.clarityStrategy &&
    input.authorityType === "DIRECT" &&
    isStrategyTier(input.readinessTier) &&
    input.interventionReadiness >= t.readinessStrategy &&
    input.narrativeCoherence >= t.coherenceStrategy &&
    input.failureModeCount <= 2 &&
    input.posture !== "DISORDERED" &&
    input.mandateFit &&
    disqualifiers.length === 0;

  if (canGoStrategy) {
    route = "STRATEGY";
    confidence = t.confidenceStrategy * pWeight * rWeight;
    rationale.push("All constitutional conditions for STRATEGY route satisfied.");
  }

  // 7. Operator Influence (can only degrade, never upgrade)
  const operator = getOperatorScore(input.operatorKey);
  let operatorInfluenceApplied = false;

  if (operator.score < 40) {
    const degraded = degradeRoute(route);
    if (degraded !== route) {
      route = degraded;
      confidence *= 0.68;
      operatorInfluenceApplied = true;
      rationale.push(`Operator score (${operator.score}) degraded route.`);
    } else {
      confidence *= 0.82;
      operatorInfluenceApplied = true;
      rationale.push(`Operator score reduced confidence.`);
    }
  }

  // Final safety clamps
  confidence = clamp(confidence, t.confidenceMin, t.confidenceMax);
  escalationAllowed = route === "STRATEGY";

  // Default interventions if none generated
  if (interventions.length === 0) {
    interventions.push("Maintain constitutional discipline and monitor signal quality");
  }

  const thresholdSignal = Math.round(
    Math.min(
      input.clarityScore,
      input.narrativeCoherence,
      input.interventionReadiness,
      input.governanceDiscipline,
    ),
  );

  return {
    route,
    confidence,
    thresholds: {
      strategyThreshold: t.clarityStrategy,
      diagnosticThreshold: t.clarityWeak,
    },
    proximity: {
      toStrategy: thresholdSignal - t.clarityStrategy,
      toDiagnostic: thresholdSignal - t.clarityWeak,
    },
    disqualifiersTriggered: uniq(disqualifiers),
    recommendedInterventions: uniq(interventions),
    rationale: uniq(rationale.length ? rationale : ["Route assigned according to constitutional thresholds."]),
    postureWeight: pWeight,
    readinessWeight: rWeight,
    escalationAllowed,
    operatorInfluence: operatorInfluenceApplied
      ? {
          originalRoute,
          originalConfidence: clamp(originalConfidence, t.confidenceMin, t.confidenceMax),
          operatorScore: operator.score,
          penaltyApplied: true,
        }
      : undefined,
  };
}
