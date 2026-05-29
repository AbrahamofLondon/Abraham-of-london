// app/api/admin/intelligence-foundry/red-team/security/run/route.ts
// Admin-only: run the Security Red-Team engine.
// Static analysis — no live HTTP probing, no production data touched.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { securityRedTeamAdapter } from "@/lib/research/engines/security-red-team-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));

    const result = await securityRedTeamAdapter.run({
      payload: body as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Security red-team run failed" },
      { status: 500 },
    );
  }
}
