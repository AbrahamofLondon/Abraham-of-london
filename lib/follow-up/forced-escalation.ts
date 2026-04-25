/**
 * Forced Escalation Triggers — removes politeness from escalation.
 *
 * if pressureIndex > 80 && breachCount >= 2 → force escalate to Strategy Room
 * No button choice. Continue → Strategy Room. Exit → abandon.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type ForcedEscalation = {
  triggered: boolean;
  reason: string | null;
  destination: "strategy_room" | "executive_reporting" | null;
};

/**
 * Check whether forced escalation should be triggered.
 */
export function checkForcedEscalation(spine: IntelligenceSpine): ForcedEscalation {
  const pressure = spine.pressureIndex ?? 0;
  const breaches = spine.execution?.breachCount ?? 0;
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;

  // Primary trigger: high pressure + repeated breach
  if (pressure > 80 && breaches >= 2) {
    return {
      triggered: true,
      reason: "This decision has crossed the threshold where passive correction is no longer valid. Pressure index exceeds 80 with multiple breaches recorded.",
      destination: "strategy_room",
    };
  }

  // Secondary trigger: high cost + no action + declining integrity
  if (cost > 10000 && !spine.execution?.actionTaken && (spine.integrityScore ?? 1) < 0.6) {
    return {
      triggered: true,
      reason: "The estimated cost exceeds £10,000/month with no action taken and declining integrity score. Executive-level intervention is required.",
      destination: "executive_reporting",
    };
  }

  return { triggered: false, reason: null, destination: null };
}

/**
 * Generate anonymised outcome statistics for publication.
 */
export function generateOutcomeStats(spines: IntelligenceSpine[]): {
  failedToAct48h: number;
  understatedCost50pct: number;
  misidentifiedOwner: number;
  totalAssessed: number;
} {
  const total = spines.length;
  if (total === 0) return { failedToAct48h: 0, understatedCost50pct: 0, misidentifiedOwner: 0, totalAssessed: 0 };

  const failedToAct = spines.filter((s) => s.preCommitment?.willing48h && !s.execution?.actionTaken).length;
  const understated = spines.filter((s) => s.flags?.economicSanitySuspicious).length;
  const misidentified = spines.filter((s) => s.flags?.falseAuthority).length;

  return {
    failedToAct48h: Math.round((failedToAct / total) * 100),
    understatedCost50pct: Math.round((understated / total) * 100),
    misidentifiedOwner: Math.round((misidentified / total) * 100),
    totalAssessed: total,
  };
}
