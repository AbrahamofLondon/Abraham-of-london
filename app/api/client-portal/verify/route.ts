// app/api/client-portal/verify/route.ts
// Public: validate a portal magic-link token and return session info.
//
// GET ?token=<raw> → validates token, records use, returns clientEmail + sessionId
// The client stores the rawToken in sessionStorage and passes it on every portal API call.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { checkBoardroomRateLimit, extractIp } from "@/lib/boardroom/boardroom-server-rate-limit";

const DENIED = NextResponse.json(
  { ok: false, error: "Access link invalid or expired. Request a new portal link." },
  { status: 403 },
);

export async function GET(request: NextRequest) {
  // Rate limit — reuse boardroom rate limiter (same security posture)
  const ip = extractIp(request);
  const rl = checkBoardroomRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");

  if (!rawToken) return DENIED;

  // Enforce minimum response time
  const start = Date.now();
  const MIN_MS = 150;

  const result = await ClientPortalTokenService.validateSession(rawToken);

  const elapsed = Date.now() - start;
  if (elapsed < MIN_MS) await new Promise((r) => setTimeout(r, MIN_MS - elapsed));

  if (!result.valid) return DENIED;

  void ClientPortalTokenService.recordUse(result.session.id);

  return NextResponse.json({
    ok: true,
    sessionId: result.session.id,
    clientEmail: result.session.clientEmail,
    expiresAt: result.session.expiresAt,
  });
}
