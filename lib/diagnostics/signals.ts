/**
 * Signal Dictionary — deterministic language system.
 *
 * No generic output. No drift. No LLM feel. No soft qualifiers.
 * Short. Sharp. Useful. Uncomfortable. Credible.
 *
 * BANNED WORDS: appears, potential, may, could, underlying, manageable,
 * validate whether, likely (except in validity boundary).
 */

export type SignalKey =
  | "AUTHORITY_LEAKAGE"
  | "DEFINITION_FAILURE"
  | "EXECUTION_AVOIDANCE"
  | "LATENT_INSTABILITY";

export type SignalDefinition = {
  key: SignalKey;
  label: string;
  verdict: string;
  contradiction: string;
  move: string;
  ignored7: string;
  ignored30: string;
  ignored90: string;
  behaviourReveal: string;
  escalationLine: string;
  boundaryStatement: string;

  /** @deprecated Use verdict instead */
  primaryStatement: string;
  /** @deprecated Use verdict instead */
  decisionStatement: string;
  /** @deprecated Use ignored30 instead */
  consequenceStatement: string;
  /** @deprecated Use move instead */
  moveStatement: string;
};

export const SIGNALS: Record<SignalKey, SignalDefinition> = {
  AUTHORITY_LEAKAGE: {
    key: "AUTHORITY_LEAKAGE",
    label: "Authority is unclear under urgency",

    verdict: "No one owns this decision. Under urgency, it will be made by whoever acts first.",

    contradiction: "You claim urgency. But no one is authorised to decide. Both cannot hold — urgency without authority produces chaos, not speed.",

    move: "Within 24 hours, name the person who can make this decision without further permission. Tell them.",

    ignored7: "Control begins transferring to whoever acts first. The formal decision-maker loses standing.",
    ignored30: "Informal authority has replaced formal authority. Reversing this now requires visible confrontation.",
    ignored90: "The decision structure has been rewritten by behaviour, not by design. Recovery requires reconstitution.",

    behaviourReveal: "Under pressure, control defaults to position rather than mandate. The decision will be made — but not by design.",

    escalationLine: "Escalate when this must be priced, defended, or enforced.",

    boundaryStatement: "Based on your responses. Identifies a decision pattern, not a full organisational diagnosis.",

    // Legacy compat
    primaryStatement: "No one owns this decision. Under urgency, it will be made by whoever acts first.",
    decisionStatement: "Assign ownership or accept that this decision will be made without control.",
    consequenceStatement: "Informal authority has replaced formal authority. Reversing this now requires visible confrontation.",
    moveStatement: "Within 24 hours, name the person who can make this decision without further permission. Tell them.",
  },

  DEFINITION_FAILURE: {
    key: "DEFINITION_FAILURE",
    label: "The decision is undefined despite claimed ownership",

    verdict: "Someone is expected to own this decision. But no one has defined what it actually is.",

    contradiction: "You claim ownership exists. But the outcome is not defined. Ownership without definition is accountability for nothing.",

    move: "Write the decision outcome in one sentence. Get the owner and one stakeholder to confirm it matches within 48 hours.",

    ignored7: "Execution begins against an undefined target. Work is produced but cannot be validated against an outcome.",
    ignored30: "Stakeholders are now interpreting the decision differently. Rework cost is compounding.",
    ignored90: "The undefined decision has become a structural dependency failure. Downstream work is built on assumption, not agreement.",

    behaviourReveal: "Under conflict, definition dissolves into discussion. The decision exists in language but not in commitment.",

    escalationLine: "Escalate when this must be priced, defended, or enforced.",

    boundaryStatement: "Based on your responses. Identifies a definition gap, not the full scope of execution risk.",

    primaryStatement: "Someone is expected to own this decision. But no one has defined what it actually is.",
    decisionStatement: "Define the decision outcome before assigning responsibility.",
    consequenceStatement: "Stakeholders are now interpreting the decision differently. Rework cost is compounding.",
    moveStatement: "Write the decision outcome in one sentence. Get the owner and one stakeholder to confirm it matches within 48 hours.",
  },

  EXECUTION_AVOIDANCE: {
    key: "EXECUTION_AVOIDANCE",
    label: "The decision is known but being avoided",

    verdict: "This decision is understood. It is being avoided. Avoidance is the current operating decision.",

    contradiction: "You acknowledge urgency. But the decision is deferred. Deferral under urgency is not caution — it is avoidance with institutional language.",

    move: "Set a 7-day deadline. Name the person who reports on the outcome. Do both today.",

    ignored7: "The decision remains unresolved. Options are narrowing. Each day of delay increases the constraint set.",
    ignored30: "The deferred decision is now more expensive to make than it was 30 days ago. Fewer options remain. Each is more constrained.",
    ignored90: "The decision is now forced by external conditions — not by internal authority. The organisation responds reactively, at higher cost.",

    behaviourReveal: "Under pressure, the decision continues to be deferred. The avoidance pattern holds even when consequences are visible.",

    escalationLine: "Escalate when this must be priced, defended, or enforced.",

    boundaryStatement: "Based on your responses. Reflects behaviour around execution, not structural capability.",

    primaryStatement: "This decision is understood. It is being avoided. Avoidance is the current operating decision.",
    decisionStatement: "Act on this decision or explicitly deprioritise it. Deferral is not a third option.",
    consequenceStatement: "The deferred decision is now more expensive to make than it was 30 days ago. Fewer options remain.",
    moveStatement: "Set a 7-day deadline. Name the person who reports on the outcome. Do both today.",
  },

  LATENT_INSTABILITY: {
    key: "LATENT_INSTABILITY",
    label: "Not stable — untested",

    verdict: "This decision is not stable. It is untested. Clarity that has not survived pressure is not clarity.",

    contradiction: "You report no immediate crisis. But ownership, definition, and accountability are all partially unclear. If clarity collapses under urgency, the decision was never owned.",

    move: "Within 72 hours, force this decision through one real constraint: time, cost, or stakeholder disagreement. Observe what breaks.",

    ignored7: "The untested condition holds — for now. No signal of failure, but no proof of resilience.",
    ignored30: "The first real pressure will surface whether this was clarity or assumption. If it was assumption, recovery starts from behind.",
    ignored90: "The untested condition has embedded itself as normal. When it fails, it will fail structurally — not incrementally.",

    behaviourReveal: "Under pressure, this decision transfers control away from the stated owner. The instability is real — it is only unproven.",

    escalationLine: "Escalate when this must be priced, defended, or enforced.",

    boundaryStatement: "Based on your responses. Identifies an instability signal, not a confirmed failure.",

    primaryStatement: "This decision is not stable. It is untested. Clarity that has not survived pressure is not clarity.",
    decisionStatement: "Test whether the claimed clarity survives pressure.",
    consequenceStatement: "The first real pressure will surface whether this was clarity or assumption.",
    moveStatement: "Within 72 hours, force this decision through one real constraint: time, cost, or stakeholder disagreement.",
  },
};
