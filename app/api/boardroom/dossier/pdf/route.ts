export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { buildBoardroomDossier } from "@/lib/boardroom/dossier-builder";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const organisationId = searchParams.get("organisationId");

    if (!organisationId) {
      return NextResponse.json(
        { ok: false, error: "organisationId query parameter is required" },
        { status: 400 },
      );
    }

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const period =
      fromParam && toParam
        ? { from: new Date(fromParam), to: new Date(toParam) }
        : undefined;

    // Load org name for cover page
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true },
    });

    if (!org) {
      return NextResponse.json(
        { ok: false, error: "Organisation not found" },
        { status: 404 },
      );
    }

    const dossier = await buildBoardroomDossier(organisationId, period);

    // Dynamic import to keep @react-pdf/renderer out of the module graph at load time
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { BoardroomDossierDocument } = await import("@/lib/boardroom/dossier-pdf");

    const documentElement = BoardroomDossierDocument({ dossier, organisationName: org.name });
    const pdfBuffer = await renderToBuffer(documentElement as ReactElement<DocumentProps>);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="boardroom-dossier-${organisationId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[BOARDROOM_DOSSIER_PDF_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
