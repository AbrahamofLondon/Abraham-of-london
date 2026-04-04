// lib/decision/report-recommendations-builder.ts
// ============================================================================
// REPORT RECOMMENDATIONS BUILDER
// Generates decision intelligence recommendations from executive report context
// ============================================================================

import { getAllDecisionAssetsFromContent } from "@/lib/decision/content-asset-adapter";
import type { DecisionAsset } from "@/lib/decision/content-asset-adapter";
import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";
import type {
  WorldviewAnchor,
  CommercialUseCase,
  DecisionAudience,
  TransformationStage,
} from "@/lib/decision/decision-metadata";

export type Recommendation = {
  type: "worldview" | "commercial" | "audience" | "transformation";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  assetId?: string;
  assetTitle?: string;
  assetHref?: string;
};

export type DecisionLayer = {
  worldviewAnchors: WorldviewAnchor[];
  commercialUseCases: CommercialUseCase[];
  audience: DecisionAudience[];
  transformationStage: TransformationStage[];
  matchedAssets: Array<{
    id: string;
    title: string;
    kind: string;
    confidence: number;
    href?: string;
  }>;
  recommendations: Recommendation[];
};

type ReportContext = {
  report: ExecutiveReport;
  organisationName: string;
  participantCount: number;
  campaignTitle: string;
};

function calculateAssetConfidence(
  asset: DecisionAsset,
  context: ReportContext
): number {
  let score = 0;

  // Check worldview anchors alignment with report state
  if (asset.worldviewAnchors?.length) {
    if (context.report.state === "DISORDERED" || context.report.state === "MISALIGNED") {
      if (asset.worldviewAnchors.includes("moral-order") || 
          asset.worldviewAnchors.includes("stewardship")) {
        score += 25;
      }
    }
    if (context.report.state === "DRIFTING") {
      if (asset.worldviewAnchors.includes("truth-discipline")) {
        score += 20;
      }
    }
    if (context.report.state === "ORDERED") {
      if (asset.worldviewAnchors.includes("covenantal-leadership")) {
        score += 15;
      }
    }
  }

  // Check commercial use cases alignment with failure modes
  if (asset.commercialUseCases?.length) {
    const failureModes = context.report.failureModes || [];
    
    if (failureModes.some(f => f.includes("Governance") || f.includes("authority"))) {
      if (asset.commercialUseCases.includes("board-review") ||
          asset.commercialUseCases.includes("institutional-realignment")) {
        score += 25;
      }
    }
    if (failureModes.some(f => f.includes("execution") || f.includes("cadence"))) {
      if (asset.commercialUseCases.includes("operating-model-reset") ||
          asset.commercialUseCases.includes("executive-alignment")) {
        score += 20;
      }
    }
    if (failureModes.some(f => f.includes("Trust") || f.includes("narrative"))) {
      if (asset.commercialUseCases.includes("culture-realignment") ||
          asset.commercialUseCases.includes("executive-reframing")) {
        score += 20;
      }
    }
  }

  // Check audience alignment with organisation context
  if (asset.audience?.length) {
    if (context.participantCount > 10) {
      if (asset.audience.includes("executives") || asset.audience.includes("boards")) {
        score += 15;
      }
    }
    if (context.participantCount <= 5) {
      if (asset.audience.includes("founders")) {
        score += 15;
      }
    }
    if (context.participantCount > 5 && context.participantCount <= 10) {
      if (asset.audience.includes("institution-builders")) {
        score += 12;
      }
    }
  }

  // Check transformation stage alignment with report state
  if (asset.transformationStage?.length) {
    if (context.report.state === "DISORDERED" && asset.transformationStage.includes("assess")) {
      score += 20;
    }
    if (context.report.state === "MISALIGNED" && asset.transformationStage.includes("diagnose")) {
      score += 18;
    }
    if (context.report.state === "DRIFTING" && asset.transformationStage.includes("realign")) {
      score += 15;
    }
    if (context.report.state === "ORDERED" && asset.transformationStage.includes("govern")) {
      score += 12;
    }
  }

  // Priority stack alignment
  if (asset.priorityWeight && context.report.priorityStack?.length) {
    score += Math.min(10, asset.priorityWeight);
  }

  return Math.min(100, score);
}

