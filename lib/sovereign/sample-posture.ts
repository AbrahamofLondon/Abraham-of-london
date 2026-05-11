/**
 * lib/sovereign/sample-posture.ts
 *
 * Sample posture evaluation for Sovereign Intelligence claims.
 *
 * Enforces the evidence standard rules that govern what language may be used
 * at each record-count threshold. Guards and surfaces consume this module to
 * determine what can and cannot be claimed.
 *
 * Classification: SERVER_ONLY (used to suppress public surfaces — never expose raw rules)
 *
 * Rules (from Operating Doctrine §6):
 *   0–2 records:  No recurrence claim. "Insufficient retained evidence."
 *   3–4 records:  Emerging pattern only. No sponsor-level recurrence claim.
 *   5–9 records:  Sponsor-safe recurrence signal with caveat.
 *   10+ records:  Cross-scope pattern language allowed. Not "benchmark."
 *   Sector/industry: Minimum 3 orgs in same cluster required.
 *   Benchmark: Blocked unless explicitly approved.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SamplePostureTier =
  | "INSUFFICIENT"       // 0–2 records
  | "EMERGING"           // 3–4 records
  | "RETAINED_COHORT"    // 5–9 records
  | "CROSS_SCOPE"        // 10+ records
  | "SECTOR_INSUFFICIENT" // sector claim attempted but < 3 orgs in cluster
  | "BENCHMARK_BLOCKED";  // benchmark language attempted — always blocked

export type SamplePostureResult = {
  tier: SamplePostureTier;
  /** Human-readable label shown in UI */
  label: string;
  /** One-sentence description of what this posture permits */
  permittedClaim: string;
  /** The mandatory caveat to show alongside any claim */
  caveat: string;
  /** Whether any recurrence claim is permitted at this posture */
  recurrencePermitted: boolean;
  /** Whether sponsor-safe recurrence claim is permitted */
  sponsorRecurrencePermitted: boolean;
  /** Whether benchmark language is permitted (always false) */
  benchmarkPermitted: false;
  /** Whether the claim is suppressed entirely */
  suppressed: boolean;
  /** Suppression notice shown when suppressed */
  suppressionNotice: string | null;
};

// ─── Posture Evaluation ───────────────────────────────────────────────────────

/**
 * Evaluates sample posture for a portfolio or cohort recurrence claim.
 *
 * @param recordCount - Total number of evidence records in scope
 * @param sectorOrgCount - Number of distinct organisations in the same sector cluster (0 if not a sector claim)
 * @param isBenchmarkClaim - Whether benchmark language is being attempted
 */
export function evaluateSamplePosture(
  recordCount: number,
  sectorOrgCount = 0,
  isBenchmarkClaim = false,
): SamplePostureResult {
  if (isBenchmarkClaim) {
    return {
      tier: "BENCHMARK_BLOCKED",
      label: "Benchmark claim blocked",
      permittedClaim: "Benchmark language requires explicit product authority approval. Use prevalence labels instead.",
      caveat: "Benchmark language is not supported without explicit approval and sample basis disclosure.",
      recurrencePermitted: false,
      sponsorRecurrencePermitted: false,
      benchmarkPermitted: false,
      suppressed: true,
      suppressionNotice: "Benchmark language is not permitted without explicit approval. Patterns are expressed as prevalence bands derived from the Intelligence Commons dataset.",
    };
  }

  if (sectorOrgCount > 0 && sectorOrgCount < 3) {
    return {
      tier: "SECTOR_INSUFFICIENT",
      label: "Sector sample not yet mature",
      permittedClaim: "Sector-level claims require at least 3 organisations in the same sector cluster.",
      caveat: "The current sector sample is below threshold. Sector-level claims are withheld until the sample is sufficient.",
      recurrencePermitted: false,
      sponsorRecurrencePermitted: false,
      benchmarkPermitted: false,
      suppressed: true,
      suppressionNotice: "Sector sample insufficient for a sector-level claim. The pattern may be visible once the sector cluster reaches the minimum threshold.",
    };
  }

  if (recordCount <= 2) {
    return {
      tier: "INSUFFICIENT",
      label: "Insufficient sample",
      permittedClaim: "No recurrence claim. Insufficient retained evidence.",
      caveat: "Insufficient retained evidence to surface a pattern at this scope.",
      recurrencePermitted: false,
      sponsorRecurrencePermitted: false,
      benchmarkPermitted: false,
      suppressed: true,
      suppressionNotice: "Insufficient retained evidence to surface an institutional pattern. Pattern detection requires at least 3 records in scope.",
    };
  }

  if (recordCount <= 4) {
    return {
      tier: "EMERGING",
      label: "Emerging recurrence",
      permittedClaim: "Emerging pattern — internal tracking only. No sponsor-level recurrence claim.",
      caveat: "This pattern is emerging from a small sample. It is tracked internally but not surfaced as a confirmed recurrence.",
      recurrencePermitted: true,
      sponsorRecurrencePermitted: false,
      benchmarkPermitted: false,
      suppressed: false,
      suppressionNotice: null,
    };
  }

  if (recordCount <= 9) {
    return {
      tier: "RETAINED_COHORT",
      label: "Retained cohort signal",
      permittedClaim: "Sponsor-safe recurrence signal with mandatory caveat.",
      caveat: "This pattern is observed across a retained cohort of comparable records. Sample size is limited. This represents an emerging signal, not a confirmed benchmark.",
      recurrencePermitted: true,
      sponsorRecurrencePermitted: true,
      benchmarkPermitted: false,
      suppressed: false,
      suppressionNotice: null,
    };
  }

  return {
    tier: "CROSS_SCOPE",
    label: "Cross-scope pattern",
    permittedClaim: "Cross-scope pattern language permitted. Benchmark language still blocked.",
    caveat: "This pattern has been observed across multiple retained cases and scopes. It does not constitute a benchmark claim — patterns represent observed tendencies, not verified external standards.",
    recurrencePermitted: true,
    sponsorRecurrencePermitted: true,
    benchmarkPermitted: false,
    suppressed: false,
    suppressionNotice: null,
  };
}

// ─── Portfolio-level posture helper ──────────────────────────────────────────

/**
 * Evaluates what recurrence language a portfolio surface may use for a given pattern.
 * Returns the suppression notice if the claim must be withheld.
 */
export function portfolioPostureForPattern(input: {
  totalRecords: number;
  sectorOrgCount?: number;
  isSectorClaim?: boolean;
}): { permitted: boolean; label: string; caveat: string; suppressionNotice: string | null } {
  const posture = evaluateSamplePosture(
    input.totalRecords,
    input.isSectorClaim ? (input.sectorOrgCount ?? 0) : 0,
    false,
  );

  return {
    permitted: !posture.suppressed && posture.sponsorRecurrencePermitted,
    label: posture.label,
    caveat: posture.caveat,
    suppressionNotice: posture.suppressionNotice,
  };
}

// ─── Visible label for UI ─────────────────────────────────────────────────────

export const SAMPLE_POSTURE_UI_LABELS: Record<SamplePostureTier, string> = {
  INSUFFICIENT: "Insufficient sample",
  EMERGING: "Emerging recurrence",
  RETAINED_COHORT: "Retained cohort signal",
  CROSS_SCOPE: "Cross-scope pattern",
  SECTOR_INSUFFICIENT: "Sector sample not yet mature",
  BENCHMARK_BLOCKED: "Benchmark claim blocked",
};
