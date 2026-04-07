import {
  buildDecisionSignalProfiles,
  type DecisionAssetContextRow,
  type DecisionSignalProfile,
} from "@/lib/decision/build-decision-signal-profile";

export type RecommendationPriority = "PRIMARY" | "SECONDARY" | "TERTIARY";

export type RecommendationReason = {
  code: string;
  label: string;
  value?: number | string | boolean;
};

export type RecommendationAsset = {
  assetId: string;
  assetTitle: string;
  assetHref: string | null;
  assetKind: string;
  contextType: string;
  contextValue: string;
  rankingScore: number;
  resonanceScore: number;
  resonanceBand: string;
  confidenceScore: number;
  usefulnessScore: number;
  governanceRiskScore: number;
  priority: RecommendationPriority;
  reasons: RecommendationReason[];
  constitutionalSource: boolean;
  drifts: DecisionSignalProfile["drifts"];
};

export type RecommendationContext = {
  route?: string | null;
  readinessTier?: string | null;
  authorityType?: string | null;
  orgState?: string | null;
  sector?: string | null;
  marketRiskBand?: string | null;
  revenueBand?: string | null;
};

export type RecommendationBuildResult = {
  generatedAt: string;
  summary: {
    totalCandidates: number;
    primaryCount: number;
    secondaryCount: number;
    tertiaryCount: number;
  };
  recommendations: RecommendationAsset[];
};

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function roundTo(value: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function matchesContext(
  profile: DecisionSignalProfile,
  context: RecommendationContext,
): boolean {
  const pairs: Array<[keyof RecommendationContext, string]> = [
    ["route", "route"],
    ["readinessTier", "readinessTier"],
    ["authorityType", "authorityType"],
    ["orgState", "orgState"],
    ["sector", "sector"],
    ["marketRiskBand", "marketRiskBand"],
    ["revenueBand", "revenueBand"],
  ];

  return pairs.some(([contextKey, type]) => {
    const wanted = normalizeString(context[contextKey]);
    if (!wanted) return false;

    return (
      normalizeString(profile.contextType).toLowerCase() === type.toLowerCase() &&
      normalizeString(profile.contextValue).toLowerCase() === wanted.toLowerCase()
    );
  });
}

function buildReasons(
  profile: DecisionSignalProfile,
  context: RecommendationContext,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [
    {
      code: "RANKING_SCORE",
      label: "Ranking score",
      value: profile.rankingScore,
    },
    {
      code: "RESONANCE_BAND",
      label: "Resonance band",
      value: profile.resonanceBand,
    },
    {
      code: "USEFULNESS_SCORE",
      label: "Usefulness score",
      value: profile.usefulnessScore,
    },
  ];

  if (matchesContext(profile, context)) {
    reasons.push({
      code: "CONTEXT_MATCH",
      label: "Direct context match",
      value: `${profile.contextType}:${profile.contextValue}`,
    });
  }

  if (profile.constitutionalSource) {
    reasons.push({
      code: "CONSTITUTIONAL_SOURCE",
      label: "Constitutional source",
      value: true,
    });
  }

  if (profile.totalConversionRate > 0) {
    reasons.push({
      code: "CONVERSION_SIGNAL",
      label: "Conversion signal",
      value: profile.totalConversionRate,
    });
  }

  if (profile.routeImprovements > 0 || profile.readinessImprovements > 0) {
    reasons.push({
      code: "IMPROVEMENT_SIGNAL",
      label: "Improvement signal",
      value: roundTo(profile.routeImprovements + profile.readinessImprovements, 2),
    });
  }

  if (profile.topDriftSeverity) {
    reasons.push({
      code: "DRIFT_MONITORING",
      label: "Governance drift monitored",
      value: profile.topDriftSeverity,
    });
  }

  return reasons;
}

function priorityFor(index: number): RecommendationPriority {
  if (index === 0) return "PRIMARY";
  if (index <= 2) return "SECONDARY";
  return "TERTIARY";
}

function scoreCandidate(
  profile: DecisionSignalProfile,
  context: RecommendationContext,
): number {
  const contextBonus = matchesContext(profile, context) ? 12 : 0;
  const constitutionalBonus = profile.constitutionalSource ? 4 : 0;
  const riskPenalty = profile.governanceRiskScore * 0.12;

  return roundTo(
    profile.rankingScore + contextBonus + constitutionalBonus - riskPenalty,
    4,
  );
}

export function buildDecisionRecommendations(
  rows: DecisionAssetContextRow[],
  context: RecommendationContext = {},
  limit = 8,
): RecommendationBuildResult {
  const profiles = buildDecisionSignalProfiles(rows);

  const ranked = [...profiles]
    .map((profile) => ({
      profile,
      candidateScore: scoreCandidate(profile, context),
    }))
    .sort((a, b) => b.candidateScore - a.candidateScore)
    .slice(0, Math.max(1, limit));

  const recommendations: RecommendationAsset[] = ranked.map(
    ({ profile }, index) => ({
      assetId: profile.assetId,
      assetTitle: profile.assetTitle,
      assetHref: profile.assetHref,
      assetKind: profile.assetKind,
      contextType: profile.contextType,
      contextValue: profile.contextValue,
      rankingScore: profile.rankingScore,
      resonanceScore: profile.resonanceScore,
      resonanceBand: profile.resonanceBand,
      confidenceScore: profile.confidenceScore,
      usefulnessScore: profile.usefulnessScore,
      governanceRiskScore: profile.governanceRiskScore,
      priority: priorityFor(index),
      reasons: buildReasons(profile, context),
      constitutionalSource: profile.constitutionalSource,
      drifts: profile.drifts,
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCandidates: profiles.length,
      primaryCount: recommendations.filter((item) => item.priority === "PRIMARY")
        .length,
      secondaryCount: recommendations.filter(
        (item) => item.priority === "SECONDARY",
      ).length,
      tertiaryCount: recommendations.filter((item) => item.priority === "TERTIARY")
        .length,
    },
    recommendations,
  };
}

/**
 * Backward-compatible alias for older report routes.
 * This keeps existing imports working while the codebase converges on one SSOT name.
 */
export function buildExecutiveReportRecommendations(
  rows: DecisionAssetContextRow[],
  context: RecommendationContext = {},
  limit = 8,
): RecommendationBuildResult {
  return buildDecisionRecommendations(rows, context, limit);
}

export default {
  buildDecisionRecommendations,
  buildExecutiveReportRecommendations,
};