// app/api/admin/retainer/oversight-cycles/[id]/route.ts
//
// Admin: manage a specific OversightReviewCycle (begin review, complete cycle, skip).

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { z } from "zod";
import {
  beginCycleReview,
  completeOversightCycle,
  skipCycle,
  OversightCycleError,
} from "@/lib/retainer/oversight-cycle-service";
import { generateMonthlyArtifact } from "@/lib/retainer/monthly-artifact-service";
import { prisma } from "@/lib/prisma.server";

// ─── GET — get a single cycle by ID ──────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const cycle = await prisma.oversightReviewCycle.findUnique({
    where: { id: params.id },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: `Cycle ${params.id} not found` }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    cycle: {
      id: cycle.id,
      contractId: cycle.contractId,
      cycleNumber: cycle.cycleNumber,
      status: cycle.status,
      periodStart: cycle.periodStart.toISOString(),
      periodEnd: cycle.periodEnd.toISOString(),
      clientHealthStatus: cycle.clientHealthStatus,
      driftScore: cycle.driftScore,
      driftCategory: cycle.driftCategory,
      interventionCount: cycle.interventionCount,
      interventionLog: cycle.interventionLog,
      outcomeSummary: cycle.outcomeSummary,
      clientNotes: cycle.clientNotes,
      internalNotes: cycle.internalNotes,
      reviewedBy: cycle.reviewedBy,
      reviewedAt: cycle.reviewedAt?.toISOString() ?? null,
      nextCycleDate: cycle.nextCycleDate?.toISOString() ?? null,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
    },
  });
}

// ─── PATCH — transition cycle state ──────────────────────────────────────────

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("begin_review"),
  }),
  z.object({
    action: z.literal("complete"),
    reviewedBy: z.string().min(1),
    driftScore: z.number().min(0).max(100),
    driftCategory: z.enum(["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"]),
    clientHealthStatus: z.enum(["HEALTHY", "WATCH", "DETERIORATING", "CRITICAL", "UNKNOWN"]),
    outcomeSummary: z.string().min(1),
    clientNotes: z.string().optional(),
    internalNotes: z.string().optional(),
    nextCycleDate: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("skip"),
    reason: z.string().min(1),
  }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "begin_review") {
      await beginCycleReview(params.id);
      return NextResponse.json({ ok: true, cycleId: params.id, status: "UNDER_REVIEW" });
    }

    if (parsed.data.action === "complete") {
      const d = parsed.data;
      await completeOversightCycle({
        runId: params.id,
        reviewedBy: d.reviewedBy,
        driftScore: d.driftScore,
        driftCategory: d.driftCategory,
        clientHealthStatus: d.clientHealthStatus,
        outcomeSummary: d.outcomeSummary,
        clientNotes: d.clientNotes,
        internalNotes: d.internalNotes,
        nextCycleDate: d.nextCycleDate ? new Date(d.nextCycleDate) : undefined,
      });

      // Generate monthly review artifact
      try {
        const cycle = await prisma.oversightReviewCycle.findUnique({
          where: { id: params.id },
          select: { contractId: true, interventionLog: true, outcomeSummary: true },
        });
        if (cycle) {
          const interventions = Array.isArray(cycle.interventionLog)
            ? (cycle.interventionLog as Array<{ interventionType: string; description: string; performedBy: string }>)
            : [];
          await generateMonthlyArtifact({
            cycleId: params.id,
            contractId: cycle.contractId,
            userEmail: auth.email ?? undefined,
            generatedBy: d.reviewedBy,
            decisionsReviewed: [],
            outcomesObserved: [],
            driftDetected: [],
            interventionsRecommended: interventions.map((i) => ({
              type: i.interventionType,
              description: i.description,
              owner: i.performedBy,
            })),
            nextReviewDate: d.nextCycleDate ? new Date(d.nextCycleDate) : new Date(Date.now() + 30 * 86400000),
          });
        }
      } catch (artifactErr) {
        console.error(`[oversight-cycle] Failed to generate monthly artifact for cycle ${params.id}:`, artifactErr);
        // Non-fatal — cycle is already completed
      }

      return NextResponse.json({ ok: true, cycleId: params.id, status: "COMPLETED" });
    }

    if (parsed.data.action === "skip") {
      await skipCycle(params.id, parsed.data.reason);
      return NextResponse.json({ ok: true, cycleId: params.id, status: "SKIPPED" });
    }
  } catch (err) {
    if (err instanceof OversightCycleError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
    }
    throw err;
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
