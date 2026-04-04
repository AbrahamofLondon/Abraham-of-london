// lib/constitution/rules.ts

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
  clarityScore: number; // 0..100
  authorityType: AuthorityType;
  readinessTier: ReadinessTier;
  posture: OrgPosture;
  failureModeCount: number; // >= 0
  failureModeSeverity: number; // 0..10
  narrativeCoherence: number; // 0..100
  interventionReadiness: number; // 0..100

  /**
   * Governance and mandate signals.
   * Defaults are conservative and safe.
   */
  mandateFit?: boolean;
  seriousnessScore?: number; // 0..100
  operatorOverrideRequested?: boolean;

  /**
   * Optional forward-compatibility inputs.
   * They are intentionally not required so this core stays lightweight.
   */
  trustCondition?: number; // 0..100
  governanceDiscipline?: number; // 0..100
}

export interface ConstitutionalDecision {
  route: ConstitutionalRoute;
  confidence: number; // 0.0..1.0
  disqualifiersTriggered: string[];
  recommendedInterventions: string[];
  rationale: string[];
  postureWeight: number;
  readinessWeight: number;
  escalationAllowed: boolean;
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function integerOrZero(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isStrategyTier(tier: ReadinessTier): boolean {
  return tier === "EXECUTION_READY" || tier === "SOVEREIGN";
}

function isFragileTier(tier: ReadinessTier): boolean {
  return tier === "FRAGILE" || tier === "EMERGING";
}

function postureWeight(posture: OrgPosture): number {
  switch (posture) {
    case "ORDERED":
      return 1.0;
    case "DRIFTING":
      return 0.9;
    case "MISALIGNED":
      return 0.8;
    case "DISORDERED":
      return 0.65;
    default:
      return 0.75;
  }
}

function readinessWeight(readinessTier: ReadinessTier): number {
  switch (readinessTier) {
    case "FRAGILE":
      return 0.55;
    case "EMERGING":
      return 0.68;
    case "STABILIZING":
      return 0.8;
    case "EXECUTION_READY":
      return 0.93;
    case "SOVEREIGN":
      return 1.0;
    default:
      return 0.7;
  }
}

function addIntervention(target: string[], condition: boolean, text: string): void {
  if (condition) target.push(text);
}

function addDisqualifier(target: string[], condition: boolean, text: string): void {
  if (condition) target.push(text);
}

function normaliseInput(raw: ConstitutionInput): Required<ConstitutionInput> {
  return {
    clarityScore: clamp(raw.clarityScore, 0, 100),
    authorityType: raw.authorityType,
    readinessTier: raw.readinessTier,
    posture: raw.posture,
    failureModeCount: integerOrZero(raw.failureModeCount),
    failureModeSeverity: clamp(raw.failureModeSeverity, 0, 10),
    narrativeCoherence: clamp(raw.narrativeCoherence, 0, 100),
    interventionReadiness: clamp(raw.interventionReadiness, 0, 100),
    mandateFit: raw.mandateFit ?? true,
    seriousnessScore: clamp(raw.seriousnessScore ?? 100, 0, 100),
    operatorOverrideRequested: raw.operatorOverrideRequested ?? false,
    trustCondition: clamp(raw.trustCondition ?? 50, 0, 100),
    governanceDiscipline: clamp(raw.governanceDiscipline ?? 50, 0, 100),
  };
}

/**
 * Constitutional routing kernel.
 * Deterministic, auditable, low-surprise.
 * Built to preserve trust, explainability and escalation discipline.
 */
export function evaluateConstitutionalRoute(rawInput: ConstitutionInput): ConstitutionalDecision {
  const t = CONSTITUTIONAL_THRESHOLDS;
  const input = normaliseInput(rawInput);

  const disqualifiers: string[] = [];
  const interventions: string[] = [];
  const rationale: string[] = [];

  const pWeight = postureWeight(input.posture);
  const rWeight = readinessWeight(input.readinessTier);

  let route: ConstitutionalRoute = "DIAGNOSTIC";
  let confidence = t.confidenceDiagnosticBase;
  let escalationAllowed = true;

  // Law 12 — rejection for mandate mismatch
  if (!input.mandateFit) {
    addDisqualifier(disqualifiers, true, "Obvious mismatch with advisory mandate");
    rationale.push("Mandate mismatch makes escalation unconstitutional.");
    route = "REJECT";
    confidence = 0.15;
    escalationAllowed = false;
  }

  // Law 12 — rejection for unserious or cosmetic signal
  if (
    input.seriousnessScore < t.seriousnessReject ||
    (input.seriousnessScore < t.seriousnessMinimum &&
      input.clarityScore < t.clarityWeak &&
      input.narrativeCoherence < t.coherenceStrategy)
  ) {
    addDisqualifier(disqualifiers, true, "Submission lacks serious decision-grade intent");
    rationale.push("The signal is too cosmetic, weak or performative for governed escalation.");
    route = "REJECT";
    confidence = Math.min(confidence, 0.16);
    escalationAllowed = false;
  }

  // Law 1 / Law 3 — minimum decision-grade substance
  if (input.clarityScore < t.clarityReject && input.narrativeCoherence < t.coherenceCritical) {
    addDisqualifier(disqualifiers, true, "Submission lacks minimum decision-grade substance");
    rationale.push("Signal collapses below constitutional minimum for meaningful routing.");
    route = "REJECT";
    confidence = Math.min(confidence, 0.15);
    escalationAllowed = false;
  } else if (input.clarityScore < t.clarityWeak) {
    addDisqualifier(disqualifiers, true, "Clarity score below constitutional minimum (<35)");
    rationale.push("Intake is too shallow for confident escalation.");
    confidence = Math.min(confidence, 0.25);
  }

  // Law 2 — authority must be explicit
  if (input.authorityType === "UNCLEAR") {
    addDisqualifier(disqualifiers, true, "Authority type is UNCLEAR – escalation blocked");
    rationale.push("Authority is unclear, so premium escalation is blocked.");
    route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.3);
    escalationAllowed = false;
  }

  // Law 8 — structural strain
  if (
    input.failureModeCount >= t.failureModeHighCount &&
    input.failureModeSeverity >= t.failureSeverityHigh
  ) {
    addDisqualifier(
      disqualifiers,
      true,
      "High-severity failure density indicates structural strain",
    );
    rationale.push("Failure density and severity indicate architectural disorder.");
    confidence = Math.min(confidence, 0.4);
  }

  // Critical incoherence
  if (input.narrativeCoherence < t.coherenceCritical) {
    addDisqualifier(disqualifiers, true, "Critical narrative incoherence detected");

    if (
      input.failureModeCount >= t.failureModeRejectCount ||
      input.clarityScore < t.clarityReject ||
      input.failureModeSeverity >= t.failureSeverityCritical
    ) {
      route = "REJECT";
      confidence = Math.min(confidence, 0.2);
      escalationAllowed = false;
      rationale.push("Critical incoherence combined with severe strain creates rejection risk.");
    } else {
      route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
      confidence = Math.min(confidence, 0.22);
      rationale.push("Incoherence requires diagnostic containment before any escalation.");
    }
  }

  // Law 13 / 14 — disorder without foundation must not escalate
  if (input.posture === "DISORDERED" && input.narrativeCoherence < t.coherenceStrategy) {
    addDisqualifier(
      disqualifiers,
      true,
      "Disordered posture without sufficient constitutional foundation",
    );
    rationale.push("Disordered posture with weak coherence cannot escalate to STRATEGY.");
    route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.35);
    escalationAllowed = false;
  }

