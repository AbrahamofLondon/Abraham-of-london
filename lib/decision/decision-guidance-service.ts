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
import { getAllDecisionAssetsFromContent } from "@/lib/decision/content-asset-adapter";
import {
  deriveConstitutionalAssessment,
  type ConstitutionalAssessment,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import type {
  ExecutiveReportConstitution,
  ExecutiveReportGuidance,
} from "@/lib/admin/reporting/types";

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
  governedAssets: Array<{
    id: string;
    title: string;
    href?: string | null;
    kind: string;
    score: number;
    summary: string;
    reasons: string[];
  }>;
  guidance: {
    summary: string;
    rationale: string[];
    recommendations: Array<{
      id: string;
      title: string;
      href?: string | null;
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
        acc[row.assetId]!.push({
          assetId: row.assetId,
          contextType: row.contextType,
          contextValue: row.contextValue,
          contextualWeight: row.contextualWeight,
          confidenceScore: row.confidenceScore,
          usefulnessScore: row.usefulnessScore,
        });
        return acc;
      },
      {},
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

function toExecutiveConstitution(
  assessment: ConstitutionalAssessment,
): ExecutiveReportConstitution {
  return {
    route: assessment.route,
    confidence: Math.round(
      (assessment.clarityScore +
        assessment.authorityScore +
        assessment.governanceScore) /
        3,
    ),
    priority: assessment.priority,
    temperature: assessment.temperature,
    orgState: assessment.orgState,
    posture: assessment.orgState,
    readinessTier: assessment.readinessTier,
    authorityType: assessment.authorityType,
    revenueBand: assessment.revenueBand,
    marketRiskBand: assessment.marketRiskBand,
    clarityScore: assessment.clarityScore,
    authorityScore: assessment.authorityScore,
    governanceScore: assessment.governanceScore,
    severityScore: assessment.severityScore,
    revenueScore: assessment.revenueScore,
    dominantDomains: assessment.dominantDomains,
    failureModes: assessment.failureModes,
    requiredInterventions: assessment.requiredInterventions,
    sponsorTypes: assessment.sponsorTypes,
    worldviewAnchors: assessment.worldviewAnchors,
    disqualifiersTriggered:
      assessment.route === "REJECT" ? ["CONSTITUTIONAL_REJECTION"] : [],
    escalationAllowed: assessment.route !== "REJECT",
    narrativeSummary: assessment.narrativeSummary,
    rationale: assessment.rationale,
  };
}

function mapAssemblerGuidance(
  guidance: ExecutiveReportGuidance,
): ConstitutionalDecisionGuidanceResponse["guidance"] {
  return {
    summary: guidance.summary,
    rationale: guidance.rationale,
    nextAction: guidance.nextAction,
    recommendations: guidance.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href ?? null,
      kind: item.kind,
      score: item.score,
      summary: item.summary,
      reasons: item.reasons,
    })),
  };
}

export async function buildDecisionGuidance(
  request: ConstitutionalDecisionGuidanceRequest,
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
    limit: Math.max((request.options?.assetLimit ?? 6) * 3, 18),
    minScore: Math.max(10, request.options?.minAssetScore ?? 18),
    performanceMap,
    contextualPerformanceMap,
  });

  const governed = applyRecommendationGovernance(matchedAssets, pseudoContext as any, {
    rules: governanceRules,
    maxPerKind: 3,
    minDiversityKinds: 2,
  });

  const assembler = await assembleConstitutionalGuidance({
    intake: request.intake as any,
    constitution: toExecutiveConstitution(constitution),
    assetLimit: request.options?.assetLimit ?? 6,
    minAssetScore: request.options?.minAssetScore ?? 18,
    options: {
      assetLimit: request.options?.assetLimit ?? 6,
      minAssetScore: request.options?.minAssetScore ?? 18,
      maxPerKind: 2,
      minDiversityKinds: 2,
    },
  });

  const governedAssets = assembler.guidance.recommendations.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href ?? null,
    kind: item.kind,
    score: item.score,
    summary: item.summary,
    reasons: item.reasons,
  }));

  return {
    constitution,
    matchedAssets,
    governedAssets,
    guidance: mapAssemblerGuidance(assembler.guidance),
    diagnostics: {
      assetPoolSize: assets.length,
      matchedAssetCount: governedAssets.length,
      governanceRuleCount: governanceRules.length + assembler.diagnostics.governanceRuleCount,
      governanceSuppressedCount:
        governed.suppressed.length + assembler.diagnostics.governanceSuppressedCount,
      adaptiveAssetsLoaded: Object.keys(performanceMap).length,
      contextualAssetsLoaded: Object.keys(contextualPerformanceMap).length,
    },
  };
}
