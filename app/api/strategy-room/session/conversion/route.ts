export const dynamic = "force-dynamic";
// app/api/strategy-room/session/conversion/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";

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

    await prisma.strategyRoomConversion.create({
      data: {
        sessionKey,
        conversionType,
        metadata: (body?.metadata || {}) as any,
        canonicalSnapshot: canonicalSnapshot as any,
      },
    });

    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot: canonicalSnapshot as any,
        lastConversionAt: new Date(),
        lastConversionType: conversionType,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[STRATEGY_ROOM_CONVERSION_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to capture conversion event." },
      { status: 500 }
    );
  }
}