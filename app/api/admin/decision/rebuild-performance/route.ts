export const dynamic = "force-dynamic";
// app/api/admin/decision/rebuild-performance/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  deriveAdaptiveWeight,
  derivePerformanceRates,
} from "@/lib/decision/adaptive-weight-engine";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

export async function POST() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const [impressions, clicks, conversions] = await Promise.all([
      prisma.decisionRecommendationImpression.findMany(),
      prisma.decisionRecommendationClick.findMany(),
      prisma.decisionRecommendationConversion.findMany(),
    ]);

    const bucket = new Map<
      string,
      {
        assetId: string;
        assetTitle: string;
        assetHref: string | null;
        assetKind: string;
        impressions: number;
        clicks: number;
        conversions: number;
        lastInteractionAt: Date | null;
      }
    >();

    for (const item of impressions) {
      const existing = bucket.get(item.assetId) ?? {
        assetId: item.assetId,
        assetTitle: item.assetTitle,
        assetHref: item.assetHref ?? null,
        assetKind: item.assetKind,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        lastInteractionAt: null,
      };

      existing.impressions += 1;
      existing.lastInteractionAt =
        !existing.lastInteractionAt || item.createdAt > existing.lastInteractionAt
          ? item.createdAt
          : existing.lastInteractionAt;

      bucket.set(item.assetId, existing);
    }

    for (const item of clicks) {
      const existing = bucket.get(item.assetId) ?? {
        assetId: item.assetId,
        assetTitle: item.assetTitle,
        assetHref: item.assetHref ?? null,
        assetKind: item.assetKind,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        lastInteractionAt: null,
      };

      existing.clicks += 1;
      existing.lastInteractionAt =
        !existing.lastInteractionAt || item.createdAt > existing.lastInteractionAt
          ? item.createdAt
          : existing.lastInteractionAt;

      bucket.set(item.assetId, existing);
    }

    for (const item of conversions) {
      if (!item.assetId) continue;

      const existing = bucket.get(item.assetId) ?? {
        assetId: item.assetId,
        assetTitle: item.assetTitle ?? item.assetId,
        assetHref: item.assetHref ?? null,
        assetKind: item.assetKind ?? "unknown",
        impressions: 0,
        clicks: 0,
        conversions: 0,
        lastInteractionAt: null,
      };

      existing.conversions += 1;
      existing.lastInteractionAt =
        !existing.lastInteractionAt || item.createdAt > existing.lastInteractionAt
          ? item.createdAt
          : existing.lastInteractionAt;

      bucket.set(item.assetId, existing);
    }

    const updates = Array.from(bucket.values());

    await prisma.$transaction(
      updates.map((item) => {
        const rates = derivePerformanceRates(item);
        const adaptiveWeight = deriveAdaptiveWeight(item);

        return prisma.decisionAssetPerformance.upsert({
          where: { assetId: item.assetId },
          update: {
            assetTitle: item.assetTitle,
            assetHref: item.assetHref,
            assetKind: item.assetKind,
            impressions: item.impressions,
            clicks: item.clicks,
            conversions: item.conversions,
            clickThroughRate: rates.clickThroughRate,
            conversionRate: rates.conversionRate,
            adaptiveWeight,
            lastInteractionAt: item.lastInteractionAt,
          },
          create: {
            assetId: item.assetId,
            assetTitle: item.assetTitle,
            assetHref: item.assetHref,
            assetKind: item.assetKind,
            impressions: item.impressions,
            clicks: item.clicks,
            conversions: item.conversions,
            clickThroughRate: rates.clickThroughRate,
            conversionRate: rates.conversionRate,
            adaptiveWeight,
            lastInteractionAt: item.lastInteractionAt,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      processedAssets: updates.length,
    });
  } catch (error) {
    console.error("[DECISION_PERFORMANCE_REBUILD_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to rebuild decision performance",
      },
      { status: 500 }
    );
  }
}