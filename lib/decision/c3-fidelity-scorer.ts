/**
 * C3 Fidelity Scorer — decides whether input deserves synthesis.
 *
 * Scores: Clarity, Context, Consequence.
 * If specificity < 0.7 → Precision Recovery Mode.
 * Do not synthesize vague input. Do not bluff intelligence.
 */

import type { CaseObject } from "./case-object";

export type C3Score = {
  clarity: number;       // 0-1: is the decision itself clear?
  context: number;       // 0-1: is there enough surrounding information?
  consequence: number;   // 0-1: is the cost/stakes articulated?
  specificityScore: number; // 0-1: composite
  mode: "SYNTHESIS_READY" | "PRECISION_RECOVERY";
  missing: Array<"clarity" | "context" | "consequence">;
  recoveryQuestion?: string;
};

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

  // Mode
  const mode: C3Score["mode"] = specificityScore >= 0.45 ? "SYNTHESIS_READY" : "PRECISION_RECOVERY";

  // Recovery question
  let recoveryQuestion: string | undefined;
  if (mode === "PRECISION_RECOVERY") {
    if (missing.includes("clarity")) {
      recoveryQuestion = "The decision is not yet specific enough. What exactly must be decided — not the topic, the decision? One sentence.";
    } else if (missing.includes("context")) {
      recoveryQuestion = "The system cannot isolate the blocker yet. Who has authority to move this decision, and what specifically prevents them from acting?";
    } else if (missing.includes("consequence")) {
      recoveryQuestion = "The cost of delay is not yet visible. What specifically gets more expensive each week this sits unresolved?";
    }
  }

  return { clarity, context, consequence, specificityScore, mode, missing, recoveryQuestion };
}
