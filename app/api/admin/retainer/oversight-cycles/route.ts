// app/api/admin/retainer/oversight-cycles/route.ts
//
// Admin: list and create OversightReviewCycles.
//
// AUTHORITY RULES:
//   - Admin-only — not self-serve.
//   - Retainer Oversight is NEVER automatically activated from payment alone.
//   - Cycles are created by operator decision, not by client request.
//   - Every cycle must link to a real contractId.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { z } from "zod";
import {
  createOversightCycle,
  getCyclesForContract,
  OversightCycleError,
} from "@/lib/retainer/oversight-cycle-service";

// ─── GET — list cycles for a contract ────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const contractId = url.searchParams.get("contractId");

  if (!contractId) {
    return NextResponse.json(
      { ok: false, error: "contractId query parameter is required" },
      { status: 400 },
    );
  }

  const cycles = await getCyclesForContract(contractId);

  return NextResponse.json({
    ok: true,
    contractId,
    cycleCount: cycles.length,
    cycles: cycles.map((c) => ({
      id: c.id,
      cycleNumber: c.cycleNumber,
      status: c.status,
      periodStart: c.periodStart.toISOString(),
      periodEnd: c.periodEnd.toISOString(),
      clientHealthStatus: c.clientHealthStatus,
      driftScore: c.driftScore,
      driftCategory: c.driftCategory,
      interventionCount: c.interventionCount,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt?.toISOString() ?? null,
      nextCycleDate: c.nextCycleDate?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// ─── POST — create a new oversight cycle (admin-only) ────────────────────────

const createCycleSchema = z.object({
  contractId: z.string().min(1),
  cycleNumber: z.number().int().positive(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  nextCycleDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const { contractId, cycleNumber, periodStart, periodEnd, nextCycleDate } = parsed.data;

  try {
    const cycle = await createOversightCycle({
      contractId,
      cycleNumber,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      nextCycleDate: nextCycleDate ? new Date(nextCycleDate) : undefined,
    });

    return NextResponse.json(
      {
        ok: true,
        cycleId: cycle.id,
        contractId: cycle.contractId,
        cycleNumber: cycle.cycleNumber,
        status: cycle.status,
        periodStart: cycle.periodStart.toISOString(),
        periodEnd: cycle.periodEnd.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OversightCycleError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
    }
    throw err;
  }
}
