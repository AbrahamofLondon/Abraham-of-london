import { NextRequest, NextResponse } from "next/server";
import { runReturnBriefScan } from "@/lib/server/strategy-room/return-brief-trigger-engine.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/strategy-room/briefing/scan
 *
 * DEPRECATED: Independent return brief scanning is now handled by the
 * Decision State Orchestrator at /api/cron/decision-state.
 *
 * This endpoint is retained for manual/debug invocation but should not
 * be scheduled as a cron. The orchestrator enforces cooldown, prevents
 * duplicate messaging, and routes to the correct system based on state.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReturnBriefScan();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[RETURN_BRIEF_SCAN_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Scan failed" }, { status: 500 });
  }
}
