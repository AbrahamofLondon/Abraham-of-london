import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { createDecisionStakeholder } from "@/lib/enterprise-foundation/authority-foundation";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const decisionObjectId = new URL(req.url).searchParams.get("decisionObjectId");
  if (!decisionObjectId) {
    return NextResponse.json({ ok: false, error: "decisionObjectId is required" }, { status: 400 });
  }

  const stakeholders = await prisma.decisionStakeholder.findMany({
    where: { decisionObjectId },
    orderBy: [{ alignmentState: "asc" }, { influenceLevel: "desc" }],
    include: { positions: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json({ ok: true, stakeholders });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const stakeholder = await createDecisionStakeholder({
      decisionObjectId: String(body?.decisionObjectId || "").trim(),
      name: String(body?.name || "").trim(),
      role: String(body?.role || "").trim(),
      functionName: String(body?.function || body?.functionName || "").trim(),
      influenceLevel: String(body?.influenceLevel || "MEDIUM").trim(),
      alignmentState: String(body?.alignmentState || "UNKNOWN").trim(),
      positionSummary: typeof body?.positionSummary === "string" ? body.positionSummary : null,
      contradictionFlag: Boolean(body?.contradictionFlag),
      actorId: auth.userId,
    });
    return NextResponse.json({ ok: true, stakeholder });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create stakeholder" }, { status: 400 });
  }
}
