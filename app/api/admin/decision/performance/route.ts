// app/api/admin/decision/performance/route.ts

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

export async function GET() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) {
      throw new Error("Database unavailable");
    }

    const assets = await prisma.decisionAssetPerformance.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    const totalAssets = assets.length;

    const totals = assets.reduce(
      (acc: any, item: any) => {
        acc.impressions += toNumber(item.impressions);
        acc.clicks += toNumber(item.clicks);
        acc.conversions += toNumber(item.conversions);
        acc.weight += toNumber(item.adaptiveWeight, 1);
        return acc;
      },
      { impressions: 0, clicks: 0, conversions: 0, weight: 0 }
    );

    const avgCtr =
      totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

    const avgConversionRate =
      totals.clicks > 0 ? totals.conversions / totals.clicks : 0;

    const avgAdaptiveWeight =
      totalAssets > 0 ? totals.weight / totalAssets : 1;

    const normalizedAssets = assets.map((item: any) => ({
      assetId: item.assetId,
      assetTitle: item.assetTitle,
      assetHref: item.assetHref,
      assetKind: item.assetKind,
      impressions: toNumber(item.impressions),
      clicks: toNumber(item.clicks),
      conversions: toNumber(item.conversions),
      clickThroughRate: toNumber(item.clickThroughRate),
      conversionRate: toNumber(item.conversionRate),
      adaptiveWeight: toNumber(item.adaptiveWeight, 1),
      lastInteractionAt: item.lastInteractionAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: item.metadata ?? {},
    }));

    const topByCtr = [...normalizedAssets]
      .filter((item) => item.impressions >= 5)
      .sort((a, b) => {
        if (b.clickThroughRate !== a.clickThroughRate) {
          return b.clickThroughRate - a.clickThroughRate;
        }
        return b.impressions - a.impressions;
      })
      .slice(0, 12);

    const topByConversion = [...normalizedAssets]
      .filter((item) => item.clicks >= 3)
      .sort((a, b) => {
        if (b.conversionRate !== a.conversionRate) {
          return b.conversionRate - a.conversionRate;
        }
        return b.conversions - a.conversions;
      })
      .slice(0, 12);

    const underperforming = [...normalizedAssets]
      .filter((item) => item.impressions >= 10 && item.clickThroughRate <= 0.05)
      .sort((a, b) => {
        if (a.clickThroughRate !== b.clickThroughRate) {
          return a.clickThroughRate - b.clickThroughRate;
        }
        return b.impressions - a.impressions;
      })
      .slice(0, 20);

    const topByWeight = [...normalizedAssets]
      .sort((a, b) => b.adaptiveWeight - a.adaptiveWeight)
      .slice(0, 12);

    return NextResponse.json({
      ok: true,
      summary: {
        totalAssets,
        totalImpressions: totals.impressions,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        averageCtr: Number(avgCtr.toFixed(6)),
        averageConversionRate: Number(avgConversionRate.toFixed(6)),
        averageAdaptiveWeight: Number(avgAdaptiveWeight.toFixed(4)),
      },
      topByCtr,
      topByConversion,
      topByWeight,
      underperforming,
      assets: normalizedAssets,
    });
  } catch (error) {
    console.error("[ADMIN_DECISION_PERFORMANCE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load decision performance.",
      },
      { status: 500 }
    );
  }
}