// app/api/admin/executive-report-delivery/revoke-link/route.ts
// Admin-only: revoke all active access tokens for a report.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { prisma } from "@/lib/prisma.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { z } from "zod";

const schema = z.object({ reportId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "reportId required" }, { status: 400 });

    const { reportId } = parsed.data;

    await prisma.executiveReportingArtifact.updateMany({
      where: { runId: reportId, kind: "ACCESS_TOKEN", status: "active" },
      data: { status: "revoked" },
    });

    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_REVOKED", sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport", canonicalRecordId: reportId,
      actorId: auth.email ?? undefined, severity: "HIGH",
      payload: { action: "admin-revoke" }, shouldWriteAudit: true, shouldWriteLineage: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Revoke failed" }, { status: 500 });
  }
}