  if (
    input.posture === "DISORDERED" &&
    (!isStrategyTier(input.readinessTier) || input.authorityType !== "DIRECT")
  ) {
    addDisqualifier(
      disqualifiers,
      true,
      "Disordered posture lacks the minimum constitutional conditions for STRATEGY",
    );
    rationale.push("Disordered cases require stronger authority and readiness before escalation.");
    route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.35);
  }

  // Fragile proxy cases must not be oversold
  if (
    input.authorityType === "PROXY" &&
    isFragileTier(input.readinessTier) &&
    input.failureModeSeverity >= t.failureSeverityHigh
  ) {
    addDisqualifier(
      disqualifiers,
      true,
      "Proxy authority under fragile conditions blocks premium escalation",
    );
    rationale.push("Proxy authority under fragility requires diagnostic discipline.");
    route = route === "REJECT" ? "REJECT" : "DIAGNOSTIC";
    confidence = Math.min(confidence, 0.32);
    escalationAllowed = false;
  }

  // Governance and trust shape confidence, but do not silently overrule route.
  if (input.governanceDiscipline < 40) {
    addIntervention(interventions, true, "Restore governance discipline");
    confidence = Math.min(confidence, 0.55);
    rationale.push("Weak governance discipline reduces safe escalation confidence.");
  }

  if (input.trustCondition < 40) {
    addIntervention(interventions, true, "Repair trust before scale");
    confidence = Math.min(confidence, 0.54);
    rationale.push("Trust erosion weakens intervention fit and escalation safety.");
  }

  // Posture-aware intervention shaping
  addIntervention(
    interventions,
    input.posture === "DRIFTING",
    "Restore governance cadence before escalation",
  );
  addIntervention(
    interventions,
    input.posture === "MISALIGNED",
    "Re-sequence strategic priorities and decision ownership",
  );
  addIntervention(
    interventions,
    input.posture === "DISORDERED",
    "Rebuild foundational order before premium escalation",
  );

  // Readiness-aware intervention shaping
  addIntervention(
    interventions,
    input.readinessTier === "FRAGILE",
    "Stabilise governance and authority posture",
  );
  addIntervention(
    interventions,
    input.readinessTier === "EMERGING",
    "Strengthen execution discipline before escalation",
  );
  addIntervention(
    interventions,
    input.readinessTier === "STABILIZING",
    "Tighten operating cadence and escalation order",
  );

  // Failure / clarity interventions
  addIntervention(
    interventions,
    input.failureModeCount > 2,
    "Clarify sponsor and decision owner",
  );
  addIntervention(
    interventions,
    input.narrativeCoherence < t.coherenceStrategy,
    "Restore narrative coherence",
  );
  addIntervention(
    interventions,
    input.authorityType === "PROXY",
    "Confirm mandate and decision boundaries",
  );
  addIntervention(
    interventions,
    input.failureModeSeverity >= 7,
    "Repair trust and governance before scale",
  );
  addIntervention(
    interventions,
    input.interventionReadiness < t.readinessStrategy,
    "Increase intervention readiness before strategic escalation",
  );

  // Strategy gate
  const canPromoteToStrategy =
    input.clarityScore >= t.clarityStrategy &&
    input.authorityType === "DIRECT" &&
    isStrategyTier(input.readinessTier) &&
    input.interventionReadiness >= t.readinessStrategy &&
    input.failureModeCount <= 2 &&
    input.narrativeCoherence >= t.coherenceStrategy &&
    input.posture !== "DISORDERED" &&
    input.mandateFit === true &&
    input.seriousnessScore >= t.seriousnessMinimum &&
    disqualifiers.length === 0 &&
    escalationAllowed;

  if (canPromoteToStrategy) {
    route = "STRATEGY";
    confidence = t.confidenceStrategy * pWeight * rWeight;
    rationale.push("Case satisfies constitutional strategy conditions.");
  } else if (
    route !== "REJECT" &&
    input.clarityScore >= 45 &&
    input.authorityType !== "UNCLEAR" &&
    input.interventionReadiness >= t.readinessDiagnostic
  ) {
    route = "DIAGNOSTIC";
    confidence = Math.max(confidence, 0.58 * pWeight * Math.max(rWeight, 0.8));
    rationale.push("Signal is real, but not yet safe for strategy-grade escalation.");
  }

  // Confidence is a gate, not a decoration
  if (route === "STRATEGY" && confidence < t.confidenceStrategyFloor) {
    route = "DIAGNOSTIC";
    escalationAllowed = false;
    rationale.push("Confidence fell below constitutional strategy floor, so route degraded.");
  }

  // Operator override requests do not change route.
  if (input.operatorOverrideRequested) {
    rationale.push("Override request noted, but constitutional routing remained sovereign.");
  }

  if (route === "STRATEGY") {
    addIntervention(interventions, true, "Define strategic priorities and escalation order");
  }

  if (route === "DIAGNOSTIC") {
    addIntervention(interventions, true, "Surface foundational diagnostic and governance assets");
  }

  if (interventions.length === 0) {
    interventions.push("Maintain constitutional discipline and monitor signal quality");
  }

  if (rationale.length === 0) {
    rationale.push("Route assigned according to constitutional thresholds.");
  }

  return {
    route,
    confidence: clamp(confidence, t.confidenceMin, t.confidenceMax),
    disqualifiersTriggered: uniq(disqualifiers),
    recommendedInterventions: uniq(interventions),
    rationale: uniq(rationale),
    postureWeight: pWeight,
    readinessWeight: rWeight,
    escalationAllowed: route === "STRATEGY",
  };
}