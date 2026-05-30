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
    const [rawHealth, registrySanity] = await Promise.all([
      ResearchRunRepository.getDetailedHealth(),
      Promise.resolve(checkRegistrySanity()),
    ]);

    // Normalise response: map dormantModuleIds → dormantModules,
    // ensure all array fields have defaults to prevent client crashes.
    const health = {
      runsThisWeek: rawHealth.runsThisWeek ?? 0,
      runsThisMonth: rawHealth.runsThisMonth ?? 0,
      distinctActors: rawHealth.distinctActors ?? 0,
      actionConversionRate: rawHealth.actionConversionRate ?? 0,
      avgTimeToImplementDays: rawHealth.avgTimeToImplementDays ?? 0,
      criticalUnresolved: rawHealth.criticalUnresolved ?? 0,
      dormantModules: rawHealth.dormantModuleIds ?? [],
      redTeamConversionRate: rawHealth.redTeamConversionRate ?? 0,
      outboundBlockedCount: rawHealth.outboundBlockedCount ?? 0,
      overallStatus: rawHealth.overallStatus ?? "ok",
    };

    return NextResponse.json({ ok: true, health, registrySanity });
  } catch (error) {
    console.error("[FOUNDRY_HEALTH]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
