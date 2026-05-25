// POST /api/admin/intelligence-foundry/engines/fast-diagnostic/run
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { fastDiagnosticAdapter } from "@/lib/research/engines/fast-diagnostic-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const result = await fastDiagnosticAdapter.run(body);

    // Extract formula steps from rawOutput if present
    const formulaSteps =
      result.rawOutput && typeof result.rawOutput === "object" && "formulaSteps" in result.rawOutput
        ? (result.rawOutput as { formulaSteps: unknown }).formulaSteps
        : [];

    const raw = result.rawOutput as Record<string, unknown> | undefined;

    return NextResponse.json({
      ok: true,
      findings: result.findings,
      summary: result.summary,
      severity: result.severity,
      engineVersion: result.engineVersion,
      durationMs: result.durationMs,
      formulaSteps,
      limitations: result.limitations ?? [],
      promotionRequirements: result.promotionRequirements ?? [],
      productionFunctionsCalled: raw?.["productionFunctionsCalled"] ?? [],
      pipelineStagesNotCalled: raw?.["pipelineStagesNotCalled"] ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Engine run failed",
      },
      { status: 500 }
    );
  }
}
