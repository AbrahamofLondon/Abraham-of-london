export const dynamic = "force-dynamic";
// app/api/strategy-room/results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = String(searchParams.get("id") || "").trim();
    const sessionKey = String(searchParams.get("sessionKey") || "").trim();
    const type = String(searchParams.get("type") || "").trim().toLowerCase();

    if (!id && !sessionKey) {
      return NextResponse.json(
        { error: "Intake ID or sessionKey required" },
        { status: 400 }
      );
    }

    // ============================================
    // 1. EXPLICIT DECISION SESSION LOOKUP
    // ============================================
    if (type === "session" || sessionKey) {
      const access = await assertStrategyRoomAccess({
        request: req,
        sessionRef: sessionKey || id,
        purpose: "strategy_room_access",
        allowTokenPurposes: ["strategy_room_access", "return_brief"],
      });
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }

      const session = await prisma.decisionRecommendationSession.findFirst({
        where: sessionKey
          ? { sessionKey }
          : { id },
        include: {
          impressions: {
            orderBy: { createdAt: "asc" },
          },
          clicks: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Decision recommendation session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        type: "session",
        id: session.id,
        sessionKey: session.sessionKey,
        submissionId: session.submissionId,
        email: session.email,
        company: session.company,
        route: session.route,
        priority: session.priority,
        temperature: session.temperature,
        orgState: session.orgState,
        readinessTier: session.readinessTier,
        authorityType: session.authorityType,
        revenueBand: session.revenueBand,
        sector: session.sector,
        marketRiskBand: session.marketRiskBand,
        fusedScore: session.fusedScore,
        routeConfidence: session.routeConfidence,
        recommendationCount: session.recommendationCount,
        converted: session.converted,
        conversionType: session.conversionType,
        conversionAt: session.conversionAt,
        metadata: session.metadata,
        impressions: session.impressions,
        clicks: session.clicks,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    }

    return NextResponse.json(
      { error: "SESSION_ACCESS_REQUIRED" },
      { status: 403 }
    );
  } catch (error) {
    console.error("[STRATEGY_RESULTS_ERROR]", error);

    return NextResponse.json(
      { error: "Failed to retrieve strategy results" },
      { status: 500 }
    );
  }
}
