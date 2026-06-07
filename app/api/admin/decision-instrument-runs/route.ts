// app/api/admin/decision-instrument-runs/route.ts
//
// Admin visibility into all Decision Instrument runs.
// Supports filtering by user, instrument slug, status, and date range.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { prisma } from "@/lib/prisma.server";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const instrumentSlug = url.searchParams.get("instrumentSlug") ?? undefined;
  const userEmail = url.searchParams.get("userEmail") ?? undefined;
  const userId = url.searchParams.get("userId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;       // STARTED | COMPLETED | FAILED
  const artifactState = url.searchParams.get("artifactState") ?? undefined; // NONE | GENERATING | READY | ERROR
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 100;

  const where: Record<string, unknown> = {};
  if (instrumentSlug) where.instrumentSlug = instrumentSlug;
  if (userEmail)      where.userEmail = userEmail;
  if (userId)         where.userId = userId;
  if (status)         where.status = status;
  if (artifactState)  where.artifactState = artifactState;

  const runs = await prisma.decisionInstrumentRun.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      instrumentSlug: true,
      userId: true,
      userEmail: true,
      entitlementSlug: true,
      entitlementVerified: true,
      inputSnapshotHash: true,
      status: true,
      artifactState: true,
      artifactUrl: true,
      artifactHash: true,
      nextRouteSlug: true,
      runDurationMs: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const summary = {
    total: runs.length,
    completed: runs.filter((r) => r.status === "COMPLETED").length,
    failed: runs.filter((r) => r.status === "FAILED").length,
    started: runs.filter((r) => r.status === "STARTED").length,
    withArtifacts: runs.filter((r) => r.artifactState === "READY").length,
  };

  return NextResponse.json({
    ok: true,
    summary,
    runs: runs.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  });
}
