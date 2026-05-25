// app/api/admin/boardroom-delivery/revoke-link/route.ts
// Admin-only: revoke a specific secure delivery token before expiry.
//
// Revocation is permanent — a revoked token cannot be reinstated.
// Emits BOARDROOM_SECURE_LINK_REVOKED governance event.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { z } from "zod";

const revokeLinkSchema = z.object({
  tokenId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = revokeLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const record = await BoardroomAccessTokenService.revokeToken(
      parsed.data.tokenId,
      auth.email ?? "admin",
    );

    return NextResponse.json({ ok: true, tokenRecord: record });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Token revocation failed" },
      { status: 500 },
    );
  }
}
