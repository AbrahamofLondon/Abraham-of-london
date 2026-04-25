/**
 * Pressure Index — cross-stage pressure consistency enforcement.
 *
 * Pressure must ONLY increase across stages.
 * If any stage reduces pressure → flag drift violation.
 *
 * Based on: cost, delay, breach, authority clarity.
 */

import type { IntelligenceSpine, SpineEvent } from "@/lib/decision/intelligence-spine";

export type PressureIndexResult = {
  currentIndex: number;
  stageIndices: Array<{ stage: string; index: number }>;
  driftDetected: boolean;
  driftViolations: string[];
};

/**
 * Compute pressure index from spine state.
 * Returns 0-100. Higher = more pressure on the user to act.
 */
export function computePressureIndex(spine: IntelligenceSpine): number {
  let pressure = 0;

  // Cost component (0-30)
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  if (cost >= 20000) pressure += 30;
  else if (cost >= 10000) pressure += 25;
  else if (cost >= 5000) pressure += 20;
  else if (cost >= 1000) pressure += 10;

  // Delay component (0-25)
  const createdMs = new Date(spine.createdAt).getTime();
  const hoursSince = (Date.now() - createdMs) / (1000 * 60 * 60);
  if (hoursSince > 168) pressure += 25;      // 7+ days
  else if (hoursSince > 72) pressure += 20;  // 3+ days
  else if (hoursSince > 48) pressure += 15;  // 2+ days
  else if (hoursSince > 24) pressure += 10;  // 1+ day

  // Breach component (0-25)
  if (spine.execution?.breach) pressure += 25;
  else if (spine.preCommitment && !spine.preCommitment.willing48h) pressure += 10;

  // Authority clarity component (0-20)
  if (spine.deterministic.conditionClass === "authority") pressure += 15;
  if (spine.flags?.falseAuthority) pressure += 20;
  else if (spine.flags?.avoidanceSuspected) pressure += 10;

  return Math.min(100, pressure);
}

/**
 * Check pressure consistency across spine history.
 * Pressure must not decrease between stages.
 */
export function checkPressureConsistency(spine: IntelligenceSpine): PressureIndexResult {
  const stageIndices: Array<{ stage: string; index: number }> = [];
  const violations: string[] = [];

  // Compute pressure at each stage based on what was known at that point
  for (const event of spine.history) {
    const snap = event.snapshot;
    let stageP = 0;

    // Use snapshot data to approximate pressure at that stage
    if (typeof snap.totalPct === "number") stageP += Math.max(0, 50 - snap.totalPct as number);
    if (snap.fragilityStatus === "FRACTURED" || snap.fragilityStatus === "VOLATILE") stageP += 20;
    if (snap.band === "FRAGILE" || snap.band === "ESCALATE") stageP += 25;
    if (snap.contradictionReinforcement) stageP += 15;
    if (snap.patternTitle) stageP += 10;

    // Base from spine-wide pressure
    stageP += computePressureIndex(spine) * 0.3;

    stageIndices.push({ stage: event.stage, index: Math.round(stageP) });
  }

  // Check monotonic increase
  for (let i = 1; i < stageIndices.length; i++) {
    const prev = stageIndices[i - 1]!;
    const curr = stageIndices[i]!;
    if (curr.index < prev.index - 5) { // 5-point tolerance
      violations.push(`Pressure dropped from ${prev.stage} (${prev.index}) to ${curr.stage} (${curr.index})`);
    }
  }

  return {
    currentIndex: computePressureIndex(spine),
    stageIndices,
    driftDetected: violations.length > 0,
    driftViolations: violations,
  };
}

/**
 * Generate delay cost accumulation message.
 */
export function delayAccumulationMessage(spine: IntelligenceSpine): string | null {
  const cost = spine.economics?.estimatedMonthlyCost;
  if (!cost || cost <= 0) return null;

  const createdMs = new Date(spine.createdAt).getTime();
  const hoursSince = Math.round((Date.now() - createdMs) / (1000 * 60 * 60));
  if (hoursSince < 24) return null;

  const dailyCost = cost / 30;
  const daysSince = Math.round(hoursSince / 24);
  const accrued = Math.round(dailyCost * daysSince);

  return `You have waited ${daysSince} day${daysSince === 1 ? "" : "s"}. Estimated cost accrued: £${accrued.toLocaleString()}.`;
}
