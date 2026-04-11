import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function makeArtifactKey(): string {
  return `intervention_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const runKey = s(body?.runKey);
    const email = s(body?.email).toLowerCase();
    const payload = body?.payload;

    if (!runKey || !email || !payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "runKey, email and payload are required." },
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
    if (!entitlements.canExportIntervention) {
      return NextResponse.json(
        { ok: false, error: "Intervention export is not enabled for this account." },
        { status: 403 },
      );
    }

    const artifact = await prisma.executiveReportingArtifact.create({
      data: {
        artifactKey: makeArtifactKey(),
        runId: run.id,
        kind: "intervention-export",
        fileName: `intervention-${runKey}.json`,
        mimeType: "application/json",
        payload,
        status: "authorized",
      },
    });

    return NextResponse.json({
      ok: true,
      artifactKey: artifact.artifactKey,
      fileName: artifact.fileName,
      status: artifact.status,
      payload,
      message: "Intervention artefact export authorized.",
    });
  } catch (error) {
    console.error("[INTERVENTION_EXPORT_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to authorize intervention export." },
      { status: 500 },
    );
  }
}