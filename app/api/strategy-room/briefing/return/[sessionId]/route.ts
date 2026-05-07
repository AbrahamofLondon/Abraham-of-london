import { NextRequest, NextResponse } from "next/server";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";
import { failClosedForFlag, noStoreJson } from "@/lib/server/security/app-route-guards";
import { writeSecurityAudit } from "@/lib/security/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

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

    const access = await assertStrategyRoomAccess({
      request: req,
      sessionRef: sessionId,
      purpose: "return_brief",
      allowTokenPurposes: ["return_brief", "strategy_room_session"],
    });

    if (!access.ok) {
      await writeSecurityAudit({
        action: "strategy_room_access_denied",
        severity: "warn",
        status: "BLOCKED",
        resourceId: sessionId,
      });
      return noStoreJson(
        { ok: false, error: access.error === "SESSION_NOT_FOUND" ? "Session not found" : "Access denied" },
        { status: access.status },
      );
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
      resourceId: access.subject.sessionKey,
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
