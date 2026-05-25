// POST /api/admin/intelligence-foundry/runs/[id]/replay
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

  try {
    const run = await ResearchRunRepository.replay(
      params.id,
      { id: auth.userId, email: auth.email ?? "" },
    );
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    console.error("[FOUNDRY_REPLAY]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
