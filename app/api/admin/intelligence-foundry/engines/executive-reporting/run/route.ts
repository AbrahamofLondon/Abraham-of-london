// app/api/admin/intelligence-foundry/engines/executive-reporting/run/route.ts
//
// Foundry dry-run for the Executive Reporting engine.
// Calls buildExecutiveReport() only — wraps resonance derivation, HCD analysis,
// OGR manifest computation, state classification, financial exposure, and narrative.
// Does NOT call executive-report-service.ts (DB-bound).
// Does NOT persist executive reports or emit lineage events.
// Admin-auth guarded.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  executiveReportingAdapter,
  ER_ENGINE_ID,
  ER_VERSION,
} from "@/lib/research/engines/executive-reporting-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await executiveReportingAdapter.run({ payload: body ?? {} });

    const rawOutput = (result.rawOutput ?? {}) as Record<string, unknown>;
    const report = rawOutput.report as Record<string, unknown> | undefined;

    return NextResponse.json({
      ok: true,
      engineId: ER_ENGINE_ID,
      engineVersion: ER_VERSION,
      runAt: rawOutput.runAt ?? new Date().toISOString(),
      durationMs: result.durationMs,
      summary: result.summary,
      severity: result.severity,
      state: report?.state ?? null,
      narrative: report?.narrative ?? null,
      ogr: report?.ogr ?? null,
      resonance: report?.resonance ?? null,
      hcdAggregate: report?.hcdAggregate ?? null,
      hcd: report?.hcd ?? null,
      financialExposure: report?.financialExposure ?? null,
      priorityStack: report?.priorityStack ?? [],
      failureModes: report?.failureModes ?? [],
      findings: result.findings,
      formulaSteps: rawOutput.formulaSteps ?? [],
      limitations: result.limitations ?? [],
      promotionRequirements: result.promotionRequirements ?? [],
      productionFunctionsCalled: rawOutput.productionFunctionsCalled ?? [],
      pipelineStagesNotCalled: rawOutput.pipelineStagesNotCalled ?? [],
      fixtureKey: rawOutput.fixtureKey ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Executive Reporting run failed",
      },
      { status: 500 },
    );
  }
}
