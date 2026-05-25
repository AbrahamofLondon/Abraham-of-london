// GET /api/admin/intelligence-foundry/trash-day
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const items = await ResearchRunRepository.getTrashDayQueue();
    return NextResponse.json({ ok: true, items, total: items.length });
  } catch (error) {
    console.error("[FOUNDRY_TRASH_DAY]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
