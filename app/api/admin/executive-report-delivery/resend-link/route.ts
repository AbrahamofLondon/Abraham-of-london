// app/api/admin/executive-report-delivery/resend-link/route.ts
// Admin-only: revoke old token, generate new token, email new secure link.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { prisma } from "@/lib/prisma.server";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { createHash, randomBytes } from "crypto";
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

    const run = await prisma.executiveReportingRun.findUnique({
      where: { id: reportId },
      select: { id: true, email: true },
    });
    if (!run) return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });

    // Revoke old tokens
    await prisma.executiveReportingArtifact.updateMany({
      where: { runId: reportId, kind: "ACCESS_TOKEN", status: "active" },
      data: { status: "revoked" },
    });

    // Generate new token
    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.executiveReportingArtifact.create({
      data: {
        artifactKey: `er-access-${reportId}-${Date.now()}`,
        runId: reportId,
        kind: "ACCESS_TOKEN",
        payload: { tokenHash: createHash("sha256").update(rawToken).digest("hex"), email: run.email, expiresAt: expiresAt.toISOString() } as any,
        status: "active",
      },
    });

    // Email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.com";
    const accessUrl = `${baseUrl}/client/reports/${reportId}?token=${encodeURIComponent(rawToken)}`;
    await sendEmail({
      type: "TRANSACTIONAL", to: run.email,
      subject: "Your Executive Report access link has been refreshed",
      html: `<p>Your access link has been refreshed.</p><a href="${accessUrl}">View Report</a>`,
      text: `Your access link has been refreshed: ${accessUrl}`,
      meta: { source: "admin-resend" },
    });

    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_DELIVERED", sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport", canonicalRecordId: reportId,
      actorId: auth.email ?? undefined, severity: "MEDIUM",
      payload: { action: "resend" }, shouldWriteAudit: true, shouldWriteLineage: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Resend failed" }, { status: 500 });
  }
}
