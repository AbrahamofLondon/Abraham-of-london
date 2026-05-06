import { NextRequest, NextResponse } from "next/server";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma.server";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { verifySignedActionToken } from "@/lib/server/security/signed-action-token";
import { failClosedForFlag, noStoreJson } from "@/lib/server/security/app-route-guards";
import { writeSecurityAudit } from "@/lib/security/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const accessToken = _req.nextUrl.searchParams.get("access") || "";

  if (!sessionId || sessionId.length < 5) {
    return noStoreJson({ ok: false, error: "Invalid session ID" }, { status: 400 });
  }

  try {
    const lockdown = failClosedForFlag({
      flag: "DISABLE_RETURN_BRIEFS",
      action: "strategy_room_access_denied",
      route: "/api/strategy-room/briefing/return",
      publicMessage: "RETURN_BRIEFS_TEMPORARILY_DISABLED",
    });
    if (!lockdown.ok) return lockdown.response;

    const session = await prisma.strategyRoomExecutionSession.findFirst({
      where: {
        OR: [{ id: sessionId }, { sessionKey: sessionId }],
      },
      select: { id: true, sessionKey: true, email: true, userId: true },
    });

    if (!session) {
      return noStoreJson({ ok: false, error: "Session not found" }, { status: 404 });
    }

    let authorized = false;
    if (accessToken) {
      const verified = verifySignedActionToken(accessToken, "return_brief");
      authorized = verified.ok && verified.payload.subject === session.sessionKey;
    }

    if (!authorized) {
      const identity = await resolveIdentity(_req);
      if (identity.authenticated) {
        const entitlement = await resolveCanonicalEntitlement({
          userId: identity.subjectId,
          email: identity.email,
          slug: "strategy-room.entry",
        });
        const emailMatches =
          !session.email ||
          (identity.email && session.email.toLowerCase() === identity.email.toLowerCase());
        const userMatches = !session.userId || (identity.subjectId && session.userId === identity.subjectId);
        authorized = Boolean(entitlement.granted && emailMatches && userMatches);
      }
    }

    if (!authorized) {
      await writeSecurityAudit({
        action: "strategy_room_access_denied",
        severity: "warn",
        status: "BLOCKED",
        resourceId: session.sessionKey,
      });
      return noStoreJson({ ok: false, error: "Access denied" }, { status: 403 });
    }

    const brief = await generateReturnBrief(sessionId);

    if (!brief) {
      return noStoreJson({
        ok: true,
        briefAvailable: false,
        message: "No return brief is warranted at this time.",
      });
    }

    await writeSecurityAudit({
      action: "return_brief_generated",
      status: "SUCCESS",
      resourceId: session.sessionKey,
    });

    return noStoreJson({
      ok: true,
      briefAvailable: true,
      brief,
    });
  } catch {
    return noStoreJson({ ok: false, error: "Unable to generate briefing" }, { status: 500 });
  }
}
