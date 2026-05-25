// POST /api/admin/intelligence-foundry/engines/strategy-room/run
//
// Runs the Strategy Room dry-run adapter in a Foundry context.
// Calls real intake scoring and gate evaluation logic.
// Does NOT archive the intake, send notifications, or verify reCAPTCHA.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { strategyRoomAdapter } from "@/lib/research/engines/strategy-room-adapter";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const result = await strategyRoomAdapter.run({ payload: body });

    const raw = result.rawOutput as Record<string, unknown> | undefined;

    return NextResponse.json({
      ok: true,
      findings: result.findings,
      summary: result.summary,
      severity: result.severity,
      engineVersion: result.engineVersion,
      durationMs: result.durationMs,
      limitations: result.limitations ?? [],
      promotionRequirements: result.promotionRequirements ?? [],
      productionFunctionsCalled: raw?.["productionFunctionsCalled"] ?? [],
      pipelineStagesNotCalled: raw?.["pipelineStagesNotCalled"] ?? [],
      formulaSteps: raw?.["formulaSteps"] ?? [],
      score: raw?.["score"] ?? null,
      evaluationStatus: raw?.["evaluationStatus"] ?? null,
      directiveLevel: raw?.["directiveLevel"] ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Strategy Room engine run failed",
      },
      { status: 500 }
    );
  }
}
