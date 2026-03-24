/**
 * SOVEREIGN INTERVENTION TRACKER v1.0
 * USP: Attributed Alignment & Friction Decay
 */

export interface SuccessMetric {
  domain: string;
  frictionDecay: number; // % reduction in variance
  resonanceGain: number; // % increase in score
  impactScore: number;   // 0-100 (Overall effectiveness)
  velocityStatus: 'ACCELERATING' | 'STABILIZING' | 'INERT';
}

export function calculateInterventionImpact(
  preIntervention: DomainDiagnostic,
  current: DomainDiagnostic
): SuccessMetric {
  const frictionDecay = ((preIntervention.friction - current.friction) / preIntervention.friction) * 100;
  const resonanceGain = current.score - preIntervention.score;
  
  // Impact is a balance of raising the floor (score) and lowering the ceiling (friction)
  const impactScore = Math.round((frictionDecay * 0.6) + (resonanceGain * 0.4));

  return {
    domain: current.domain,
    frictionDecay: parseFloat(frictionDecay.toFixed(1)),
    resonanceGain,
    impactScore: Math.max(0, impactScore),
    velocityStatus: resonanceGain > 5 ? 'ACCELERATING' : frictionDecay > 10 ? 'STABILIZING' : 'INERT'
  };
}