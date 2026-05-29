// app/api/admin/intelligence-foundry/outbound/analyze/route.ts
// Admin-only: run the Outbound Policy Gate engine.
// POST body: { text?, title?, link?, provider?, maxChars?, useSafeFixture?, useFailingFixture? }
// Returns: { ok, result }

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { outboundPolicyGateAdapter } from "@/lib/research/engines/outbound-policy-gate-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await outboundPolicyGateAdapter.run({ payload: body });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Outbound policy gate check failed" },
      { status: 500 },
    );
  }
}
