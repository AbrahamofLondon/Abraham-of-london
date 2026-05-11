export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { computeBenchmarkReport, getCommonsSize } from "@/lib/sovereign/intelligence-commons";

function num(v: unknown, fallback = 50): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * POST /api/sovereign/commons/benchmark
 *
 * Computes percentile positions for a given score set against the
 * Intelligence Commons dataset. Falls back to theoretically-grounded
 * bootstrap distributions when empirical data is below threshold.
 *
 * Every score in the diagnostic now renders with a percentile position.
 * This is the "two-day engineering task" the brief identifies as the
 * minimum viable version of the Intelligence Commons.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const revenueBand = typeof body.revenueBand === "string" ? body.revenueBand : "SMB";
    const orgState = typeof body.orgState === "string" ? body.orgState : "STABLE";

    const report = computeBenchmarkReport({
      authorityClarity: num(body.authorityClarity),
      narrativeCoherence: num(body.narrativeCoherence),
      interventionReadiness: num(body.interventionReadiness),
      executionReadiness: num(body.executionReadiness),
      revenueBand,
      orgState,
    });

    const commonsSize = getCommonsSize({ revenueBand });

    return NextResponse.json({
      ok: true,
      benchmarks: report,
      cohortKey: `${revenueBand}.${orgState}`,
      commonsSize,
      dataSource: commonsSize >= 20 ? "EMPIRICAL" : "THEORETICAL",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to compute benchmarks" },
      { status: 500 },
    );
  }
}
