/**
 * Case Memory — cross-stage and returning-user intelligence.
 *
 * Detects: recurring blocker, repeated avoided decision, same ownership
 * conflict, prior move not taken, unresolved condition under new language.
 *
 * Returning users do not get a fresh generic flow.
 * Previous case material affects current synthesis.
 * Recurrence is surfaced explicitly.
 */

import type { CaseObject } from "./case-object";

export type RecurrenceSignal = {
  type: "recurring_blocker" | "repeated_avoidance" | "ownership_conflict" | "move_not_taken" | "condition_relabeled";
  message: string;
  priorCaseId: string;
  similarity: number; // 0-1
};

export type CaseMemoryResult = {
  hasPriorCases: boolean;
  priorCaseCount: number;
  recurrenceSignals: RecurrenceSignal[];
  returningUserInterrupt?: string;
  /** Prior case IDs for reference */
  priorCaseIds: string[];
};

/**
 * Compare current case against prior cases for recurrence detection.
 */
export function checkCaseMemory(
  currentCase: CaseObject,
  priorCases: CaseObject[],
): CaseMemoryResult {
  if (priorCases.length === 0) {
    return { hasPriorCases: false, priorCaseCount: 0, recurrenceSignals: [], priorCaseIds: [] };
  }

  const signals: RecurrenceSignal[] = [];

  for (const prior of priorCases) {
    // Recurring blocker: same blocker language
    if (currentCase.blocker && prior.blocker) {
      const sim = textSimilarity(currentCase.blocker, prior.blocker);
      if (sim > 0.4) {
        signals.push({
          type: "recurring_blocker",
          message: `You described a similar blocker in a prior assessment: "${prior.blocker.slice(0, 80)}". The same constraint is recurring.`,
          priorCaseId: prior.id,
          similarity: sim,
        });
      }
    }

    // Repeated avoidance: same forced action never taken
    if (currentCase.forcedAction && prior.forcedAction) {
      const sim = textSimilarity(currentCase.forcedAction, prior.forcedAction);
      if (sim > 0.3) {
        signals.push({
          type: "repeated_avoidance",
          message: `Your forced action is similar to a prior assessment: "${prior.forcedAction.slice(0, 80)}". If the same action keeps appearing as the answer, the real question is why it hasn't been taken.`,
          priorCaseId: prior.id,
          similarity: sim,
        });
      }
    }

    // Ownership conflict: same owner named repeatedly
    if (currentCase.claimedOwner && prior.claimedOwner) {
      const sim = textSimilarity(currentCase.claimedOwner, prior.claimedOwner);
      if (sim > 0.5) {
        signals.push({
          type: "ownership_conflict",
          message: `The same ownership structure was named in a prior assessment. If the owner hasn't changed but the condition persists, the issue is not ownership — it is authority to act.`,
          priorCaseId: prior.id,
          similarity: sim,
        });
      }
    }

    // Condition relabeled: different decision text but same condition class + similar blocker
    if (currentCase.conditionClass === prior.conditionClass && currentCase.decision !== prior.decision) {
      const blockerSim = textSimilarity(currentCase.blocker ?? "", prior.blocker ?? "");
      if (blockerSim > 0.3) {
        signals.push({
          type: "condition_relabeled",
          message: `You are describing a new decision, but the blocker matches a prior unresolved pattern. This is the same condition under different language.`,
          priorCaseId: prior.id,
          similarity: blockerSim,
        });
      }
    }
  }

  // Build returning user interrupt if significant recurrence
  let interrupt: string | undefined;
  if (signals.length > 0) {
    const strongest = signals.sort((a, b) => b.similarity - a.similarity)[0]!;
    if (strongest.type === "condition_relabeled") {
      interrupt = "You are describing a new decision, but the blocker matches a prior unresolved pattern. Is this genuinely new, or the same condition under different language?";
    } else if (strongest.type === "repeated_avoidance") {
      interrupt = `The action you described as the solution has appeared before. If you already know what to do, the question is not what — it is why you haven't done it.`;
    } else if (strongest.type === "recurring_blocker") {
      interrupt = `This blocker has appeared before. If the blocker persists across decisions, it is not a constraint — it is a structural feature of how decisions are avoided here.`;
    }
  }

  return {
    hasPriorCases: true,
    priorCaseCount: priorCases.length,
    recurrenceSignals: signals,
    returningUserInterrupt: interrupt,
    priorCaseIds: priorCases.map((c) => c.id),
  };
}

/**
 * Simple text similarity based on shared significant words.
 * Returns 0-1.
 */
function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "shall", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "out", "off", "over", "under", "again", "further", "then", "once", "and", "but", "or", "nor", "not", "no", "so", "if", "than", "too", "very", "just", "about", "up", "it", "its", "this", "that", "these", "those", "i", "we", "they", "he", "she", "you", "me", "us", "them", "my", "our", "your", "his", "her", "their"]);

  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w)));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w)));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return overlap / Math.max(wordsA.size, wordsB.size);
}
