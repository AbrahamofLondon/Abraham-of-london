// app/api/admin/decision/contextual-ranking/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sortRows(rows: any[]) {
  return rows.sort((a, b) => {
    if (b.contextualWeight !== a.contextualWeight) {
      return b.contextualWeight - a.contextualWeight;
    }
    if (b.usefulnessScore !== a.usefulnessScore) {
      return b.usefulnessScore - a.usefulnessScore;
    }
    if (b.routeImprovements !== a.routeImprovements) {
      return b.routeImprovements - a.routeImprovements;
    }
    return b.impressions - a.impressions;
  });
}

function mapRow(row: any) {
  const metadata = (row.metadata || {}) as Record<string, unknown>;

  return {
    assetId: row.assetId,
    assetTitle: row.assetTitle,
    assetHref: row.assetHref,
    assetKind: row.assetKind,
    contextType: row.contextType,
    contextValue: row.contextValue,
    contextualWeight: toNumber(row.contextualWeight, 1),
    confidenceScore: toNumber(row.confidenceScore, 0),
    usefulnessScore: toNumber(row.usefulnessScore, 0),
    impressions: toNumber(row.impressions, 0),
    clicks: toNumber(row.clicks, 0),
    conversions: toNumber(row.conversions, 0),
    assistedConversions: toNumber(row.assistedConversions, 0),
    routeImprovements: toNumber(row.routeImprovements, 0),
    readinessImprovements: toNumber(row.readinessImprovements, 0),
    clarityGain: toNumber(row.clarityGain, 0),
    authorityGain: toNumber(row.authorityGain, 0),
    governanceGain: toNumber(metadata.governanceGain, 0),
    constitutionalSource: Boolean(metadata.constitutionalSource),
    updatedAt: row.updatedAt,
  };
}

function byType(rows: any[], type: string) {
  return sortRows(
    rows.filter(
      (row) =>
        row.contextType === type &&
        toNumber(row.impressions, 0) >= 3 &&
        toNumber(row.confidenceScore, 0) > 0
    )
  )
    .slice(0, 20)
    .map(mapRow);
}

function buildSummary(rows: any[]) {
  const constitutionalRows = rows.filter(
    (row) => Boolean((row.metadata || {}).constitutionalSource)
  );

  return {
    totalRows: rows.length,
    constitutionalRows: constitutionalRows.length,
    avgContextualWeight:
      rows.length > 0
        ? Number(
            (
              rows.reduce(
                (acc, row) => acc + toNumber(row.contextualWeight, 0),
                0
              ) / rows.length
            ).toFixed(6)
          )
        : 0,
    avgConfidenceScore:
      rows.length > 0
        ? Number(
            (
              rows.reduce(
                (acc, row) => acc + toNumber(row.confidenceScore, 0),
                0
              ) / rows.length
            ).toFixed(6)
          )
        : 0,
  };
}

export async function GET() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const rows = await prisma.decisionAssetContextPerformance.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({
      ok: true,
      mode: "constitutional",
      summary: buildSummary(rows),
      bySector: byType(rows, "sector"),
      byRoute: byType(rows, "route"),
      byReadinessTier: byType(rows, "readinessTier"),
      byAuthorityType: byType(rows, "authorityType"),
      byOrgState: byType(rows, "orgState"),
      byMarketRiskBand: byType(rows, "marketRiskBand"),
      byRevenueBand: byType(rows, "revenueBand"),
    });
  } catch (error) {
    console.error("[ADMIN_CONTEXTUAL_RANKING_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load constitutional contextual ranking.",
      },
      { status: 500 }
    );
  }
}