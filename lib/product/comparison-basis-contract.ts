/**
 * lib/product/comparison-basis-contract.ts
 *
 * Defines the evidence basis for any percentile or comparison claim
 * surfaced on a score-bearing product surface.
 *
 * Every comparison band, percentile label, or "X% of comparable organisations"
 * claim MUST route through this contract so the basis is traceable, auditable,
 * and governed — not implied.
 */

// ─── Basis Types ──────────────────────────────────────────────────────────────

/**
 * The source of the comparison data underpinning any percentile or band claim.
 *
 * BOOTSTRAP_DISTRIBUTION         — Theoretical prior; no observed records yet.
 *                                  Claims are directionally grounded but not empirically derived.
 * INTERNAL_OBSERVED_RECORDS      — Real records from the platform dataset,
 *                                  not outcome-verified. Prevalence claims are
 *                                  observational, not causal.
 * OUTCOME_VERIFIED_RECORDS       — Records with completed outcome verification.
 *                                  Strongest basis for consequence-path claims.
 * OPERATOR_REVIEWED_SAMPLE       — Human-reviewed subset of platform records.
 *                                  Adds qualitative validation to observed data.
 * INSUFFICIENT_SAMPLE            — Sample too small for reliable comparison.
 *                                  No percentile or band claims should be surfaced.
 */
export type ComparisonBasisType =
  | "BOOTSTRAP_DISTRIBUTION"
  | "INTERNAL_OBSERVED_RECORDS"
  | "OUTCOME_VERIFIED_RECORDS"
  | "OPERATOR_REVIEWED_SAMPLE"
  | "INSUFFICIENT_SAMPLE";

/**
 * Distribution maturity describes how far the comparison basis has evolved
 * from theoretical priors toward institution-specific retained history.
 *
 * Level 0 — No comparison base. Do not surface comparison claims.
 * Level 1 — Bootstrap: theoretical distribution derived from framework logic.
 * Level 2 — Internal observed: platform records, no outcome verification.
 * Level 3 — Outcome verified: at least some records have confirmed outcomes.
 * Level 4 — Operator reviewed: human-qualified subset of records.
 * Level 5 — Institution-specific: retained history for this client/organisation.
 */
export type DistributionMaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * A comparison band label — safe for surfacing on client-facing product pages.
 * Never surfaces raw percentile numbers without an accompanying basis.
 */
export type ComparisonBand =
  | "Below observed concern range"
  | "Within normal observed range"
  | "Above concern range"
  | "High-pressure range"
  | "Severe-pressure range"
  | "Insufficient comparison base";

/**
 * The full comparison basis for a single score or signal claim.
 */
export type ComparisonBasis = {
  type: ComparisonBasisType;
  maturityLevel: DistributionMaturityLevel;
  /** How many records underpin this comparison (null if not disclosed/available) */
  sampleSize: number | null;
  /** Plain-language description of the comparison population */
  sampleDescription: string;
  /** ISO date when this basis was last updated */
  lastUpdatedAt: string | null;
};

// ─── Band Thresholds ──────────────────────────────────────────────────────────

/**
 * Score thresholds for band assignment.
 * Scores are 0–100 where higher = worse condition (more pressure/risk).
 * These are the default thresholds for the BOOTSTRAP level.
 * Override per-instrument as outcome data accumulates.
 */
export type BandThresholds = {
  belowConcern: number;    // score < belowConcern → "Below observed concern range"
  normalUpper: number;     // score < normalUpper → "Within normal observed range"
  concernUpper: number;    // score < concernUpper → "Above concern range"
  highUpper: number;       // score < highUpper → "High-pressure range"
  // ≥ highUpper → "Severe-pressure range"
};

export const DEFAULT_BAND_THRESHOLDS: BandThresholds = {
  belowConcern: 20,
  normalUpper: 45,
  concernUpper: 65,
  highUpper: 80,
};

// ─── Score-to-Band Resolution ─────────────────────────────────────────────────

export function resolveComparisonBand(
  score: number,
  basis: ComparisonBasis,
  thresholds: BandThresholds = DEFAULT_BAND_THRESHOLDS,
): ComparisonBand {
  if (basis.type === "INSUFFICIENT_SAMPLE" || basis.maturityLevel === 0) {
    return "Insufficient comparison base";
  }
  if (score < thresholds.belowConcern) return "Below observed concern range";
  if (score < thresholds.normalUpper) return "Within normal observed range";
  if (score < thresholds.concernUpper) return "Above concern range";
  if (score < thresholds.highUpper) return "High-pressure range";
  return "Severe-pressure range";
}

// ─── Public Label Rendering ───────────────────────────────────────────────────

/**
 * Returns a public-safe, one-line description of the comparison basis.
 * Used in governance disclosures and result page footnotes.
 */
