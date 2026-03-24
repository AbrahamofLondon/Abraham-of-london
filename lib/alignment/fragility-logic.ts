/**
 * Institutional Fragility Logic v2.0
 * Uses Bessel-corrected Standard Deviation to determine cohort polarization.
 */

export type FragilityStatus = 'STABLE' | 'VOLATILE' | 'FRACTURED' | 'INSUFFICIENT_DATA';

interface FragilityResult {
  status: FragilityStatus;
  score: number; // The actual variance percentage
  color: string;
  description: string;
}

export function calculateFragility(scores: number[]): FragilityResult {
  const n = scores.length;

  // 1. Handle Insufficient Data
  if (n < 3) {
    return {
      status: 'INSUFFICIENT_DATA',
      score: 0,
      color: 'text-neutral-400',
      description: 'Minimum 3 nodes required for volatility analysis.'
    };
  }

  // 2. Calculate Mean
  const mean = scores.reduce((a, b) => a + b, 0) / n;

  // 3. Calculate Sample Standard Deviation (Bessel's Correction: n-1)
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // 4. Determine Thresholds
  // Logic: stdDev represents the average 'spread' from the mean in percentage points.
  if (stdDev >= 22) {
    return {
      status: 'FRACTURED',
      score: Math.round(stdDev),
      color: 'text-red-600',
      description: 'High polarization: Internal consensus has collapsed.'
    };
  }

  if (stdDev >= 12) {
    return {
      status: 'VOLATILE',
      score: Math.round(stdDev),
      color: 'text-[#8A6A2F]',
      description: 'Developing friction: Pockets of misalignment detected.'
    };
  }

  return {
    status: 'STABLE',
    score: Math.round(stdDev),
    color: 'text-emerald-600',
    description: 'High cohesion: Responses are tightly clustered.'
  };
}