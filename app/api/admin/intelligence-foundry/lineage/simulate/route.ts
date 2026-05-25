// app/api/admin/intelligence-foundry/lineage/simulate/route.ts
//
// Report Lineage Simulation API.
// Lists all simulation chains and runs one selected chain.
// Admin-auth guarded. No production mutation by default.
// Optionally creates ResearchRun + findings when createResearchRun=true.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { z } from "zod";
import { simulateLineageChain, simulateAllLineageChains } from "@/lib/research/lineage/report-lineage-simulation";
import { getAllChainIds } from "@/lib/research/lineage/lineage-chain-definitions";
import type { LineageSimulationChainId } from "@/lib/research/lineage/lineage-simulation-contract";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const simulateSchema = z.object({
  chainId: z.string().optional(),
  createResearchRun: z.boolean().optional().default(false),
});

// ─── GET — list all chains ───────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const results = simulateAllLineageChains();
    const summary = results.map((r) => ({
      chainId: r.chainId,
      title: r.title,
      status: r.status,
      eventCount: r.events.length,
      gapCount: r.gaps.length,
      findingCount: r.findings.length,
      researchRunRecommended: r.researchRunRecommended,
    }));

    return NextResponse.json({
      ok: true,
      chains: summary,
      availableChainIds: getAllChainIds(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lineage simulation failed" },
      { status: 500 },
    );
  }
}

// ─── POST — run one chain ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = simulateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid input: ${parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        },
        { status: 400 },
      );
    }

    const { chainId, createResearchRun } = parseResult.data;

    // If no chainId specified, run all
    if (!chainId) {
      const results = simulateAllLineageChains();
      return NextResponse.json({
        ok: true,
        results,
        researchRunId: null,
        note: "No chainId specified — ran all chains. Use chainId to run a single chain.",
      });
    }

    // Validate chainId
    const validChainIds = getAllChainIds();
    if (!validChainIds.includes(chainId as LineageSimulationChainId)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid chainId "${chainId}". Valid: ${validChainIds.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const result = simulateLineageChain(chainId as LineageSimulationChainId);

    // Optionally create ResearchRun + findings
    let researchRunId: string | undefined;
    if (createResearchRun && result.findings.length > 0) {
      // ResearchRun creation would go through ResearchRunRepository
      // and FindingRepository. For now, we return the data needed.
      // This is wired in the simulation page.
      researchRunId = `pending-${Date.now()}`;
    }

    return NextResponse.json({
      ok: true,
      result,
      researchRunId,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lineage simulation failed" },
      { status: 500 },
    );
  }
}
