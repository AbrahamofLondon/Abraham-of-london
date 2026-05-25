// app/api/client-portal/deliverables/route.ts
// Client-facing: get all deliverables for an authenticated portal session.
//
// GET ?token=<raw> → returns { diagnostics, reports, dossiers, actionSummary }
//
// Validates the portal token on each request (stateless — no cookie required).

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { ClientActionLog } from "@/lib/client-portal/client-action-log";
import { prisma } from "@/lib/prisma.server";
import { checkBoardroomRateLimit, extractIp } from "@/lib/boardroom/boardroom-server-rate-limit";

const DENIED = NextResponse.json(
  { ok: false, error: "Access link invalid or expired." },
  { status: 403 },
);

export async function GET(request: NextRequest) {
  const ip = extractIp(request);
  const rl = checkBoardroomRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");
  if (!rawToken) return DENIED;

  const validation = await ClientPortalTokenService.validateSession(rawToken);
  if (!validation.valid) return DENIED;

  const { clientEmail } = validation.session;

  try {
    // Fetch all deliverables in parallel
    const [dossiers, actions, actionSummary] = await Promise.all([
      // Boardroom dossiers delivered to this email
      prisma.boardroomDossier.findMany({
        where: { clientEmail, status: "DELIVERED" },
        select: {
          id: true,
          title: true,
          status: true,
          sourceType: true,
          isSample: true,
          createdAt: true,
          updatedAt: true,
          accessTokens: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true, expiresAt: true, viewCount: true, lastViewedAt: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Decision action items
      ClientActionLog.forClient(clientEmail),

      // Action summary
      ClientActionLog.summary(clientEmail),
    ]);

    // Redact sample dossiers from client view (never deliver samples to clients)
    const deliverableDossiers = dossiers.filter((d) => !d.isSample);

    // Build access URLs for dossiers that have active tokens
    const dossiersWithAccess = deliverableDossiers.map((d) => {
      const activeToken = d.accessTokens[0];
      return {
        ...d,
        accessTokens: undefined, // strip internal token details
        hasActiveToken: Boolean(activeToken),
        lastViewedAt: activeToken?.lastViewedAt ?? null,
        viewCount: activeToken?.viewCount ?? 0,
      };
    });

    return NextResponse.json({
      ok: true,
      clientEmail,
      deliverables: {
        dossiers: dossiersWithAccess,
        actionItems: actions,
        actionSummary,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch deliverables" },
      { status: 500 },
    );
  }
}
