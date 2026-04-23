import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { recordEnforcementCycle } from "@/lib/retainers/retainer-service";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const retainedDecisionId = typeof body?.retainedDecisionId === "string" ? body.retainedDecisionId.trim() : "";

    if (!retainedDecisionId) {
      return NextResponse.json({ ok: false, error: "retainedDecisionId is required" }, { status: 400 });
    }

    const cycle = await recordEnforcementCycle({
      retainedDecisionId,
      cycleDate: body?.cycleDate ? new Date(String(body.cycleDate)) : undefined,
      actionsTaken: body?.actionsTaken ?? [],
      contradictionsUpdated: body?.contradictionsUpdated ?? [],
      outcomeDelta: typeof body?.outcomeDelta === "number" ? body.outcomeDelta : null,
      aiDriftDelta: typeof body?.aiDriftDelta === "number" ? body.aiDriftDelta : null,
      actorId: auth.userId,
    });

    return NextResponse.json({ ok: true, cycle });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to record enforcement cycle" },
      { status: 400 },
    );
  }
}
