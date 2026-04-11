export const dynamic = "force-dynamic";
// app/api/admin/decision/contextual-ranking/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildDecisionSignalProfiles,
  summarizeDecisionSignalProfiles,
  type DecisionAssetContextRow,
  type DecisionSignalProfile,
} from "@/lib/decision/build-decision-signal-profile";

function byType(
  profiles: DecisionSignalProfile[],
  type: string,
  minImpressions = 3,
): DecisionSignalProfile[] {
  return profiles
    .filter(
      (profile) =>
        profile.contextType === type &&
        profile.impressions >= minImpressions &&
        profile.confidenceScore > 0,
    )
    .slice(0, 20);
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

    return NextResponse.json({
      ok: true,
      mode: "constitutional",
      summary: summarizeDecisionSignalProfiles(profiles),
      bySector: byType(profiles, "sector"),
      byRoute: byType(profiles, "route"),
      byReadinessTier: byType(profiles, "readinessTier"),
      byAuthorityType: byType(profiles, "authorityType"),
      byOrgState: byType(profiles, "orgState"),
      byMarketRiskBand: byType(profiles, "marketRiskBand"),
      byRevenueBand: byType(profiles, "revenueBand"),
    });
  } catch (error) {
    console.error("[ADMIN_CONTEXTUAL_RANKING_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load constitutional contextual ranking.",
      },
      { status: 500 },
    );
  }
}