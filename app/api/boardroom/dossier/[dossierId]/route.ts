// app/api/boardroom/dossier/[dossierId]/route.ts
// Client-facing: retrieve a Boardroom Dossier by ID.
//
// Security controls:
//   1. Rate limit: 10 requests/IP/minute — probe prevention
//   2. Constant-time denial: all invalid states return 403 with the same error
//      message and a forced minimum delay to prevent timing-based enumeration
//   3. Token validation: SHA-256 hash comparison, expiry, revocation
//   4. Cross-dossier attack prevention: tokenRecord.dossierId === dossierId check

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { checkBoardroomRateLimit, extractIp } from "@/lib/boardroom/boardroom-server-rate-limit";
import { BoardroomDeliveryLog } from "@/lib/boardroom/boardroom-delivery-log";

/** Constant denial response — same wording regardless of reason. */
const ACCESS_DENIED_RESPONSE = NextResponse.json(
  { ok: false, error: "Access link invalid. Please use the link provided in your briefing document." },
  { status: 403 },
);

/** Minimum response time in ms to prevent timing attacks on token validation. */
const MIN_RESPONSE_MS = 200;

async function withMinDelay<T>(fn: () => Promise<T>, startMs: number): Promise<T> {
  const result = await fn();
  const elapsed = Date.now() - startMs;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dossierId: string }> },
) {
  const startMs = Date.now();

  try {
    // ── Rate limit ────────────────────────────────────────────────────────────
    const ip = extractIp(request);
    const rl = checkBoardroomRateLimit(ip);

    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const { dossierId } = await params;
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS));
      return ACCESS_DENIED_RESPONSE;
    }

    // ── Token validation (hash, expiry, revocation) ────────────────────────
    return await withMinDelay(async () => {
      const validation = await BoardroomAccessTokenService.validateToken(rawToken);

      if (!validation.valid) {
        // Log EXPIRED lazily — if the reason is EXPIRED, record the event
        if (validation.reason === "EXPIRED" && (validation as any).tokenRecord?.id) {
          void BoardroomDeliveryLog.record({
            tokenId: (validation as any).tokenRecord.id,
            dossierId,
            eventType: "EXPIRED",
          });
        }
        return ACCESS_DENIED_RESPONSE;
      }

      const { tokenRecord } = validation;

      // ── Cross-dossier attack prevention ──────────────────────────────────
      if (tokenRecord.dossierId !== dossierId) {
        return ACCESS_DENIED_RESPONSE;
      }

      // ── Fetch dossier ────────────────────────────────────────────────────
      const dossier = await BoardroomDossierService.getById(dossierId);
      if (!dossier) {
        return ACCESS_DENIED_RESPONSE;
      }

      // ── Record view ──────────────────────────────────────────────────────
      await Promise.all([
        BoardroomAccessTokenService.recordTokenView(tokenRecord.id),
        BoardroomDossierService.recordView(dossierId),
        BoardroomDeliveryLog.record({
          tokenId: tokenRecord.id,
          dossierId,
          eventType: "VIEWED",
          clientEmail: tokenRecord.clientEmail ?? null,
        }),
      ]);

      return NextResponse.json({ ok: true, dossier });
    }, startMs);
  } catch (_err) {
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve dossier" },
      { status: 500 },
    );
  }
}
