/**
 * lib/pressure/pressure-signal-contract.ts
 *
 * Canonical Pressure Signal contract.
 *
 * Defines the input schema, pressure bands, evidence gap categories,
 * authority risk categories, consequence signal, recommended next move,
 * public/private storage boundary, and conversion event fields.
 *
 * This is the single source of truth for the Pressure Signal product.
 * Both `/pressure` (canonical route) and the API `/api/pressure/signal`
 * resolve through this contract.
 *
 * Route decision:
 *   CANONICAL: /pressure
 *   LEGACY:    /decision-pressure (redirects to /pressure)
 *   RATIONALE: /pressure uses server-side API with Zod validation,
 *              Upstash rate limiting, event persistence to PressureSignalEvent,
 *              and input hashing. /decision-pressure is client-side only
 *              with no persistence, no rate limiting, no input hashing.
 */

// ─── Pressure Bands ──────────────────────────────────────────────────────────

export const PRESSURE_BANDS = ["GREEN", "AMBER", "RED"] as const;
export type PressureBand = (typeof PRESSURE_BANDS)[number];

export const PRESSURE_BAND_LABELS: Record<PressureBand, string> = {
  GREEN: "Low pressure — the decision is not yet urgent but may become relevant",
  AMBER: "Moderate pressure — delay is measurable but not yet structural",
  RED: "High pressure — urgency, stakes, and unresolved ownership or evidence are present together",
};

export const PRESSURE_BAND_COLORS: Record<PressureBand, string> = {
  GREEN: "#6EE7B7",
  AMBER: "#F59E0B",
  RED: "#FB7185",
};

// ─── Evidence Gap Categories ─────────────────────────────────────────────────

export const EVIDENCE_GAP_CATEGORIES = [
  "MISSING_DECISION",
  "MISSING_OWNER",
  "MISSING_STAKE",
  "MISSING_DEADLINE",
  "MISSING_EVIDENCE",
  "MISSING_AUTHORITY",
  "MISSING_CONSEQUENCE",
  "INSUFFICIENT_SPECIFICITY",
] as const;

export type EvidenceGapCategory = (typeof EVIDENCE_GAP_CATEGORIES)[number];

export const EVIDENCE_GAP_LABELS: Record<EvidenceGapCategory, string> = {
  MISSING_DECISION: "No clear decision identified",
  MISSING_OWNER: "No named decision owner",
  MISSING_STAKE: "No stated stakes or consequences",
  MISSING_DEADLINE: "No deadline or time pressure",
  MISSING_EVIDENCE: "Evidence base is incomplete",
  MISSING_AUTHORITY: "Decision authority is unclear",
  MISSING_CONSEQUENCE: "Cost of inaction is not articulated",
  INSUFFICIENT_SPECIFICITY: "Input is too vague for a responsible signal",
};

// ─── Authority Risk Categories ────────────────────────────────────────────────

export const AUTHORITY_RISK_CATEGORIES = [
  "OWNER_ABSENT",
  "OWNER_AMBIGUOUS",
  "AUTHORITY_CONTESTED",
  "MANDATE_INSUFFICIENT",
  "APPROVAL_CHAIN_UNCLEAR",
] as const;

export type AuthorityRiskCategory = (typeof AUTHORITY_RISK_CATEGORIES)[number];

export const AUTHORITY_RISK_LABELS: Record<AuthorityRiskCategory, string> = {
  OWNER_ABSENT: "No one is named as the decision owner",
  OWNER_AMBIGUOUS: "Multiple people could be the owner, but none is confirmed",
  AUTHORITY_CONTESTED: "Decision authority is disputed or unclear",
  MANDATE_INSUFFICIENT: "The named owner lacks mandate to execute",
  APPROVAL_CHAIN_UNCLEAR: "The approval path is not defined",
};

// ─── Consequence Signal ──────────────────────────────────────────────────────

