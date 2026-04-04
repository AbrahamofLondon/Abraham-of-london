// app/api/admin/decision/rebuild-contextual-efficacy/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import {
  buildContextualBreakdown,
  buildContextualJoinKey,
  getCanonicalPerformanceContext,
  getCanonicalRecommendations,
} from "@/lib/admin/decision/canonical-efficacy";

type ContextAggregate = {
  joinKey: string;
  context: ReturnType<typeof buildContextualBreakdown>;
  sessions: Set<string>;
  impressions: number;
  conversions: number;
  assetStats: Map<
    string,
    {
      assetId: string;
      title: string;
      kind: string;
      href?: string | null;
      impressions: number;
      conversions: number;
      scoreSum: number;
      rankSum: number;
      rankCount: number;
      reasons: Set<string>;
    }
  >;
};

function round(value: number, decimals = 4): number {
  return Number(value.toFixed(decimals));
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length
    ? value.trim()
    : fallback;
}

function upsertAssetStat(
  bucket: ContextAggregate,
  rec: ReturnType<typeof getCanonicalRecommendations>[number],
  converted: boolean
) {
  const key = rec.assetId || `${rec.kind}::${rec.title}`;
  const existing = bucket.assetStats.get(key) || {
    assetId: rec.assetId,
    title: rec.title,
    kind: rec.kind,
    href: rec.href ?? null,
    impressions: 0,
    conversions: 0,
    scoreSum: 0,
    rankSum: 0,
    rankCount: 0,
    reasons: new Set<string>(),
  };

  existing.title =
    existing.title.length >= rec.title.length ? existing.title : rec.title;
  existing.kind = safeString(existing.kind, rec.kind);
  existing.href = existing.href || rec.href || null;
  existing.impressions += 1;
  existing.conversions += converted ? 1 : 0;
  existing.scoreSum += rec.score || 0;
  existing.rankSum += rec.rank || 0;
  existing.rankCount += rec.rank ? 1 : 0;

  for (const reason of rec.reasons) {
    if (reason) existing.reasons.add(reason);
  }

  bucket.assetStats.set(key, existing);
}

export async function POST() {
  try {
    const [sessions, impressions, conversions] = await Promise.all([
      prisma.strategyRoomSession.findMany({
        select: {
          sessionKey: true,
          canonicalSnapshot: true,
          source: true,
        },
      }),
      prisma.strategyRoomRecommendationImpression.findMany({
        select: {
          sessionKey: true,
          canonicalSnapshot: true,
          recommendations: true,
          createdAt: true,
        },
      }),
      prisma.strategyRoomConversion.findMany({
        select: {
          sessionKey: true,
          canonicalSnapshot: true,
          conversionType: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const conversionsBySession = new Map<string, number>();
    for (const conversion of conversions) {
      conversionsBySession.set(
        conversion.sessionKey,
        (conversionsBySession.get(conversion.sessionKey) || 0) + 1
      );
    }

    const buckets = new Map<string, ContextAggregate>();

    for (const impression of impressions) {
      const context = getCanonicalPerformanceContext(
        impression.canonicalSnapshot as any
      );
      if (!context) continue;

      const joinKey = buildContextualJoinKey(context);
      const bucket =
        buckets.get(joinKey) ||
        {
          joinKey,
          context: buildContextualBreakdown(context),
          sessions: new Set<string>(),
          impressions: 0,
          conversions: 0,
          assetStats: new Map(),
        };

      bucket.sessions.add(impression.sessionKey);
      bucket.impressions += 1;

      const converted = (conversionsBySession.get(impression.sessionKey) || 0) > 0;
      if (converted) bucket.conversions += 1;

      const recommendations = getCanonicalRecommendations(
        impression.canonicalSnapshot as any
      );

      for (const rec of recommendations) {
        upsertAssetStat(bucket, rec, converted);
      }

      buckets.set(joinKey, bucket);
    }

    const rebuilt = Array.from(buckets.values())
      .map((bucket) => {
        const contextualConversionRate =
          bucket.impressions > 0 ? bucket.conversions / bucket.impressions : 0;

        const rankedAssets = Array.from(bucket.assetStats.values())
          .map((asset) => {
            const conversionRate =
              asset.impressions > 0 ? asset.conversions / asset.impressions : 0;

            const avgMatchScore =
              asset.impressions > 0 ? asset.scoreSum / asset.impressions : 0;

            const avgRank =
              asset.rankCount > 0 ? asset.rankSum / asset.rankCount : 0;

            const contextualLift =
              conversionRate * 0.55 +
              (avgMatchScore / 100) * 0.30 +
              (avgRank > 0 ? (1 / avgRank) * 0.15 : 0);

            return {
              assetId: asset.assetId,
              title: asset.title,
              kind: asset.kind,
              href: asset.href ?? null,
              impressions: asset.impressions,
              conversions: asset.conversions,
              conversionRate: round(conversionRate),
              avgMatchScore: round(avgMatchScore, 2),
              avgRank: round(avgRank, 2),
              contextualLift: round(contextualLift),
              reasons: Array.from(asset.reasons).slice(0, 8),
            };
          })
          .sort((a, b) => b.contextualLift - a.contextualLift);

        return {
          joinKey: bucket.joinKey,
          context: bucket.context,
          totalSessions: bucket.sessions.size,
          impressionCount: bucket.impressions,
          conversionCount: bucket.conversions,
          contextualConversionRate: round(contextualConversionRate),
          rankedAssets,
        };
      })
      .sort((a, b) => b.contextualConversionRate - a.contextualConversionRate);

    await prisma.adminDecisionContextualEfficacy.deleteMany({});

    if (rebuilt.length > 0) {
      await prisma.adminDecisionContextualEfficacy.createMany({
        data: rebuilt.map((row) => ({
          joinKey: row.joinKey,
          context: row.context as any,
          totalSessions: row.totalSessions,
          impressionCount: row.impressionCount,
          conversionCount: row.conversionCount,
          contextualConversionRate: row.contextualConversionRate,
          rankedAssets: row.rankedAssets as any,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      rebuiltContexts: rebuilt.length,
      sample: rebuilt.slice(0, 5),
    });
  } catch (error) {
    console.error("[ADMIN_REBUILD_CONTEXTUAL_EFFICACY_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to rebuild canonical contextual efficacy." },
      { status: 500 }
    );
  }
}