import { NextRequest, NextResponse } from "next/server";
import { buildExecutiveSnapshot } from "@/lib/executive/snapshot";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/executive/snapshot?organisationId=...
 *
 * Returns compressed executive view for rapid risk review.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAppRoute();
    if (!auth.authorized) return auth.response;

    const organisationId = new URL(req.url).searchParams.get("organisationId");
    if (!organisationId) {
      return NextResponse.json({ ok: false, error: "organisationId is required" }, { status: 400 });
    }

    const snapshot = await buildExecutiveSnapshot(organisationId);

    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    console.error("[executive-snapshot]", err);
    return NextResponse.json({ error: "Failed to build executive snapshot" }, { status: 500 });
  }
}
