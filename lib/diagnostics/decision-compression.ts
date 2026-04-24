/**
 * Decision Compression Engine — each layer reduces ambiguity, increases force.
 *
 * SYSTEM MODEL:
 * Fast Diagnostic → Detect: "Something is wrong"
 * Full Assessment → Isolate: "This is exactly what is wrong"
 * Executive Reporting → Quantify: "This is what it costs"
 * Strategy Room → Enforce: "This is what must happen now"
 *
 * No layer may use weaker language than the one before.
 * More depth = more certainty, not more explanation.
 */

export type CompressionLayer = "fast" | "full" | "executive_reporting" | "strategy_room";

export type DecisionCore = {
  layer: CompressionLayer;
  decision: string;
  consequence: string;
  move: string;
  contradiction: string;
  /** At least 2: actor, constraint, domain, dependency, failure mode */
  precisionVariables: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE ESCALATION LADDER — fixed phrases per layer
// ─────────────────────────────────────────────────────────────────────────────

export type EscalationLanguage = {
  contradictionFrame: string;
  consequenceFrame: string;
  moveFrame: string;
  decisionFrame: string;
};

export const ESCALATION_LADDER: Record<CompressionLayer, EscalationLanguage> = {
  fast: {
    contradictionFrame: "Your answers conflict.",
    consequenceFrame: "This pattern typically compounds within 7–30 days.",
    moveFrame: "Within 24 hours, name the person responsible.",
    decisionFrame: "You must assign ownership or accept loss of control.",
  },
  full: {
    contradictionFrame: "You have a structural contradiction between {domainA} and {domainB}. These cannot both be true.",
    consequenceFrame: "This contradiction is producing execution divergence that will widen under pressure.",
    moveFrame: "Name the owner of this decision and define what they can decide without escalation.",
    decisionFrame: "You must resolve this contradiction or accept that it will resolve itself without your control.",
  },
  executive_reporting: {
    contradictionFrame: "This contradiction is currently costing execution stability and will degrade control within 30 days.",
    consequenceFrame: "Estimated exposure: {exposure}. The cost compounds with each decision cycle.",
    moveFrame: "Document this decision formally and assign authority with a defined scope.",
    decisionFrame: "This decision must be priced, documented, and assigned — or it becomes an unmanaged liability.",
  },
  strategy_room: {
    contradictionFrame: "This contradiction is actively transferring control away from you.",
    consequenceFrame: "Without enforcement, this decision defaults to whoever acts first. Recovery cost increases {multiplier}x per month.",
    moveFrame: "Assign decision authority to {role} and enforce execution within 7 days.",
    decisionFrame: "This decision is being enforced. Delay is no longer available.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTRADICTION INTENSITY — escalates across layers
// ─────────────────────────────────────────────────────────────────────────────

export type ContradictionIntensity = "awareness" | "incompatibility" | "damage" | "loss_of_control";

export const INTENSITY_BY_LAYER: Record<CompressionLayer, ContradictionIntensity> = {
  fast: "awareness",
  full: "incompatibility",
  executive_reporting: "damage",
  strategy_room: "loss_of_control",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOVE PRECISION — each layer increases execution specificity
// ─────────────────────────────────────────────────────────────────────────────

export type MovePrecision = "personal_action" | "team_action" | "structured_decision" | "enforced_assignment";

export const MOVE_PRECISION_BY_LAYER: Record<CompressionLayer, MovePrecision> = {
  fast: "personal_action",
  full: "team_action",
  executive_reporting: "structured_decision",
  strategy_room: "enforced_assignment",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPRESSION ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────

const LAYER_ORDER: CompressionLayer[] = ["fast", "full", "executive_reporting", "strategy_room"];

export type CompressionViolation = {
  field: string;
  previousLayer: CompressionLayer;
  currentLayer: CompressionLayer;
  issue: string;
};

/**
 * Enforce that each deeper layer is more specific, not more verbose.
 * Returns violations if the deeper layer is weaker.
 */
export function enforceDecisionCompression(
  previous: DecisionCore,
  current: DecisionCore,
): CompressionViolation[] {
  const violations: CompressionViolation[] = [];

  const prevIndex = LAYER_ORDER.indexOf(previous.layer);
  const currIndex = LAYER_ORDER.indexOf(current.layer);

  if (currIndex <= prevIndex) {
    violations.push({
      field: "layer",
      previousLayer: previous.layer,
      currentLayer: current.layer,
      issue: "Current layer is not deeper than previous layer.",
    });
    return violations;
  }

  // Decision must be more specific (different, not identical)
  if (current.decision === previous.decision) {
    violations.push({
      field: "decision",
      previousLayer: previous.layer,
      currentLayer: current.layer,
      issue: "Decision text is identical to previous layer. Must be more specific.",
    });
  }

  // Move must be different and more specific
  if (current.move === previous.move) {
    violations.push({
      field: "move",
      previousLayer: previous.layer,
      currentLayer: current.layer,
      issue: "Move is identical to previous layer. Must increase execution specificity.",
    });
  }

  // Precision variables must increase
  if (current.precisionVariables.length < previous.precisionVariables.length + 1) {
    violations.push({
      field: "precisionVariables",
      previousLayer: previous.layer,
      currentLayer: current.layer,
      issue: `Precision variables (${current.precisionVariables.length}) must exceed previous layer (${previous.precisionVariables.length}).`,
    });
  }

  // Contradiction must not soften
  const prevIntensity = INTENSITY_BY_LAYER[previous.layer];
  const currIntensity = INTENSITY_BY_LAYER[current.layer];
  const intensityOrder: ContradictionIntensity[] = ["awareness", "incompatibility", "damage", "loss_of_control"];
  if (intensityOrder.indexOf(currIntensity) < intensityOrder.indexOf(prevIntensity)) {
    violations.push({
      field: "contradiction",
      previousLayer: previous.layer,
      currentLayer: current.layer,
      issue: `Contradiction intensity (${currIntensity}) is weaker than previous (${prevIntensity}).`,
    });
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSEQUENCE STRUCTURE — time-bound, not narrative
// ─────────────────────────────────────────────────────────────────────────────

export type StructuredConsequence = {
  immediate: string;
  thirtyDays: string;
  ninetyDays: string;
};

/**
 * Build a time-bound consequence from signal + layer.
 * No vague consequences. All time-bound.
 */
export function buildStructuredConsequence(
  signalKey: string,
  layer: CompressionLayer,
): StructuredConsequence {
  if (signalKey === "AUTHORITY_LEAKAGE") {
    return {
      immediate: layer === "fast" || layer === "full"
        ? "Execution slows due to unclear ownership."
        : "Execution divergence is active. Decisions are being made without mandate.",
      thirtyDays: layer === "fast" || layer === "full"
        ? "Parallel decisions emerge across teams."
        : "Informal authority structures solidify. Formal governance loses credibility.",
      ninetyDays: layer === "fast" || layer === "full"
        ? "Authority becomes distributed and non-recoverable without escalation."
        : "Authority reconstitution requires structural intervention, not operational adjustment.",
    };
  }

  if (signalKey === "DEFINITION_FAILURE") {
    return {
      immediate: layer === "fast" || layer === "full"
        ? "Execution stalls because the outcome is not agreed."
        : "Resources are being committed against an undefined target.",
      thirtyDays: layer === "fast" || layer === "full"
        ? "Stakeholders begin interpreting the outcome differently."
        : "Execution produces contradictory outputs. Rework cost begins compounding.",
      ninetyDays: layer === "fast" || layer === "full"
        ? "The decision dissolves into recurring discussion without resolution."
        : "The undefined decision becomes a structural dependency failure affecting downstream work.",
    };
  }

  if (signalKey === "EXECUTION_AVOIDANCE") {
    return {
      immediate: layer === "fast" || layer === "full"
        ? "The decision is deferred. Options remain but pressure grows."
        : "Active avoidance is consuming decision bandwidth without producing outcomes.",
      thirtyDays: layer === "fast" || layer === "full"
        ? "Options narrow as urgency increases."
        : "The cost of the decision has increased. Fewer options remain. Each is more constrained.",
      ninetyDays: layer === "fast" || layer === "full"
        ? "The deferred decision reappears under worse conditions."
        : "The decision is now forced by external conditions rather than internal authority.",
    };
  }

  // LATENT_INSTABILITY
  return {
    immediate: "No immediate failure visible.",
    thirtyDays: layer === "fast" || layer === "full"
      ? "Underlying inconsistencies begin surfacing under pressure."
      : "The latent condition produces unpredictable failures when pressure increases.",
    ninetyDays: layer === "fast" || layer === "full"
      ? "The condition becomes structural if not tested."
      : "The untested condition has embedded itself. Resolution now requires diagnostic, not observation.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REALITY CHECK — is this falsifiable or operational?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test whether a statement survives reality scrutiny.
 * ❌ "Teams are misaligned" — unfalsifiable, vague
 * ✅ "3 stakeholders will give different answers to the same priority question" — testable
 */
export function realityCheck(statement: string): { passes: boolean; reason: string } {
  const vague = [
    "misaligned", "need to improve", "should consider", "may benefit",
    "teams are", "communication is", "strategy needs", "culture is",
  ];

  const lower = statement.toLowerCase();
  for (const v of vague) {
    if (lower.includes(v)) {
      return {
        passes: false,
        reason: `Contains vague language: "${v}". Replace with testable, observable statement.`,
      };
    }
  }

  // Must contain at least one specificity marker
  const hasActor = /\b(who|person|role|owner|stakeholder|team|lead)\b/i.test(statement);
  const hasTime = /\b(days?|weeks?|months?|hours?|deadline|within|before|after)\b/i.test(statement);
  const hasAction = /\b(assign|name|write|document|enforce|resolve|test|ask|compare)\b/i.test(statement);

  const specificity = [hasActor, hasTime, hasAction].filter(Boolean).length;

  if (specificity < 1) {
    return {
      passes: false,
      reason: "Statement lacks specificity markers (actor, time, or action). Add at least one.",
    };
  }

  return { passes: true, reason: "Statement is operational and testable." };
}
