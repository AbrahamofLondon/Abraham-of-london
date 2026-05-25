// app/api/boardroom/dossier/[dossierId]/route.ts
// Client-facing: retrieve a Boardroom Dossier by ID.
//
// Access gate: requires a valid signed delivery token (?token=<raw>).
// Token is validated by SHA-256 hash comparison — raw token is never stored.
// Replaces legacy ?email= query-parameter access.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dossierId: string }> },
) {
  try {
    const { dossierId } = await params;
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      return NextResponse.json(
        { ok: false, error: "Access token required" },
        { status: 401 },
      );
    }

    // Validate token (hash comparison, expiry, revocation)
    const validation = await BoardroomAccessTokenService.validateToken(rawToken);

    if (!validation.valid) {
      const status = validation.reason === "NOT_FOUND" ? 403 : 403;
      const error =
        validation.reason === "REVOKED"
          ? "Access token has been revoked"
          : validation.reason === "EXPIRED"
          ? "Access token has expired"
          : "Access denied or dossier not found";
      return NextResponse.json({ ok: false, error }, { status });
    }

    const { tokenRecord } = validation;

    // Confirm the token is for the requested dossier
    if (tokenRecord.dossierId !== dossierId) {
      return NextResponse.json(
        { ok: false, error: "Access denied or dossier not found" },
        { status: 403 },
      );
    }

    const dossier = await BoardroomDossierService.getById(dossierId);
    if (!dossier) {
      return NextResponse.json(
        { ok: false, error: "Dossier not found" },
        { status: 404 },
      );
    }

    // Record view against both the token and the dossier
    await Promise.all([
      BoardroomAccessTokenService.recordTokenView(tokenRecord.id),
      BoardroomDossierService.recordView(dossierId),
    ]);

    return NextResponse.json({ ok: true, dossier });
  } catch (_err) {
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve dossier" },
      { status: 500 },
    );
  }
}
