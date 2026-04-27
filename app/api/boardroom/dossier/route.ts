export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
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

    const dossier = await buildBoardroomDossier(organisationId, period);

    return NextResponse.json({ ok: true, dossier });
  } catch (error) {
    console.error("[BOARDROOM_DOSSIER_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build dossier" },
      { status: 500 },
    );
  }
}
