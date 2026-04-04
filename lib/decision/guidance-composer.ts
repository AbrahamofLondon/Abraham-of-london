// lib/decision/guidance-composer.ts
// ============================================================================
// GUIDANCE COMPOSER
// Converts matched assets + context into decision-grade output
// ============================================================================

import type { MatchedAsset } from "@/lib/decision/asset-matcher";
import type { DecisionContext } from "@/lib/decision/decision-context";

export interface DecisionGuidance {
  summary: string;
  rationale: string[];
  recommendations: Array<{
    id: string;
    title: string;
    href?: string;
    kind: string;
    summary?: string;
    score: number;
    reasons: string[];
  }>;
  nextAction: string;
}

export function composeDecisionGuidance(args: {
  context: DecisionContext;
  matchedAssets: MatchedAsset[];
}): DecisionGuidance {
  const { context, matchedAssets } = args;

  const summary = [
    `The system reads this case as ${context.orgState.toLowerCase()} with a ${context.readinessTier.toLowerCase()} posture.`,
    context.primaryFailureModes.length
      ? `Primary failure pressure appears in ${context.primaryFailureModes.join(", ")}.`
      : `No dominant failure mode was isolated with high confidence.`,
    context.requiredInterventions.length
      ? `The immediate intervention stack is ${context.requiredInterventions.join(", ")}.`
      : `The case benefits from guided diagnostic clarification before escalation.`,
  ].join(" ");

  const rationale = [
    `Route posture: ${context.route}`,
    `Priority posture: ${context.priority}`,
    `Authority posture: ${context.authorityType}`,
    `Revenue band: ${context.revenueBand}`,
    `Market risk: ${context.marketRiskBand}`,
  ];

  let nextAction = "Run guided diagnostic before escalation.";
  if (context.route === "STRATEGY") {
    nextAction = "Escalate to strategy-room review with matched governance and execution assets.";
  } else if (context.route === "DIAGNOSTIC") {
    nextAction = "Surface the strongest diagnostic and corrective assets, then re-evaluate readiness.";
  }

  return {
    summary,
    rationale,
    recommendations: matchedAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      href: asset.href,
      kind: asset.kind,
      summary: asset.summary,
      score: asset.matchScore,
      reasons: asset.matchReasons,
    })),
    nextAction,
  };
}