export function comparisonBasisPublicLabel(basis: ComparisonBasis): string {
  switch (basis.type) {
    case "BOOTSTRAP_DISTRIBUTION":
      return "Comparison derived from framework distribution. No empirical records yet.";
    case "INTERNAL_OBSERVED_RECORDS":
      return basis.sampleSize
        ? `Compared against ${basis.sampleSize.toLocaleString()} observed platform records. ${basis.sampleDescription}.`
        : `Compared against observed platform records. ${basis.sampleDescription}.`;
    case "OUTCOME_VERIFIED_RECORDS":
      return basis.sampleSize
        ? `Compared against ${basis.sampleSize.toLocaleString()} outcome-verified records. ${basis.sampleDescription}.`
        : `Compared against outcome-verified records. ${basis.sampleDescription}.`;
    case "OPERATOR_REVIEWED_SAMPLE":
      return basis.sampleSize
        ? `Compared against ${basis.sampleSize.toLocaleString()} operator-reviewed records. ${basis.sampleDescription}.`
        : `Operator-reviewed comparison sample. ${basis.sampleDescription}.`;
    case "INSUFFICIENT_SAMPLE":
      return "Insufficient comparison base — no percentile or band claims are surfaced.";
  }
}

/**
 * Returns the governance caveat required whenever a comparison band is surfaced.
 * Always include this below any percentile or band display.
 */
export function comparisonBasisCaveat(basis: ComparisonBasis): string {
  if (basis.type === "BOOTSTRAP_DISTRIBUTION") {
    return "Comparison band is based on a theoretical distribution, not empirical records. " +
      "It is directionally informative but should not be treated as a statistical finding.";
  }
  if (basis.type === "INSUFFICIENT_SAMPLE") {
    return "Comparison data is insufficient for this pattern. No band claim is made.";
  }
  return "Comparison bands represent observed tendencies across the platform dataset, not determinate predictions. " +
    "Individual organisations may differ materially from dataset patterns.";
}

/**
 * Whether this basis is strong enough to surface a percentile or band claim on a public surface.
 */
export function isBasisSufficientForPublicClaim(basis: ComparisonBasis): boolean {
  return basis.type !== "INSUFFICIENT_SAMPLE" && basis.maturityLevel >= 1;
}

// ─── Maturity Gate Enforcement ────────────────────────────────────────────────

/**
 * Enforces the comparison basis maturity gate.
 *
 * Rules (P6 — comparison basis integrity):
 *   - BOOTSTRAP_DISTRIBUTION is never claimable as verified (max maturity 2).
 *   - maturityLevel 3+ requires OUTCOME_VERIFIED_RECORDS or OPERATOR_REVIEWED_SAMPLE.
 *   - maturityLevel 4+ requires OPERATOR_REVIEWED_SAMPLE.
 *   - maturityLevel 5 requires institutional retention (OPERATOR_REVIEWED_SAMPLE + sampleSize ≥ 20).
 *
 * Returns { allowed: true } when the claim is structurally valid.
 * Returns { allowed: false, reason } when the claim violates governance rules.
 *
 * ALL comparison band claims in score.ts and instrument authority MUST pass through
 * this gate before surfacing. The presenter enforces this at call time.
 */
export function enforceMaturityGate(
  basis: ComparisonBasis,
): { allowed: true } | { allowed: false; reason: string } {
  if (basis.type === "INSUFFICIENT_SAMPLE") {
    return { allowed: false, reason: "Insufficient sample — no band claim is permitted." };
  }

  if (basis.type === "BOOTSTRAP_DISTRIBUTION" && basis.maturityLevel > 2) {
    return {
      allowed: false,
      reason: "Bootstrap distribution basis cannot claim maturity level 3+. Verified outcomes required.",
    };
  }

  if (basis.maturityLevel >= 3) {
    if (
      basis.type !== "OUTCOME_VERIFIED_RECORDS" &&
      basis.type !== "OPERATOR_REVIEWED_SAMPLE"
    ) {
      return {
        allowed: false,
        reason: `Maturity level ${basis.maturityLevel} requires outcome-verified or operator-reviewed records. Current basis: ${basis.type}.`,
      };
    }
  }

  if (basis.maturityLevel >= 4 && basis.type !== "OPERATOR_REVIEWED_SAMPLE") {
    return {
      allowed: false,
      reason: `Maturity level ${basis.maturityLevel} requires operator-reviewed records. Current basis: ${basis.type}.`,
    };
  }

  if (basis.maturityLevel >= 5) {
    if (basis.type !== "OPERATOR_REVIEWED_SAMPLE" || (basis.sampleSize !== null && basis.sampleSize < 20)) {
      return {
        allowed: false,
        reason: `Maturity level 5 requires operator-reviewed records with sample size ≥ 20. Current sample: ${basis.sampleSize ?? "unknown"}.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Returns whether a comparison band surfaced at this maturity level
 * should include an "unverified basis" disclosure on the public surface.
 *
 * Required by governance rules — never suppress this disclosure when true.
 */
export function requiresUnverifiedDisclosure(basis: ComparisonBasis): boolean {
  return (
    basis.type === "BOOTSTRAP_DISTRIBUTION" ||
    basis.type === "INTERNAL_OBSERVED_RECORDS" ||
    basis.maturityLevel <= 2
  );
}
