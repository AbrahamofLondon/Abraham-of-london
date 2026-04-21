import { NextRequest, NextResponse } from "next/server";
import {
  recordJourneyEvent,
  type JourneyStage,
  type JourneyContext,
} from "@/lib/analytics/decision-journey";

const VALID_STAGES = new Set<JourneyStage>([
  "landing",
  "bundle_click",
  "diagnostic_start",
  "diagnostic_complete",
  "diagnostic_abandon",
  "team_mode_selected",
  "campaign_created",
  "first_respondent",
  "campaign_closed",
  "enterprise_complete",
  "exec_gate_view",
  "exec_purchase_start",
  "exec_purchase",
  "exec_run_start",
  "exec_report_generated",
  "watch_state",
  "watch_followup",
  "strategy_gate_view",
  "strategy_attempt",
  "strategy_allowed",
  "strategy_blocked",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, stage, context, userId } = body as {
      sessionId?: string;
      stage?: string;
      context?: JourneyContext;
      userId?: string;
    };

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    if (!stage || !VALID_STAGES.has(stage as JourneyStage)) {
      return NextResponse.json(
        { error: "Invalid or missing stage" },
        { status: 400 },
      );
    }

    const id = await recordJourneyEvent(
      sessionId,
      stage as JourneyStage,
      context,
      userId,
    );

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[journey-event]", err);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 },
    );
  }
}
