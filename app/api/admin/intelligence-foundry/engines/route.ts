// GET /api/admin/intelligence-foundry/engines
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    ok: true,
    engines: ENGINE_REGISTRY,
    summary: {
      total: ENGINE_REGISTRY.length,
      callable: ENGINE_REGISTRY.filter((e) => e.status === "PRODUCTION_CALLABLE").length,
      needsWrap: ENGINE_REGISTRY.filter((e) => e.status === "PRODUCTION_NEEDS_WRAP").length,
      documentationOnly: ENGINE_REGISTRY.filter((e) => e.status === "DOCUMENTATION_ONLY").length,
      humanProcess: ENGINE_REGISTRY.filter((e) => e.status === "HUMAN_PROCESS").length,
      decommissioned: ENGINE_REGISTRY.filter((e) => e.status === "DECOMMISSIONED").length,
    },
  });
}
