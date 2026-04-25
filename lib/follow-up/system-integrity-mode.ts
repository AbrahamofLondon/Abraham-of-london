/**
 * System Integrity Mode — global kill switch.
 *
 * if (QER < 5% OR TAR < 60%) → systemIntegrityMode = "degraded"
 *
 * Effects:
 * - suppress Strategy Room
 * - restrict ER access
 * - show: "System recalibrating. Outputs temporarily limited."
 *
 * Protects reputation when metrics drop.
 */

import { THRESHOLDS, type NorthStarMetrics } from "./north-star-metrics";

export type SystemIntegrityMode = "operational" | "degraded" | "critical";

export type SystemIntegrityStatus = {
  mode: SystemIntegrityMode;
  suppressStrategyRoom: boolean;
  restrictER: boolean;
  outreachAllowed: boolean;
  message: string | null;
  reasons: string[];
};

const CRITICAL_QER = 0.05;
const CRITICAL_TAR = 0.60;

/**
 * Evaluate system integrity from north star metrics.
 */
export function evaluateSystemIntegrity(metrics: NorthStarMetrics): SystemIntegrityStatus {
  const reasons: string[] = [];

  if (metrics.qer.rate < CRITICAL_QER && metrics.qer.qualified > 10) {
    reasons.push(`QER at ${(metrics.qer.rate * 100).toFixed(1)}% (below critical ${CRITICAL_QER * 100}%)`);
  }
  if (metrics.tar.rate < CRITICAL_TAR && metrics.tar.totalCount > 20) {
    reasons.push(`TAR at ${(metrics.tar.rate * 100).toFixed(1)}% (below critical ${CRITICAL_TAR * 100}%)`);
  }
  if (metrics.dar.rate < THRESHOLDS.DAR_MIN * 0.5 && metrics.dar.total > 5) {
    reasons.push(`DAR at ${(metrics.dar.rate * 100).toFixed(1)}% (below critical ${THRESHOLDS.DAR_MIN * 50}%)`);
  }

  if (reasons.length >= 2) {
    return {
      mode: "critical",
      suppressStrategyRoom: true,
      restrictER: true,
      outreachAllowed: false,
      message: "System recalibrating. Multiple metrics below acceptable thresholds. Outputs temporarily limited.",
      reasons,
    };
  }

  if (reasons.length === 1) {
    return {
      mode: "degraded",
      suppressStrategyRoom: true,
      restrictER: false,
      outreachAllowed: false,
      message: "System recalibrating. Outputs temporarily limited until metrics recover.",
      reasons,
    };
  }

  return {
    mode: "operational",
    suppressStrategyRoom: false,
    restrictER: false,
    outreachAllowed: metrics.outreachAllowed,
    message: null,
    reasons: [],
  };
}

/**
 * Execution verification — classify impact type.
 * Only structural_change counts as success.
 */
export type VerifiedImpact = "structural_change" | "temporary_fix" | "no_change";

export function classifyVerifiedImpact(input: {
  actionTaken: boolean;
  outcomeDescription?: string;
  blockerResolved?: boolean;
  conditionChanged?: boolean;
}): VerifiedImpact {
  if (!input.actionTaken) return "no_change";

  if (input.conditionChanged && input.blockerResolved) return "structural_change";

  if (input.actionTaken && !input.conditionChanged) return "temporary_fix";

  return "temporary_fix";
}
