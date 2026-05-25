// POST /api/admin/intelligence-foundry/engines/request-adapter
//
// Creates a ResearchRun of type ENGINE_TEST / status ACTION_REQUIRED
// for a PRODUCTION_NEEDS_WRAP engine.
//
// This run surfaces in:
//   - Research Run Vault (module: engine-testing-range)
//   - Trash Day queue (ACTION_REQUIRED, stale after 7 days)
//
// Constraints:
//   - Only allowed for PRODUCTION_NEEDS_WRAP and HUMAN_PROCESS engines
//   - Not allowed for DOCUMENTATION_ONLY or DECOMMISSIONED
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";

const ADAPTER_REQUEST_ALLOWED_STATUSES = ["PRODUCTION_NEEDS_WRAP", "HUMAN_PROCESS"] as const;

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const engineId: string = body.engineId ?? "";

    if (!engineId) {
      return NextResponse.json({ ok: false, error: "engineId is required" }, { status: 400 });
    }

    const engine = ENGINE_REGISTRY.find((e) => e.id === engineId);
    if (!engine) {
      return NextResponse.json({ ok: false, error: `Engine not found: ${engineId}` }, { status: 404 });
    }

    if (!ADAPTER_REQUEST_ALLOWED_STATUSES.includes(engine.status as (typeof ADAPTER_REQUEST_ALLOWED_STATUSES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: `Engine ${engineId} is ${engine.status}. Adapter requests are only allowed for PRODUCTION_NEEDS_WRAP or HUMAN_PROCESS engines.`,
        },
        { status: 400 }
      );
    }

    const slug = `adapter-request-${engineId}-${Date.now()}`;

    const run = await ResearchRunRepository.create({
      title: `Adapter required: ${engine.name}`,
      slug,
      runType: "ENGINE_TEST",
      module: "engine-testing-range",
      moduleVersion: "1.0.0",
      actorId: auth.userId ?? undefined,
      actorEmail: auth.email ?? undefined,
      status: "ACTION_REQUIRED",
      severity: "MEDIUM",
      recommendation: `Build Foundry adapter for ${engine.name} (${engineId}). Wrap production logic to capture version, timing, and structured findings as EngineRunOutput. Register adapter in ADAPTERS map in the performance/run route and engine-testing-range page.${engine.adapterRequired ? ` Required: ${engine.adapterRequired}` : ""}`,
      inputJson: JSON.stringify({ engineId, engineName: engine.name, engineStatus: engine.status }),
      outputJson: JSON.stringify({ requestedAt: new Date().toISOString(), requestedBy: auth.email ?? auth.userId ?? "unknown" }),
      findingsJson: JSON.stringify([
        {
          id: `adapter-request-${engineId}-${Date.now()}`,
          title: `Adapter required: ${engine.name}`,
          description: engine.limitationReason ?? `${engine.name} (${engineId}) is ${engine.status}. A Foundry adapter is needed to make this engine callable for structured benchmarking and research runs.`,
          severity: "MEDIUM",
          source: `engine-registry::${engineId}::status=${engine.status}`,
          evidence: engine.adapterRequired ?? `Engine status: ${engine.status}`,
          remediation: `Implement lib/research/engines/${engineId}-adapter.ts satisfying the EngineAdapter contract. Register in ENGINE_REGISTRY with status PRODUCTION_CALLABLE.`,
        },
      ]),
      engineVersionJson: JSON.stringify({ [engineId]: engine.version }),
      isDemo: false,
      requiresOwnerDecision: false,
      driftDetected: false,
      humanReviewRequired: false,
      schemaVersion: "1.0.0",
    });

    return NextResponse.json({ ok: true, run }, { status: 201 });
  } catch (err) {
    console.error("[ADAPTER_REQUEST_POST]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to create adapter request" },
      { status: 500 }
    );
  }
}
