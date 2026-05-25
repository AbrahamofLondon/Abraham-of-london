// GET /api/admin/intelligence-foundry/modules
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { MODULE_REGISTRY } from "@/lib/research/module-registry";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    ok: true,
    modules: MODULE_REGISTRY,
    summary: {
      total: MODULE_REGISTRY.length,
      wired: MODULE_REGISTRY.filter((m) => m.status === "WIRED").length,
      partial: MODULE_REGISTRY.filter((m) => m.status === "PARTIAL").length,
      adapterNeeded: MODULE_REGISTRY.filter((m) => m.status === "ADAPTER_NEEDED").length,
      demo: MODULE_REGISTRY.filter((m) => m.status === "DEMO").length,
      planned: MODULE_REGISTRY.filter((m) => m.status === "PLANNED").length,
    },
  });
}
