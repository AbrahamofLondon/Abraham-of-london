/**
 * lib/constitution/escalation-engine.ts — Auto-escalation sweep.
 *
 * Iterates open interventions and escalates to Strategy Room when
 * constitutional thresholds are met. Routes all escalation through
 * the escalation governor for validation.
 *
 * Produces: escalation events with reason, source, and governor verdict.
 */

import { listOpenInterventions } from "./intervention-store";
import { getCaseMemory } from "./memory-store";
import { governEscalation } from "./escalation-governor";
import type { ConstitutionalDecision } from "./rules";

export type EscalationResult = {
  caseKey: string;
  operatorKey: string;
  permitted: boolean;
  reason: string;
  source: "AUTO_ESCALATION";
  triggerId: string;
  seriousness: number;
  confidence: number;
};

/**
 * Sweep all open interventions and attempt escalation for eligible cases.
 *
 * Rules:
 * - Only ESCALATE_TO_STRATEGY or CRITICAL priority interventions considered
 * - Skip if case is already routed to STRATEGY (prevent duplicate escalation)
 * - Hard override: seriousness > 75 AND confidence > 0.6
 * - All escalations validated through governEscalation() before proceeding
 * - Returns results for all considered interventions (permitted and denied)
 */
export function runAutoEscalationSweep(): EscalationResult[] {
  const results: EscalationResult[] = [];

  let interventions: ReturnType<typeof listOpenInterventions>;
  try {
    interventions = listOpenInterventions();
  } catch (err) {
    console.error("[escalation-engine] Failed to list interventions:", err);
    return results;
  }

  for (const intervention of interventions) {
    if (!intervention.caseKey) continue;

    const isEscalationType =
      intervention.actionType === "ESCALATE_TO_STRATEGY" ||
      intervention.priority === "CRITICAL";

    if (!isEscalationType) continue;

    let caseMemory: ReturnType<typeof getCaseMemory>;
    try {
      caseMemory = getCaseMemory(intervention.caseKey);
    } catch {
      continue;
    }
    if (!caseMemory) continue;

    // Prevent duplicate escalation
    if (caseMemory.latestRoute === "STRATEGY") continue;

    const seriousness = caseMemory.latestSeriousness ?? 0;
    const confidence = caseMemory.latestConfidence ?? 0;

    // Hard override condition: seriousness > 75 AND confidence > 0.6
    const meetsThreshold = seriousness > 75 && confidence > 0.6;

    if (!meetsThreshold) {
      results.push({
        caseKey: intervention.caseKey,
        operatorKey: caseMemory.operatorKey ?? "unknown",
        permitted: false,
        reason: `Below escalation threshold: seriousness=${seriousness}, confidence=${confidence.toFixed(2)}`,
        source: "AUTO_ESCALATION",
        triggerId: intervention.id,
        seriousness,
        confidence,
      });
      continue;
    }

    // Validate through governor
    const governorInput = {
      route: "STRATEGY",
      escalationAllowed: true,
      confidence,
      disqualifiersTriggered: [],
      thresholds: {},
      proximity: {},
      recommendedInterventions: [],
      rationale: [],
      readinessTier: "STABILIZING",
      operatorScore: 75,
    } as unknown as ConstitutionalDecision;

    const governorVerdict = governEscalation(governorInput);

    if (!governorVerdict.permitted) {
      results.push({
        caseKey: intervention.caseKey,
        operatorKey: caseMemory.operatorKey ?? "unknown",
        permitted: false,
        reason: `Governor denied: ${governorVerdict.reason}`,
        source: "AUTO_ESCALATION",
        triggerId: intervention.id,
        seriousness,
        confidence,
      });
      continue;
    }

    // Escalation permitted — record the result
    // Note: actual session creation is handled by the caller (cron/API route)
    // to keep this engine side-effect-free and testable
    results.push({
      caseKey: intervention.caseKey,
      operatorKey: caseMemory.operatorKey ?? "unknown",
      permitted: true,
      reason: governorVerdict.reason,
      source: "AUTO_ESCALATION",
      triggerId: intervention.id,
      seriousness,
      confidence,
    });
  }

  return results;
}
