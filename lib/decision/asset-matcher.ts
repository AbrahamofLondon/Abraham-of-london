// lib/decision/asset-matcher.ts

import type { DecisionAsset } from "@/lib/decision/content-asset-adapter";
import type { DecisionContext } from "@/lib/decision/decision-context";
import type { AssetKind } from "@/lib/decision/decision-metadata";

export interface MatchedAsset extends DecisionAsset {
  matchScore: number;
  matchReasons: string[];
  rankingTrace?: {
    baseScore: number;
    adaptiveWeight: number;
    contextualWeights: Array<{
      contextType: string;
      contextValue: string;
      weight: number;
      confidenceScore?: number;
    }>;
    finalScore: number;
  };
}

export interface AssetPerformanceOverlay {
  adaptiveWeight?: number;
  clickThroughRate?: number;
  conversionRate?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface ContextualPerformanceOverlay {
  assetId: string;
  contextType: "sector" | "route" | "readinessTier" | "authorityType";
  contextValue: string;
  contextualWeight?: number;
  confidenceScore?: number;
  usefulnessScore?: number;
}

function includesIgnoreCase(list: string[] | undefined, value: string): boolean {
  if (!list?.length) return false;
  const target = value.trim().toLowerCase();
  return list.some((item) => item.trim().toLowerCase() === target);
}

function overlapsIgnoreCase(a: string[] | undefined, b: string[] | undefined): string[] {
  if (!a?.length || !b?.length) return [];
  const setB = new Set(b.map((v) => v.trim().toLowerCase()));
  return a.filter((v) => setB.has(v.trim().toLowerCase()));
}

function roundTo(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function buildContextualLift(
  overlays: ContextualPerformanceOverlay[] | undefined,
  context: DecisionContext
) {
  if (!overlays?.length) {
    return {
      combinedWeight: 1,
      traces: [] as Array<{
        contextType: string;
        contextValue: string;
        weight: number;
        confidenceScore?: number;
      }>,
    };
  }

  const requested = [
    { contextType: "sector", contextValue: context.sector || "UNSPECIFIED" },
    { contextType: "route", contextValue: context.route || "UNKNOWN" },
    {
      contextType: "readinessTier",
      contextValue: context.readinessTier || "UNKNOWN",
    },
    {
      contextType: "authorityType",
      contextValue: context.authorityType || "UNKNOWN",
    },
  ];

  const traces = requested
    .map((item) => {
      const found = overlays.find(
        (overlay) =>
          overlay.contextType === item.contextType &&
          overlay.contextValue.toLowerCase() === item.contextValue.toLowerCase()
      );

      if (!found) return null;

      return {
        contextType: found.contextType,
        contextValue: found.contextValue,
        weight: found.contextualWeight ?? 1,
        confidenceScore: found.confidenceScore,
      };
    })
    .filter(Boolean) as Array<{
    contextType: string;
    contextValue: string;
    weight: number;
    confidenceScore?: number;
  }>;

  if (traces.length === 0) {
    return {
      combinedWeight: 1,
      traces: [],
    };
  }

  const averageWeight =
    traces.reduce((acc, item) => acc + item.weight, 0) / traces.length;

  return {
    combinedWeight: roundTo(averageWeight, 6),
    traces,
  };
}

export function scoreAssetMatch(
  asset: DecisionAsset,
  context: DecisionContext,
  performance?: AssetPerformanceOverlay,
  contextualOverlays?: ContextualPerformanceOverlay[]
): MatchedAsset {
  let baseScore = 0;
  const reasons: string[] = [];

  if (asset.orgStates?.includes(context.orgState)) {
    baseScore += 20;
    reasons.push(`Matches org state: ${context.orgState}`);
  }

  if (asset.revenueBands?.includes(context.revenueBand)) {
    baseScore += 14;
    reasons.push(`Matches revenue band: ${context.revenueBand}`);
  }

  if (asset.readinessTiers?.includes(context.readinessTier)) {
    baseScore += 16;
    reasons.push(`Matches readiness tier: ${context.readinessTier}`);
  }

  if (context.sector && asset.sectors?.includes(context.sector as any)) {
    baseScore += 12;
    reasons.push(`Matches sector: ${context.sector}`);
  }

  if (asset.marketRiskBands?.includes(context.marketRiskBand)) {
    baseScore += 8;
    reasons.push(`Matches market risk: ${context.marketRiskBand}`);
  }

  const failureMatches = overlapsIgnoreCase(
    asset.failureModes as string[],
    context.primaryFailureModes
  );
  if (failureMatches.length) {
    baseScore += Math.min(18, failureMatches.length * 6);
    reasons.push(`Failure-mode fit: ${failureMatches.join(", ")}`);
  }

  const domainMatches = overlapsIgnoreCase(
    asset.dominantDomains as string[],
    context.dominantDomains
  );
  if (domainMatches.length) {
    baseScore += Math.min(12, domainMatches.length * 4);
    reasons.push(`Domain fit: ${domainMatches.join(", ")}`);
  }

  const interventionMatches = overlapsIgnoreCase(
    asset.requiredInterventions as string[],
    context.requiredInterventions
  );
  if (interventionMatches.length) {
    baseScore += Math.min(15, interventionMatches.length * 5);
    reasons.push(`Intervention fit: ${interventionMatches.join(", ")}`);
  }

  if (asset.appliesTo?.length) {
    if (
      includesIgnoreCase(asset.appliesTo, context.route) ||
      includesIgnoreCase(asset.appliesTo, context.priority) ||
      includesIgnoreCase(asset.appliesTo, context.temperature) ||
      includesIgnoreCase(asset.appliesTo, context.authorityType)
    ) {
      baseScore += 10;
      reasons.push("General applicability fit");
    }
  }

  baseScore += asset.priorityWeight ?? 0;
  baseScore += (asset.confidenceWeight ?? 0) + (asset.metadataConfidence - 50) / 10;

  if (asset.metadataConfidence >= 80) {
    reasons.push("High-confidence metadata");
  } else if (asset.metadataConfidence < 40) {
    reasons.push("Low-confidence metadata");
  }

  const adaptiveWeight = performance?.adaptiveWeight ?? 1;
  const contextualLift = buildContextualLift(contextualOverlays, context);

  if (adaptiveWeight > 1.05) {
    reasons.push(`Performance lift: ${adaptiveWeight.toFixed(2)}x`);
  } else if (adaptiveWeight < 0.95) {
    reasons.push(`Performance dampener: ${adaptiveWeight.toFixed(2)}x`);
  }

  if (contextualLift.traces.length > 0) {
    reasons.push(
      `Contextual lift: ${contextualLift.combinedWeight.toFixed(2)}x`
    );
  }

  const finalScore = roundTo(baseScore * adaptiveWeight * contextualLift.combinedWeight, 2);

  return {
    ...asset,
    matchScore: finalScore,
    matchReasons: reasons,
    rankingTrace: {
      baseScore: roundTo(baseScore, 4),
      adaptiveWeight: roundTo(adaptiveWeight, 4),
      contextualWeights: contextualLift.traces,
      finalScore,
    },
  };
}

export function matchDecisionAssets(
  assets: DecisionAsset[],
  context: DecisionContext,
  options?: {
    kinds?: AssetKind[];
    minScore?: number;
    limit?: number;
    performanceMap?: Record<string, AssetPerformanceOverlay>;
    contextualPerformanceMap?: Record<string, ContextualPerformanceOverlay[]>;
  }
): MatchedAsset[] {
  const filtered = options?.kinds?.length
    ? assets.filter((asset) => options.kinds!.includes(asset.kind))
    : assets;

  return filtered
    .map((asset) =>
      scoreAssetMatch(
        asset,
        context,
        options?.performanceMap?.[asset.id],
        options?.contextualPerformanceMap?.[asset.id]
      )
    )
    .filter((asset) => asset.matchScore >= (options?.minScore ?? 20))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, options?.limit ?? 8);
}