// GET /api/admin/intelligence-foundry/health
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { checkRegistrySanity } from "@/lib/research/registry-sanity-check";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const [health, registrySanity] = await Promise.all([
      ResearchRunRepository.getDetailedHealth(),
      Promise.resolve(checkRegistrySanity()),
    ]);
    return NextResponse.json({ ok: true, health, registrySanity });
  } catch (error) {
    console.error("[FOUNDRY_HEALTH]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
