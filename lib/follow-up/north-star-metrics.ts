/**
 * North Star Metrics — the only 3 numbers that matter.
 *
 * QER% — Qualified ER Conversion (Intent YES + Cost >= £5k → ER purchase)
 * DAR% — Decision Activation Rate (Strategy Room buyers → action within 48h)
 * TAR% — Truth Acceptance Rate (Accuracy YES / total completions)
 *
 * Hard thresholds:
 * QER < 8% → pricing or framing is weak
 * DAR < 60% → Strategy Room is theatre
 * TAR < 70% → engine is misdiagnosing
 *
 * If any drops below → stop outreach and fix.
 */

export type NorthStarMetrics = {
  qer: { rate: number; qualified: number; purchased: number; status: "healthy" | "weak" | "critical" };
  dar: { rate: number; activated: number; total: number; status: "healthy" | "weak" | "critical" };
  tar: { rate: number; yesCount: number; totalCount: number; status: "healthy" | "weak" | "critical" };
  outreachAllowed: boolean;
};

export const THRESHOLDS = {
  QER_MIN: 0.08,
  DAR_MIN: 0.60,
  TAR_MIN: 0.70,
} as const;

export function computeNorthStar(data: {
  qualifiedIntentYesHighCost: number;
  erPurchases: number;
  strategyRoomBuyers: number;
  actionWithin48h: number;
  accuracyYes: number;
  totalCompletions: number;
}): NorthStarMetrics {
  const qerRate = data.qualifiedIntentYesHighCost > 0 ? data.erPurchases / data.qualifiedIntentYesHighCost : 0;
  const darRate = data.strategyRoomBuyers > 0 ? data.actionWithin48h / data.strategyRoomBuyers : 0;
  const tarRate = data.totalCompletions > 0 ? data.accuracyYes / data.totalCompletions : 0;

  const qerStatus = qerRate >= THRESHOLDS.QER_MIN ? "healthy" : qerRate >= THRESHOLDS.QER_MIN * 0.5 ? "weak" : "critical";
  const darStatus = darRate >= THRESHOLDS.DAR_MIN ? "healthy" : darRate >= THRESHOLDS.DAR_MIN * 0.5 ? "weak" : "critical";
  const tarStatus = tarRate >= THRESHOLDS.TAR_MIN ? "healthy" : tarRate >= THRESHOLDS.TAR_MIN * 0.5 ? "weak" : "critical";

  const outreachAllowed = qerStatus !== "critical" && darStatus !== "critical" && tarStatus !== "critical";

  return {
    qer: { rate: qerRate, qualified: data.qualifiedIntentYesHighCost, purchased: data.erPurchases, status: qerStatus },
    dar: { rate: darRate, activated: data.actionWithin48h, total: data.strategyRoomBuyers, status: darStatus },
    tar: { rate: tarRate, yesCount: data.accuracyYes, totalCount: data.totalCompletions, status: tarStatus },
    outreachAllowed,
  };
}
