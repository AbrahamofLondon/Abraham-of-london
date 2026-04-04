/* lib/ogr/manifest-engine.ts — CANONICAL OGR MATH ENGINE */

export const OGR_CONSTANTS = {
  FRICTION_FLOOR: 0.0,
  FRICTION_CEILING: 99.99,
  RESONANCE_FLOOR: 0.0,
  RESONANCE_CEILING: 100.0,
  REVENUE_FLOOR: 0.0,
  SOVEREIGN_THRESHOLD: 90.0,
  PRECISION: 8,
} as const;

export interface OGRMetrics {
  resonanceScore: number;
  marketFriction: number;
  targetRevenue: number;
}

export interface OGRComputed {
  integrationTax: number;
  velocityMultiplier: number;
  resonanceAlpha: number;
  sovereignCertainty: number;
  isAuthorizedToExecute: boolean;
}

/* -------------------------------------------------------------------------- */
/* INTERNAL UTILITIES                                                         */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : fallback;

  return Number.isFinite(n) ? n : fallback;
}

/* -------------------------------------------------------------------------- */
/* EXPORTED SANITIZERS                                                        */
/* -------------------------------------------------------------------------- */

export function roundTo(value: number, digits: number): number {
  return Number(toFiniteNumber(value, 0).toFixed(digits));
}

export function sanitizeResonance(value: unknown): number {
  return roundTo(
    clamp(
      toFiniteNumber(value, OGR_CONSTANTS.RESONANCE_FLOOR),
      OGR_CONSTANTS.RESONANCE_FLOOR,
      OGR_CONSTANTS.RESONANCE_CEILING
    ),
    OGR_CONSTANTS.PRECISION
  );
}

export function sanitizeFriction(value: unknown): number {
  return roundTo(
    clamp(
      toFiniteNumber(value, OGR_CONSTANTS.FRICTION_FLOOR),
      OGR_CONSTANTS.FRICTION_FLOOR,
      OGR_CONSTANTS.FRICTION_CEILING
    ),
    OGR_CONSTANTS.PRECISION
  );
}

export function sanitizeRevenue(value: unknown): number {
  return roundTo(
    Math.max(
      OGR_CONSTANTS.REVENUE_FLOOR,
      toFiniteNumber(value, OGR_CONSTANTS.REVENUE_FLOOR)
    ),
    OGR_CONSTANTS.PRECISION
  );
}

export function sanitizeMetrics(input: Partial<OGRMetrics>): OGRMetrics {
  return {
    resonanceScore: sanitizeResonance(input.resonanceScore),
    marketFriction: sanitizeFriction(input.marketFriction),
    targetRevenue: sanitizeRevenue(input.targetRevenue),
  };
}

/* -------------------------------------------------------------------------- */
/* MANIFEST DERIVATION ENGINE                                                 */
/* -------------------------------------------------------------------------- */
/**
 * Manifest formulas:
 * I_tax = ((100 - R) * 1.25) + (F * 0.05)
 * V_mult = R / (100 - F)
 * alpha  = Rev * ((F / 100) - ((100 - R) / 100))
 * C_sov  = (R * 0.7) + ((100 - F) * 0.3)
 */
export function calculateDerived(input: Partial<OGRMetrics>): OGRComputed {
  const { resonanceScore: R, marketFriction: F, targetRevenue: Rev } =
    sanitizeMetrics(input);

  const integrationTaxRaw = ((100 - R) * 1.25) + (F * 0.05);
  const velocityMultiplierRaw = R / (100 - F);
  const resonanceAlphaRaw = Rev * ((F / 100) - ((100 - R) / 100));
  const sovereignCertaintyRaw = (R * 0.7) + ((100 - F) * 0.3);

  const sovereignCertainty = roundTo(sovereignCertaintyRaw, 4);

  return {
    integrationTax: roundTo(integrationTaxRaw, 2),
    velocityMultiplier: roundTo(velocityMultiplierRaw, 2),
    resonanceAlpha: roundTo(resonanceAlphaRaw, 2),
    sovereignCertainty,
    isAuthorizedToExecute:
      sovereignCertainty >= OGR_CONSTANTS.SOVEREIGN_THRESHOLD,
  };
}