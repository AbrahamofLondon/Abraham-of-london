/**
 * lib/product/evidence-classification.ts — Canonical evidence type classification.
 *
 * Every output should know what kind of evidence supports it.
 * Do not pretend self-reported evidence is institutional proof.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE ORIGIN CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The origin/quality tier of evidence supporting an output.
 *
 * Ordered from weakest to strongest:
 * - SELF_REPORTED: single user's self-assessment (Purpose Alignment, Fast Diagnostic)
 * - STRUCTURED_DIAGNOSTIC: scored diagnostic with algorithmic analysis (Constitutional, Team, Enterprise)
 * - MULTI_RESPONDENT: evidence from multiple respondents (Team Assessment respondent mode)
 * - BEHAVIOUR_VERIFIED: evidence cross-checked against observed behaviour patterns
 * - OUTCOME_VERIFIED: evidence verified against 14/30-day outcome measurement
 * - INSTITUTIONAL: evidence accumulated across multiple cases within an organisation
 */
export type EvidenceOrigin =
  | "SELF_REPORTED"
  | "STRUCTURED_DIAGNOSTIC"
  | "MULTI_RESPONDENT"
  | "BEHAVIOUR_VERIFIED"
  | "OUTCOME_VERIFIED"
  | "INSTITUTIONAL";

export const EVIDENCE_ORIGIN_RANK: Record<EvidenceOrigin, number> = {
  SELF_REPORTED: 1,
  STRUCTURED_DIAGNOSTIC: 2,
  MULTI_RESPONDENT: 3,
  BEHAVIOUR_VERIFIED: 4,
  OUTCOME_VERIFIED: 5,
  INSTITUTIONAL: 6,
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSET CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classification for static or dynamic evidence assets.
 *
 * - DEMONSTRATION_CASE: deterministic/static demonstration (e.g., homepage refusal engine demo)
 * - SAMPLE_RESTRICTED_DECISION: example showing a restricted/refused decision
 * - SAMPLE_ALLOWED_DECISION: example showing an admitted/allowed decision
 * - STATIC_PROOF_ASSET: hardcoded evidence dossier (e.g., /evidence/[slug] pages)
 * - VERIFIED_CASE_EVIDENCE: DB-backed, approved, outcome-verified evidence
 * - LIVE_ENGINE_OUTPUT: real-time engine-generated output from user input
 */
export type EvidenceAssetClassification =
  | "DEMONSTRATION_CASE"
  | "SAMPLE_RESTRICTED_DECISION"
  | "SAMPLE_ALLOWED_DECISION"
  | "STATIC_PROOF_ASSET"
  | "VERIFIED_CASE_EVIDENCE"
  | "LIVE_ENGINE_OUTPUT";

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL CONTINUITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every result should answer: is this a new signal, repeated signal,
 * worsening signal, resolved signal, or verified pattern?
 */
export type SignalContinuity =
  | "NEW"
  | "REPEATED"
  | "WORSENING"
  | "IMPROVING"
  | "RESOLVED"
  | "VERIFIED_PATTERN";

// ─────────────────────────────────────────────────────────────────────────────
// PROOF FALLBACK CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When DB-backed approved evidence is unavailable and the system falls back
 * to canned/demonstration content, the output must be classified.
 */
export type ProofFallbackStatus =
  | "LIVE_EVIDENCE"
  | "DEMONSTRATION_FALLBACK"
  | "INSUFFICIENT_SAMPLE";

/**
 * Determine fallback status for proof blocks.
 *
 * @param approvedCount - number of approved public evidence records in DB
 * @param minimumSample - minimum sample size for live evidence (default 5)
 */
export function classifyProofStatus(
  approvedCount: number,
  minimumSample = 5,
): ProofFallbackStatus {
  if (approvedCount >= minimumSample) return "LIVE_EVIDENCE";
  if (approvedCount > 0) return "INSUFFICIENT_SAMPLE";
  return "DEMONSTRATION_FALLBACK";
}

// ─────────────────────────────────────────────────────────────────────────────
// SURFACE → EVIDENCE ORIGIN MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/** Map a diagnostic stage to its evidence origin tier. */
export function stageToEvidenceOrigin(
  stage: string,
  isRespondentMode = false,
): EvidenceOrigin {
  if (isRespondentMode) return "MULTI_RESPONDENT";

  switch (stage) {
    case "purpose_alignment":
      return "SELF_REPORTED";
    case "constitutional":
      return "STRUCTURED_DIAGNOSTIC";
    case "team":
      return "STRUCTURED_DIAGNOSTIC";
    case "enterprise":
      return "STRUCTURED_DIAGNOSTIC";
    case "executive_reporting":
      return "STRUCTURED_DIAGNOSTIC";
    case "strategy_room":
      return "BEHAVIOUR_VERIFIED";
    case "monitoring":
      return "OUTCOME_VERIFIED";
    default:
      return "SELF_REPORTED";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE → ASSET CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/** Known static evidence assets and their classifications. */
export const STATIC_EVIDENCE_ASSETS: Record<string, EvidenceAssetClassification> = {
  // Homepage refusal engine demo
  "homepage-refusal-demo": "DEMONSTRATION_CASE",

  // /evidence/ static dossiers
  "tariff-shock-growth-break": "STATIC_PROOF_ASSET",
  "team-alignment-illusion": "STATIC_PROOF_ASSET",
  "escalation-denied-case": "STATIC_PROOF_ASSET",

  // Homepage micro-proof strip
  "homepage-micro-proof": "DEMONSTRATION_CASE",
} as const;
