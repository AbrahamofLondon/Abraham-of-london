// app/api/client/portal/route.ts
// Client Portal API — returns client's reports, dossiers, and action items.
// Authenticated via magic-link token.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token required" }, { status: 401 });
  }

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const session = await prisma.clientPortalSession.findFirst({
      where: { tokenHash, revokedAt: null },
      select: { id: true, clientEmail: true, expiresAt: true, useCount: true },
    });

    if (!session) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 403 });
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "Session expired" }, { status: 410 });
    }

    const email = session.clientEmail;

    // Fetch reports
    const reports = await prisma.executiveReportingRun.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, canonicalSnapshot: true, createdAt: true },
      take: 20,
    });

    // Fetch dossiers
    const dossiers = await prisma.boardroomDossier.findMany({
      where: { clientEmail: email },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, createdAt: true },
      take: 20,
    });

    // Fetch action items
    const actions = await prisma.clientDecisionAction.findMany({
      where: { clientEmail: email },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    // Update use count
    await prisma.clientPortalSession.update({
      where: { id: session.id },
      data: { useCount: session.useCount + 1, lastUsedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      email,
      reports: reports.map((r) => ({
        id: r.id,
        status: r.status,
        state: (r.canonicalSnapshot as Record<string, unknown> | null)?.state ?? "unknown",
        createdAt: r.createdAt.toISOString(),
      })),
      dossiers: dossiers.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
      actions: actions.map((a) => ({
        id: a.id,
        findingTitle: a.findingTitle,
        severity: a.severity,
        status: a.status,
        recommendedAction: a.recommendedAction,
        dueDate: a.dueDate?.toISOString() ?? null,
        outcomeNote: a.outcomeNote,
      })),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Portal error" }, { status: 500 });
  }
}
