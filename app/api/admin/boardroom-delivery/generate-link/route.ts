// app/api/admin/boardroom-delivery/generate-link/route.ts
// Admin-only: create a secure delivery token for a Boardroom Dossier.
//
// After generating the token:
//   1. If clientEmail provided → sends delivery email immediately.
//   2. Logs GENERATED event (always) and SENT / SEND_FAILED event.
//
// The raw token is returned exactly once to the admin caller — embed in the
// email URL. It is never persisted; only the SHA-256 hash is stored.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { sendBoardroomDeliveryEmail } from "@/lib/boardroom/boardroom-delivery-email";
import { BoardroomDeliveryLog } from "@/lib/boardroom/boardroom-delivery-log";
import { z } from "zod";

const generateLinkSchema = z.object({
  dossierId: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
  /** Expiry in days from now. Defaults to 7. Max 90. */
  expiryDays: z.number().int().min(1).max(90).optional(),
  /** If true, send delivery email automatically when clientEmail is provided. Defaults true. */
  sendEmail: z.boolean().optional().default(true),
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

    const { dossierId, clientEmail, clientName, expiryDays, sendEmail } = parsed.data;

    // Generate token
    const result = await BoardroomAccessTokenService.createToken({
      dossierId,
      clientEmail,
      clientName,
      expiryDays,
      createdBy: auth.email ?? "admin",
    });

    const tokenId = result.record.id;

    // Log GENERATED event
    void BoardroomDeliveryLog.record({
      tokenId,
      dossierId,
      eventType: "GENERATED",
      clientEmail: clientEmail ?? null,
      performedBy: auth.email ?? "admin",
    });

    // Send email if clientEmail provided and sendEmail not suppressed
    let emailResult: { ok: boolean; error?: string; emailId?: string } | null = null;

    if (sendEmail && clientEmail) {
      // Fetch dossier title for email
      const dossier = await BoardroomDossierService.getById(dossierId).catch(() => null);
      const dossierTitle = (dossier as any)?.title ?? "Boardroom Briefing";

      emailResult = await sendBoardroomDeliveryEmail({
        to: clientEmail,
        clientName: clientName ?? null,
        dossierTitle,
        deliveryUrl: result.deliveryUrl,
        expiresAt: new Date(result.record.expiresAt),
        dossierId,
        tokenId,
      });

      void BoardroomDeliveryLog.record({
        tokenId,
        dossierId,
        eventType: emailResult.ok ? "SENT" : "SEND_FAILED",
        clientEmail: clientEmail ?? null,
        performedBy: auth.email ?? "admin",
        metadata: emailResult.ok
          ? { emailId: emailResult.emailId }
          : { error: emailResult.error },
      });
    }

    return NextResponse.json({
      ok: true,
      // Raw token returned exactly once — do not log or cache this response
      rawToken: result.rawToken,
      deliveryUrl: result.deliveryUrl,
      tokenRecord: result.record,
      email: emailResult
        ? { sent: emailResult.ok, error: emailResult.error ?? null }
        : { sent: false, reason: "No clientEmail provided or sendEmail suppressed" },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Token generation failed" },
      { status: 500 },
    );
  }
}
