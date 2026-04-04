// app/api/admin/decision/rebuild-efficacy/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveDecisionEfficacy } from "@/lib/decision/decision-efficacy-engine";

export async function POST() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const [impressions, clicks, conversions, followups] = await Promise.all([
      prisma.decisionRecommendationImpression.findMany(),
      prisma.decisionRecommendationClick.findMany(),
      prisma.decisionRecommendationConversion.findMany(),
      prisma.decisionSessionFollowup.findMany({
        include: {
          session: {
            include: {
              impressions: true,
              clicks: true,
            },
          },
        },
      }),
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
        assistedConversions: number;
        routeImprovements: number;
        readinessImprovements: number;
        clarityImprovements: number;
        authorityImprovements: number;
      }
    >();

    function ensureBucket(
      assetId: string,
      assetTitle: string,
      assetHref: string | null,
      assetKind: string
    ) {
      const existing = bucket.get(assetId);
      if (existing) return existing;

      const created = {
        assetId,
        assetTitle,
        assetHref,
        assetKind,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        assistedConversions: 0,
        routeImprovements: 0,
        readinessImprovements: 0,
        clarityImprovements: 0,
        authorityImprovements: 0,
      };

      bucket.set(assetId, created);
      return created;
    }

    for (const item of impressions) {
      ensureBucket(
        item.assetId,
        item.assetTitle,
        item.assetHref ?? null,
        item.assetKind
      ).impressions += 1;
    }

    for (const item of clicks) {
      ensureBucket(
        item.assetId,
        item.assetTitle,
        item.assetHref ?? null,
        item.assetKind
      ).clicks += 1;
    }

    for (const item of conversions) {
      if (!item.assetId) continue;

      ensureBucket(
        item.assetId,
        item.assetTitle ?? item.assetId,
        item.assetHref ?? null,
        item.assetKind ?? "unknown"
      ).conversions += 1;
    }

    for (const followup of followups) {
      const sessionImpressions = followup.session?.impressions ?? [];
      const sessionClicks = followup.session?.clicks ?? [];

      const touchedAssetIds = new Set<string>([
        ...sessionImpressions.map((x: any) => x.assetId),
        ...sessionClicks.map((x: any) => x.assetId),
      ]);

      for (const assetId of touchedAssetIds) {
        const source =
          sessionClicks.find((x: any) => x.assetId === assetId) ||
          sessionImpressions.find((x: any) => x.assetId === assetId);

        if (!source) continue;

        const entry = ensureBucket(
          source.assetId,
          source.assetTitle,
          source.assetHref ?? null,
          source.assetKind
        );

        if (followup.convertedAfterGuidance) {
          entry.assistedConversions += 1;
        }
        if (followup.routeImproved) {
          entry.routeImprovements += 1;
        }
        if ((followup.readinessDelta ?? 0) > 0) {
          entry.readinessImprovements += 1;
        }
        entry.clarityImprovements += Math.max(0, Number(followup.clarityDelta ?? 0));
        entry.authorityImprovements += Math.max(
          0,
          Number(followup.authorityDelta ?? 0)
        );
      }
    }

    const rows = Array.from(bucket.values());

    await prisma.$transaction(
      rows.map((row) => {
        const efficacy = deriveDecisionEfficacy(row);

        return prisma.decisionAssetEfficacy.upsert({
          where: { assetId: row.assetId },
          update: {
            assetTitle: row.assetTitle,
            assetHref: row.assetHref,
            assetKind: row.assetKind,
            impressions: row.impressions,
            clicks: row.clicks,
            conversions: row.conversions,
            assistedConversions: row.assistedConversions,
            routeImprovements: row.routeImprovements,
            readinessImprovements: row.readinessImprovements,
            clarityImprovements: row.clarityImprovements,
            authorityImprovements: row.authorityImprovements,
            efficacyScore: efficacy.efficacyScore,
            decisionUsefulnessScore: efficacy.decisionUsefulnessScore,
            confidenceScore: efficacy.confidenceScore,
            lastEvaluatedAt: new Date(),
          },
          create: {
            assetId: row.assetId,
            assetTitle: row.assetTitle,
            assetHref: row.assetHref,
            assetKind: row.assetKind,
            impressions: row.impressions,
            clicks: row.clicks,
            conversions: row.conversions,
            assistedConversions: row.assistedConversions,
            routeImprovements: row.routeImprovements,
            readinessImprovements: row.readinessImprovements,
            clarityImprovements: row.clarityImprovements,
            authorityImprovements: row.authorityImprovements,
            efficacyScore: efficacy.efficacyScore,
            decisionUsefulnessScore: efficacy.decisionUsefulnessScore,
            confidenceScore: efficacy.confidenceScore,
            lastEvaluatedAt: new Date(),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      processedAssets: rows.length,
    });
  } catch (error) {
    console.error("[DECISION_EFFICACY_REBUILD_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to rebuild decision efficacy.",
      },
      { status: 500 }
    );
  }
}