function generateRecommendations(
  assets: DecisionAsset[],
  context: ReportContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Top worldview anchor recommendation
  const worldviewAssets = assets.filter(a => a.worldviewAnchors?.length);
  if (worldviewAssets.length > 0) {
    const topWorldview = worldviewAssets[0];
    recommendations.push({
      type: "worldview",
      title: "Align with Foundational Worldview",
      description: `Consider engaging with "${topWorldview.title}" to establish ${topWorldview.worldviewAnchors?.join(", ")} framework for institutional integrity.`,
      priority: context.report.state === "DISORDERED" ? "high" : "medium",
      assetId: topWorldview.id,
      assetTitle: topWorldview.title,
      assetHref: topWorldview.href,
    });
  }

  // Top commercial use case recommendation based on failure modes
  const commercialAssets = assets.filter(a => a.commercialUseCases?.length);
  if (commercialAssets.length > 0) {
    const topCommercial = commercialAssets[0];
    const primaryUseCase = topCommercial.commercialUseCases?.[0];
    recommendations.push({
      type: "commercial",
      title: `${primaryUseCase?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
      description: `"${topCommercial.title}" provides frameworks for ${primaryUseCase} in ${context.organisationName}.`,
      priority: "high",
      assetId: topCommercial.id,
      assetTitle: topCommercial.title,
      assetHref: topCommercial.href,
    });
  }

  // Audience-specific recommendation
  const audienceAssets = assets.filter(a => a.audience?.length);
  if (audienceAssets.length > 0) {
    const topAudience = audienceAssets[0];
    recommendations.push({
      type: "audience",
      title: `${topAudience.audience?.map(a => a.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ")} Resource`,
      description: `Designed for ${topAudience.audience?.join(", ")}, "${topAudience.title}" addresses key leadership challenges.`,
      priority: "medium",
      assetId: topAudience.id,
      assetTitle: topAudience.title,
      assetHref: topAudience.href,
    });
  }

  // Transformation stage recommendation
  const stageAssets = assets.filter(a => a.transformationStage?.length);
  if (stageAssets.length > 0) {
    const topStage = stageAssets[0];
    const currentStage = topStage.transformationStage?.[0];
    recommendations.push({
      type: "transformation",
      title: `${currentStage?.toUpperCase()} Phase Resource`,
      description: `"${topStage.title}" supports the ${currentStage} phase of your transformation journey.`,
      priority: "medium",
      assetId: topStage.id,
      assetTitle: topStage.title,
      assetHref: topStage.href,
    });
  }

  return recommendations.slice(0, 5);
}

export async function buildExecutiveReportRecommendations(
  context: ReportContext
): Promise<DecisionLayer> {
  // Get all decision assets from content
  const allAssets = getAllDecisionAssetsFromContent();
  
  // Calculate confidence scores for each asset
  const scoredAssets = allAssets.map(asset => ({
    ...asset,
    confidence: calculateAssetConfidence(asset, context),
  }));
  
  // Sort by confidence and take top matches
  const matchedAssets = scoredAssets
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
    .map(asset => ({
      id: asset.id,
      title: asset.title,
      kind: asset.kind,
      confidence: asset.confidence,
      href: asset.href,
    }));
  
  // Aggregate unique metadata from top assets
  const topAssets = scoredAssets.slice(0, 5);
  
  const worldviewAnchors = [...new Set(
    topAssets.flatMap(a => a.worldviewAnchors || [])
  )] as WorldviewAnchor[];
  
  const commercialUseCases = [...new Set(
    topAssets.flatMap(a => a.commercialUseCases || [])
  )] as CommercialUseCase[];
  
  const audience = [...new Set(
    topAssets.flatMap(a => a.audience || [])
  )] as DecisionAudience[];
  
  const transformationStage = [...new Set(
    topAssets.flatMap(a => a.transformationStage || [])
  )] as TransformationStage[];
  
  // Generate recommendations
  const recommendations = generateRecommendations(scoredAssets.slice(0, 15), context);
  
  return {
    worldviewAnchors,
    commercialUseCases,
    audience,
    transformationStage,
    matchedAssets,
    recommendations,
  };
}