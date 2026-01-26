// app/api/inner-circle/admin/export/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(message: string, status = 500) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!token) return jsonErr("Unauthorized", 401);

    // TODO: verify token properly (DB/session store), otherwise anyone with any cookie value gets in.
    // For now: explicit stub response.
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[ExportRoute] Error:", e);
    return jsonErr("Internal server error", 500);
  }
}