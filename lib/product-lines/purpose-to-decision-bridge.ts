/**
 * Purpose-to-Decision Bridge — typed evidence flow between product lines.
 *
 * Purpose Alignment may feed behavioural evidence into Operational Decision Intelligence.
 * Operational Decision Intelligence may trigger Purpose Alignment when behavioural recurrence is detected.
 *
 * This is not a merger. It is a typed, optional, auditable evidence bridge.
 *
 * Rules:
 * - Purpose evidence is always labelled as "personal behavioural evidence"
 * - Corporate products never present Purpose as organisational proof
 * - Bridge logic preserves source lineage
 * - Cross-product evidence is optional, never required
 */

import type { ProductLineContribution } from "./product-line-contract";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// PURPOSE → CORPORATE EVIDENCE
// ─────────────────────────────────────────────────────────────────────────────

export type PurposeAlignmentEvidence = {
  /** The pattern reading title (e.g., "Mandate Drift in Decision Domain") */
  patternTitle: string;
  /** The weakest domain (identity, decision, environment, behaviour, emotional_order, legacy) */
  weakestDomain: string;
  /** The avoided decision from reflection gate */
  avoidedDecision: string | null;
  /** Whether a Pattern-Breaker Contract was signed */
  contractSigned: boolean;
  /** The user's commitment text */
  commitment: string | null;
  /** Contract breach status */
  breachStatus: "none" | "pending" | "completed" | "breached" | null;
  /** Dissenter signal from reflection gate */
  dissenterSignal: string | null;
  /** Behavioural verification status */
  behaviouralVerificationStatus: "unverified" | "likely_completed" | "likely_incomplete" | "contradictory" | null;
  /** Overall coherence score (0-100) */
  coherencePercent: number;
  /** Coherence band */
  coherenceBand: string;
};

/**
 * Map Purpose Alignment result into typed evidence for corporate products.
 *
 * Call this when the user explicitly chooses "Use as decision evidence"
 * or when the system detects escalation-worthy patterns.
 */
