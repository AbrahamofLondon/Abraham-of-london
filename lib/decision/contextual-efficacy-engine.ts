// lib/decision/contextual-efficacy-engine.ts

export interface ContextualPerformanceInput {
  impressions: number;
  clicks: number;
  conversions: number;
  assistedConversions: number;
  routeImprovements: number;
  readinessImprovements: number;
  clarityGain: number;
  authorityGain: number;
}

export interface ContextualEfficacyResult {
  contextualWeight: number;
  confidenceScore: number;
  usefulnessScore: number;
}

function safeRate(num: number, den: number): number {
  if (!den || den <= 0) return 0;
  return num / den;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

/**
 * Conservative context weighting.
 * Neutral = 1.0
 * Strong context evidence can lift toward 2.4
 * Weak / poor context can damp toward 0.7
 */
export function deriveContextualEfficacy(
  input: ContextualPerformanceInput
): ContextualEfficacyResult {
  const impressions = Math.max(0, input.impressions || 0);
  const clicks = Math.max(0, input.clicks || 0);
  const conversions = Math.max(0, input.conversions || 0);
  const assistedConversions = Math.max(0, input.assistedConversions || 0);
  const routeImprovements = Math.max(0, input.routeImprovements || 0);
  const readinessImprovements = Math.max(0, input.readinessImprovements || 0);
  const clarityGain = Math.max(0, input.clarityGain || 0);
  const authorityGain = Math.max(0, input.authorityGain || 0);

  if (impressions < 3) {
    return {
      contextualWeight: 1,
      confidenceScore: roundTo(impressions / 20),
      usefulnessScore: 0,
    };
  }

  const ctr = safeRate(clicks, impressions);
  const cvr = safeRate(conversions, clicks || impressions);
  const assistRate = safeRate(assistedConversions, impressions);
  const routeImproveRate = safeRate(routeImprovements, impressions);
  const readinessImproveRate = safeRate(readinessImprovements, impressions);
  const clarityRate = safeRate(clarityGain, impressions);
  const authorityRate = safeRate(authorityGain, impressions);

  const confidenceScore = roundTo(Math.min(1, impressions / 50), 6);

  const usefulnessScore = roundTo(
    ctr * 10 +
      cvr * 20 +
      assistRate * 14 +
      routeImproveRate * 22 +
      readinessImproveRate * 18 +
      clarityRate * 8 +
      authorityRate * 8,
    6
  );

  const normalized = usefulnessScore / 20;
  const contextualWeight = roundTo(clamp(1 + normalized * confidenceScore, 0.7, 2.4), 6);

  return {
    contextualWeight,
    confidenceScore,
    usefulnessScore,
  };
}