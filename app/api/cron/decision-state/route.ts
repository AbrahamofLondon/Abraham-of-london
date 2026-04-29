import { NextRequest, NextResponse } from "next/server";
import { runDecisionStateOrchestrator } from "@/lib/server/follow-up/decision-state-orchestrator.server";

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

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  try {
    const result = await runDecisionStateOrchestrator({ dryRun, limit: 200 });

    return NextResponse.json({
      ok: true,
      dryRun,
      ...result,
    });
  } catch (error) {
    console.error("[DECISION_STATE_CRON_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Orchestration failed" }, { status: 500 });
  }
}
