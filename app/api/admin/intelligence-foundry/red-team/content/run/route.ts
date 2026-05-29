// app/api/admin/intelligence-foundry/red-team/content/run/route.ts
// Admin-only: run the Content Red-Team engine.
// Adversarial content analysis — no live calls, no production data touched.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { contentRedTeamAdapter } from "@/lib/research/engines/content-red-team-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));

    const result = await contentRedTeamAdapter.run({
      payload: body as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Content red-team run failed" },
      { status: 500 },
    );
  }
}
