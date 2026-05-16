/**
 * lib/product/decision-completion-risk.ts
 *
 * Completion Risk v1 — estimates whether a governed case is at risk
 * of stalling, being abandoned, or requiring escalation.
 *
 * This is a RULE-BASED model. It does not use ML or AI predictions.
 * It evaluates the current record against known failure patterns.
 *
 * Language rule:
 *   Do NOT say "AI predicts".
 *   Say: "Based on the current record and comparable governed-case
 *   patterns where available, this case may require follow-up."
 */

import type { DecisionBehaviourVector } from "./decision-behaviour-vector-contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompletionRiskBand = "LOW" | "MEDIUM" | "HIGH" | "SEVERE";

export type SuggestedIntervention =
  | "WATCH"
  | "REVIEW"
  | "RETURN_BRIEF"
  | "STRATEGY_ROOM"
  | "ESCALATE";

export type EvidenceBasis = "RULE_BASED" | "AGGREGATE_SUPPORTED" | "INSUFFICIENT_DATA";

export type DecisionCompletionRisk = {
  band: CompletionRiskBand;
  reason: string;
  suggestedIntervention: SuggestedIntervention;
  evidenceBasis: EvidenceBasis;
};

// ─── Input ────────────────────────────────────────────────────────────────────

export type CompletionRiskInput = {
  /** Case age in days */
  caseAgeDays: number;
  /** Case source type */
  caseType: string;
  /** Whether an authority gap has been detected */
  authorityGap: boolean;
  /** Whether an evidence gap has been detected */
  evidenceGap: boolean;
  /** Whether recurrence has been detected */
  recurrence: boolean;
  /** Whether the case is stale (no activity beyond threshold) */
  staleStatus: boolean;
  /** Commercial exposure band, if available */
  commercialExposureBand?: "LOW" | "MEDIUM" | "HIGH" | "SEVERE" | null;
  /** Prior outcome signal, if available */
  priorOutcomeSignal?: string | null;
  /** Whether a Return Brief has been generated */
  returnBriefGenerated: boolean;
  /** Whether Strategy Room has been entered */
  strategyRoomHistory: boolean;
  /** Optional behaviour vector for richer assessment */
  behaviourVector?: DecisionBehaviourVector | null;
};

// ─── Risk rules ───────────────────────────────────────────────────────────────

const SEVERE_CONDITIONS: Array<(input: CompletionRiskInput) => boolean> = [
  // Case is very old AND stale
  (i) => i.caseAgeDays > 180 && i.staleStatus,
  // Recurrence detected with authority gap
  (i) => i.recurrence && i.authorityGap,
  // Prior outcome was "WORSENED" or "BLOCKED" with no progress
  (i) =>
    (i.priorOutcomeSignal === "WORSENED" || i.priorOutcomeSignal === "BLOCKED") &&
    i.caseAgeDays > 90,
  // Severe commercial exposure with stale status
  (i) => i.commercialExposureBand === "SEVERE" && i.staleStatus,
];

const HIGH_CONDITIONS: Array<(input: CompletionRiskInput) => boolean> = [
  // Case is old (90+ days)
  (i) => i.caseAgeDays > 90,
  // Stale for more than 30 days
  (i) => i.staleStatus && i.caseAgeDays > 60,
  // Authority gap + evidence gap together
  (i) => i.authorityGap && i.evidenceGap,
  // Recurrence detected
  (i) => i.recurrence,
  // Return Brief generated but no action
  (i) => i.returnBriefGenerated && i.staleStatus,
  // High commercial exposure
  (i) => i.commercialExposureBand === "HIGH",
];

const MEDIUM_CONDITIONS: Array<(input: CompletionRiskInput) => boolean> = [
  // Case is 30-90 days old
  (i) => i.caseAgeDays >= 30 && i.caseAgeDays <= 90,
  // Authority gap alone
  (i) => i.authorityGap,
  // Evidence gap alone
  (i) => i.evidenceGap,
  // Stale but relatively young
  (i) => i.staleStatus && i.caseAgeDays < 60,
  // Medium commercial exposure
  (i) => i.commercialExposureBand === "MEDIUM",
  // Prior outcome was "DELAYED"
  (i) => i.priorOutcomeSignal === "DELAYED",
];

