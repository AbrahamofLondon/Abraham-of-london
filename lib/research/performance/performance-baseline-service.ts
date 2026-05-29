/**
 * lib/research/performance/performance-baseline-service.ts
 *
 * Server-side performance baseline service.
 * One durable baseline per engine (upsert by engineId).
 *
 * Local (localStorage) baselines remain the fast-access QA tool.
 * Server baselines are the governance record: they can block
 * promotion and persist across machines and browsers.
 *
 * Regression threshold: if current avg > baselineMs * REGRESSION_FACTOR
 * (default 1.25 = 25% degradation), the engine is considered regressed.
 */

import "server-only";

import { prisma } from "@/lib/prisma";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Percentage slowdown before a run is considered a regression (1.25 = 25%). */
export const REGRESSION_FACTOR = 1.25;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PerformanceBaselineRecord = {
  id:          string;
  engineId:    string;
  baselineMs:  number;
  p95Ms:       number;
  sampleSize:  number;
  environment: string;
  notes:       string | null;
  updatedBy:   string | null;
  createdAt:   Date;
  updatedAt:   Date;
};

export type UpsertBaselineInput = {
  engineId:    string;
  baselineMs:  number;
  p95Ms:       number;
  sampleSize:  number;
  environment?: string;
  notes?:      string;
  updatedBy?:  string;
};

export type RegressionResult = {
  isRegressed: boolean;
  currentAvgMs: number;
  baselineMs: number;
  deltaMs: number;
  deltaPct: number;
};

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Upsert a server baseline for an engine. Overwrites the previous baseline.
 */
export async function upsertBaseline(
  input: UpsertBaselineInput,
): Promise<PerformanceBaselineRecord> {
  return prisma.performanceBaseline.upsert({
    where:  { engineId: input.engineId },
    create: {
      engineId:    input.engineId,
      baselineMs:  input.baselineMs,
      p95Ms:       input.p95Ms,
      sampleSize:  input.sampleSize,
      environment: input.environment ?? "production",
      notes:       input.notes    ?? null,
      updatedBy:   input.updatedBy ?? null,
    },
    update: {
      baselineMs:  input.baselineMs,
      p95Ms:       input.p95Ms,
      sampleSize:  input.sampleSize,
      environment: input.environment ?? "production",
      notes:       input.notes    ?? null,
      updatedBy:   input.updatedBy ?? null,
      updatedAt:   new Date(),
    },
  }) as unknown as PerformanceBaselineRecord;
}

/**
 * Get the server baseline for an engine, or null if none set.
 */
export async function getBaseline(
  engineId: string,
): Promise<PerformanceBaselineRecord | null> {
  return prisma.performanceBaseline.findUnique({
    where: { engineId },
  }) as unknown as PerformanceBaselineRecord | null;
}

/**
 * List all server baselines.
 */
export async function listBaselines(): Promise<PerformanceBaselineRecord[]> {
  return prisma.performanceBaseline.findMany({
    orderBy: { updatedAt: "desc" },
  }) as unknown as PerformanceBaselineRecord[];
}

/**
 * Delete a server baseline for an engine.
 */
export async function deleteBaseline(engineId: string): Promise<boolean> {
  try {
    await prisma.performanceBaseline.delete({ where: { engineId } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a current run result is a regression against the server baseline.
 */
export function checkRegression(
  currentAvgMs: number,
  baseline: PerformanceBaselineRecord,
): RegressionResult {
  const deltaMs  = currentAvgMs - baseline.baselineMs;
  const deltaPct = baseline.baselineMs > 0
    ? (deltaMs / baseline.baselineMs) * 100
    : 0;
  const isRegressed = currentAvgMs > baseline.baselineMs * REGRESSION_FACTOR;

  return { isRegressed, currentAvgMs, baselineMs: baseline.baselineMs, deltaMs, deltaPct };
}
