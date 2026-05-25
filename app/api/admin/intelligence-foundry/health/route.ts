// GET /api/admin/intelligence-foundry/health
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const health = await ResearchRunRepository.getDetailedHealth();
    return NextResponse.json({ ok: true, health });
  } catch (error) {
    console.error("[FOUNDRY_HEALTH]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