// ─── Intervention mapping ─────────────────────────────────────────────────────

function suggestIntervention(band: CompletionRiskBand, input: CompletionRiskInput): SuggestedIntervention {
  if (band === "SEVERE") {
    if (input.recurrence || input.authorityGap) return "ESCALATE";
    if (input.strategyRoomHistory) return "STRATEGY_ROOM";
    return "STRATEGY_ROOM";
  }

  if (band === "HIGH") {
    if (input.returnBriefGenerated) return "RETURN_BRIEF";
    if (input.authorityGap) return "STRATEGY_ROOM";
    return "REVIEW";
  }

  if (band === "MEDIUM") {
    if (input.staleStatus) return "RETURN_BRIEF";
    return "REVIEW";
  }

  return "WATCH";
}

function buildReason(band: CompletionRiskBand, input: CompletionRiskInput): string {
  const parts: string[] = [];

  if (input.caseAgeDays > 180) parts.push(`Case has been open for ${input.caseAgeDays} days.`);
  else if (input.caseAgeDays > 90) parts.push(`Case has been open for ${input.caseAgeDays} days without resolution.`);

  if (input.staleStatus) parts.push("No recent activity detected.");
  if (input.recurrence) parts.push("Pattern recurrence has been detected.");
  if (input.authorityGap) parts.push("Authority ownership is unclear.");
  if (input.evidenceGap) parts.push("Evidence is insufficient for escalation.");
  if (input.priorOutcomeSignal === "WORSENED") parts.push("The prior outcome signal indicates the condition has worsened.");
  if (input.priorOutcomeSignal === "BLOCKED") parts.push("The prior outcome signal indicates the decision is blocked.");
  if (input.commercialExposureBand === "SEVERE" || input.commercialExposureBand === "HIGH") {
    parts.push(`Commercial exposure is ${input.commercialExposureBand.toLowerCase()}.`);
  }
  if (input.returnBriefGenerated && input.staleStatus) {
    parts.push("A Return Brief was generated but no action has been recorded.");
  }

  if (parts.length === 0) {
    parts.push("No significant risk signals detected in the current record.");
  }

  return parts.join(" ");
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Evaluates completion risk for a governed case.
 *
 * This is a deterministic rule-based assessment. It does not use AI or ML.
 * The output is based on the current record and comparable governed-case
 * patterns where available.
 */
export function evaluateCompletionRisk(input: CompletionRiskInput): DecisionCompletionRisk {
  // Check severe conditions first
  for (const condition of SEVERE_CONDITIONS) {
    if (condition(input)) {
      return {
        band: "SEVERE",
        reason: buildReason("SEVERE", input),
        suggestedIntervention: suggestIntervention("SEVERE", input),
        evidenceBasis: "RULE_BASED",
      };
    }
  }

  // Check high conditions
  for (const condition of HIGH_CONDITIONS) {
    if (condition(input)) {
      return {
        band: "HIGH",
        reason: buildReason("HIGH", input),
        suggestedIntervention: suggestIntervention("HIGH", input),
        evidenceBasis: "RULE_BASED",
      };
    }
  }

  // Check medium conditions
  for (const condition of MEDIUM_CONDITIONS) {
    if (condition(input)) {
      return {
        band: "MEDIUM",
        reason: buildReason("MEDIUM", input),
        suggestedIntervention: suggestIntervention("MEDIUM", input),
        evidenceBasis: input.caseAgeDays > 0 ? "RULE_BASED" : "INSUFFICIENT_DATA",
      };
    }
  }

  // Default: LOW risk
  return {
    band: "LOW",
    reason: buildReason("LOW", input),
    suggestedIntervention: "WATCH",
    evidenceBasis: input.caseAgeDays > 0 ? "RULE_BASED" : "INSUFFICIENT_DATA",
  };
}
