export const dynamic = "force-dynamic";
// app/api/strategy-room/session/conversion/route.ts

import { NextResponse } from "next/server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import {
  createStrategyRoomConversion,
  markStrategyRoomConversion,
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
    const conversionType = String(body?.conversionType || "").trim();

    if (!sessionKey || !conversionType) {
      return NextResponse.json(
        { ok: false, error: "sessionKey and conversionType are required." },
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
      source: "conversion",
      sessionKey,
    });

    const persistedCanonicalSnapshot = toJsonString(canonicalSnapshot);

    await createStrategyRoomConversion({
      sessionKey,
      conversionType,
      metadata: toJsonString(body?.metadata || {}),
      canonicalSnapshot: persistedCanonicalSnapshot,
    });

    await markStrategyRoomConversion(
      sessionKey,
      conversionType,
      persistedCanonicalSnapshot
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[STRATEGY_ROOM_CONVERSION_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to capture conversion event." },
      { status: 500 }
    );
  }
}
