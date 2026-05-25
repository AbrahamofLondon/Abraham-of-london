// app/api/client/actions/[actionId]/route.ts
// Client-facing: update action item status. Scoped to own actions via token.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> },
) {
  try {
    const { actionId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ ok: false, error: "Token required" }, { status: 401 });

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await prisma.clientPortalSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { clientEmail: true },
    });
    if (!session) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 403 });

    const body = await request.json();
    const { status, outcomeNote } = body;

    if (!status) return NextResponse.json({ ok: false, error: "Status required" }, { status: 400 });

    const validStatuses = ["IN_PROGRESS", "ACTIONED", "DEFERRED", "WONT_ACT"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Verify ownership
    const action = await prisma.clientDecisionAction.findFirst({
      where: { id: actionId, clientEmail: session.clientEmail },
    });
    if (!action) return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });

    // Deferred requires reason
    if (status === "DEFERRED" && !outcomeNote) {
      return NextResponse.json({ ok: false, error: "Deferred requires a reason" }, { status: 400 });
    }

    await prisma.clientDecisionAction.update({
      where: { id: actionId },
      data: {
        status,
        outcomeNote: outcomeNote ?? null,
        actionedAt: status === "ACTIONED" ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    await routeGovernanceEvent({
      eventType: "FINDING_CREATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "FoundryFinding",
      canonicalRecordId: actionId,
      actorEmail: session.clientEmail,
      severity: "MEDIUM",
      payload: { actionStatus: status, actionId },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}
