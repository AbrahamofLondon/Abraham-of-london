/**
 * CaseObject — the user's specific decision situation.
 *
 * Created by fast diagnostic. Inherited by full assessments.
 * Consumed by ER and Strategy Room. No stage re-derives context from zero.
 *
 * This is the user's case, in their words. Not a classification.
 */

export type ConditionClass =
  | "authority"
  | "definition"
  | "execution"
  | "instability";

export type SignalStrength = "low" | "medium" | "high";

export type CaseObject = {
  id: string;
  /** The decision in the user's own words */
  decision: string;
  /** What they already tried and what went wrong */
  priorAttempt?: string;
  /** What gets more expensive each week */
  costOfDelay?: string;
  /** Who they say owns the decision */
  claimedOwner?: string;
  /** Who the system infers actually decides */
  actualOwnerCandidate?: string;
  /** What they say is blocking the decision */
  blocker?: string;
  /** What they say they'd do if forced to decide in 24 hours */
  forcedAction?: string;
  /** The contradiction the system identified between their answers */
  contradiction?: string;
  /** What the system infers they are actually avoiding */
  inferredAvoidance?: string;
  /** Deterministic classification */
  conditionClass?: ConditionClass;
  /** How strong the signal is */
  signalStrength?: SignalStrength;
  /** C3 specificity score (0-1) */
  specificityScore: number;
  /** User email for cross-stage linking */
  email?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Create a CaseObject from fast diagnostic free-text responses.
 */
export function createCaseObject(input: {
  id: string;
  decision: string;
  priorAttempt?: string;
  costOfDelay?: string;
  claimedOwner?: string;
  blocker?: string;
  forcedAction?: string;
  email?: string;
}): CaseObject {
  return {
    ...input,
    specificityScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Infer the contradiction from the gap between stated blocker and forced action.
 */
export function inferContradiction(caseObj: CaseObject): string | null {
  if (!caseObj.blocker || !caseObj.forcedAction) return null;

  const blockerLower = caseObj.blocker.toLowerCase();
  const forcedLower = caseObj.forcedAction.toLowerCase();

  // If the forced action bypasses the stated blocker, the blocker isn't the real issue
  if (blockerLower.length > 10 && forcedLower.length > 10) {
    return `You described the blocker as: "${caseObj.blocker}" — but when forced to decide, you said: "${caseObj.forcedAction}". If the forced action bypasses the blocker, the blocker is not preventing the decision. It is justifying the avoidance.`;
  }

  return null;
}

/**
 * Infer what is being avoided from the gap between all answers.
 */
export function inferAvoidance(caseObj: CaseObject): string | null {
  if (!caseObj.forcedAction || !caseObj.blocker) return null;

  // The avoided thing is whatever the forced action implies they COULD do but haven't
  return `The decision you described as blocked is one you already know how to resolve (your forced answer proves this). What is being avoided is not the decision — it is the conversation, confrontation, or commitment that the decision requires.`;
}

/**
 * Classify the condition from case material.
 */
export function classifyCondition(caseObj: CaseObject): ConditionClass {
  const all = [
    caseObj.decision,
    caseObj.blocker,
    caseObj.claimedOwner,
    caseObj.forcedAction,
    caseObj.priorAttempt,
  ].filter(Boolean).join(" ").toLowerCase();

  // Authority signals
  const authorityTerms = ["who decides", "no one owns", "unclear ownership", "authority", "permission", "approve", "sign off", "escalate", "board", "ceo", "cfo"];
  const authorityHits = authorityTerms.filter((t) => all.includes(t)).length;

  // Definition signals
  const definitionTerms = ["unclear outcome", "not defined", "what exactly", "scope", "criteria", "alignment", "agree on", "different interpretation"];
  const definitionHits = definitionTerms.filter((t) => all.includes(t)).length;

  // Execution signals
  const executionTerms = ["deferred", "delayed", "postponed", "stalled", "avoided", "keep discussing", "no deadline", "waiting"];
  const executionHits = executionTerms.filter((t) => all.includes(t)).length;

  if (authorityHits > definitionHits && authorityHits > executionHits) return "authority";
  if (definitionHits > authorityHits && definitionHits > executionHits) return "definition";
  if (executionHits > 0) return "execution";
  return "instability";
}
