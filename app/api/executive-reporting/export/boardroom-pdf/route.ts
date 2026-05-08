export const dynamic = "force-dynamic";
// app/api/executive-reporting/export/boardroom-pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";
import { qualifiesForBoardroom, generateBoardroomDossier } from "@/lib/constitution/boardroom-mode";

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function makeArtifactKey(): string {
  return `boardroom_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const runKey = s(body?.runKey);
    const email = s(body?.email).toLowerCase();

    if (!runKey || !email) {
      return NextResponse.json(
        { ok: false, error: "runKey and email are required." },
        { status: 400 },
      );
    }

    const run = await prisma.executiveReportingRun.findUnique({
      where: { runKey },
    });

    if (!run) {
      return NextResponse.json(
        { ok: false, error: "Executive reporting run not found." },
        { status: 404 },
      );
    }

    if (run.email !== email) {
      return NextResponse.json(
        { ok: false, error: "Run/email mismatch." },
        { status: 403 },
      );
    }

    const entitlements = await getExecutiveReportingEntitlements(email);

    if (!entitlements.canExportBoardroomPdf) {
      return NextResponse.json(
        { ok: false, error: "Boardroom PDF export is not enabled for this account." },
        { status: 403 },
      );
    }

    // ── Generate structured boardroom dossier from canonical data ──
    const canonicalSnapshot = run.canonicalSnapshot as Record<string, unknown> | null;
    const viewModelSnapshot = run.viewModelSnapshot as Record<string, unknown> | null;
    const spineForBoardroom = {
      costOfDelay: viewModelSnapshot?.costOfDelay ?? canonicalSnapshot?.costOfDelay ?? null,
      accuracy: viewModelSnapshot?.accuracy ?? canonicalSnapshot?.accuracy ?? null,
      synthesis: viewModelSnapshot?.synthesis ?? canonicalSnapshot?.synthesis ?? null,
      conditionClass: viewModelSnapshot?.conditionClass ?? canonicalSnapshot?.conditionClass ?? null,
      decisionText: viewModelSnapshot?.decisionText ?? canonicalSnapshot?.decisionText ?? null,
    } as any;

    const boardroomQualification = qualifiesForBoardroom(spineForBoardroom);
    const boardroomDossier = boardroomQualification.qualified
      ? generateBoardroomDossier(spineForBoardroom)
      : null;

    const existing = await prisma.executiveReportingArtifact.findFirst({
      where: {
        runId: run.id,
        kind: "boardroom-pdf",
        status: {
          in: ["queued", "ready"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        artifactKey: existing.artifactKey,
        fileName: existing.fileName,
        status: existing.status,
        message:
          existing.status === "ready"
            ? "Boardroom PDF already prepared."
            : "Boardroom PDF export already queued.",
      });
    }

    const artifact = await prisma.executiveReportingArtifact.create({
      data: {
        artifactKey: makeArtifactKey(),
        runId: run.id,
        kind: "boardroom-pdf",
        fileName: `boardroom-brief-${runKey}.pdf`,
        mimeType: "application/pdf",
        payload: {
          runKey,
          exportType: "boardroom-pdf",
          classification: "RESTRICTED",
          canonicalSnapshot: run.canonicalSnapshot,
          viewModelSnapshot: run.viewModelSnapshot,
          boardroomQualification: {
            qualified: boardroomQualification.qualified,
            reason: boardroomQualification.reason,
          },
          boardroomDossier: boardroomDossier ?? null,
        },
        status: "queued",
      },
    });

    return NextResponse.json({
      ok: true,
      artifactKey: artifact.artifactKey,
      fileName: artifact.fileName,
      status: artifact.status,
      message: "Boardroom PDF export queued.",
    });
  } catch (error) {
    console.error("[BOARDROOM_PDF_EXPORT_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to queue boardroom PDF export." },
      { status: 500 },
    );
  }
}