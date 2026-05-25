// app/api/admin/boardroom-delivery/tokens/[dossierId]/route.ts
// Admin-only: list all delivery tokens for a Boardroom Dossier.
// Includes revoked and expired tokens for audit visibility.
// Raw token values are never returned — only metadata.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dossierId: string }> },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { dossierId } = await params;
    const tokens = await BoardroomAccessTokenService.listAllTokens(dossierId);
    return NextResponse.json({ ok: true, tokens });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to list tokens" },
      { status: 500 },
    );
  }
}
