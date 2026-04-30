/**
 * Server-side assessment integrity scoring.
 *
 * Evaluates response patterns to determine whether an assessment submission
 * should receive full-detail results or reduced-specificity output.
 *
 * This module does NOT expose integrity reasons, flags, or thresholds to
 * the client. Only the publicResponseMode is safe to return.
 */

type IntegrityInput = {
  /** Per-question timing in milliseconds (ordered by answer sequence). */
  responseTimings: number[];
  /** Array of [resonance, certainty] pairs for dual-axis answers. */
  dualAxisPairs: Array<{ resonance: number; certainty: number }>;
  /** Total elapsed time in milliseconds from start to submit. */
  completionMs: number;
  /** Number of questions answered. */
  answerCount: number;
  /** Optional attention-check response values (true = passed). */
  attentionChecks?: boolean[];
};

export type IntegrityVerdict = {
  /** Overall integrity level — never exposed to the user. */
  integrity: "clean" | "cautious" | "degraded";
  /** Reasons for the verdict — private, never sent to client. */
  reasons: string[];
  /** Controls how much detail the result surface reveals. */
  publicResponseMode: "full" | "reduced";
};

const MIN_MS_PER_ANSWER = 900;
const EXTREME_THRESHOLD = 0.7;
const UNIFORMITY_MINIMUM_PATTERNS = 3;
const SPEED_RUSH_TOTAL_MS_PER_ANSWER = 1200;

export function assessIntegrity(input: IntegrityInput): IntegrityVerdict {
  const reasons: string[] = [];
  let score = 0; // higher = more suspicious

  const { responseTimings, dualAxisPairs, completionMs, answerCount, attentionChecks } = input;

  // 1. Response timing analysis
  if (responseTimings.length > 0) {
    const avgMs = responseTimings.reduce((a, b) => a + b, 0) / responseTimings.length;
    if (avgMs < MIN_MS_PER_ANSWER) {
      reasons.push("response_timing_too_fast");
      score += 2;
    }
    const rushCount = responseTimings.filter((t) => t < 500).length;
    if (rushCount > responseTimings.length * 0.5) {
      reasons.push("majority_responses_sub_500ms");
      score += 2;
    }
  }

  // 2. Completion speed
  if (answerCount > 0 && completionMs > 0) {
    const msPerAnswer = completionMs / answerCount;
    if (msPerAnswer < SPEED_RUSH_TOTAL_MS_PER_ANSWER) {
      reasons.push("overall_completion_too_fast");
      score += 1;
    }
  }

  // 3. Answer uniformity (dual-axis)
  if (dualAxisPairs.length >= 4) {
    const patterns = new Set(
      dualAxisPairs.map((p) => `${p.resonance}:${p.certainty}`),
    );
    if (patterns.size < UNIFORMITY_MINIMUM_PATTERNS) {
      reasons.push("answer_pattern_uniform");
      score += 2;
    }

    // Extreme uniformity — too many answers at the poles
    const extremeCount = dualAxisPairs.filter(
      (p) =>
        (p.resonance <= 1 || p.resonance >= 9) &&
        (p.certainty <= 1 || p.certainty >= 9),
    ).length;
    if (extremeCount >= Math.ceil(dualAxisPairs.length * EXTREME_THRESHOLD)) {
      reasons.push("extreme_value_concentration");
      score += 2;
    }
  }

  // 4. Certainty/resonance inconsistency
  if (dualAxisPairs.length >= 4) {
    const conflictCount = dualAxisPairs.filter(
      (p) => Math.abs(p.resonance - p.certainty) >= 5 && p.certainty >= 7,
    ).length;
    if (conflictCount >= Math.ceil(dualAxisPairs.length * 0.45)) {
      reasons.push("excessive_certainty_resonance_conflict");
      score += 1;
    }
  }

  // 5. Attention check failures
  if (attentionChecks && attentionChecks.length > 0) {
    const failCount = attentionChecks.filter((c) => !c).length;
    if (failCount > 0) {
      reasons.push("attention_check_failed");
      score += failCount * 2;
    }
  }

  // Verdict
  let integrity: IntegrityVerdict["integrity"];
  let publicResponseMode: IntegrityVerdict["publicResponseMode"];

  if (score >= 4) {
    integrity = "degraded";
    publicResponseMode = "reduced";
  } else if (score >= 2) {
    integrity = "cautious";
    publicResponseMode = "full";
  } else {
    integrity = "clean";
    publicResponseMode = "full";
  }

  return { integrity, reasons, publicResponseMode };
}
