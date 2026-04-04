// lib/decision/decision-efficacy-engine.ts

export interface AssetEfficacyInput {
  impressions: number;
  clicks: number;
  conversions: number;
  assistedConversions: number;
  routeImprovements: number;
  readinessImprovements: number;
  clarityImprovements: number;
  authorityImprovements: number;
}

export interface AssetEfficacyResult {
  efficacyScore: number;
  decisionUsefulnessScore: number;
  confidenceScore: number;
}

function roundTo(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function safeRate(num: number, den: number): number {
  if (!den || den <= 0) return 0;
  return num / den;
}

export function deriveDecisionEfficacy(
  input: AssetEfficacyInput
): AssetEfficacyResult {
  const impressions = Math.max(0, input.impressions || 0);
  const clicks = Math.max(0, input.clicks || 0);
  const conversions = Math.max(0, input.conversions || 0);
  const assistedConversions = Math.max(0, input.assistedConversions || 0);
  const routeImprovements = Math.max(0, input.routeImprovements || 0);
  const readinessImprovements = Math.max(0, input.readinessImprovements || 0);
  const clarityImprovements = Math.max(0, input.clarityImprovements || 0);
  const authorityImprovements = Math.max(0, input.authorityImprovements || 0);

  const ctr = safeRate(clicks, impressions);
  const cvr = safeRate(conversions, clicks || impressions);
  const assistRate = safeRate(assistedConversions, impressions);
  const routeImproveRate = safeRate(routeImprovements, impressions);
  const readinessImproveRate = safeRate(readinessImprovements, impressions);

  const avgCognitiveImprovement =
    (clarityImprovements + authorityImprovements) / Math.max(1, impressions);

  const confidenceScore = roundTo(Math.min(1, impressions / 100), 6);

  const decisionUsefulnessScore = roundTo(
    routeImproveRate * 30 +
      readinessImproveRate * 22 +
      avgCognitiveImprovement * 10 +
      assistRate * 18 +
      cvr * 20,
    6
  );

  const efficacyScore = roundTo(
    (decisionUsefulnessScore + ctr * 10) * (0.55 + confidenceScore * 0.45),
    6
  );

  return {
    efficacyScore,
    decisionUsefulnessScore,
    confidenceScore,
  };
}