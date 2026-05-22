/**
 * pages/api/admin/outbound/scheduler/pause.ts
 *
 * POST — Pause or resume the outbound scheduler via DB.
 *
 * OWNER-only. Audited. Rate-limited.
 *
 * Body: { paused: boolean; reason?: string }
 *
 * Rules:
 *  - OWNER role required (not just ADMIN)
 *  - reason required when pausing
 *  - Cannot auto-publish — only controls the DB pause flag
 *  - Audit event written on every toggle
 *  - Scheduler does not auto-resume — must be explicitly resumed
 */

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { canAccessOwner } from "@/lib/access/checks";
import { logAuditEvent } from "@/lib/server/audit";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { pauseScheduler, resumeScheduler } from "@/lib/outbound/core/outbound-control-state";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";

function requestId(): string {
  return `pause_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const originCheck = verifyAdminMutationOrigin(req);
  if (!originCheck.ok) {
    return res.status(403).json({ ok: false, error: originCheck.reason });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  // ── OWNER gate ─────────────────────────────────────────────────────────────
  if (!canAccessOwner(guard.access)) {
    return res.status(403).json({
      ok: false,
      error: "Owner access required to toggle scheduler pause state.",
    });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const actorId = guard.session?.user?.id ?? "unknown";
  const actorEmail = guard.session?.user?.email ?? null;
  const rl = await checkRateLimit({
    scope: "admin-scheduler-pause",
    identifier: actorId,
    limit: 10,
    windowSeconds: 60,
  });
  res.setHeader("X-RateLimit-Limit", rl.limit);
  res.setHeader("X-RateLimit-Remaining", rl.remaining);
  if (!rl.allowed) {
    return res.status(429).json({ ok: false, error: "Rate limit exceeded." });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  const { paused, reason } = (req.body ?? {}) as {
    paused?: boolean;
    reason?: string;
  };

  if (typeof paused !== "boolean") {
    return res.status(400).json({
      ok: false,
      error: "Missing required field: paused (boolean).",
    });
  }

  if (paused && !reason?.trim()) {
    return res.status(400).json({
      ok: false,
      error: "reason is required when pausing the scheduler.",
    });
  }

  const id = requestId();

  try {
    let state;
    if (paused) {
      state = await pauseScheduler({
        reason: reason?.trim() ?? null,
        actorId,
        actorEmail,
      });
    } else {
      state = await resumeScheduler({ actorId, actorEmail });
    }

    await logAuditEvent({
      action: paused ? "OUTBOUND_SCHEDULER_PAUSED" : "OUTBOUND_SCHEDULER_RESUMED",
      category: "OUTBOUND",
      status: "success",
      actorType: "admin",
      actorId,
      requestId: id,
      metadata: {
        paused,
        reason: reason ?? null,
        actorEmail,
        pausedAt: state.pausedAt?.toISOString() ?? null,
        resumedAt: state.resumedAt?.toISOString() ?? null,
      },
    }).catch(() => null);

    return res.status(200).json({
      ok: true,
      paused: state.schedulerPaused,
      pausedReason: state.pausedReason,
      pausedAt: state.pausedAt?.toISOString() ?? null,
      resumedAt: state.resumedAt?.toISOString() ?? null,
      requestId: id,
    });
  } catch (err) {
    console.error("[scheduler/pause] failed:", err);
    return res.status(500).json({ ok: false, error: "Failed to update scheduler pause state." });
  }
}
