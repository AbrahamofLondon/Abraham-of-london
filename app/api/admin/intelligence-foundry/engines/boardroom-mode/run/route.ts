// app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts
//
// Foundry dry-run for the Boardroom Mode engine.
// Calls qualifiesForBoardroom() + generateBoardroomDossier() only.
// Does NOT render PDF. Does NOT persist customer artefacts.
// Admin-auth guarded.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { boardroomDossierAdapter as boardroomModeAdapter, BOARDROOM_ENGINE_ID, BOARDROOM_VERSION } from "@/lib/research/engines/boardroom-dossier-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await boardroomModeAdapter.run({ payload: body ?? {} });

    const rawOutput = (result.rawOutput ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      engineId: BOARDROOM_ENGINE_ID,
      engineVersion: BOARDROOM_VERSION,
      runAt: rawOutput.runAt ?? new Date().toISOString(),
      durationMs: result.durationMs,
      summary: result.summary,
      qualification: rawOutput.qualification ?? null,
      dossier: rawOutput.dossier ?? null,
      findings: result.findings,
      formulaSteps: rawOutput.formulaSteps ?? [],
      limitations: result.limitations ?? [],
      promotionRequirements: result.promotionRequirements ?? [],
      productionFunctionsCalled: rawOutput.productionFunctionsCalled ?? [],
      pipelineStagesNotCalled: rawOutput.pipelineStagesNotCalled ?? [],
      conditionClass: rawOutput.conditionClass ?? null,
      estimatedMonthlyCost: rawOutput.estimatedMonthlyCost ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Boardroom run failed" },
      { status: 500 },
    );
  }
}
