// app/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run/route.ts
//
// Foundry dry-run for the ER → Boardroom Bridge adapter.
// Proves the governed escalation path:
//   Executive Reporting output → IntelligenceSpine transformation → Boardroom qualification gate
//
// Does NOT render PDF. Does NOT persist customer artefacts.
// Does NOT call executive-report-service.ts (DB-bound).
// Admin-auth guarded.
//
// Supports ResearchRun save if the current pattern supports it.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  executiveReportBoardroomBridgeAdapter,
  BRIDGE_ENGINE_ID,
  BRIDGE_VERSION,
} from "@/lib/research/engines/executive-report-boardroom-bridge-adapter";
import { z } from "zod";

// ─── Input validation ─────────────────────────────────────────────────────────

const bridgeApiSchema = z.object({
  useDisorderedFixture: z.boolean().optional(),
  useMisalignedFixture: z.boolean().optional(),
  useOrderedFixture: z.boolean().optional(),
  useMappingGapFixture: z.boolean().optional(),
  useMalformedFixture: z.boolean().optional(),
  scenarioLabel: z.string().optional(),
});

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));

    // Validate input
    const parseResult = bridgeApiSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid input: ${parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        },
        { status: 400 },
      );
    }

    const result = await executiveReportBoardroomBridgeAdapter.run({ payload: body ?? {} });

    const rawOutput = (result.rawOutput ?? {}) as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown> | undefined;

    return NextResponse.json({
      ok: true,
      engineId: BRIDGE_ENGINE_ID,
      engineVersion: BRIDGE_VERSION,
      runAt: rawOutput.runAt ?? new Date().toISOString(),
      durationMs: result.durationMs,
      summary: result.summary,
      severity: result.severity,
      bridgeDecision: bridgeOutput?.bridgeDecision ?? null,
      qualifiesForBoardroom: bridgeOutput?.qualifiesForBoardroom ?? false,
      executiveReport: bridgeOutput?.executiveReport ?? null,
      mappedSpine: bridgeOutput?.mappedSpine ?? null,
      boardroomResult: bridgeOutput?.boardroomResult ?? null,
      mappingTrace: bridgeOutput?.mappingTrace ?? [],
      mappingGaps: bridgeOutput?.mappingGaps ?? [],
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
        error: err instanceof Error ? err.message : "ER → Boardroom Bridge run failed",
      },
      { status: 500 },
    );
  }
}
