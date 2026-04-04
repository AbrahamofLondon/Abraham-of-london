// lib/decision/decision-guidance-service.ts

import { db } from "@/lib/db";
import {
  applyRecommendationGovernance,
  type GovernanceRule,
} from "@/lib/decision/recommendation-governance";
import {
  matchDecisionAssets,
  type AssetPerformanceOverlay,
  type ContextualPerformanceOverlay,
  type MatchedAsset,
} from "@/lib/decision/asset-matcher";
import {
  getAllDecisionAssetsFromContent,
} from "@/lib/decision/content-asset-adapter";
import {
  applyConstitutionalSelectionPolicy,
  buildConstitutionalGuidance,
  deriveConstitutionalAssessment,
  type ConstitutionalAssessment,
  type ConstitutionalAssetCandidate,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";

export interface ConstitutionalDecisionGuidanceRequest {
  intake: ConstitutionalIntake;
  options?: {
    assetLimit?: number;
    minAssetScore?: number;
  };
}

export interface ConstitutionalDecisionGuidanceResponse {
  constitution: ConstitutionalAssessment;
  matchedAssets: MatchedAsset[];
  governedAssets: ConstitutionalAssetCandidate[];
  guidance: {
    summary: string;
    rationale: string[];
    recommendations: Array<{
      id: string;
      title: string;
      href?: string;
      kind: string;
      score: number;
      summary: string;
      reasons: string[];
    }>;
    nextAction: string;
  };
  diagnostics: {
    assetPoolSize: number;
    matchedAssetCount: number;
    governanceRuleCount: number;
    governanceSuppressedCount: number;
    adaptiveAssetsLoaded: number;
    contextualAssetsLoaded: number;
  };
}

async function getPrisma() {
  return typeof (db as any)?.getPrismaClient === "function"
    ? await (db as any).getPrismaClient()
    : db;
}

async function getPerformanceMap(): Promise<Record<string, AssetPerformanceOverlay>> {
  try {
    const prisma = await getPrisma();
    if (!prisma?.decisionAssetPerformance) return {};
    const rows = await prisma.decisionAssetPerformance.findMany();

    return rows.reduce((acc: Record<string, AssetPerformanceOverlay>, row: any) => {
      acc[row.assetId] = {
        adaptiveWeight: row.adaptiveWeight,
        clickThroughRate: row.clickThroughRate,
        conversionRate: row.conversionRate,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
      };
      return acc;
    }, {});
  } catch {
    return {};
  }
}

async function getContextualPerformanceMap(): Promise<
  Record<string, ContextualPerformanceOverlay[]>
> {
  try {
    const prisma = await getPrisma();
    if (!prisma?.decisionAssetContextPerformance) return {};
    const rows = await prisma.decisionAssetContextPerformance.findMany();

    return rows.reduce(
      (acc: Record<string, ContextualPerformanceOverlay[]>, row: any) => {
        if (!acc[row.assetId]) acc[row.assetId] = [];
        acc[row.assetId].push({
          assetId: row.assetId,
          contextType: row.contextType,
          contextValue: row.contextValue,
          contextualWeight: row.contextualWeight,
          confidenceScore: row.confidenceScore,
          usefulnessScore: row.usefulnessScore,
        });
        return acc;
      },
      {}
    );
  } catch {
    return {};
  }
}

async function getGovernanceRules(): Promise<GovernanceRule[]> {
  try {
    const prisma = await getPrisma();
    if (!prisma?.decisionAssetGovernanceRule) return [];
    return prisma.decisionAssetGovernanceRule.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function buildDecisionGuidance(
  request: ConstitutionalDecisionGuidanceRequest
): Promise<ConstitutionalDecisionGuidanceResponse> {
  const constitution = deriveConstitutionalAssessment(request.intake);
  const assets = getAllDecisionAssetsFromContent();

  const [performanceMap, contextualPerformanceMap, governanceRules] =
    await Promise.all([
      getPerformanceMap(),
      getContextualPerformanceMap(),
      getGovernanceRules(),
    ]);

  const pseudoContext = {
    route: constitution.route,
    priority: constitution.priority,
    temperature: constitution.temperature,
    orgState: constitution.orgState,
    readinessTier: constitution.readinessTier,
    authorityType: constitution.authorityType,
    revenueBand: constitution.revenueBand,
    marketRiskBand: constitution.marketRiskBand,
    sector: request.intake.sector || "general",
    dominantDomains: constitution.dominantDomains,
    primaryFailureModes: constitution.failureModes,
    requiredInterventions: constitution.requiredInterventions,
  };

  const matchedAssets = matchDecisionAssets(assets as any, pseudoContext as any, {
    limit: Math.max((request.options?.assetLimit ?? 6) * 2, 12),
    minScore: request.options?.minAssetScore ?? 18,
    performanceMap,
    contextualPerformanceMap,
  });

  const governed = applyRecommendationGovernance(
    matchedAssets,
    pseudoContext as any,
    {
      rules: governanceRules,
      maxPerKind: 2,
      minDiversityKinds: 2,
    }
  );

  const constitutionalAssets = applyConstitutionalSelectionPolicy(
    governed.governed as ConstitutionalAssetCandidate[],
    constitution,
    request.options?.assetLimit ?? 6
  );

  const guidance = buildConstitutionalGuidance(
    constitution,
    constitutionalAssets
  );

  return {
    constitution,
    matchedAssets,
    governedAssets: constitutionalAssets,
    guidance,
    diagnostics: {
      assetPoolSize: assets.length,
      matchedAssetCount: constitutionalAssets.length,
      governanceRuleCount: governanceRules.length,
      governanceSuppressedCount: governed.suppressed.length,
      adaptiveAssetsLoaded: Object.keys(performanceMap).length,
      contextualAssetsLoaded: Object.keys(contextualPerformanceMap).length,
    },
  };
}