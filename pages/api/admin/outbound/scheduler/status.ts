/**
 * pages/api/admin/outbound/scheduler/status.ts
 *
 * GET — Returns current outbound scheduler state for the admin cockpit.
 *
 * Returns:
 *   - enabled flag (env var)
 *   - paused flag (env var OR DB)
 *   - CRON_SECRET presence (never the value)
 *   - scheduler lock state
 *   - last 5 runs with counts
 *   - 24h failure summary per provider
 *   - due counts (scheduled items past their scheduledFor)
 *   - provider readiness stubs (based on env config, not live OAuth check)
 *
 * Admin-only. No tokens exposed.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { getOutboundControlState } from "@/lib/outbound/core/outbound-control-state";
import { getFailureSummary } from "@/lib/outbound/core/outbound-publish-ledger";
import { getOutboundPostsDue } from "@/lib/outbound/outbound-content-loader";

type ProviderStatus = {
  provider: string;
  schedulerEnabled: boolean;
  schedulerPaused: boolean;
  failureCount24h: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const schedulerEnabled = process.env.OUTBOUND_SCHEDULER_ENABLED === "true";
  const schedulerPausedEnv = process.env.OUTBOUND_SCHEDULER_PAUSED === "true";
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());

  // ── DB state ────────────────────────────────────────────────────────────────
  const [controlState, lockRow, recentRuns, linkedInSummary, facebookSummary, xSummary] =
    await Promise.all([
      getOutboundControlState(),
      prisma.schedulerLock.findUnique({ where: { lockKey: "outbound-scheduler" } }),
      prisma.schedulerRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
      getFailureSummary("linkedin", 24).catch(() => null),
      getFailureSummary("facebook", 24).catch(() => null),
      getFailureSummary("x", 24).catch(() => null),
    ]);

  const schedulerPausedDb = controlState.schedulerPaused;
  const schedulerPaused = schedulerPausedEnv || schedulerPausedDb;

  // ── Lock state ──────────────────────────────────────────────────────────────
  const lockActive = lockRow
    ? lockRow.expiresAt > new Date()
    : false;

  // ── Due counts — aggregate across all providers ─────────────────────────────
  let dueCount = 0;
  try {
    dueCount =
      getOutboundPostsDue("linkedin").length +
      getOutboundPostsDue("facebook").length +
      getOutboundPostsDue("x").length;
  } catch {
    dueCount = -1; // unavailable
  }

  // ── Provider readiness stubs ─────────────────────────────────────────────────
  // Full live readiness check runs in the diagnostics endpoint;
  // here we return config-based stubs for speed.
  const providers: ProviderStatus[] = [
    {
      provider: "linkedin",
      schedulerEnabled,
      schedulerPaused,
      failureCount24h: linkedInSummary?.failureCount ?? 0,
      lastFailureAt: linkedInSummary?.lastFailure?.createdAt?.toString() ?? null,
      lastSuccessAt: linkedInSummary?.lastSuccess?.createdAt?.toString() ?? null,
    },
    {
      provider: "facebook",
      schedulerEnabled,
      schedulerPaused,
      failureCount24h: facebookSummary?.failureCount ?? 0,
      lastFailureAt: facebookSummary?.lastFailure?.createdAt?.toString() ?? null,
      lastSuccessAt: facebookSummary?.lastSuccess?.createdAt?.toString() ?? null,
    },
    {
      provider: "x",
      schedulerEnabled,
      schedulerPaused,
      failureCount24h: xSummary?.failureCount ?? 0,
      lastFailureAt: xSummary?.lastFailure?.createdAt?.toString() ?? null,
      lastSuccessAt: xSummary?.lastSuccess?.createdAt?.toString() ?? null,
    },
  ];

  return res.status(200).json({
    ok: true,
    scheduler: {
      enabled: schedulerEnabled,
      paused: schedulerPaused,
      pausedEnv: schedulerPausedEnv,
      pausedDb: schedulerPausedDb,
      pausedReason: controlState.pausedReason,
      pausedByEmail: controlState.pausedByEmail,
      pausedAt: controlState.pausedAt?.toISOString() ?? null,
      resumedAt: controlState.resumedAt?.toISOString() ?? null,
      cronSecretConfigured,
    },
    lock: {
      active: lockActive,
      expiresAt: lockRow?.expiresAt?.toISOString() ?? null,
      holder: lockRow?.holder ?? null,
    },
    recentRuns: recentRuns.map((r) => ({
      runKey: r.runKey,
      source: r.source,
      dryRun: r.dryRun,
      status: r.status,
      scanned: r.scannedCount,
      eligible: r.eligibleCount,
      published: r.publishedCount,
      skipped: r.skippedCount,
      failed: r.failedCount,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
    dueCount,
    providers,
    // Token never returned
  });
}
