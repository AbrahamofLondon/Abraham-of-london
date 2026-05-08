/**
 * progression-copy.ts — Earned progression language library.
 *
 * Every progression prompt must feel earned, not upsold.
 * The system escalates because the evidence justifies it,
 * not because the user clicked "upgrade."
 *
 * Doctrine: Decision Intelligence as Infrastructure.
 * Product: Decision Infrastructure by Abraham of London.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE-JUSTIFIED ESCALATION
// ─────────────────────────────────────────────────────────────────────────────

/** When the user's evidence is strong enough to justify deeper analysis. */
export const EVIDENCE_SUFFICIENT = {
  headline: "Your evidence is strong enough for deeper analysis.",
  body: "The system has detected sufficient signal to justify a governed review. Executive Reporting translates this evidence into a priced consequence brief.",
  cta: "Continue to Executive Reporting",
} as const;

/** When multi-source evidence strengthens the case. */
export const MULTI_SOURCE_STRENGTHENED = {
  headline: "Multi-source evidence strengthens this reading.",
  body: "Adding a second diagnostic layer moves this from single-source signal to cross-referenced evidence. The contradiction graph becomes active.",
  cta: "Add the next layer",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CONTRADICTION-DRIVEN ESCALATION
// ─────────────────────────────────────────────────────────────────────────────

/** When unresolved contradiction warrants deeper review. */
export const CONTRADICTION_DETECTED = {
  headline: "The system has detected unresolved contradiction.",
  body: "Executive Reporting is available because this decision now has enough consequence to justify deeper review. The contradiction will not resolve with more data — it requires governed interpretation.",
  cta: "See the governed brief",
} as const;

/** When personal and institutional signals diverge. */
export const PERSONAL_INSTITUTIONAL_DIVERGENCE = {
  headline: "Personal signal and institutional evidence disagree.",
  body: "The Constitutional Diagnostic reads whether this internal conflict has structural consequences at the organisational level.",
  cta: "Continue to Constitutional Diagnostic",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RESTRICTION — NOT YET ADMISSIBLE
// ─────────────────────────────────────────────────────────────────────────────

/** When the evidence is too weak for escalation. */
export const EVIDENCE_INSUFFICIENT = {
  headline: "This decision is not yet admissible for deeper review.",
  body: "The current evidence base does not meet the threshold for governed escalation. Strengthen the evidence first — add another diagnostic layer or provide more specific inputs.",
  cta: "Strengthen the evidence",
} as const;

/** When the commitment gate is declined. */
export const COMMITMENT_DECLINED = {
  headline: "The system is designed for decisions ready to move.",
  body: "You can still view the analysis. The system will classify this as unresolved and track whether the pattern repeats.",
  cta: "View analysis anyway",
} as const;

/** When constitutional route is REJECT. */
export const CONSTITUTIONAL_REJECT = {
  headline: "The current evidence does not support escalation.",
  body: "REJECT means the identified condition prevents progression to the strategy phase at this time. Other assessment pathways remain open. The system does not fabricate readiness.",
  cta: "Return to diagnostics",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LAYER TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Fast Diagnostic -> Purpose Alignment */
export const FAST_TO_PURPOSE = {
  headline: "What is not yet clear is whether this is personal or systemic.",
  body: "Purpose Alignment reads the person — your mandate, your operating pattern, your decision structure. This is personal decision infrastructure, not a personality test.",
  cta: "Start Purpose Alignment",
} as const;

/** Purpose Alignment -> Constitutional Diagnostic */
export const PURPOSE_TO_CONSTITUTIONAL = {
  headline: "The personal signal is established. Now test the structure.",
  body: "The Constitutional Diagnostic reads the organisation — authority, pressure, failure mode density, and readiness for governed intervention.",
  cta: "Start Constitutional Diagnostic",
} as const;

/** Constitutional -> Team Assessment */
export const CONSTITUTIONAL_TO_TEAM = {
  headline: "Constitutional reading established. Add execution evidence.",
  body: "Team Assessment reveals the gap between leadership perception and operating reality. This strengthens the evidence base for Executive Reporting.",
  cta: "Start Team Assessment",
} as const;

/** Team -> Enterprise Assessment */
export const TEAM_TO_ENTERPRISE = {
  headline: "Perception gap measured. Now test institutional fragility.",
  body: "Enterprise Assessment reads organisational exposure, structural strain, and escalation thresholds across the decision landscape.",
  cta: "Start Enterprise Assessment",
} as const;

/** Any diagnostic -> Executive Reporting */
export const DIAGNOSTIC_TO_ER = {
  headline: "The evidence justifies a governed brief.",
  body: "Executive Reporting translates structural strain into financial exposure, names the institutional constraint, and builds a governed priority stack from your specific evidence.",
  cta: "Open Executive Reporting",
} as const;

/** Executive Reporting -> Strategy Room */
export const ER_TO_STRATEGY_ROOM = {
  headline: "The brief is complete. Intervention is warranted.",
  body: "Strategy Room opens when the governed brief identifies conditions that require direct, structured intervention — not when you choose to pay more.",
  cta: "Enter Strategy Room",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY AND RETURN
// ─────────────────────────────────────────────────────────────────────────────

/** Outcome verification prompt. */
export const OUTCOME_TRACKING = {
  headline: "This decision will be tracked.",
  body: "The system verifies whether intervention resolved, improved, stabilised, or worsened the condition at 14 and 30 days. Outcome evidence improves future governed judgment.",
  cta: "Set verification checkpoint",
} as const;

/** Return brief availability. */
export const RETURN_BRIEF_AVAILABLE = {
  headline: "Return Brief is available.",
  body: "Enough time has passed to verify the intervention. The system compares the current state against the original governed reading and classifies the outcome.",
  cta: "View Return Brief",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

export type ProgressionCopy = {
  readonly headline: string;
  readonly body: string;
  readonly cta: string;
};

/** All progression copy blocks indexed by key. */
export const PROGRESSION_LIBRARY = {
  evidenceSufficient: EVIDENCE_SUFFICIENT,
  multiSourceStrengthened: MULTI_SOURCE_STRENGTHENED,
  contradictionDetected: CONTRADICTION_DETECTED,
  personalInstitutionalDivergence: PERSONAL_INSTITUTIONAL_DIVERGENCE,
  evidenceInsufficient: EVIDENCE_INSUFFICIENT,
  commitmentDeclined: COMMITMENT_DECLINED,
  constitutionalReject: CONSTITUTIONAL_REJECT,
  fastToPurpose: FAST_TO_PURPOSE,
  purposeToConstitutional: PURPOSE_TO_CONSTITUTIONAL,
  constitutionalToTeam: CONSTITUTIONAL_TO_TEAM,
  teamToEnterprise: TEAM_TO_ENTERPRISE,
  diagnosticToEr: DIAGNOSTIC_TO_ER,
  erToStrategyRoom: ER_TO_STRATEGY_ROOM,
  outcomeTracking: OUTCOME_TRACKING,
  returnBriefAvailable: RETURN_BRIEF_AVAILABLE,
} as const satisfies Record<string, ProgressionCopy>;
