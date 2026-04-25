/**
 * Memory Interrupt — cross-stage and returning-user intelligence enforcement.
 *
 * Wraps case-memory detection with mandatory interrupt logic.
 * If recurrence confidence > 0.7, the user MUST acknowledge the pattern
 * before proceeding. This is not optional. This is not a suggestion.
 *
 * Returning users do not get fresh generic flows.
 */

import { checkCaseMemory, type RecurrenceSignal, type CaseMemoryResult } from "./case-memory";
import type { CaseObject } from "./case-object";
import type { IntelligenceSpine } from "./intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type MemorySignal = {
  type: RecurrenceSignal["type"];
  message: string;
  similarity: number;
  priorCaseId: string;
  /** If true, the user must acknowledge before continuing */
  interrupt: boolean;
};

export type MemoryInterruptResult = {
  signals: MemorySignal[];
  /** If true, the assessment must pause and show the interrupt */
  mustInterrupt: boolean;
  /** The message to display — direct, not hedged */
  interruptMessage?: string;
  /** Prior case count for context */
  priorCaseCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERRUPT CHECK
// ─────────────────────────────────────────────────────────────────────────────

const INTERRUPT_THRESHOLD = 0.7;

/**
 * Check for memory signals and determine whether an interrupt is required.
 *
 * Call at the start of every stage. If mustInterrupt is true,
 * the UI must show the interrupt message and get acknowledgment.
 */
export function checkMemoryAndInterrupt(
  currentCase: CaseObject,
  priorCases: CaseObject[],
): MemoryInterruptResult {
  if (priorCases.length === 0) {
    return { signals: [], mustInterrupt: false, priorCaseCount: 0 };
  }

  const memoryResult = checkCaseMemory(currentCase, priorCases);

  const signals: MemorySignal[] = memoryResult.recurrenceSignals.map((sig) => ({
    type: sig.type,
    message: sig.message,
    similarity: sig.similarity,
    priorCaseId: sig.priorCaseId,
    interrupt: sig.similarity >= INTERRUPT_THRESHOLD,
  }));

  const interruptSignals = signals.filter((s) => s.interrupt);
  const mustInterrupt = interruptSignals.length > 0;

  let interruptMessage: string | undefined;
  if (mustInterrupt) {
    const strongest = interruptSignals.sort((a, b) => b.similarity - a.similarity)[0]!;

    switch (strongest.type) {
      case "recurring_blocker":
        interruptMessage = "This blocker has appeared before. If the blocker persists across decisions, it is not a constraint — it is a structural feature of how decisions are avoided here. Are you facing a genuinely new constraint, or is this the same one under different conditions?";
        break;
      case "repeated_avoidance":
        interruptMessage = "The action you described as the solution has appeared in a prior assessment. You already know what to do. The question is not what — it is why you haven't done it. What changed since last time?";
        break;
      case "ownership_conflict":
        interruptMessage = "The same ownership structure was named in a prior assessment. If the owner hasn't changed but the condition persists, the issue is not ownership — it is authority to act. Has the authority structure actually changed?";
        break;
      case "condition_relabeled":
        interruptMessage = "You are describing a new decision, but the pattern matches a prior unresolved condition. Is this genuinely new, or the same condition under different language?";
        break;
      case "move_not_taken":
        interruptMessage = "A prior assessment recommended an action that was not taken. The system will track this pattern. If the recommended action keeps appearing and keeps being deferred, the avoidance itself is the finding.";
        break;
    }
  }

  return {
    signals,
    mustInterrupt,
    interruptMessage,
    priorCaseCount: priorCases.length,
  };
}

/**
 * Check memory using the intelligence spine for context.
 * Convenience wrapper for stages that have spine access.
 */
export function checkSpineMemory(
  spine: IntelligenceSpine,
  priorCases: CaseObject[],
): MemoryInterruptResult {
  return checkMemoryAndInterrupt(spine.case, priorCases);
}
