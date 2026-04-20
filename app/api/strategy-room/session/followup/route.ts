export const dynamic = "force-dynamic";
// app/api/strategy-room/session/followup/route.ts

import { NextResponse } from "next/server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import {
  createStrategyRoomFollowup,
  markStrategyRoomFollowup,
} from "@/lib/strategy-room/persistence";

function toJsonString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

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

    const persistedCanonicalSnapshot = toJsonString(canonicalSnapshot);

    await createStrategyRoomFollowup({
      sessionKey,
      routeAfter: String(body?.routeAfter || ""),
      readinessTierAfter: String(body?.readinessTierAfter || ""),
      authorityTypeAfter: String(body?.authorityTypeAfter || ""),
      clarityDelta: Number(body?.clarityDelta || 0),
      authorityDelta: Number(body?.authorityDelta || 0),
      convertedAfterGuidance: Boolean(body?.convertedAfterGuidance),
      metadata: toJsonString(body?.metadata || {}),
      canonicalSnapshot: persistedCanonicalSnapshot,
    });

    await markStrategyRoomFollowup(sessionKey, persistedCanonicalSnapshot);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[STRATEGY_ROOM_FOLLOWUP_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to capture follow-up event." },
      { status: 500 }
    );
  }
}
