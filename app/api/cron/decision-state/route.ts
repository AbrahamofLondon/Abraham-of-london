import { NextRequest, NextResponse } from "next/server";
import { runDecisionStateOrchestrator } from "@/lib/server/follow-up/decision-state-orchestrator.server";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { failClosedForFlag, noStoreJson } from "@/lib/server/security/app-route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cron/decision-state
 *
 * The single controlling cron for all user contact decisions.
 * Replaces independent sends from pressure loop, escalation engine,
 * and return brief scan.
 *
 * Schedule: every 12 hours (recommended)
 * Guard: CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  const lockdown = failClosedForFlag({
    flag: "DISABLE_EMAIL_SENDS",
    action: "cron_error",
    route: "/api/cron/decision-state",
    publicMessage: "SYSTEM_TEMPORARILY_DISABLED",
  });
  if (!lockdown.ok) return lockdown.response;

  if (!cronSecret) {
    return noStoreJson({ ok: false, error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    await writeSecurityAudit({
      action: "invalid_token",
      severity: "warn",
      status: "BLOCKED",
      resourceId: "/api/cron/decision-state",
    });
    return noStoreJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  try {
    await writeSecurityAudit({
      action: "cron_started",
      status: "SUCCESS",
      resourceId: "/api/cron/decision-state",
      metadata: { dryRun },
    });
    const result = await runDecisionStateOrchestrator({ dryRun, limit: 200 });

    await writeSecurityAudit({
      action: "cron_completed",
      status: "SUCCESS",
      resourceId: "/api/cron/decision-state",
      metadata: { dryRun, scanned: result.scanned, triggered: result.triggered, errors: result.errors },
    });

    return noStoreJson({
      ok: true,
      dryRun,
      ...result,
    });
  } catch (error) {
    await writeSecurityAudit({
      action: "cron_error",
      severity: "error",
      status: "FAILED",
      resourceId: "/api/cron/decision-state",
      errorMessage: error instanceof Error ? error.message : "Orchestration failed",
      metadata: { dryRun },
    });
    return noStoreJson({ ok: false, error: "Orchestration failed" }, { status: 500 });
  }
}
