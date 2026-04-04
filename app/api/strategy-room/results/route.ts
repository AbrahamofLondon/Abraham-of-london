// app/api/strategy-room/results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";

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

    // ============================================
    // 2. LEGACY STRATEGY INTAKE LOOKUP
    // ============================================
    const record = await prisma.strategyIntake.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Strategy intake not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: "intake",
      id: record.id,
      fullName: record.fullName,
      organisation: record.organisation,
      dependencyLevel: record.dependencyLevel,
      volatility: record.volatility,
      readinessScore: record.readinessScore,
      payload: record.payload,
      emailHash: record.emailHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error("[STRATEGY_RESULTS_ERROR]", error);

    return NextResponse.json(
      { error: "Failed to retrieve strategy results" },
      { status: 500 }
    );
  }
}