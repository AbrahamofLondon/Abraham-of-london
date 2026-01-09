// app/api/inner-circle/admin/export/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    // 1) Auth gate (MUST return Response on fail)
    const token = req.cookies.get("admin_session")?.value;
    if (!token) return jsonErr("Unauthorized", 401);

    // 2) Do the work safely
    // Example: if calling any upstream fetch, do not allow undefined response
    // const r = await fetch(...); if (!r.ok) return jsonErr("Upstream error", 502);

    // 3) Return real response
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[ExportRoute] Error:", e);
    return jsonErr("Internal server error", 500);
  }
}