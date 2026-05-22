/**
 * pages/api/admin/outbound/scheduler/run.ts
 *
 * POST — Run the outbound scheduler.
 *
 * Access control:
 *  - ADMIN allowed for dryRun
 *  - OWNER required for live execution
 *
 * Rules:
 *  - dryRun allowed for ADMIN
 *  - live run requires OWNER
 *  - live run requires OUTBOUND_SCHEDULER_ENABLED=true
 *  - live run requires explicit final confirmation: confirm: "RUN_OUTBOUND_SCHEDULER"
 *  - rate-limited
 *  - audited
 */

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

import { requireAdminApi, requireTierApi } from "@/lib/access/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { logAuditEvent } from "@/lib/server/audit";
import { runOutboundScheduler } from "@/lib/outbound/core/outbound-scheduler-runner";
import { acquireSchedulerLock, releaseSchedulerLock } from "@/lib/outbound/core/outbound-scheduler-lock";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";
import type { ProviderId } from "@/lib/outbound/core/outbound-provider-contract";

function requestId(): string {
  return `sched_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // ── Origin / CSRF check ───────────────────────────────────────────────────
  const originCheck = verifyAdminMutationOrigin(req);
  if (!originCheck.ok) {
    return res.status(403).json({ ok: false, error: originCheck.reason });
  }

  const id = requestId();

  // ── Authenticate ──────────────────────────────────────────────────────────
  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const actorId = guard.session?.user?.id ?? null;
  const actorEmail = guard.session?.user?.email ?? null;
  const actorEmailHash = hashEmail(actorEmail);

  const { dryRun, provider, campaign, confirm, now } = req.body as {
    dryRun?: boolean;
    provider?: string;
    campaign?: string;
    confirm?: string;
    now?: string;
  };

  const isDryRun = dryRun === true;

  // ── Access control ────────────────────────────────────────────────────────
  if (!isDryRun) {
    // Live run requires OWNER
    const ownerGuard = await requireTierApi(req, res, "owner");
    if (!ownerGuard) return;

    // Live run requires explicit confirmation
    if (confirm !== "RUN_OUTBOUND_SCHEDULER") {
      return res.status(400).json({
        ok: false,
        error: "Live scheduler run requires confirmation: confirm: \"RUN_OUTBOUND_SCHEDULER\".",
        requestId: id,
      });
    }

    // Live run requires scheduler enabled
    if (process.env.OUTBOUND_SCHEDULER_ENABLED !== "true") {
      return res.status(400).json({
        ok: false,
        error: "OUTBOUND_SCHEDULER_ENABLED is not true. Scheduler cannot run live.",
        requestId: id,
      });
    }

    // Acquire scheduler lock for live run
    const lock = await acquireSchedulerLock(actorId ?? undefined);
    if (!lock.acquired) {
      return res.status(409).json({
        ok: false,
        error: `Scheduler is already running: ${lock.reason}`,
        requestId: id,
      });
    }
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rateKey = actorId ?? (req.headers["x-forwarded-for"] as string ?? "unknown");
  const rate = await checkRateLimit({
    scope: "LINKEDIN_OUTBOUND_PUBLISH", // Reuse existing scope
    identifier: rateKey,
    limit: isDryRun ? 20 : 5, // More dry-runs allowed
    windowSeconds: 3600,
  });
  if (!rate.allowed) {
    if (!isDryRun) {
      await releaseSchedulerLock();
    }
    res.setHeader("Retry-After", "3600");
    Object.entries(rateLimitHeaders(rate)).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(429).json({
      ok: false,
      error: "Scheduler run rate limit reached. Try again in an hour.",
      requestId: id,
    });
  }

  // ── Validate provider ─────────────────────────────────────────────────────
  const validProviders: ProviderId[] = ["linkedin", "facebook", "x"];
  if (provider && !validProviders.includes(provider as ProviderId)) {
    if (!isDryRun) {
      await releaseSchedulerLock();
    }
    return res.status(400).json({
      ok: false,
      error: `Invalid provider "${provider}". Expected one of: ${validProviders.join(", ")}.`,
      requestId: id,
    });
  }

  // ── Run scheduler ─────────────────────────────────────────────────────────
  try {
    const summary = await runOutboundScheduler({
      dryRun: isDryRun,
      provider: provider as ProviderId | undefined,
      campaign,
      now,
      source: "api",
      actorId,
      actorEmail,
      actorEmailHash,
    });

    // Release lock after live run
    if (!isDryRun) {
      await releaseSchedulerLock();
    }

    return res.status(200).json({
      requestId: id,
      ...summary,
    });
  } catch (err) {
    if (!isDryRun) {
      await releaseSchedulerLock();
    }

    const errorMessage = err instanceof Error ? err.message : "Unknown scheduler error";
    console.error("[SCHEDULER_API] Error:", err);

    return res.status(500).json({
      ok: false,
      error: "Scheduler run failed unexpectedly.",
      requestId: id,
      message: errorMessage.slice(0, 500),
    });
  }
}
