// app/api/strategy-room/session/followup/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionKey = String(body?.sessionKey || "").trim();
    if (!sessionKey) {
      return NextResponse.json(
        { ok: false, error: "sessionKey is required." },
        { status: 400 }
      );
    }

    const canonicalSnapshot = normalizeCanonicalSectionsSnapshot({
      envelope:
        body?.canonicalSnapshot?.sections ? body.canonicalSnapshot : undefined,
      sections:
        body?.canonicalSnapshot?.constitutionalPosture
          ? body.canonicalSnapshot
          : undefined,
      source: "followup",
      sessionKey,
    });

    await prisma.strategyRoomFollowup.create({
      data: {
        sessionKey,
        routeAfter: String(body?.routeAfter || ""),
        readinessTierAfter: String(body?.readinessTierAfter || ""),
        authorityTypeAfter: String(body?.authorityTypeAfter || ""),
        clarityDelta: Number(body?.clarityDelta || 0),
        authorityDelta: Number(body?.authorityDelta || 0),
        convertedAfterGuidance: Boolean(body?.convertedAfterGuidance),
        metadata: (body?.metadata || {}) as any,
        canonicalSnapshot: canonicalSnapshot as any,
      },
    });

    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot: canonicalSnapshot as any,
        lastFollowupAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[STRATEGY_ROOM_FOLLOWUP_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to capture follow-up event." },
      { status: 500 }
    );
  }
}