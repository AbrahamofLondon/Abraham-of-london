import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { propagateDecisionChange } from "@/lib/strategy-room/execution-feedback";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST  — Log a new decision
 * PATCH — Update decision status (pending → executed | blocked)
 */

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id: sessionId } = await ctx.params;
    const body = await req.json();
    const { decision, notes } = body;

    if (!decision || typeof decision !== "string") {
      return NextResponse.json(
        { error: "Decision text is required" },
        { status: 400 },
      );
    }

    // Verify session exists
    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const log = await prisma.strategyDecisionLog.create({
      data: {
        sessionId,
        decision,
        notes: notes ?? null,
        status: "pending",
      },
    });

    // Fire feedback loop (non-blocking)
    propagateDecisionChange(sessionId, "created", log.id).catch(() => {});

    return NextResponse.json({ ok: true, decision: log });
  } catch (err) {
    console.error("[decision-log-create]", err);
    return NextResponse.json(
      { error: "Failed to log decision" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id: sessionId } = await ctx.params;
    const body = await req.json();
    const { decisionId, status, notes } = body;

    if (!decisionId) {
      return NextResponse.json(
        { error: "decisionId is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["pending", "executed", "blocked"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const log = await prisma.strategyDecisionLog.update({
      where: { id: decisionId },
      data: updateData,
    });

    // Fire feedback loop (non-blocking)
    propagateDecisionChange(sessionId, "status_changed", decisionId).catch(() => {});

    return NextResponse.json({ ok: true, decision: log });
  } catch (err) {
    console.error("[decision-log-update]", err);
    return NextResponse.json(
      { error: "Failed to update decision" },
      { status: 500 },
    );
  }
}