export const CONSEQUENCE_SIGNALS = [
  "FINANCIAL_EXPOSURE",
  "REPUTATIONAL_RISK",
  "REGULATORY_RISK",
  "OPERATIONAL_IMPACT",
  "STRATEGIC_DELAY",
  "OPPORTUNITY_COST",
] as const;

export type ConsequenceSignal = (typeof CONSEQUENCE_SIGNALS)[number];

// ─── Recommended Next Move ───────────────────────────────────────────────────

export const RECOMMENDED_NEXT_MOVES = [
  "BOARDROOM_BRIEF",
  "STRATEGY_ROOM",
  "EXECUTIVE_REPORTING",
  "DECISION_INSTRUMENTS",
  "FAST_DIAGNOSTIC",
  "PURPOSE_ALIGNMENT",
  "INNER_CIRCLE",
  "ENTERPRISE_PATH",
] as const;

export type RecommendedNextMove = (typeof RECOMMENDED_NEXT_MOVES)[number];

// ─── Input Schema ────────────────────────────────────────────────────────────

export interface PressureSignalInput {
  /** The raw concern text from the user. Never stored in plaintext. */
  concern: string;
}

// ─── Output Schema ───────────────────────────────────────────────────────────

export interface PressureSignalOutput {
  /** Pressure band classification */
  pressureLevel: PressureBand;
  /** Why this band was assigned */
  bandReason: string;
  /** Evidence gaps detected in the input */
  missingEvidence: EvidenceGapCategory[];
  /** Authority or ownership risk detected */
  authorityRisk: AuthorityRiskCategory | null;
  /** Consequence signal detected */
  consequenceSignal: ConsequenceSignal | null;
  /** What the system recommends as the next product */
  recommendedProduct: RecommendedNextMove;
  /** Human-readable recommended next step */
  recommendedNextStep: string;
  /** The first weakness likely to break under pressure */
  firstWeaknessLikelyToBreak: string;
  /** Consequence warning */
  consequenceWarning: string;
  /** Compact summary for sharing */
  compactSummary: string;
}

// ─── Refusal Schema ──────────────────────────────────────────────────────────

export interface PressureSignalRefusal {
  /** Why the system refused to produce a signal */
  reason: string;
  /** What the user should provide instead */
  nextAdmissibleInput: string;
}

// ─── Storage Boundary ────────────────────────────────────────────────────────

/**
 * What is stored in the database (PressureSignalEvent):
 *   - inputHash (SHA-256 hash of the concern, first 32 chars)
 *   - pressureLevel (GREEN/AMBER/RED)
 *   - recommendedProduct
 *   - safeMetrics (derived metrics only — no raw text)
 *   - result (full output object — no raw input text)
 *   - userId (if authenticated)
 *   - ipHash (SHA-256 hash of IP, first 32 chars)
 *   - userAgent (browser string)
 *
 * What is NEVER stored:
 *   - Raw concern text in any database field
 *   - Raw concern text in Redis
 *   - Raw concern text in URLs
 *   - Raw concern text in analytics events
 *
 * What is stored only if intentionally access-controlled:
 *   - Nothing — raw text is deliberately excluded from storage
 */
export const STORAGE_BOUNDARY = {
  storedFields: [
    "inputHash",
    "pressureLevel",
    "recommendedProduct",
    "safeMetrics",
    "result",
    "userId",
    "ipHash",
    "userAgent",
  ] as const,
  neverStored: ["rawConcernText"] as const,
} as const;

// ─── Conversion Event Fields ─────────────────────────────────────────────────

export interface PressureSignalConversionEvent {
  pressureLevel: PressureBand;
  recommendedProduct: RecommendedNextMove;
  /** Whether the user proceeded to the recommended product */
  converted: boolean;
  /** What product they actually entered */
  actualNextProduct: string | null;
  /** Time between signal and conversion */
  conversionDelayHours: number | null;
  /** Session identifier for funnel analysis */
  sessionId: string;
}
