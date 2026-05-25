// app/api/admin/boardroom-delivery/generate-link/route.ts
// Admin-only: create a secure delivery token for a Boardroom Dossier.
//
// Returns the raw token exactly once — it is the caller's responsibility to
// transmit it to the client (e.g., embed in an email link). The raw token is
// never persisted; only its SHA-256 hash is stored.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { z } from "zod";

const generateLinkSchema = z.object({
  dossierId: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
  /** Expiry in days from now. Defaults to 7. Max 90. */
  expiryDays: z.number().int().min(1).max(90).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = generateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const result = await BoardroomAccessTokenService.createToken({
      dossierId: parsed.data.dossierId,
      clientEmail: parsed.data.clientEmail,
      clientName: parsed.data.clientName,
      expiryDays: parsed.data.expiryDays,
      createdBy: auth.email ?? "admin",
    });

    return NextResponse.json({
      ok: true,
      // Raw token returned exactly once — do not log or cache this response
      rawToken: result.rawToken,
      deliveryUrl: result.deliveryUrl,
      tokenRecord: result.record,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Token generation failed" },
      { status: 500 },
    );
  }
}
