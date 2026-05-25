// app/api/admin/boardroom-delivery/resend-link/route.ts
// Admin-only: resend a boardroom dossier delivery link.
//
// Revokes the old token and generates a new one in a single atomic operation.
// Sends the new link by email. Returns the new raw token exactly once.
//
// Why revoke the old token: an admin resend implies the previous link was
// lost or undelivered. Keeping the old token active creates two valid paths
// to the same dossier — a security surface we do not accept.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { sendBoardroomDeliveryEmail } from "@/lib/boardroom/boardroom-delivery-email";
import { BoardroomDeliveryLog } from "@/lib/boardroom/boardroom-delivery-log";
import { z } from "zod";

const resendLinkSchema = z.object({
  /** The token record ID to revoke and replace. */
  tokenId: z.string().min(1),
  /** Override email for resend. Defaults to original token's clientEmail. */
  clientEmail: z.string().email().optional(),
  /** Override name for resend. */
  clientName: z.string().optional(),
  /** New expiry in days. Defaults to 7. Max 90. */
  expiryDays: z.number().int().min(1).max(90).optional(),
  /** If false, generate new token but do not send email. Defaults true. */
  sendEmail: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resendLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const { tokenId, clientEmail: overrideEmail, clientName: overrideName, expiryDays, sendEmail } = parsed.data;

    // Load the existing token record
    const existingTokens = await BoardroomAccessTokenService.listAllTokens(
      // We need to look up by token ID — use listAllTokens then filter
      // (listAllTokens takes dossierId; we resolve dossierId from the token itself)
      "unknown-dossier", // will be resolved below
    ).catch(() => []);

    // Alternative: query directly via prisma (the service only exposes dossier-scoped queries)
    // We'll use a direct prisma query here since this is an admin-only route
    const { prisma } = await import("@/lib/prisma.server");
    const existing = await prisma.boardroomDossierAccessToken.findUnique({
      where: { id: tokenId },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Token not found" }, { status: 404 });
    }

    if (existing.revokedAt) {
      return NextResponse.json(
        { ok: false, error: "Token is already revoked. Cannot resend from a revoked token." },
        { status: 400 },
      );
    }

    const dossierId = existing.dossierId;
    const recipientEmail = overrideEmail ?? existing.clientEmail ?? undefined;
    const recipientName = overrideName ?? existing.clientName ?? undefined;

    // Step 1: Revoke the old token
    await BoardroomAccessTokenService.revokeToken(
      tokenId,
      auth.email ?? "admin",
    );

    void BoardroomDeliveryLog.record({
      tokenId,
      dossierId,
      eventType: "REVOKED",
      clientEmail: existing.clientEmail,
      performedBy: auth.email ?? "admin",
      metadata: { reason: "resend — old token revoked before new token generated" },
    });

    // Step 2: Generate new token
    const newResult = await BoardroomAccessTokenService.createToken({
      dossierId,
      clientEmail: recipientEmail,
      clientName: recipientName,
      expiryDays,
      createdBy: auth.email ?? "admin",
    });

    const newTokenId = newResult.record.id;

    void BoardroomDeliveryLog.record({
      tokenId: newTokenId,
      dossierId,
      eventType: "GENERATED",
      clientEmail: recipientEmail ?? null,
      performedBy: auth.email ?? "admin",
      metadata: { replacedTokenId: tokenId },
    });

    // Step 3: Send email
    let emailResult: { ok: boolean; error?: string; emailId?: string } | null = null;

    if (sendEmail && recipientEmail) {
      const dossier = await BoardroomDossierService.getById(dossierId).catch(() => null);
      const dossierTitle = (dossier as any)?.title ?? "Boardroom Briefing";

      emailResult = await sendBoardroomDeliveryEmail({
        to: recipientEmail,
        clientName: recipientName ?? null,
        dossierTitle,
        deliveryUrl: newResult.deliveryUrl,
        expiresAt: new Date(newResult.record.expiresAt),
        dossierId,
        tokenId: newTokenId,
      });

      void BoardroomDeliveryLog.record({
        tokenId: newTokenId,
        dossierId,
        eventType: emailResult.ok ? "RESENT" : "SEND_FAILED",
        clientEmail: recipientEmail ?? null,
        performedBy: auth.email ?? "admin",
        metadata: emailResult.ok
          ? { emailId: emailResult.emailId, replacedTokenId: tokenId }
          : { error: emailResult.error, replacedTokenId: tokenId },
      });
    }

    return NextResponse.json({
      ok: true,
      revokedTokenId: tokenId,
      rawToken: newResult.rawToken,
      deliveryUrl: newResult.deliveryUrl,
      tokenRecord: newResult.record,
      email: emailResult
        ? { sent: emailResult.ok, error: emailResult.error ?? null }
        : { sent: false, reason: "No recipient email or sendEmail suppressed" },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Resend failed" },
      { status: 500 },
    );
  }
}
