/**
 * Arbiter Tournament — hard authority override for synthesis validation.
 *
 * This is not soft validation. This is a tournament of 5 mandatory rules.
 * If any rule fails, synthesis is rejected. No silent fallback.
 * The user sees the mismatch. That is a market differentiator.
 *
 * Rules:
 * 1. Condition integrity — synthesis class must match deterministic class
 * 2. Contradiction alignment — must reference deterministic contradiction set
 * 3. Move validity — must reference blocker, not generic advice
 * 4. Cost consistency — no invented costs without user-stated cost
 * 5. Avoidance proof — must reference forcedAction or priorAttempt mismatch
 */

import type { GovernedSynthesis } from "./synthesis-engine";
import type { CaseObject } from "./case-object";
import type { DeterministicOutput } from "./intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ArbiterViolation = {
  rule: "condition_integrity" | "contradiction_alignment" | "move_validity" | "cost_consistency" | "avoidance_proof";
  severity: "hard" | "soft";
  message: string;
};

export type ArbiterTournamentResult = {
  accepted: boolean;
  violations: ArbiterViolation[];
  forcedFallback: boolean;
  /** Message to show the user when arbiter rejects synthesis */
  userMessage?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the 5-rule arbiter tournament against synthesis output.
 *
 * Hard violations → reject. Soft violations → warn but allow.
 * Any hard violation means the synthesis is unreliable and the user
 * must see the mismatch — not a quietly degraded result.
 */
export function runArbiterTournament(
  synthesis: Partial<GovernedSynthesis>,
  caseObj: CaseObject,
  deterministic: DeterministicOutput,
): ArbiterTournamentResult {
  const violations: ArbiterViolation[] = [];

  // ── Rule 1: Condition Integrity ──────────────────────────────────────────
  // Synthesis condition class must match deterministic classification
  if (synthesis.conditionClass && synthesis.conditionClass !== deterministic.conditionClass) {
    violations.push({
      rule: "condition_integrity",
      severity: "hard",
      message: `Synthesis classified as "${synthesis.conditionClass}" but deterministic analysis found "${deterministic.conditionClass}". The system's own engines disagree on the nature of your condition.`,
    });
  }

  // ── Rule 2: Contradiction Alignment ──────────────────────────────────────
  // Synthesis contradiction must reference terms from the deterministic contradiction set
  if (synthesis.primaryContradiction && deterministic.contradictionSet.length > 0) {
    const contradictionLower = synthesis.primaryContradiction.toLowerCase();
    const hasAlignment = deterministic.contradictionSet.some((term) => {
      // Check if at least one significant word from each contradiction term appears
      const words = term.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return words.some((w) => contradictionLower.includes(w));
    });

    if (!hasAlignment) {
      violations.push({
        rule: "contradiction_alignment",
        severity: "hard",
        message: "The contradiction identified by synthesis does not align with the structural contradictions detected deterministically. The synthesis may be fabricating a narrative.",
      });
    }
  }

  // ── Rule 3: Move Validity ────────────────────────────────────────────────
  // Concrete move must reference the user's blocker, not be generic advice
  if (synthesis.concreteMove) {
    const moveLower = synthesis.concreteMove.toLowerCase();

    // Check for generic phrases — these are NOT specific to this user
    const genericPhrases = [
      "improve communication", "align stakeholders", "have a conversation",
      "think about", "consider your options", "reflect on", "take some time",
      "gather more information", "consult with", "build consensus",
      "create a plan", "develop a strategy", "assess the situation",
    ];
    const isGeneric = genericPhrases.some((p) => moveLower.includes(p));

    // Check that move references the blocker or the condition
    const referencesBlocker = caseObj.blocker
      ? caseObj.blocker.toLowerCase().split(/\s+/)
          .filter((w) => w.length > 4)
          .some((w) => moveLower.includes(w))
      : false;

    const referencesCondition = moveLower.includes(deterministic.conditionClass);

    if (isGeneric && !referencesBlocker) {
      violations.push({
        rule: "move_validity",
        severity: "hard",
        message: "The recommended action is generic advice, not a move specific to your blocker. Any consultant could have said this without reading your input.",
      });
    } else if (!referencesBlocker && !referencesCondition && !moveLower.includes("72 hour") && !moveLower.includes("24 hour")) {
      violations.push({
        rule: "move_validity",
        severity: "soft",
        message: "The recommended action does not explicitly reference your stated blocker. The move may be valid but is not clearly grounded in your specific situation.",
      });
    }
  }

  // ── Rule 4: Cost Consistency ─────────────────────────────────────────────
  // If synthesis references costs/money, the user must have provided cost data
  if (synthesis.defaultPathForecast) {
    const forecastLower = synthesis.defaultPathForecast.toLowerCase();
    const mentionsCost = /[£$€]|\bcost\b|\bexpense\b|\bprice\b|\bbudget\b|\bfinancial\b|\b\d+k\b|\bmillion\b/.test(forecastLower);
    const userProvidedCost = caseObj.costOfDelay && caseObj.costOfDelay.trim().length > 5;

    if (mentionsCost && !userProvidedCost) {
      violations.push({
        rule: "cost_consistency",
        severity: "hard",
        message: "The forecast references financial consequences, but you did not provide cost-of-delay information. The system is fabricating cost data it does not have.",
      });
    }
  }

  // ── Rule 5: Avoidance Proof ──────────────────────────────────────────────
  // Must reference forcedAction or priorAttempt to prove avoidance detection
  if (synthesis.avoidedDecision) {
    const avoidanceLower = synthesis.avoidedDecision.toLowerCase();

    const referencesForcedAction = caseObj.forcedAction
      ? caseObj.forcedAction.toLowerCase().split(/\s+/)
          .filter((w) => w.length > 4)
          .some((w) => avoidanceLower.includes(w))
      : false;

    const referencesPriorAttempt = caseObj.priorAttempt
      ? caseObj.priorAttempt.toLowerCase().split(/\s+/)
          .filter((w) => w.length > 4)
          .some((w) => avoidanceLower.includes(w))
      : false;

    if (!referencesForcedAction && !referencesPriorAttempt) {
      violations.push({
        rule: "avoidance_proof",
        severity: "soft",
        message: "The avoidance analysis does not reference your forced action or prior attempts. The inference may be valid but lacks grounding in your specific evidence.",
      });
    }
  }

  // ── Tournament Result ────────────────────────────────────────────────────
  const hardViolations = violations.filter((v) => v.severity === "hard");
  const accepted = hardViolations.length === 0;

  let userMessage: string | undefined;
  if (!accepted) {
    const first = hardViolations[0]!;
    if (hardViolations.length === 1) {
      userMessage = `The system detected an inconsistency in its own output: ${first.message} Resolve the information gap before a stronger conclusion can be produced.`;
    } else {
      userMessage = `The system detected ${hardViolations.length} inconsistencies between your narrative and its analysis. ${first.message} The system will not present conclusions it cannot defend.`;
    }
  }

  return {
    accepted,
    violations,
    forcedFallback: !accepted,
    userMessage,
  };
}
