/**
 * lib/product/comparison-basis-presenter.ts
 *
 * Routes all percentile and comparison band displays through a single
 * governed presenter. Every score-bearing product surface calls this
 * module — never renders raw numbers without a basis declaration.
 */

import type {
  ComparisonBasis,
  ComparisonBand,
  BandThresholds,
} from "./comparison-basis-contract";
import {
  resolveComparisonBand,
  comparisonBasisPublicLabel,
  comparisonBasisCaveat,
  isBasisSufficientForPublicClaim,
  enforceMaturityGate,
  requiresUnverifiedDisclosure,
  DEFAULT_BAND_THRESHOLDS,
} from "./comparison-basis-contract";

// ─── Canonical Basis Registry ─────────────────────────────────────────────────

/**
 * Pre-configured comparison bases for each score-bearing instrument surface.
 * Add entries as instruments accumulate outcome-verified records.
 */
const INSTRUMENT_BASIS_REGISTRY: Record<string, ComparisonBasis> = {
  "fast-diagnostic": {
    type: "INTERNAL_OBSERVED_RECORDS",
    maturityLevel: 2,
    sampleSize: null,
    sampleDescription: "Founder-led and SMB-scale organisations across the diagnostic dataset",
    lastUpdatedAt: null,
  },
  "constitutional-diagnostic": {
    type: "INTERNAL_OBSERVED_RECORDS",
    maturityLevel: 2,
    sampleSize: null,
    sampleDescription: "Organisations that have completed the constitutional intake",
    lastUpdatedAt: null,
  },
  "executive-reporting": {
    type: "INTERNAL_OBSERVED_RECORDS",
    maturityLevel: 2,
    sampleSize: null,
    sampleDescription: "Cases with completed executive reporting sessions",
    lastUpdatedAt: null,
  },
  "decision-exposure-instrument": {
    type: "BOOTSTRAP_DISTRIBUTION",
    maturityLevel: 1,
    sampleSize: null,
    sampleDescription: "Theoretical distribution derived from decision-exposure framework logic",
    lastUpdatedAt: null,
  },
  "escalation-readiness-scorecard": {
    type: "BOOTSTRAP_DISTRIBUTION",
    maturityLevel: 1,
    sampleSize: null,
    sampleDescription: "Theoretical distribution derived from escalation-readiness framework logic",
    lastUpdatedAt: null,
  },
  "execution-risk-index": {
    type: "BOOTSTRAP_DISTRIBUTION",
    maturityLevel: 1,
    sampleSize: null,
    sampleDescription: "Theoretical distribution derived from execution-risk framework logic",
    lastUpdatedAt: null,
  },
  "mandate-clarity-framework": {
    type: "BOOTSTRAP_DISTRIBUTION",
    maturityLevel: 1,
    sampleSize: null,
    sampleDescription: "Theoretical distribution derived from mandate-clarity framework logic",
    lastUpdatedAt: null,
  },
  "governance-drift-detector": {
    type: "BOOTSTRAP_DISTRIBUTION",
    maturityLevel: 1,
    sampleSize: null,
    sampleDescription: "Theoretical distribution derived from governance-drift framework logic",
    lastUpdatedAt: null,
  },
  "intelligence-signals": {
    type: "INTERNAL_OBSERVED_RECORDS",
    maturityLevel: 2,
    sampleSize: null,
    sampleDescription: "Pattern prevalence observed across the diagnostic dataset",
    lastUpdatedAt: null,
  },
};

const FALLBACK_BASIS: ComparisonBasis = {
  type: "INSUFFICIENT_SAMPLE",
  maturityLevel: 0,
  sampleSize: null,
  sampleDescription: "No comparison base established for this instrument",
  lastUpdatedAt: null,
};

export function getBasisForInstrument(instrumentKey: string): ComparisonBasis {
  return INSTRUMENT_BASIS_REGISTRY[instrumentKey] ?? FALLBACK_BASIS;
}

// ─── Presenter Output ─────────────────────────────────────────────────────────

export type ComparisonPresentation = {
  /** Whether a band/percentile claim is safe to surface */
  canSurface: boolean;
  /** The resolved comparison band label */
  band: ComparisonBand | null;
  /** One-line public label describing the comparison basis */
  basisLabel: string;
  /** Governance caveat — always include below any band display */
  caveat: string;
  /** The raw basis object (for audit/governance surfaces) */
  basis: ComparisonBasis;
  /**
   * Whether an unverified-basis disclosure must accompany the band (P6).
   * Always render when true — never suppress.
   */
  requiresUnverifiedDisclosure: boolean;
  /**
   * If the maturity gate blocked surfacing, the reason.
   * Present only when canSurface is false due to gate violation (not just insufficient sample).
   */
  maturityGateRejection: string | null;
};

/**
 * Resolves a full comparison presentation for a given instrument and score.
 *
 * @param instrumentKey  - Registry key for the instrument (e.g. "fast-diagnostic")
 * @param score          - The score value (0–100, where higher = more pressure/risk)
 * @param thresholds     - Optional custom thresholds (defaults to DEFAULT_BAND_THRESHOLDS)
 * @param basisOverride  - Optional override for testing or institution-specific basis
 */
export function resolveComparisonPresentation(
  instrumentKey: string,
  score: number,
  thresholds: BandThresholds = DEFAULT_BAND_THRESHOLDS,
  basisOverride?: ComparisonBasis,
): ComparisonPresentation {
  const basis = basisOverride ?? getBasisForInstrument(instrumentKey);

  // P6: Run the maturity gate before any claim is surfaced
  const gate = enforceMaturityGate(basis);
  const sufficientForClaim = isBasisSufficientForPublicClaim(basis);
  const canSurface = sufficientForClaim && gate.allowed;
  const band = canSurface ? resolveComparisonBand(score, basis, thresholds) : null;

  return {
    canSurface,
    band,
    basisLabel: comparisonBasisPublicLabel(basis),
    caveat: comparisonBasisCaveat(basis),
    basis,
    requiresUnverifiedDisclosure: requiresUnverifiedDisclosure(basis),
    maturityGateRejection: gate.allowed ? null : gate.reason,
  };
}

/**
 * Returns the colour token for a comparison band — for use in UI rendering.
 * Always pair with the basis caveat; never show colour alone.
 */
export function bandColorToken(band: ComparisonBand | null): string {
  if (!band) return "rgba(255,255,255,0.25)";
  switch (band) {
    case "Below observed concern range":
      return "rgba(110,231,183,0.70)";
    case "Within normal observed range":
      return "rgba(255,255,255,0.50)";
    case "Above concern range":
      return "rgba(251,191,36,0.70)";
    case "High-pressure range":
      return "rgba(249,115,22,0.70)";
    case "Severe-pressure range":
      return "rgba(239,68,68,0.75)";
    case "Insufficient comparison base":
      return "rgba(255,255,255,0.20)";
  }
}

/**
 * Returns the short label string for a comparison band — for compact UI contexts.
 */
export function bandShortLabel(band: ComparisonBand | null): string {
  if (!band) return "No comparison";
  switch (band) {
    case "Below observed concern range":  return "Below concern threshold";
    case "Within normal observed range":  return "Within normal range";
    case "Above concern range":           return "Above concern range";
    case "High-pressure range":           return "High-pressure";
    case "Severe-pressure range":         return "Severe-pressure";
    case "Insufficient comparison base":  return "No comparison base";
  }
}
