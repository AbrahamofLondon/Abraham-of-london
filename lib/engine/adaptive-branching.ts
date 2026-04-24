/**
 * Adaptive Question Branching — questions change based on prior answers.
 *
 * WHY THIS IS IRREPLICABLE:
 * A competitor can see the finished assessment output but cannot reverse-engineer
 * the branching logic. Two users with different answer patterns get different
 * follow-up questions, producing different evidence depth in different domains.
 *
 * The branching tree is the IP. The output is the result.
 */

export type BranchCondition = {
  /** Which question ID triggered this branch */
  triggeredBy: string;
  /** Condition: score below threshold, gap detected, or pattern match */
  condition: "score_below" | "score_above" | "gap_detected" | "contradiction" | "high_certainty_low_resonance";
  /** Threshold for the condition */
  threshold: number;
};

export type AdaptiveQuestion = {
  id: string;
  domain: string;
  statement: string;
  /** Why this question is being asked (shown to user for transparency) */
  rationale: string;
  /** Branch conditions — only shown if these are met */
  showWhen: BranchCondition[];
  /** Priority: higher = asked first within branch */
  priority: number;
};

export type BranchingResult = {
  /** Questions to show next */
  nextQuestions: AdaptiveQuestion[];
  /** Why these questions were selected */
  branchReason: string;
  /** How many total questions the user will see (helps set expectation) */
  estimatedRemainingQuestions: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

const ADAPTIVE_QUESTIONS: AdaptiveQuestion[] = [
  // IDENTITY deep-dive (triggers when identity score < 4)
  {
    id: "adapt_identity_1",
    domain: "identity",
    statement: "If you had to rewrite your mandate today in one sentence, what would it say — and would your team recognise it?",
    rationale: "Your identity signal was weak. This tests whether the mandate exists in practice, not just in theory.",
    showWhen: [{ triggeredBy: "identity", condition: "score_below", threshold: 4 }],
    priority: 10,
  },
  {
    id: "adapt_identity_2",
    domain: "identity",
    statement: "Name the last decision you made that was clearly driven by your stated mandate, not by pressure or convenience.",
    rationale: "Testing whether the mandate produces decisions or just language.",
    showWhen: [{ triggeredBy: "identity", condition: "score_below", threshold: 5 }],
    priority: 9,
  },
  {
    id: "adapt_identity_3",
    domain: "identity",
    statement: "Who in your organisation could state your mandate accurately without being prompted?",
    rationale: "A mandate that only the holder knows is not a mandate — it is an intention.",
    showWhen: [{ triggeredBy: "identity", condition: "score_below", threshold: 4 }],
    priority: 8,
  },

  // DECISION deep-dive (triggers when decision score < 4 OR high certainty + low resonance)
  {
    id: "adapt_decision_1",
    domain: "decision",
    statement: "Describe the last decision you deferred. What was the cost of waiting?",
    rationale: "Decision avoidance is the primary pressure pattern. This tests whether cost is visible.",
    showWhen: [
      { triggeredBy: "decision", condition: "score_below", threshold: 4 },
      { triggeredBy: "decision", condition: "high_certainty_low_resonance", threshold: 3 },
    ],
    priority: 10,
  },
  {
    id: "adapt_decision_2",
    domain: "decision",
    statement: "When you make a decision under pressure, what is the first thing you sacrifice?",
    rationale: "Reveals the hierarchy of values under stress — not what you claim, but what you protect.",
    showWhen: [{ triggeredBy: "decision", condition: "score_below", threshold: 5 }],
    priority: 9,
  },

  // CONTRADICTION probe (triggers when gap between domains >= 35 points)
  {
    id: "adapt_contradiction_1",
    domain: "cross_domain",
    statement: "Your answers show strong alignment in one area but weak alignment in another. Which do you trust more — your strength or your weakness?",
    rationale: "Internal contradiction detected. This forces acknowledgment.",
    showWhen: [{ triggeredBy: "cross_domain", condition: "gap_detected", threshold: 35 }],
    priority: 10,
  },

  // AUTHORITY deep-dive (constitutional — triggers when authority unclear)
  {
    id: "adapt_authority_1",
    domain: "authority",
    statement: "For the most important open decision: who is supposed to decide? Who actually decides? Are they the same person?",
    rationale: "Authority signal was unclear. This separates formal from actual authority.",
    showWhen: [{ triggeredBy: "authority", condition: "score_below", threshold: 5 }],
    priority: 10,
  },
  {
    id: "adapt_authority_2",
    domain: "authority",
    statement: "Name one person who makes decisions they are not formally authorised to make. Why can they?",
    rationale: "Shadow authority is a structural signal, not just a governance gap.",
    showWhen: [{ triggeredBy: "authority", condition: "score_below", threshold: 4 }],
    priority: 9,
  },

  // TRUST deep-dive (triggers when trust < 4)
  {
    id: "adapt_trust_1",
    domain: "trust",
    statement: "When was the last time someone in the organisation said something privately that contradicted what was said publicly?",
    rationale: "Low trust signal detected. This tests whether the distrust is visible or hidden.",
    showWhen: [{ triggeredBy: "trust", condition: "score_below", threshold: 4 }],
    priority: 10,
  },

  // HIGH SCORING probe (triggers when score > 8 — tests overconfidence)
  {
    id: "adapt_overconfidence_1",
    domain: "cross_domain",
    statement: "You scored very high across multiple domains. What would someone who disagrees with your assessment say?",
    rationale: "High confidence across the board can indicate blind spots. This tests self-awareness.",
    showWhen: [{ triggeredBy: "cross_domain", condition: "score_above", threshold: 8 }],
    priority: 8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRANCHING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function computeAdaptiveBranch(
  currentScores: Record<string, number>,
  answeredQuestionIds: string[],
): BranchingResult {
  const triggered: AdaptiveQuestion[] = [];

  for (const q of ADAPTIVE_QUESTIONS) {
    // Skip already answered
    if (answeredQuestionIds.includes(q.id)) continue;

    // Check if any show condition is met
    const shouldShow = q.showWhen.some((cond) => {
      const score = currentScores[cond.triggeredBy] ?? 50;

      switch (cond.condition) {
        case "score_below":
          return score < cond.threshold * 10; // scores are 0-100, thresholds are 0-10
        case "score_above":
          return score > cond.threshold * 10;
        case "gap_detected": {
          const values = Object.values(currentScores);
          if (values.length < 2) return false;
          return Math.max(...values) - Math.min(...values) >= cond.threshold;
        }
        case "contradiction":
          return score < cond.threshold * 10;
        case "high_certainty_low_resonance":
          return score < cond.threshold * 10; // simplified — full version checks both axes
        default:
          return false;
      }
    });

    if (shouldShow) triggered.push(q);
  }

  // Sort by priority, take top 3
  const next = triggered.sort((a, b) => b.priority - a.priority).slice(0, 3);

  const branchReason = next.length > 0
    ? `${next.length} follow-up question${next.length > 1 ? "s" : ""} triggered by your answer pattern. ${next[0]!.rationale}`
    : "No follow-up questions triggered. Your answers are internally consistent.";

  return {
    nextQuestions: next,
    branchReason,
    estimatedRemainingQuestions: next.length,
  };
}
