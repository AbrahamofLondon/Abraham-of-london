export const dynamic = "force-dynamic";
// app/api/strategy-room/session/impression/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";

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
    const recommendations = Array.isArray(body?.recommendations)
      ? body.recommendations
      : [];
    const canonicalSnapshotInput = body?.canonicalSnapshot;
    const contextSnapshot = body?.contextSnapshot;

    if (!sessionKey) {
      return NextResponse.json(
        { ok: false, error: "sessionKey is required." },
        { status: 400 }
      );
    }

    const canonicalSnapshot =
      normalizeCanonicalSectionsSnapshot({
        envelope:
          canonicalSnapshotInput && canonicalSnapshotInput.sections
            ? canonicalSnapshotInput
            : undefined,
        sections:
          !canonicalSnapshotInput?.sections && contextSnapshot?.constitutionalPosture
            ? contextSnapshot
            : undefined,
        source: "impression",
        sessionKey,
      }) ??
      (canonicalSnapshotInput || null);

    await prisma.strategyRoomRecommendationImpression.create({
      data: {
        sessionKey,
        recommendations: toJsonString(recommendations) || "[]",
        canonicalSnapshot: toJsonString(canonicalSnapshot),
      },
    });

    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot: toJsonString(canonicalSnapshot),
        lastImpressionAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[STRATEGY_ROOM_IMPRESSION_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to record recommendation impressions." },
      { status: 500 }
    );
  }
}
