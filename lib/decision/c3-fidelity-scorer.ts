/**
 * C3 Fidelity Scorer — decides whether input deserves synthesis.
 *
 * Scores: Clarity, Context, Consequence.
 * Tiered enforcement:
 *   < 0.5  → HARD_RECOVERY   (no synthesis, interrogation only)
 *   0.5–0.7 → SOFT_RECOVERY  (deterministic only, no contradiction block)
 *   ≥ 0.7  → FULL_SYNTHESIS  (full LLM synthesis + arbiter)
 *
 * Do not synthesize vague input. Do not bluff intelligence.
 */

import type { CaseObject } from "./case-object";
import type { C3Tier, ConfidenceBand } from "./intelligence-spine";

export type C3Score = {
  clarity: number;       // 0-1: is the decision itself clear?
  context: number;       // 0-1: is there enough surrounding information?
  consequence: number;   // 0-1: is the cost/stakes articulated?
  specificityScore: number; // 0-1: composite
  /** @deprecated Use tier instead for new code */
  mode: "SYNTHESIS_READY" | "PRECISION_RECOVERY";
  /** Tiered enforcement level */
  tier: C3Tier;
  /** Human-readable confidence band */
  confidenceBand: ConfidenceBand;
  missing: Array<"clarity" | "context" | "consequence">;
  recoveryQuestion?: string;
};

// Re-export for convenience
export type { C3Tier, ConfidenceBand } from "./intelligence-spine";

/**
 * Score text specificity. Higher = more specific.
 * Checks for: named actors, time references, concrete nouns, causal language.
 */
function textSpecificity(text: string | undefined | null): number {
  if (!text || text.trim().length < 5) return 0;

  const words = text.trim().split(/\s+/).length;
  if (words < 3) return 0.1;

  let score = 0;

  // Length (diminishing returns)
  score += Math.min(0.25, Math.log(words / 3) / Math.log(40 / 3) * 0.25);

  // Named actors (capitalised multi-word, roles)
  if (/\b(CEO|CFO|COO|CTO|board|director|manager|team|department|VP)\b/i.test(text)) score += 0.2;
  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)\b/.test(text)) score += 0.1;

  // Time references
  if (/\b(week|month|day|quarter|year|deadline|Q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) score += 0.15;

  // Concrete nouns (money, numbers, percentages)
  if (/\d/.test(text)) score += 0.1;
  if (/[£$€]/.test(text)) score += 0.1;

  // Causal language
  if (/\b(because|therefore|so that|resulting in|causing|which means|leading to)\b/i.test(text)) score += 0.1;

  return Math.min(1, score);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function deriveTier(specificityScore: number): C3Tier {
  if (specificityScore >= 0.7) return "FULL_SYNTHESIS";
  if (specificityScore >= 0.5) return "SOFT_RECOVERY";
  return "HARD_RECOVERY";
}

function deriveConfidenceBand(specificityScore: number): ConfidenceBand {
  if (specificityScore >= 0.7) return "high";
  if (specificityScore >= 0.5) return "medium";
  return "low";
}

/**
 * Score a CaseObject on Clarity, Context, Consequence.
 */
export function scoreC3(caseObj: CaseObject): C3Score {
  // Clarity: is the decision itself articulated specifically?
  const clarity = textSpecificity(caseObj.decision);

  // Context: is there enough surrounding information?
  const contextInputs = [caseObj.priorAttempt, caseObj.claimedOwner, caseObj.blocker, caseObj.forcedAction];
  const filledContext = contextInputs.filter((t) => t && t.trim().length > 10).length;
  const contextSpecificity = contextInputs.reduce((s, t) => s + textSpecificity(t), 0) / Math.max(1, contextInputs.length);
  const context = Math.min(1, (filledContext / contextInputs.length) * 0.5 + contextSpecificity * 0.5);

  // Consequence: is the cost/stakes articulated?
  const consequence = textSpecificity(caseObj.costOfDelay);

  // Composite
  const specificityScore = Math.round((clarity * 0.35 + context * 0.40 + consequence * 0.25) * 100) / 100;

  // Missing dimensions
  const missing: C3Score["missing"] = [];
  if (clarity < 0.4) missing.push("clarity");
  if (context < 0.4) missing.push("context");
  if (consequence < 0.3) missing.push("consequence");

  // Tiered enforcement
  const tier = deriveTier(specificityScore);
  const confidenceBand = deriveConfidenceBand(specificityScore);

  // Legacy mode for backward compat
  const mode: C3Score["mode"] = tier === "FULL_SYNTHESIS" ? "SYNTHESIS_READY" : "PRECISION_RECOVERY";

  // Recovery question — tiered by severity
  let recoveryQuestion: string | undefined;
  if (tier === "HARD_RECOVERY") {
    // Interrogation mode — demand specifics
    if (missing.includes("clarity")) {
      recoveryQuestion = "The decision is not yet specific enough. What exactly must be decided — not the topic, the decision? One sentence.";
    } else if (missing.includes("context")) {
      recoveryQuestion = "The system cannot isolate the blocker yet. Who has authority to move this decision, and what specifically prevents them from acting?";
    } else if (missing.includes("consequence")) {
      recoveryQuestion = "The cost of delay is not yet visible. What specifically gets more expensive each week this sits unresolved?";
    } else {
      recoveryQuestion = "The input lacks the specificity required for analysis. Name a specific person, a specific deadline, and a specific cost.";
    }
  } else if (tier === "SOFT_RECOVERY") {
    // Partial framing — acknowledge gaps but proceed with deterministic
    if (missing.length > 0) {
      const gapNames = missing.join(", ");
      recoveryQuestion = `The system can produce a partial reading but lacks full ${gapNames}. Provide more detail for a stronger conclusion.`;
    }
  }

  return { clarity, context, consequence, specificityScore, mode, tier, confidenceBand, missing, recoveryQuestion };
}
