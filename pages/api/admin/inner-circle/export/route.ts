import { NextRequest, NextResponse } from "next/server";
import { getInnerCircleAccess } from "@/lib/inner-circle/access";
import { getPrivacySafeKeyExportWithRateLimit } from "@/lib/inner-circle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const access = await getInnerCircleAccess(req, { requireAuth: true, skipRateLimit: false });

  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Access Denied", message: "Admin access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "50");

  const { data, headers } = await getPrivacySafeKeyExportWithRateLimit({ page, limit }, "admin", req);

  const res = new NextResponse(JSON.stringify(data, null, 2), { status: 200 });
  res.headers.set("Content-Type", "application/json; charset=utf-8");
  res.headers.set("Content-Disposition", 'attachment; filename="inner-circle-export.json"');
  res.headers.set("Cache-Control", "no-store");

  for (const [k, v] of Object.entries(headers || {})) res.headers.set(k, v);

  return res;
}