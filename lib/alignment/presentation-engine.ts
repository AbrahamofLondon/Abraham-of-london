/**
 * SOVEREIGN HARDENED PULSE ENGINE v3.0
 * Engineered for Board-Level Stakeholder Reportage.
 * Implements: Weighted Variance, Standard Error, and DRI (Data Reliability Index).
 */

export interface PulseResponse {
  domain: string;
  resonance: number;  // 0-100 (Operational Reality)
  certainty: number;  // 0-100 (Subjective Confidence)
}

export interface HardenedMetrics {
  weightedResonance: number;
  standardError: number;
  reliabilityIndex: number; // 0-100
  integrityStatus: 'CRITICAL' | 'STABLE' | 'DEVIANT';
  nodeCount: number;
}

export function calculateInstitutionalIntegrity(responses: PulseResponse[]): HardenedMetrics {
  const n = responses.length;
  
  // 1. Minimum Threshold for Board Reportage
  if (n < 5) {
    return { weightedResonance: 0, standardError: 0, reliabilityIndex: 0, integrityStatus: 'CRITICAL', nodeCount: n };
  }

  // 2. Weighted Mean Calculation
  const sumWeights = responses.reduce((acc, r) => acc + r.certainty, 0);
  const weightedMean = responses.reduce((acc, r) => acc + (r.resonance * r.certainty), 0) / sumWeights;

  // 3. Weighted Variance (Bessel-corrected for small samples)
  // Formula: Σ w_i * (x_i - mean)^2 / Σ w_i
  const weightedVariance = responses.reduce((acc, r) => {
    return acc + r.certainty * Math.pow(r.resonance - weightedMean, 2);
  }, 0) / sumWeights;

  // 4. Standard Error of the Mean (SEM)
  // Reflects the precision of the institutional baseline
  const stdDev = Math.sqrt(weightedVariance);
  const standardError = stdDev / Math.sqrt(n);

  // 5. Data Reliability Index (DRI)
  // Penalty for low participation (n) and high variance (stdDev)
  const participationFactor = Math.min(n / 20, 1); // Benchmarked at 20 nodes for 100% weight
  const variancePenalty = Math.max(0, 100 - (stdDev * 1.5));
  const reliabilityIndex = Math.round((variancePenalty * 0.7) + (participationFactor * 30));

  // 6. Integrity Status Assignment
  let status: 'CRITICAL' | 'STABLE' | 'DEVIANT' = 'STABLE';
  if (reliabilityIndex < 40 || standardError > 15) status = 'CRITICAL';
  else if (reliabilityIndex < 70) status = 'DEVIANT';

  return {
    weightedResonance: Math.round(weightedMean),
    standardError: parseFloat(standardError.toFixed(2)),
    reliabilityIndex,
    integrityStatus: status,
    nodeCount: n
  };
}