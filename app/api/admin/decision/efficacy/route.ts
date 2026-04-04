// app/api/admin/decision/efficacy/route.ts
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

function safeString(value: unknown, fallback = "UNKNOWN"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

type ConditionBucket = {
  key: string;
  assets: Set<string>;
  impressions: number;
  clicks: number;
  conversions: number;
  followups: number;
  routeImprovements: number;
  readinessImprovements: number;
  clarityGain: number;
  authorityGain: number;
  governanceGain: number;
};

type DecisionAssetEfficacyRow = {
  assetId: string;
  assetTitle: string | null;
  assetHref: string | null;
  assetKind: string | null;
  impressions: number | string | null;
  clicks: number | string | null;
  conversions: number | string | null;
  assistedConversions: number | string | null;
  routeImprovements: number | string | null;
  readinessImprovements: number | string | null;
  clarityImprovements: number | string | null;
  authorityImprovements: number | string | null;
  efficacyScore: number | string | null;
  decisionUsefulnessScore: number | string | null;
  confidenceScore: number | string | null;
  lastEvaluatedAt: Date | string | null;
  updatedAt?: Date | string | null;
};

type SessionAssetRef = {
  assetId: string;
};

type FollowupSession = {
  sector?: string | null;
  route?: string | null;
  readinessTier?: string | null;
  authorityType?: string | null;
  orgState?: string | null;
  impressions?: SessionAssetRef[];
  clicks?: SessionAssetRef[];
};

type DecisionSessionFollowupRow = {
  routeImproved?: boolean | null;
  readinessDelta?: number | string | null;
  convertedAfterGuidance?: boolean | null;
  clarityDelta?: number | string | null;
  authorityDelta?: number | string | null;
  governanceDelta?: number | string | null;
  session?: FollowupSession | null;
};

function createBucket(key: string): ConditionBucket {
  return {
    key,
    assets: new Set(),
    impressions: 0,
    clicks: 0,
    conversions: 0,
    followups: 0,
    routeImprovements: 0,
    readinessImprovements: 0,
    clarityGain: 0,
    authorityGain: 0,
    governanceGain: 0,
  };
}

function serializeBucketMap(map: Map<string, ConditionBucket>) {
  return [...map.values()]
    .map((bucket) => {
      const ctr = bucket.impressions > 0 ? bucket.clicks / bucket.impressions : 0;
      const conversionRate = bucket.followups > 0 ? bucket.conversions / bucket.followups : 0;
      const routeImproveRate = bucket.followups > 0 ? bucket.routeImprovements / bucket.followups : 0;
      const readinessImproveRate =
        bucket.followups > 0 ? bucket.readinessImprovements / bucket.followups : 0;

      return {
        key: bucket.key,
        assetCount: bucket.assets.size,
        impressions: bucket.impressions,
        clicks: bucket.clicks,
        conversions: bucket.conversions,
        followups: bucket.followups,
        routeImprovements: bucket.routeImprovements,
        readinessImprovements: bucket.readinessImprovements,
        ctr: Number(ctr.toFixed(4)),
        conversionRate: Number(conversionRate.toFixed(4)),
        routeImproveRate: Number(routeImproveRate.toFixed(4)),
        readinessImproveRate: Number(readinessImproveRate.toFixed(4)),
        avgClarityGain: Number(
          (bucket.followups > 0 ? bucket.clarityGain / bucket.followups : 0).toFixed(4),
        ),
        avgAuthorityGain: Number(
          (bucket.followups > 0 ? bucket.authorityGain / bucket.followups : 0).toFixed(4),
        ),
        avgGovernanceGain: Number(
          (bucket.followups > 0 ? bucket.governanceGain / bucket.followups : 0).toFixed(4),
        ),
      };
    })
    .sort(
      (a, b) =>
        b.routeImproveRate - a.routeImproveRate ||
        b.conversionRate - a.conversionRate ||
        b.followups - a.followups,
    );
}

export async function GET() {
  try {
    const prisma =
      typeof db.getPrismaClient === "function"
        ? await db.getPrismaClient()
        : null;

    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable." },
        { status: 503 },
      );
    }

    const [assets, followups] = await Promise.all([
      (prisma as any).decisionAssetEfficacy.findMany({
        orderBy: { updatedAt: "desc" },
      }) as Promise<DecisionAssetEfficacyRow[]>,
      (prisma as any).decisionSessionFollowup.findMany({
        include: {
          session: {
            include: {
              impressions: true,
              clicks: true,
            },
          },
        },
      }) as Promise<DecisionSessionFollowupRow[]>,
    ]);

    const normalized = assets.map((item: DecisionAssetEfficacyRow) => ({
      assetId: item.assetId,
      assetTitle: item.assetTitle,
      assetHref: item.assetHref,
      assetKind: item.assetKind,
      impressions: toNumber(item.impressions),
      clicks: toNumber(item.clicks),
      conversions: toNumber(item.conversions),
      assistedConversions: toNumber(item.assistedConversions),
      routeImprovements: toNumber(item.routeImprovements),
      readinessImprovements: toNumber(item.readinessImprovements),
      clarityImprovements: toNumber(item.clarityImprovements),
      authorityImprovements: toNumber(item.authorityImprovements),
      efficacyScore: toNumber(item.efficacyScore),
      decisionUsefulnessScore: toNumber(item.decisionUsefulnessScore),
      confidenceScore: toNumber(item.confidenceScore),
      lastEvaluatedAt: item.lastEvaluatedAt,
    }));

    const bySector = new Map<string, ConditionBucket>();
    const byRoute = new Map<string, ConditionBucket>();
    const byReadinessTier = new Map<string, ConditionBucket>();
    const byAuthorityType = new Map<string, ConditionBucket>();
    const byOrgState = new Map<string, ConditionBucket>();

    for (const followup of followups) {
      const session = followup.session;
      if (!session) continue;

      const touchedAssets = new Set<string>();

      for (const imp of session.impressions || []) {
        if (imp?.assetId) touchedAssets.add(imp.assetId);
      }

      for (const click of session.clicks || []) {
        if (click?.assetId) touchedAssets.add(click.assetId);
      }

      const clickCount = (session.clicks || []).length;

      const conditionSets = [
        { map: bySector, key: safeString(session.sector) },
        { map: byRoute, key: safeString(session.route) },
        { map: byReadinessTier, key: safeString(session.readinessTier) },
        { map: byAuthorityType, key: safeString(session.authorityType) },
        { map: byOrgState, key: safeString(session.orgState) },
      ];

      for (const { map, key } of conditionSets) {
        if (!map.has(key)) map.set(key, createBucket(key));
        const bucket = map.get(key)!;

        for (const assetId of touchedAssets) {
          bucket.assets.add(assetId);
          bucket.impressions += 1;
        }

        bucket.clicks += clickCount;
        bucket.followups += 1;

        if (followup.routeImproved) bucket.routeImprovements += 1;
        if (toNumber(followup.readinessDelta) > 0) bucket.readinessImprovements += 1;
        if (followup.convertedAfterGuidance) bucket.conversions += 1;

        bucket.clarityGain += Math.max(0, toNumber(followup.clarityDelta));
        bucket.authorityGain += Math.max(0, toNumber(followup.authorityDelta));
        bucket.governanceGain += Math.max(0, toNumber(followup.governanceDelta));
      }
    }

    const summary = {
      totalAssets: normalized.length,
      totalFollowups: followups.length,
      routeImprovedSessions: followups.filter((f) => Boolean(f.routeImproved)).length,
      convertedAfterGuidance: followups.filter((f) => Boolean(f.convertedAfterGuidance)).length,
      avgEfficacyScore: normalized.length
        ? Number(
            (
              normalized.reduce((acc, x) => acc + x.efficacyScore, 0) /
              normalized.length
            ).toFixed(4),
          )
        : 0,
    };

    return NextResponse.json({
      ok: true,
      summary,
      assets: normalized,
      conditional: {
        bySector: serializeBucketMap(bySector),
        byRoute: serializeBucketMap(byRoute),
        byReadinessTier: serializeBucketMap(byReadinessTier),
        byAuthorityType: serializeBucketMap(byAuthorityType),
        byOrgState: serializeBucketMap(byOrgState),
      },
    });
  } catch (error) {
    console.error("[ADMIN_DECISION_EFFICACY_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load decision efficacy metrics." },
      { status: 500 },
    );
  }
}