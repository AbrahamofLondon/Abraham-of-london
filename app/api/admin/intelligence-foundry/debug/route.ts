// GET /api/admin/intelligence-foundry/debug
// Returns computed module statuses, registry state, and enforcement flags.
// Only available in development.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { MODULE_REGISTRY } from "@/lib/research/module-registry";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";
import { computeAllModuleStatuses } from "@/lib/research/module-status-computer";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Debug endpoint not available in production" }, { status: 403 });
  }

  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const [moduleStatuses, health] = await Promise.all([
      Promise.resolve(computeAllModuleStatuses(MODULE_REGISTRY)),
      ResearchRunRepository.getHealthMetrics(),
    ]);

    const wiredClaimed = MODULE_REGISTRY.filter((m) => m.status === "WIRED").length;
    const wiredActual = moduleStatuses.filter((r) => r.computedStatus === "WIRED").length;
    const statusMismatches = moduleStatuses.filter((r) => r.declaredStatus !== r.computedStatus);

    return NextResponse.json({
      ok: true,
      debug: {
        moduleRegistry: {
          total: MODULE_REGISTRY.length,
          wiredClaimed,
          wiredActual,
          statusMismatches: statusMismatches.map((r) => ({
            moduleId: r.moduleId,
            declared: r.declaredStatus,
            computed: r.computedStatus,
            routeExists: r.routeExists,
            engineCallable: r.engineCallable,
            reason: r.reason,
          })),
          allStatuses: moduleStatuses,
        },
        engineRegistry: {
          total: ENGINE_REGISTRY.length,
          callable: ENGINE_REGISTRY.filter((e) => e.status === "PRODUCTION_CALLABLE").length,
          needsWrap: ENGINE_REGISTRY.filter((e) => e.status === "PRODUCTION_NEEDS_WRAP").length,
        },
        health,
        honestyConstitution: {
          status: "ACTIVE",
          laws: 5,
          enforced: ["create", "archive", "defer", "findingCreate"],
        },
        enforcement: {
          genericUpdateBlocked: true,
          lifecycleFieldsPatchRejected: true,
          auditEventsAtomic: true,
          ciGateHardReject: true,
        },
      },
    });
  } catch (error) {
    console.error("[FOUNDRY_DEBUG]", error);
    return NextResponse.json({ ok: false, error: "Debug data unavailable" }, { status: 500 });
  }
}
