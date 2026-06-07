/**
 * GMI Public Copy Guardrails
 * Validates GMI-facing copy for disallowed terms that outrun actual data capability.
 * Use validateGmiCopy() before publishing any public-facing content.
 */

// ─── Allowed terms ────────────────────────────────────────────────────────────

export const ALLOWED_COPY_TERMS: readonly string[] = [
  "dashboard",
  "current published state",
  "last updated",
  "manual evidence snapshot",
  "board-ready PDF",
  "board-ready pdf",
  "falsification register",
  "operator brief",
  "decision-grade intelligence",
  "decision infrastructure",
  "manual evidence",
  "governed decision",
  "published intelligence",
  "public ledger",
  "evidence standard",
  "quarterly edition",
] as const;

// ─── Disallowed terms ─────────────────────────────────────────────────────────

export const DISALLOWED_COPY_TERMS: readonly string[] = [
  "real-time",
  "real time",
  "live market feed",
  "live feed",
  "automated bloomberg ingestion",
  "bloomberg ingestion",
  "reuters-powered",
  "reuters powered",
  "predictive model",
  "ai forecast engine",
  "instant alerting",
  "live data",
  "live intelligence",
  "streaming data",
  "automated market signals",
] as const;

// ─── Policy object ────────────────────────────────────────────────────────────

export const GMI_COPY_POLICY = {
  name: "GMI Public Copy Policy",
  version: "1.0",
  effective: "2026-06-07",
  principle:
    "Public wording must never outrun actual data capability. " +
    "No term implying live feeds, automated ingestion, or AI forecasting " +
    "may appear unless the underlying capability is genuinely active.",
  allowedTerms: ALLOWED_COPY_TERMS,
  disallowedTerms: DISALLOWED_COPY_TERMS,
  enforcement: "validateGmiCopy() must pass before publishing any GMI-facing copy.",
} as const;

// ─── Validator ────────────────────────────────────────────────────────────────

export type GmiCopyValidationResult = {
  valid: boolean;
  violations: string[];
  checkedAt: string;
};

/**
 * Validates text for disallowed GMI copy terms.
 * Returns { valid: true } if clean, or { valid: false, violations: [...] } if not.
 */
export function validateGmiCopy(text: string): GmiCopyValidationResult {
  const lower = text.toLowerCase();

  const violations = DISALLOWED_COPY_TERMS.filter((term) =>
    lower.includes(term.toLowerCase())
  );

  return {
    valid: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}
