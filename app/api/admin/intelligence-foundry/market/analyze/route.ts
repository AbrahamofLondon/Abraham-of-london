// app/api/admin/intelligence-foundry/market/analyze/route.ts
// Admin-only: run the Market Response engine against submitted copy.
// POST body: { text, platform, isHeadline, mode }
// Returns: { ok, result }

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { marketResponseAdapter } from "@/lib/research/engines/market-response-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await marketResponseAdapter.run({ payload: body });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Market response analysis failed" },
      { status: 500 },
    );
  }
}
