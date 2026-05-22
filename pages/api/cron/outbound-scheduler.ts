/**
 * pages/api/cron/outbound-scheduler.ts
 *
 * Cron-triggered outbound scheduler endpoint.
 *
 * Protected by CRON_SECRET (passed as ?secret= query param or Authorization header).
 * If OUTBOUND_SCHEDULER_ENABLED !== "true", returns immediately (skipped).
 *
 * Rules:
 *  - Requires CRON_SECRET env var to match
 *  - If scheduler disabled, return ok:true with skipped status
 *  - Runs scheduler live (no dry-run)
 *  - No public access
 *  - Audits start/completion/failure
 *
 * Compatible with:
 *  - Vercel Cron Jobs
 *  - Netlify scheduled functions
 *  - GitHub Actions scheduled workflows
 *  - Any external cron service
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { runOutboundScheduler } from "@/lib/outbound/core/outbound-scheduler-runner";
import { acquireSchedulerLock, releaseSchedulerLock } from "@/lib/outbound/core/outbound-scheduler-lock";
import { logAuditEvent } from "@/lib/server/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ── Only allow GET or POST ────────────────────────────────────────────────
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // ── Validate CRON_SECRET ──────────────────────────────────────────────────
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.warn("[CRON_SCHEDULER] CRON_SECRET is not configured. Cron endpoint is disabled.");
    return res.status(503).json({
      ok: false,
      error: "Cron endpoint is not configured.",
      skipped: true,
    });
  }

  const providedSecret =
    req.query.secret as string ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!providedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({
      ok: false,
      error: "Invalid or missing CRON_SECRET.",
      skipped: true,
    });
  }

  // ── Check scheduler enabled ───────────────────────────────────────────────
  if (process.env.OUTBOUND_SCHEDULER_ENABLED !== "true") {
    await logAuditEvent({
      actorType: "system",
      action: "OUTBOUND_SCHEDULER_SKIPPED",
      resourceType: "admin",
      resourceName: "Outbound scheduler (cron)",
      status: "success",
      severity: "low",
      tags: ["outbound", "scheduler", "cron"],
      metadata: {
        reason: "OUTBOUND_SCHEDULER_ENABLED is not true",
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      ok: true,
      skipped: true,
      message: "OUTBOUND_SCHEDULER_ENABLED is not true. Scheduler skipped.",
    });
  }

  // ── Acquire lock ──────────────────────────────────────────────────────────
  const lock = await acquireSchedulerLock("cron");
  if (!lock.acquired) {
    await logAuditEvent({
      actorType: "system",
      action: "OUTBOUND_SCHEDULER_SKIPPED_LOCKED",
      resourceType: "admin",
      resourceName: "Outbound scheduler (cron)",
      status: "success",
      severity: "low",
      tags: ["outbound", "scheduler", "cron"],
      metadata: {
        reason: lock.reason,
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      ok: true,
      skipped: true,
      message: `Scheduler skipped: ${lock.reason}`,
    });
  }

  // ── Run scheduler ─────────────────────────────────────────────────────────
  try {
    const summary = await runOutboundScheduler({
      dryRun: false,
      source: "cron",
    });

    return res.status(200).json({
      ...summary,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown scheduler error";
    console.error("[CRON_SCHEDULER] Fatal error:", err);

    return res.status(500).json({
      ok: false,
      error: "Scheduler cron run failed.",
      message: errorMessage.slice(0, 500),
    });
  } finally {
    await releaseSchedulerLock();
  }
}