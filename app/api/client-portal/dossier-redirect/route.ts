// app/api/client-portal/dossier-redirect/route.ts
//
// GET ?dossierId=<id>&token=<raw>
//
// Validates the portal session token, then redirects the client to the
// boardroom dossier delivery URL (which has its own access token).
//
// This route acts as the bridge between the client portal (magic-link auth)
// and the boardroom dossier viewer (delivery-token auth).
//
// Security invariants:
//  - Token must be valid and unexpired
//  - DossierId must belong to the client email on the session
//  - Redirect is to the boardroom dossier page with a fresh, validated token
//  - All 401/403 responses are constant-time and reveal no information

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { prisma } from "@/lib/prisma";

const MIN_RESPONSE_MS = 150;
const PORTAL_REDIRECT_EXPIRY_HOURS = 2; // Short-lived — portal redirect tokens expire in 2 hours

async function withMinDelay<T>(promise: Promise<T>, minMs: number): Promise<T> {
  const [result] = await Promise.all([promise, new Promise((r) => setTimeout(r, minMs))]);
  return result;
}

const siteBase = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ACCESS_DENIED = () =>
  NextResponse.redirect(new URL("/portal?error=access_denied", siteBase()));

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const { searchParams } = new URL(request.url);
  const rawPortalToken = searchParams.get("token") ?? "";
  const dossierId = searchParams.get("dossierId") ?? "";

  if (!rawPortalToken || !dossierId) {
    await withMinDelay(Promise.resolve(), MIN_RESPONSE_MS - (Date.now() - startTime));
    return ACCESS_DENIED();
  }

  try {
    const validation = await ClientPortalTokenService.validateSession(rawPortalToken);

    if (!validation.valid) {
      await withMinDelay(Promise.resolve(), MIN_RESPONSE_MS - (Date.now() - startTime));
      return ACCESS_DENIED();
    }

    const { session } = validation;

    // Verify the dossier belongs to this client and is delivered
    const dossier = await prisma.boardroomDossier.findFirst({
      where: {
        id: dossierId,
        clientEmail: session.clientEmail,
        status: "DELIVERED",
        isSample: false,
      },
      select: { id: true },
    });

    if (!dossier) {
      await withMinDelay(Promise.resolve(), MIN_RESPONSE_MS - (Date.now() - startTime));
      return ACCESS_DENIED();
    }

    // Generate a fresh short-lived delivery token for this portal redirect
    const tokenResult = await BoardroomAccessTokenService.createToken({
      dossierId,
      clientEmail: session.clientEmail,
      expiryHours: PORTAL_REDIRECT_EXPIRY_HOURS,
      createdBy: `portal:${session.id}`,
    });

    // Record portal token use (fire-and-forget)
    void ClientPortalTokenService.recordUse(session.id);

    // Enforce minimum response time before redirect
    await withMinDelay(Promise.resolve(), MIN_RESPONSE_MS - (Date.now() - startTime));

    // Redirect to boardroom dossier with fresh short-lived token
    const dossierUrl = new URL(
      `/boardroom/dossier/${dossierId}?token=${encodeURIComponent(tokenResult.rawToken)}`,
      siteBase(),
    );

    return NextResponse.redirect(dossierUrl);
  } catch (err) {
    console.error("[DOSSIER_REDIRECT]", err);
    await withMinDelay(Promise.resolve(), MIN_RESPONSE_MS - (Date.now() - startTime));
    return ACCESS_DENIED();
  }
}
