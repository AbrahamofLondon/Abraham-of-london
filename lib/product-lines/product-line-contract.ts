/**
 * Product Line Contract — typed boundary between two distinct products.
 *
 * PURPOSE ALIGNMENT = personal mandate and behavioural enforcement product
 * OPERATIONAL DECISION INTELLIGENCE = corporate decision enforcement product
 *
 * These are not the same product. They are not stages of each other.
 * They may share evidence through a typed, optional, auditable bridge.
 *
 * This file is the authority on what each product line is and is not.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT LINES
// ─────────────────────────────────────────────────────────────────────────────

export type ProductLine =
  | "PURPOSE_ALIGNMENT"
  | "OPERATIONAL_DECISION_INTELLIGENCE";

export type ProductLineRole =
  | "PERSONAL_PATTERN_ENFORCEMENT"
  | "CORPORATE_DECISION_ENFORCEMENT";

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type EvidenceType =
  // Purpose Alignment evidence types
  | "personal_pattern"
  | "behavioural_contract"
  | "contract_breach"
  | "avoided_decision"
  | "dissenter_signal"
  // Operational Decision Intelligence evidence types
  | "case_decision"
  | "stakeholder"
  | "outcome"
  // Shared evidence types
  | "recurrence";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTION — the typed bridge between product lines
// ─────────────────────────────────────────────────────────────────────────────

export type ProductLineContribution = {
  id: string;
  /** Which product line produced this evidence */
  source: ProductLine;
  /** Which product line may consume it (null = self-contained) */
  target?: ProductLine;
  /** The role this evidence plays */
  role: ProductLineRole;
  /** What type of evidence this is */
  evidenceType: EvidenceType;
  /** Confidence in this evidence (0-1) */
  confidence: number;
  /** Human-readable summary */
  summary: string;
  /** The actual evidence payload — typed per evidenceType */
  payload: unknown;
  /** When this contribution was created */
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT LINE IDENTITY — what each product is and is not
// ─────────────────────────────────────────────────────────────────────────────

export const PURPOSE_ALIGNMENT_IDENTITY = {
  productLine: "PURPOSE_ALIGNMENT" as ProductLine,
  role: "PERSONAL_PATTERN_ENFORCEMENT" as ProductLineRole,

  answers: [
    "Are my decisions aligned with what I say matters?",
    "Which domain is most inconsistent?",
    "What pattern am I repeating?",
    "What decision am I avoiding?",
    "What binding action must I take?",
    "Did I keep the commitment?",
  ],

  coreComponents: [
    "14 statements across 6 domains",
    "Dual-axis scoring (resonance x certainty)",
    "Live Profile Sidebar",
    "Reflection Gate",
    "Pattern Reading",
    "Pattern-Breaker Contract",
    "Contract Dashboard",
    "Pattern Observatory",
  ],

  isNot: [
    "a corporate assessment",
    "a team diagnostic",
    "a company governance tool",
    "a replacement for Constitutional Diagnostic",
    "a generic fast diagnostic",
    "dependent on Operational Decision Intelligence",
  ],

  paidValue: [
    "enforcement",
    "memory",
    "verification",
    "peer intelligence",
    "behavioural accountability",
  ],

  boundaryStatement: "This is personal behavioural evidence. It may strengthen a corporate decision case, but it does not replace organisational diagnosis.",
} as const;

export const OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY = {
  productLine: "OPERATIONAL_DECISION_INTELLIGENCE" as ProductLine,
  role: "CORPORATE_DECISION_ENFORCEMENT" as ProductLineRole,

  answers: [
    "What decision is stuck?",
    "What organisational contradiction is driving it?",
    "Who owns, blocks, or avoids it?",
    "What does delay cost?",
    "What must be enforced next?",
    "Did the intervention work?",
  ],

  coreComponents: [
    "CaseObject",
    "C3 Fidelity Scorer",
    "Intelligence Spine",
    "Deterministic Arbiter",
    "Evidence Graph",
    "Default Path Forecast",
    "Stakeholder Map",
    "Strategy Room Simulation",
    "Outcome Verification",
  ],

  stages: [
    "fast_diagnostic",
    "constitutional",
    "team",
    "enterprise",
    "executive_reporting",
    "strategy_room",
    "outcome_verification",
  ],

  isNot: [
    "a personal alignment tool",
    "a personality test",
    "a replacement for Purpose Alignment",
    "dependent on Purpose Alignment completion",
  ],
} as const;
