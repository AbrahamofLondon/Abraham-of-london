// app/api/admin/intelligence-foundry/content/analyze/route.ts
// Admin-only: run the Editorial Style Checker engine.
// POST body: { text?, title?, contentType?, useCleanFixture?, useDirtyFixture? }
// Returns: { ok, result }

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { editorialStyleCheckerAdapter } from "@/lib/research/engines/editorial-style-checker-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await editorialStyleCheckerAdapter.run({ payload: body });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Editorial style check failed" },
      { status: 500 },
    );
  }
}
