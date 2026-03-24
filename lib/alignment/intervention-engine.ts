export type InterventionDomain = 'STRATEGIC_INTENT' | 'OPERATIONAL_CLARITY' | 'LEADERSHIP_TRUST' | 'CULTURAL_COHESION';

export interface Mandate {
  title: string;
  description: string;
  urgency: 'CRITICAL' | 'HIGH' | 'ADVISORY';
  investment_tier: 'PREMIUM' | 'ENTERPRISE';
}

export function generateMandate(domain: InterventionDomain, delta: number): Mandate | null {
  if (delta < 15) return null; // No intervention needed for low dissonance

  const mandates: Record<InterventionDomain, Mandate> = {
    STRATEGIC_INTENT: {
      title: "Vision Recalibration Workshop",
      description: "Alignment between Board-level intent and Director-level execution has fractured. Requires a 2-day facilitated synchronization.",
      urgency: delta > 30 ? 'CRITICAL' : 'HIGH',
      investment_tier: 'PREMIUM'
    },
    OPERATIONAL_CLARITY: {
      title: "Systemic Workflow Audit",
      description: "The 'Operational Reality' is decoupled from the mandated process. Mapping of the shadow-processes is required to recover lost energy.",
      urgency: delta > 25 ? 'CRITICAL' : 'HIGH',
      investment_tier: 'ENTERPRISE'
    },
    LEADERSHIP_TRUST: {
      title: "Relational Integrity Protocol",
      description: "A profound trust deficit is creating a 'Silence Tax' on all communications. High-discretion leadership coaching recommended.",
      urgency: 'CRITICAL',
      investment_tier: 'PREMIUM'
    },
    CULTURAL_COHESION: {
      title: "Core Resonance Alignment",
      description: "Sub-cultures are diverging from the central brand identity. Values-realignment exercise to unify the cohort.",
      urgency: 'ADVISORY',
      investment_tier: 'PREMIUM'
    }
  };

  return mandates[domain];
}