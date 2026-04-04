/* lib/alignment/intervention-engine.ts */

export type InterventionDomain = 
  | 'STRATEGIC_INTENT' 
  | 'OPERATIONAL_CLARITY' 
  | 'LEADERSHIP_TRUST' 
  | 'CULTURAL_COHESION';

export interface Mandate {
  title: string;
  description: string;
  urgency: 'CRITICAL' | 'HIGH' | 'ADVISORY';
  investment_tier: 'PREMIUM' | 'ENTERPRISE';
  delta_index: number; // Added for UI progress tracking
}

/**
 * SOVEREIGN INTERVENTION ENGINE v2.0
 * Hardened logic for strategic mandate generation.
 * @param domain - The specific quadrant of institutional friction.
 * @param delta - The calculated divergence between Intent and Reality.
 */
export function generateMandate(domain: InterventionDomain, delta: number): Mandate | null {
  // 1. SILENCE THRESHOLD: No intervention for friction within standard deviation (<15%)
  if (delta < 15) return null;

  // 2. DATA NORMALIZATION: Ensure delta doesn't break logic (clamp 0-100)
  const normalizedDelta = Math.min(Math.max(delta, 0), 100);

  const mandates: Record<InterventionDomain, Mandate> = {
    STRATEGIC_INTENT: {
      title: "Vision Recalibration Workshop",
      description: normalizedDelta > 40 
        ? "Total decoupling detected. Board-level intent and Director-level execution are in active conflict. Emergency synchronization required."
        : "Alignment between Board-level intent and Director-level execution has fractured. Requires a 2-day facilitated synchronization.",
      urgency: normalizedDelta > 30 ? 'CRITICAL' : 'HIGH',
      investment_tier: 'PREMIUM',
      delta_index: normalizedDelta
    },
    OPERATIONAL_CLARITY: {
      title: "Systemic Workflow Audit",
      description: "The 'Operational Reality' is decoupled from the mandated process. Mapping of shadow-processes is required to recover systemic energy loss.",
      urgency: normalizedDelta > 25 ? 'CRITICAL' : 'HIGH',
      investment_tier: 'ENTERPRISE',
      delta_index: normalizedDelta
    },
    LEADERSHIP_TRUST: {
      title: "Relational Integrity Protocol",
      description: "A profound trust deficit is creating a 'Silence Tax' on all communications. High-discretion leadership coaching and audit recommended.",
      urgency: 'CRITICAL', // Trust issues are never 'Advisory' in the Sovereign Protocol
      investment_tier: 'PREMIUM',
      delta_index: normalizedDelta
    },
    CULTURAL_COHESION: {
      title: "Core Resonance Alignment",
      description: "Sub-cultures are diverging from the central brand identity. Values-realignment exercise to unify the aggregate cohort.",
      urgency: normalizedDelta > 35 ? 'HIGH' : 'ADVISORY',
      investment_tier: 'PREMIUM',
      delta_index: normalizedDelta
    }
  };

  // 3. DEFENSIVE RETURN
  const selectedMandate = mandates[domain];
  
  if (!selectedMandate) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[InterventionEngine] Unrecognized domain: ${domain}`);
    }
    return null;
  }

  return selectedMandate;
}