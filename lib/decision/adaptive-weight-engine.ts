// lib/decision/adaptive-weight-engine.ts

export interface AssetPerformanceSnapshot {
  assetId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  adaptiveWeight?: number;
}

function roundTo(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function safeRate(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return numerator / denominator;
}

/**
 * Conservative weighting:
 * - neutral base = 1.0
 * - strong CTR increases moderately
 * - conversion increases more heavily
 * - low data volume is damped
 */
export function deriveAdaptiveWeight(
  performance: AssetPerformanceSnapshot
): number {
  const impressions = Math.max(0, performance.impressions || 0);
  const clicks = Math.max(0, performance.clicks || 0);
  const conversions = Math.max(0, performance.conversions || 0);

  if (impressions < 5) {
    return 1;
  }

  const ctr = safeRate(clicks, impressions);
  const cvr = safeRate(conversions, clicks || impressions);

  const volumeFactor = Math.min(1, impressions / 100);

  const ctrLift = ctr * 0.75;
  const cvrLift = cvr * 1.5;

  const rawWeight = 1 + (ctrLift + cvrLift) * volumeFactor;

  return roundTo(Math.max(0.65, Math.min(2.5, rawWeight)));
}

export function derivePerformanceRates(performance: AssetPerformanceSnapshot) {
  const clickThroughRate = roundTo(
    safeRate(performance.clicks, performance.impressions),
    6
  );

  const conversionRate = roundTo(
    safeRate(performance.conversions, performance.clicks || performance.impressions),
    6
  );

  return {
    clickThroughRate,
    conversionRate,
  };
}