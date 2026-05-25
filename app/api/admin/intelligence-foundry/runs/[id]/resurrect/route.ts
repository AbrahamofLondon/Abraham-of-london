// POST /api/admin/intelligence-foundry/runs/[id]/resurrect
// OWNER-only: resurrect an archived run into a new linked record.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  if (!(auth.access as any)?.permissions?.isOwner) {
    return NextResponse.json({ ok: false, error: "Owner access required to resurrect runs" }, { status: 403 });
  }

  try {
    const run = await ResearchRunRepository.resurrect(
      params.id,
      { id: auth.userId, email: auth.email ?? "" },
    );
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    if (msg.includes("not archived")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 409 });
    }
    console.error("[FOUNDRY_RESURRECT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
