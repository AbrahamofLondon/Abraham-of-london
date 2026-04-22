import { NextRequest, NextResponse } from "next/server";
import {
  recordJourneyEvent,
  type JourneyStage,
  type JourneyContext,
} from "@/lib/analytics/decision-journey";

// Accept any non-empty string as stage — the JourneyStage type union is
// enforced at the client. Server persists all events for behavioural analysis.
function isValidStage(stage: unknown): stage is JourneyStage {
  return typeof stage === "string" && stage.length > 0 && stage.length < 100;
}

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

    if (!stage || !isValidStage(stage)) {
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
