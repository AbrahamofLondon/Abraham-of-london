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
  // Core condition classes (4)
  | "AUTHORITY_LEAKAGE"
  | "DEFINITION_FAILURE"
  | "EXECUTION_AVOIDANCE"
  | "LATENT_INSTABILITY"
  // Authority variants (3)
  | "AUTHORITY_CONTEST"
  | "AUTHORITY_VACUUM"
  | "FALSE_AUTHORITY"
  // Definition variants (2)
  | "DEFINITION_DRIFT"
  | "DEFINITION_CONFLICT"
  // Execution variants (2)
  | "EXECUTION_THEATRE"
  | "ESCALATION_AVOIDANCE"
  // Instability variants (2)
  | "STRUCTURAL_FRAGILITY"
  | "GOVERNANCE_EROSION";

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

  // ─── AUTHORITY VARIANTS ────────────────────────────────────────────────

  AUTHORITY_CONTEST: {
    key: "AUTHORITY_CONTEST",
    label: "Multiple parties claim decision authority",
    verdict: "Two or more people believe they own this decision. Neither will defer. The contest itself has become the blocker.",
    contradiction: "You named an owner. But the decision has not moved — because someone else also believes they own it. Contested authority produces meetings, not decisions.",
    move: "Identify which claimant can absorb the consequence. That person decides. Communicate the mandate explicitly within 48 hours.",
    ignored7: "Both claimants continue to act on their interpretation. Downstream execution diverges.",
    ignored30: "The contest has hardened into political territory. Resolution now requires visible escalation.",
    ignored90: "The authority contest has produced two parallel operating realities. Reunification cost exceeds the original decision cost.",
    behaviourReveal: "Under pressure, both parties escalate to their respective sponsors. The decision fragments upward.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies an authority contest, not a full governance audit.",
    primaryStatement: "Two or more people believe they own this decision. Neither will defer.",
    decisionStatement: "Resolve the contest by naming one owner with explicit mandate.",
    consequenceStatement: "The contest has hardened into political territory.",
    moveStatement: "Identify which claimant can absorb the consequence. That person decides.",
  },

  AUTHORITY_VACUUM: {
    key: "AUTHORITY_VACUUM",
    label: "No one claims or exercises decision authority",
    verdict: "This decision has no owner. Not contested — absent. The vacuum is being filled by inertia, not governance.",
    contradiction: "You describe urgency. But no one has stepped forward to own the outcome. Urgency without an owner produces activity without progress.",
    move: "Appoint a decision owner today. Not a committee. One person who reports on the outcome within 7 days.",
    ignored7: "The vacuum attracts informal authority. Someone is making micro-decisions without mandate.",
    ignored30: "The informal decision-maker has established precedent. Formal appointment now requires overriding established behaviour.",
    ignored90: "The vacuum has been permanently filled by whoever acted first. Governance was not exercised — it was surrendered.",
    behaviourReveal: "Under pressure, everyone waits. The decision does not stall — it evaporates.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies an authority vacuum, not a structural assessment.",
    primaryStatement: "This decision has no owner. The vacuum is being filled by inertia.",
    decisionStatement: "Appoint a decision owner. Not a committee. One person.",
    consequenceStatement: "The informal decision-maker has established precedent.",
    moveStatement: "Appoint a decision owner today.",
  },

  FALSE_AUTHORITY: {
    key: "FALSE_AUTHORITY",
    label: "Stated owner lacks real authority to decide",
    verdict: "The named owner holds the title but not the mandate. They can convene meetings but cannot close decisions.",
    contradiction: "You named an owner. But they have not decided — because they cannot. False authority absorbs accountability without exercising power.",
    move: "Determine who can actually absorb the consequence. If the stated owner cannot, escalate the mandate explicitly.",
    ignored7: "The false authority continues to convene without closing. Stakeholders lose confidence in the process.",
    ignored30: "The real decision-maker is now operating informally. The stated owner has become a coordination layer, not an authority.",
    ignored90: "The gap between stated and actual authority is now structural. Governance redesign is required.",
    behaviourReveal: "Under pressure, the stated owner defers upward. Their authority was always conditional.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies a false authority pattern.",
    primaryStatement: "The named owner holds the title but not the mandate.",
    decisionStatement: "Determine who can actually absorb the consequence.",
    consequenceStatement: "The real decision-maker is now operating informally.",
    moveStatement: "Determine who can actually absorb the consequence. Escalate the mandate.",
  },

  // ─── DEFINITION VARIANTS ───────────────────────────────────────────────

  DEFINITION_DRIFT: {
    key: "DEFINITION_DRIFT",
    label: "Decision definition has changed without acknowledgement",
    verdict: "The decision you are trying to make is not the decision that was originally framed. The scope has shifted — but no one has named the shift.",
    contradiction: "You describe the same decision. But the parameters have changed. Drift disguised as continuity produces work against a moving target.",
    move: "Restate the decision as it exists today — not as it was originally framed. Get one stakeholder to confirm the restatement within 48 hours.",
    ignored7: "Execution continues against the original framing. The gap between intent and action widens.",
    ignored30: "The drift has produced two versions of the decision — the one being discussed and the one being executed.",
    ignored90: "The original decision is unrecognisable. Correction requires re-scoping, not re-executing.",
    behaviourReveal: "Under pressure, people reference the original framing. The drift becomes visible only when outputs are compared to stated goals.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies definition drift.",
    primaryStatement: "The decision has drifted from its original framing.",
    decisionStatement: "Restate the decision as it exists today.",
    consequenceStatement: "The drift has produced two versions of the decision.",
    moveStatement: "Restate the decision as it exists today. Get one stakeholder to confirm.",
  },

  DEFINITION_CONFLICT: {
    key: "DEFINITION_CONFLICT",
    label: "Stakeholders hold incompatible definitions of the decision",
    verdict: "Different stakeholders are solving different problems. The decision appears shared but is actually fragmented across incompatible interpretations.",
    contradiction: "You claim alignment. But stakeholders describe different outcomes. Alignment without shared definition is coordination theatre.",
    move: "Write the decision outcome in one sentence. Share it with each stakeholder independently. Record where interpretations diverge.",
    ignored7: "Each stakeholder executes against their interpretation. Rework begins.",
    ignored30: "The interpretations have hardened. Converging them now requires political negotiation, not clarification.",
    ignored90: "The decision has permanently fragmented. Each stakeholder has built execution structures around their interpretation.",
    behaviourReveal: "Under pressure, each stakeholder defends their interpretation as the original intent.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies a definition conflict.",
    primaryStatement: "Different stakeholders are solving different problems.",
    decisionStatement: "Write the decision outcome in one sentence. Test it against each stakeholder.",
    consequenceStatement: "The interpretations have hardened into competing execution paths.",
    moveStatement: "Write the decision outcome in one sentence. Share it with each stakeholder independently.",
  },

  // ─── EXECUTION VARIANTS ────────────────────────────────────────────────

  EXECUTION_THEATRE: {
    key: "EXECUTION_THEATRE",
    label: "Activity substitutes for decision execution",
    verdict: "Work is being produced but the decision is not advancing. Meetings, reports, and updates create the appearance of progress without commitment.",
    contradiction: "You describe active engagement. But the decision remains unmade. Activity without commitment is theatre — it looks like work but produces nothing binding.",
    move: "Cancel one meeting related to this decision. Replace it with a written commitment from the decision owner. Due within 72 hours.",
    ignored7: "The theatre continues. Another update cycle produces another set of slides and no decision.",
    ignored30: "The activity pattern has become the operating rhythm. The decision is now embedded in process, not in progress.",
    ignored90: "The theatre has consumed the decision. The original urgency has been absorbed by the cadence of meetings.",
    behaviourReveal: "Under pressure, more activity is added. The response to stalling is more meetings, not fewer.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies execution theatre.",
    primaryStatement: "Work is being produced but the decision is not advancing.",
    decisionStatement: "Cancel the process. Replace it with a written commitment.",
    consequenceStatement: "The activity pattern has become the operating rhythm.",
    moveStatement: "Cancel one meeting. Replace it with a written commitment due within 72 hours.",
  },

  ESCALATION_AVOIDANCE: {
    key: "ESCALATION_AVOIDANCE",
    label: "Required escalation is being suppressed",
    verdict: "This decision requires escalation but the escalation is being avoided. The team is managing around the constraint instead of surfacing it.",
    contradiction: "You acknowledge the decision is stuck. But escalation has not occurred. Avoidance of escalation is not patience — it is the decision to let the condition worsen.",
    move: "Escalate to the next level of authority within 48 hours. State the blocker, the cost of delay, and the requested decision.",
    ignored7: "The condition continues to worsen while the team manages around it. Options narrow.",
    ignored30: "The escalation that was avoided 30 days ago would have been cheaper. The condition has compounded.",
    ignored90: "The condition is now a crisis. The escalation that was avoided is now forced — at higher cost and lower control.",
    behaviourReveal: "Under pressure, the team reframes the issue as complexity to avoid triggering escalation.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies escalation avoidance.",
    primaryStatement: "This decision requires escalation but the escalation is being avoided.",
    decisionStatement: "Escalate to the next level of authority within 48 hours.",
    consequenceStatement: "The escalation that was avoided 30 days ago would have been cheaper.",
    moveStatement: "Escalate within 48 hours. State the blocker, the cost, and the requested decision.",
  },

  // ─── INSTABILITY VARIANTS ──────────────────────────────────────────────

  STRUCTURAL_FRAGILITY: {
    key: "STRUCTURAL_FRAGILITY",
    label: "Decision structure depends on a single point of failure",
    verdict: "The decision depends on one person, one assumption, or one condition. If that single point fails, the entire structure collapses.",
    contradiction: "You describe stability. But the stability rests on a single dependency. Fragility disguised as order is the most expensive kind of failure.",
    move: "Identify the single point of failure. Create one contingency plan for its removal. Document it within 72 hours.",
    ignored7: "The single point continues to hold. No visible failure — but no resilience either.",
    ignored30: "The dependency has deepened. The single point is now load-bearing for more decisions than originally intended.",
    ignored90: "The single point has failed or departed. The structure that depended on it has collapsed. Recovery is structural, not operational.",
    behaviourReveal: "Under pressure, everyone looks to the same person or assumption. When that point is absent, paralysis is immediate.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies a structural fragility pattern.",
    primaryStatement: "The decision depends on a single point of failure.",
    decisionStatement: "Identify the single point. Create one contingency.",
    consequenceStatement: "The single point has failed or departed. The structure has collapsed.",
    moveStatement: "Identify the single point of failure. Create one contingency plan within 72 hours.",
  },

  GOVERNANCE_EROSION: {
    key: "GOVERNANCE_EROSION",
    label: "Formal governance is being bypassed by informal practice",
    verdict: "The governance structure exists on paper but is not being followed. Decisions are made informally, outside the mandated process.",
    contradiction: "You describe a governance process. But the decision was made outside it. When governance is bypassed routinely, the governance structure has already failed.",
    move: "Identify one decision made outside governance in the last 30 days. Surface it to the governance body. Enforce the process for the next decision cycle.",
    ignored7: "The informal practice continues. The governance structure loses further credibility.",
    ignored30: "Governance has become ceremonial. The real decisions happen in corridors, not in the mandated process.",
    ignored90: "The governance structure has been permanently undermined. Restoring it requires reconstitution, not enforcement.",
    behaviourReveal: "Under pressure, the governance process is the first thing skipped. Speed and informality win over structure.",
    escalationLine: "Escalate when this must be priced, defended, or enforced.",
    boundaryStatement: "Based on your responses. Identifies governance erosion.",
    primaryStatement: "Formal governance is being bypassed by informal practice.",
    decisionStatement: "Identify one decision made outside governance. Surface it.",
    consequenceStatement: "Governance has become ceremonial. The real decisions happen elsewhere.",
    moveStatement: "Identify one decision made outside governance in the last 30 days. Surface it.",
  },
};
