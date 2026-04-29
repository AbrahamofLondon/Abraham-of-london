import "server-only";

/**
 * Anchor Types — shared type definitions for the anchor-driven decision system.
 *
 * These types are server-only. DecisionAnchors must never appear in client responses.
 * Only the composed AnchorNarrative strings may be exposed to the client.
 */

import type { DiagnosticSeverity } from "@/lib/alignment/types";

// ─── Assessment type identifier ──────────────────────────────────────────────

export type AnchorAssessmentType =
  | "constitutional"
  | "purpose"
  | "team"
  | "enterprise";

// ─── Decision Anchors ────────────────────────────────────────────────────────

/**
 * Extracted from user inputs. Preserves verbatim language where possible.
 * Used by contradiction engine and narrative engine. Never exposed to client.
 */
export type DecisionAnchors = {
  /** Which assessment produced these anchors */
  assessmentType: AnchorAssessmentType;
  /** The actual decision under pressure — in user's words where available */
  decision: string;
  /** What has already been tried — prior actions, corrections, attempts */
  attemptedActions: string[];
  /** What keeps the decision reversible or deferred */
  blocker: string;
  /** The thing pulling against the decision */
  competingPriority: string;
  /** Clarity of decision ownership */
  ownerClarity: "clear" | "contested" | "absent" | "false";
  /** Why now — urgency in user's words */
  urgency: string;
  /** What happens if nothing changes — in user's words */
  statedConsequence: string;
  /** Raw user language fragments preserved for interpolation */
  verbatimFragments: string[];
};

// ─── Anchor Contradiction ────────────────────────────────────────────────────

/**
 * A user-specific contradiction detected from anchor fields.
 * Every field interpolates actual anchor values — no fixed messages.
 */
export type AnchorContradiction = {
  /** What the user said or implied */
  statement: string;
  /** The opposing force or incompatible position */
  tension: string;
  /** What this produces if left unresolved */
  implication: string;
  /** Severity of the contradiction */
  severity: DiagnosticSeverity;
};

// ─── Anchor Narrative ────────────────────────────────────────────────────────

/**
 * The 8-section output composed from anchors.
 * Every section references at least one user anchor.
 * These strings are safe to expose to the client.
 */
export type AnchorNarrative = {
  /** User-specific opening referencing attempted actions and the core tension */
  opening: string;
  /** Names the two positions held simultaneously */
  condition: string;
  /** Why the condition persists — references the blocker */
  whyItExists: string;
  /** System-level pattern bound to user's decision and competing priority */
  pattern: string;
  /** Anchor-driven cost escalation over time */
  costOfInaction: {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  /** Assessment-type-specific perspective (personal/team/enterprise/board) */
  perspective: string;
  /** Binary choice: decision vs competing priority */
  requiredMove: string;
  /** Concrete next step using anchor language */
  cta: string;
};

// ─── Classification context passed into narrative engine ─────────────────────

/**
 * Classification data from existing scoring engines, passed into the
 * narrative engine so it can bind system-level patterns to user anchors.
 */
export type NarrativeClassificationContext = {
  /** Pattern label from classification (e.g. "mandate_fracture", "trust_asymmetry") */
  patternLabel: string;
  /** First corrective action from classification engine */
  firstAction: string;
  /** Consequence text from classification engine */
  consequence: string;
  /** Assessment-specific perspective type */
  perspectiveType: "personal" | "team" | "enterprise" | "board";
};
