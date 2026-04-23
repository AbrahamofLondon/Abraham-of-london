import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { createDecisionDependency, getDecisionImpactView } from "@/lib/enterprise-foundation/authority-foundation";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const decisionObjectId = new URL(req.url).searchParams.get("decisionObjectId");
  if (!decisionObjectId) {
    return NextResponse.json({ ok: false, error: "decisionObjectId is required" }, { status: 400 });
  }

  try {
    const impact = await getDecisionImpactView(decisionObjectId);
    return NextResponse.json({ ok: true, impact });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load impact view" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const dependency = await createDecisionDependency({
      parentDecisionId: String(body?.parentDecisionId || "").trim(),
      childDecisionId: String(body?.childDecisionId || "").trim(),
      relationshipType: String(body?.relationshipType || "").trim(),
      actorId: auth.userId,
    });
    return NextResponse.json({ ok: true, dependency });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create dependency" }, { status: 400 });
  }
}
