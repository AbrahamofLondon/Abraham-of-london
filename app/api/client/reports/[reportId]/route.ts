// app/api/client/reports/[reportId]/route.ts
// Client-facing: retrieve an Executive Report by ID with token auth.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { reportId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Access token required" }, { status: 401 });
    }

    // Hash the token and look up the artifact
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const artifact = await prisma.executiveReportingArtifact.findFirst({
      where: {
        runId: reportId,
        kind: "ACCESS_TOKEN",
        status: "active",
      },
      select: { payload: true },
    });

    if (!artifact) {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }

    const payload = artifact.payload as Record<string, unknown> | undefined;
    if (!payload || payload.tokenHash !== tokenHash) {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }

    // Check expiry
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt as string) : null;
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "Link expired" }, { status: 410 });
    }

    // Fetch the report
    const run = await prisma.executiveReportingRun.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        canonicalSnapshot: true,
      },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
    }

    const snapshot = run.canonicalSnapshot as Record<string, unknown> | null;
    if (!snapshot) {
      return NextResponse.json({ ok: false, error: "Report data unavailable" }, { status: 500 });
    }

    // Record view
    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_VIEWED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      canonicalRecordId: reportId,
      severity: "LOW",
      payload: { viewedAt: new Date().toISOString() },
      shouldWriteAudit: false,
      shouldWriteLineage: true,
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: run.id,
        state: snapshot.state,
        narrative: snapshot.narrative,
        financialExposure: snapshot.financialExposure,
        priorityStack: snapshot.priorityStack,
        failureModes: snapshot.failureModes,
        ogr: snapshot.ogr,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to retrieve report" }, { status: 500 });
  }
}
