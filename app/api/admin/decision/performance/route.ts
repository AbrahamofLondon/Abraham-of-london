// app/api/admin/decision/performance/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildDecisionSignalProfiles,
  summarizeDecisionSignalProfiles,
  type DecisionAssetContextRow,
} from "@/lib/decision/build-decision-signal-profile";

function topBy<T>(
  items: T[],
  selector: (item: T) => number,
  limit = 10,
): T[] {
  return [...items]
    .sort((a, b) => selector(b) - selector(a))
    .slice(0, limit);
}

export async function GET() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const rows = (await prisma.decisionAssetContextPerformance.findMany({
      orderBy: [{ updatedAt: "desc" }],
    })) as DecisionAssetContextRow[];

    const profiles = buildDecisionSignalProfiles(rows);
    const summary = summarizeDecisionSignalProfiles(profiles);

    return NextResponse.json({
      ok: true,
      summary,
      strongestSignals: topBy(profiles, (profile) => profile.signalStrengthScore, 12),
      bestStrategicFit: topBy(profiles, (profile) => profile.strategicFitScore, 12),
      topRankingAssets: topBy(profiles, (profile) => profile.rankingScore, 12),
      highestRiskAssets: topBy(profiles, (profile) => profile.governanceRiskScore, 12),
    });
  } catch (error) {
    console.error("[ADMIN_DECISION_PERFORMANCE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load decision performance dashboard.",
      },
      { status: 500 },
    );
  }
}