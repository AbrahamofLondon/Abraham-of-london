// app/api/admin/intelligence-foundry/data-poisoning/run/route.ts
// Admin-only: run data-poisoning tests against a callable engine.
// Dry-run only. No records mutated. No production data touched.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";
import { DataPoisoningService } from "@/lib/research/data-poisoning/data-poisoning-service";
import { fastDiagnosticAdapter } from "@/lib/research/engines/fast-diagnostic-adapter";
import { patternRecurrenceAdapter } from "@/lib/research/engines/pattern-recurrence-adapter";
import { constitutionalDiagnosticAdapter } from "@/lib/research/engines/constitutional-diagnostic-adapter";
import { strategyRoomAdapter } from "@/lib/research/engines/strategy-room-adapter";
import { boardroomModeAdapter } from "@/lib/research/engines/boardroom-mode-adapter";
import { executiveReportingAdapter } from "@/lib/research/engines/executive-reporting-adapter";
import { executiveReportBoardroomBridgeAdapter } from "@/lib/research/engines/executive-report-boardroom-bridge-adapter";
import { costOfDelayAdapter } from "@/lib/research/engines/cost-of-delay-adapter";
import { cohortPrivacyAdapter } from "@/lib/research/engines/cohort-privacy-adapter";
import { editorialStyleCheckerAdapter } from "@/lib/research/engines/editorial-style-checker-adapter";
import { enforcementGatesAdapter } from "@/lib/research/engines/enforcement-gates-adapter";
import { outboundPolicyGateAdapter } from "@/lib/research/engines/outbound-policy-gate-adapter";
import { reportLineageAdapter } from "@/lib/research/engines/report-lineage-adapter";

const ADAPTERS: Record<string, { run(input: { payload: Record<string, unknown> }): Promise<unknown>; getVersion?(): unknown }> = {
  "fast-diagnostic": fastDiagnosticAdapter,
  "pattern-recurrence": patternRecurrenceAdapter,
  "constitutional-diagnostic": constitutionalDiagnosticAdapter,
  "strategy-room": strategyRoomAdapter,
  "boardroom-dossier": boardroomModeAdapter,
  "executive-reporting": executiveReportingAdapter,
  "executive-report-boardroom-bridge": executiveReportBoardroomBridgeAdapter,
  "cost-of-delay": costOfDelayAdapter,
  "cohort-privacy": cohortPrivacyAdapter,
  "editorial-style-checker": editorialStyleCheckerAdapter,
  "enforcement-gates": enforcementGatesAdapter,
  "outbound-policy-gate": outboundPolicyGateAdapter,
  "report-lineage": reportLineageAdapter,
};

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const engineId: string = body.engineId ?? "";

    if (!engineId) {
      return NextResponse.json({ ok: false, error: "engineId required" }, { status: 400 });
    }

    const engine = ENGINE_REGISTRY.find((e) => e.id === engineId);
    if (!engine) {
      return NextResponse.json({ ok: false, error: `Engine not found: ${engineId}` }, { status: 404 });
    }
    if (engine.status !== "PRODUCTION_CALLABLE") {
      return NextResponse.json(
        { ok: false, error: `Engine ${engineId} is ${engine.status} — data-poisoning tests require PRODUCTION_CALLABLE status` },
        { status: 400 },
      );
    }

    const adapter = ADAPTERS[engineId];
    if (!adapter) {
      return NextResponse.json(
        { ok: false, error: `No adapter registered for engine: ${engineId}` },
        { status: 400 },
      );
    }

    const result = await DataPoisoningService.runPoisonTests(engineId, adapter);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Data poisoning run failed" },
      { status: 500 },
    );
  }
}
