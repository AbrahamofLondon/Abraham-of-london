/**
 * Founder Operating Dashboard — data layer.
 *
 * Answers instantly:
 * - Are we allowed to sell today?
 * - Where is revenue actually coming from?
 * - Where is the system breaking?
 * - What must be fixed now?
 *
 * If it doesn't answer those, it's noise.
 */

import { computeNorthStar, type NorthStarMetrics } from "@/lib/follow-up/north-star-metrics";
import { evaluateSystemIntegrity, type SystemIntegrityStatus } from "@/lib/follow-up/system-integrity-mode";
import { computeCallFunnel, diagnoseCallPerformance, aggregateDropOffs, type CallRecord, type CallFunnelMetrics, type CallDiagnosis } from "./call-analytics";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RevenuePanel = {
  revenue7d: number;
  revenue30d: number;
  erPurchases: number;
  srEntries: number;
  avgDealSize: number;
  erConversionRate: number;
  srConversionRate: number;
  insight: string;
};

export type PipelinePanel = {
  intentYes: number;
  intentNo: number;
  highCost: number;
  lowCost: number;
  viableBuyers: number;
  insight: string;
};

export type PressurePanel = {
  avgPressureIndex: number;
  increasing: number;
  decreasing: number;
  inBreach: number;
  insight: string;
};

export type ActionItem = {
  priority: 1 | 2 | 3;
  action: string;
  source: string;
};

export type FounderDashboard = {
  systemStatus: SystemIntegrityStatus;
  northStar: NorthStarMetrics;
  revenue: RevenuePanel;
  pipeline: PipelinePanel;
  pressure: PressurePanel;
  callFunnel: CallFunnelMetrics;
  callDiagnoses: CallDiagnosis[];
  actionQueue: ActionItem[];
  generatedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildFounderDashboard(input: {
  // North star inputs
  qualifiedIntentYesHighCost: number;
  erPurchases: number;
  strategyRoomBuyers: number;
  actionWithin48h: number;
  accuracyYes: number;
  totalCompletions: number;

  // Revenue
  revenue7d: number;
  revenue30d: number;
  srEntries: number;
  avgDealSize: number;
  totalFastCompletions: number;

  // Pipeline
  intentYes: number;
  intentNo: number;
  highCost: number;
  lowCost: number;

  // Pressure
  avgPressureIndex: number;
  pressureIncreasing: number;
  pressureDecreasing: number;
  inBreach: number;

  // Calls
  calls: CallRecord[];
}): FounderDashboard {
  const northStar = computeNorthStar({
    qualifiedIntentYesHighCost: input.qualifiedIntentYesHighCost,
    erPurchases: input.erPurchases,
    strategyRoomBuyers: input.strategyRoomBuyers,
    actionWithin48h: input.actionWithin48h,
    accuracyYes: input.accuracyYes,
    totalCompletions: input.totalCompletions,
  });

  const systemStatus = evaluateSystemIntegrity(northStar);

  // Revenue
  const erRate = input.totalFastCompletions > 0 ? input.erPurchases / input.totalFastCompletions : 0;
  const srRate = input.erPurchases > 0 ? input.srEntries / input.erPurchases : 0;

  let revenueInsight: string;
  if (erRate < 0.08) revenueInsight = "Revenue is constrained by ER conversion, not lead volume.";
  else if (srRate < 0.05) revenueInsight = "ER converts but Strategy Room entry is low. Pricing or framing at SR gate needs tightening.";
  else revenueInsight = "Revenue funnel is performing within targets.";

  const revenue: RevenuePanel = {
    revenue7d: input.revenue7d,
    revenue30d: input.revenue30d,
    erPurchases: input.erPurchases,
    srEntries: input.srEntries,
    avgDealSize: input.avgDealSize,
    erConversionRate: erRate,
    srConversionRate: srRate,
    insight: revenueInsight,
  };

  // Pipeline
  const viableBuyers = input.highCost;
  const pipelineInsight = viableBuyers > 0
    ? `You have ${viableBuyers} viable buyers (cost >= £5k). Everything else is noise.`
    : "No viable buyers in pipeline. Tighten inbound quality.";

  const pipeline: PipelinePanel = {
    intentYes: input.intentYes,
    intentNo: input.intentNo,
    highCost: input.highCost,
    lowCost: input.lowCost,
    viableBuyers,
    insight: pipelineInsight,
  };

  // Pressure
  const totalPressure = input.pressureIncreasing + input.pressureDecreasing;
  const increasingPct = totalPressure > 0 ? input.pressureIncreasing / totalPressure : 0;
  let pressureInsight: string;
  if (increasingPct > 0.7) pressureInsight = "Pressure is building. Conversion window is active.";
  else if (increasingPct < 0.4) pressureInsight = "Pressure declining. Users may be resolving outside the system.";
  else pressureInsight = "Pressure is stable. Monitor for shifts.";

  const pressure: PressurePanel = {
    avgPressureIndex: input.avgPressureIndex,
    increasing: input.pressureIncreasing,
    decreasing: input.pressureDecreasing,
    inBreach: input.inBreach,
    insight: pressureInsight,
  };

  // Call analytics
  const callFunnel = computeCallFunnel(input.calls);
  const callDiagnoses = diagnoseCallPerformance(callFunnel);

  // Action queue (auto-generated)
  const actionQueue: ActionItem[] = [];

  if (!systemStatus.outreachAllowed) {
    actionQueue.push({ priority: 1, action: "STOP outreach — system metrics below threshold", source: "north_star" });
  }

  const dropOffs = aggregateDropOffs(input.calls);
  if (dropOffs.length > 0 && dropOffs[0]!.rate > 0.3) {
    actionQueue.push({ priority: 1, action: `Fix ${dropOffs[0]!.stage} drop-off in calls (${Math.round(dropOffs[0]!.rate * 100)}%)`, source: "call_analytics" });
  }

  if (erRate < 0.08) {
    actionQueue.push({ priority: 2, action: "Increase cost anchoring in Fast Diagnostic and ER paywall", source: "revenue" });
  }

  if (northStar.tar.rate < 0.7 && northStar.tar.totalCount > 10) {
    actionQueue.push({ priority: 1, action: "TAR below 70% — review contradiction extraction accuracy", source: "north_star" });
  }

  if (input.inBreach > input.totalCompletions * 0.3) {
    actionQueue.push({ priority: 2, action: "Breach rate high — tighten pre-commitment gate or follow-up timing", source: "pressure" });
  }

  actionQueue.sort((a, b) => a.priority - b.priority);

  return {
    systemStatus,
    northStar,
    revenue,
    pipeline,
    pressure,
    callFunnel,
    callDiagnoses,
    actionQueue,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format the action queue for display.
 */
export function formatActionQueue(items: ActionItem[]): string {
  return items.map((item, i) => `${i + 1}. [P${item.priority}] ${item.action}`).join("\n");
}