export function purposeAlignmentToContribution(input: {
  patternTitle: string;
  weakestDomain: string;
  avoidedDecision?: string | null;
  commitment?: string | null;
  contractSigned?: boolean;
  breachStatus?: "none" | "pending" | "completed" | "breached" | null;
  dissenterSignal?: string | null;
  behaviouralVerificationStatus?: "unverified" | "likely_completed" | "likely_incomplete" | "contradictory" | null;
  coherencePercent: number;
  coherenceBand: string;
}): ProductLineContribution {
  const evidence: PurposeAlignmentEvidence = {
    patternTitle: input.patternTitle,
    weakestDomain: input.weakestDomain,
    avoidedDecision: input.avoidedDecision ?? null,
    contractSigned: input.contractSigned ?? false,
    commitment: input.commitment ?? null,
    breachStatus: input.breachStatus ?? null,
    dissenterSignal: input.dissenterSignal ?? null,
    behaviouralVerificationStatus: input.behaviouralVerificationStatus ?? null,
    coherencePercent: input.coherencePercent,
    coherenceBand: input.coherenceBand,
  };

  // Determine primary evidence type
  let evidenceType: ProductLineContribution["evidenceType"] = "personal_pattern";
  if (input.breachStatus === "breached") evidenceType = "contract_breach";
  else if (input.avoidedDecision) evidenceType = "avoided_decision";
  else if (input.dissenterSignal) evidenceType = "dissenter_signal";
  else if (input.contractSigned) evidenceType = "behavioural_contract";

  // Confidence based on depth of evidence
  let confidence = 0.3; // base: personal self-report
  if (input.contractSigned) confidence += 0.2; // committed
  if (input.breachStatus === "completed") confidence += 0.2; // verified completion
  if (input.behaviouralVerificationStatus === "likely_completed") confidence += 0.2; // external verification
  if (input.dissenterSignal) confidence += 0.1; // third-party signal
  confidence = Math.min(1, confidence);

  return {
    id: `pa_contrib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: "PURPOSE_ALIGNMENT",
    target: "OPERATIONAL_DECISION_INTELLIGENCE",
    role: "PERSONAL_PATTERN_ENFORCEMENT",
    evidenceType,
    confidence,
    summary: buildContributionSummary(evidence),
    payload: evidence,
    createdAt: new Date().toISOString(),
  };
}

function buildContributionSummary(evidence: PurposeAlignmentEvidence): string {
  const parts: string[] = [];

  parts.push(`Personal pattern: "${evidence.patternTitle}" (${evidence.coherenceBand}, ${evidence.coherencePercent}%)`);

  if (evidence.avoidedDecision) {
    parts.push(`Avoided decision: "${evidence.avoidedDecision}"`);
  }

  if (evidence.contractSigned && evidence.breachStatus === "breached") {
    parts.push("Contract breached — commitment made but not kept");
  } else if (evidence.contractSigned && evidence.breachStatus === "completed") {
    parts.push("Contract completed — commitment kept");
  } else if (evidence.contractSigned) {
    parts.push("Contract signed — verification pending");
  }

  if (evidence.dissenterSignal) {
    parts.push(`Dissenter signal: "${evidence.dissenterSignal}"`);
  }

  return parts.join(". ") + ".";
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION LOGIC — should Purpose evidence cross into corporate?
// ─────────────────────────────────────────────────────────────────────────────

export type EscalationReason =
  | "avoided_decision_involves_organisation"
  | "contract_breach_affects_others"
  | "pattern_recurrence"
  | "dissenter_indicates_structural_consequence"
  | "user_explicit_choice";

/**
 * Determine whether Purpose Alignment evidence should escalate to the corporate product line.
 *
 * Returns true ONLY if the personal pattern has organisational consequence.
 * Returns false if the pattern is purely personal.
 *
 * This is a gate, not an automatic bridge.
 */
export function shouldEscalatePurposeToCorporate(input: {
  avoidedDecision?: string | null;
  contractBreached?: boolean;
  recurrenceCount?: number;
  dissenterSignal?: string | null;
  userExplicitChoice?: boolean;
}): { shouldEscalate: boolean; reasons: EscalationReason[] } {
  const reasons: EscalationReason[] = [];

  // User explicitly chose to bridge
  if (input.userExplicitChoice) {
    reasons.push("user_explicit_choice");
  }

  // Avoided decision involves leadership, team, or organisation
  if (input.avoidedDecision) {
    const lower = input.avoidedDecision.toLowerCase();
    const orgTerms = ["team", "leadership", "organisation", "organization", "department", "board", "company", "division", "direct report", "manager", "colleague", "stakeholder"];
    if (orgTerms.some((term) => lower.includes(term))) {
      reasons.push("avoided_decision_involves_organisation");
    }
  }

  // Contract breach affects others
  if (input.contractBreached) {
    reasons.push("contract_breach_affects_others");
  }

  // Same pattern recurs (3+ times indicates structural, not personal)
  if (input.recurrenceCount && input.recurrenceCount >= 3) {
    reasons.push("pattern_recurrence");
  }

  // Dissenter signal indicates organisational consequence
  if (input.dissenterSignal) {
    const lower = input.dissenterSignal.toLowerCase();
    const structuralTerms = ["team", "organisation", "company", "leadership", "culture", "governance", "people", "staff", "department"];
    if (structuralTerms.some((term) => lower.includes(term))) {
      reasons.push("dissenter_indicates_structural_consequence");
    }
  }

  return {
    shouldEscalate: reasons.length > 0,
    reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORPORATE → PURPOSE TRIGGER
// ─────────────────────────────────────────────────────────────────────────────

export type PurposeTrigger = {
  /** Why the corporate product is triggering Purpose */
  reason: string;
  /** The specific pattern detected in corporate analysis */
  detectedPattern: string;
  /** Suggested Purpose focus area */
  suggestedDomain: string | null;
};

/**
 * Determine whether a corporate decision spine should trigger Purpose Alignment.
 *
 * Returns a trigger ONLY if:
 * - Same avoided action repeats across corporate assessments
 * - User identifies the move but does not take it (personal non-execution)
 * - Recurrence is behavioural, not merely structural
 * - Strategy Room outcome shows personal non-execution
 *
 * This is NOT automatic. It produces a suggestion that the UI may show.
 */
export function decisionCaseToPurposeTrigger(spine: IntelligenceSpine): PurposeTrigger | null {
  // Check: same move recommended but not taken (outcome verification shows non-execution)
  const outcomeEvent = spine.history.find((e) => e.stage === "outcome_verification");
  if (outcomeEvent) {
    const snap = outcomeEvent.snapshot;
    if (snap.status === "not_taken" || snap.status === "partial") {
      return {
        reason: "The corporate assessment recommended an action that was not taken. This may indicate a personal pattern rather than a structural barrier.",
        detectedPattern: `Action "${spine.synthesis?.concreteMove?.slice(0, 60) ?? "recommended move"}" was identified but not executed.`,
        suggestedDomain: "decision",
      };
    }
  }

  // Check: recurrence signals suggest behavioural (not structural) avoidance
  if (spine.memory && spine.memory.recurrenceSignals.length > 0) {
    const avoidanceSignals = spine.memory.recurrenceSignals.filter(
      (s) => s.type === "repeated_avoidance" || s.type === "move_not_taken",
    );
    if (avoidanceSignals.length >= 2) {
      return {
        reason: "The same action keeps appearing as the answer across multiple corporate assessments. The barrier may be personal, not structural.",
        detectedPattern: avoidanceSignals[0]?.message.slice(0, 80) ?? "Repeated avoidance detected",
        suggestedDomain: "behaviour",
      };
    }
  }

  // Check: blocker is person-specific, not structural
  if (spine.case.blocker) {
    const lower = spine.case.blocker.toLowerCase();
    const personalTerms = ["i can't", "i don't", "i'm afraid", "i'm not sure", "my confidence", "my fear", "my reluctance", "i keep"];
    if (personalTerms.some((term) => lower.includes(term))) {
      return {
        reason: "The stated blocker appears personal rather than structural. Purpose Alignment may surface the underlying pattern.",
        detectedPattern: `Personal blocker language detected: "${spine.case.blocker.slice(0, 60)}"`,
        suggestedDomain: "behaviour",
      };
    }
  }

  return null;
}
