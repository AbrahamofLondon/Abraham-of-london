/* lib/alignment/hardened-pulse-engine.ts — HARDENED TELEMETRY LOGIC */

export interface PulseResponse {
  domain: string;
  resonance: number; // 0-100
  certainty: number; // 0-100
}

export interface PulseAnalysis {
  weightedScore: number;
  confidenceScore: number;
  dataIntegrity: 'HIGH' | 'MEDIUM' | 'LOW';
  activeNodes: number;
}

/**
 * CORE LOGIC: Calculates the mathematical alignment of telemetry nodes.
 */
export function calculateHardenedMetrics(responses: PulseResponse[]): PulseAnalysis {
  // 1. Filter out "Ghost Nodes" (Certainty floor of 10%)
  const validResponses = responses.filter(r => r.certainty >= 10);
  const n = validResponses.length;

  if (n === 0) {
    return { weightedScore: 0, confidenceScore: 0, dataIntegrity: 'LOW', activeNodes: 0 };
  }

  // 2. Calculate Weighted Average: Σ(Resonance * Certainty) / Σ(Certainty)
  const totalWeight = validResponses.reduce((acc, r) => acc + r.certainty, 0);
  const weightedSum = validResponses.reduce((acc, r) => {
    return acc + (r.resonance * (r.certainty / 100));
  }, 0);

  const weightedScore = Math.round((weightedSum / (totalWeight || 1)) * 100);

  // 3. Confidence Score: Balance of Average Certainty (70%) and Sample Volume (30%)
  const avgCertainty = totalWeight / n;
  const sampleStrength = Math.min((n / 10) * 100, 100); 
  const confidenceScore = Math.round((avgCertainty * 0.7) + (sampleStrength * 0.3));

  // 4. Determine Data Integrity
  let integrity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (confidenceScore > 75 && n >= 5) integrity = 'HIGH';
  else if (confidenceScore > 40) integrity = 'MEDIUM';

  return {
    weightedScore,
    confidenceScore,
    dataIntegrity: integrity,
    activeNodes: n
  };
}

/** * ALIAS FOR COMPATIBILITY: Resolves "Attempted import error" in Admin Snapshot & API
 */
export const calculateInstitutionalIntegrity = calculateHardenedMetrics;