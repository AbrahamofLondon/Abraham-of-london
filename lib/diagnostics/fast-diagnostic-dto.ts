/**
 * Fast Diagnostic public DTO — the shape returned by the scoring API.
 * This file has NO server-only guard so it can be imported by both
 * the API route (server) and the page component (client).
 *
 * No scoring logic. No thresholds. No classification rules.
 * Types only.
 */

export type FastDiagnosticRequest = {
  answers: Record<string, string>;
  committed: boolean;
  elapsedMs?: number;
  /** Numeric financial exposure estimate (computed client-side) */
  financialExposure?: number | null;
  /** Exposure band classification */
  exposureBand?: "low" | "moderate" | "high" | "critical" | "undisclosed" | null;
  /** Input basis for the exposure calculation */
  exposureBasis?: {
    revenueBand?: string | null;
    urgencyScore?: number | null;
    ownershipScore?: number | null;
    clarityScore?: number | null;
    accountabilityScore?: number | null;
    stateScore?: number | null;
    decisionValue?: number | null;
  } | null;
};

export type FastDiagnosticResult = {
  /** Opaque case reference */
  caseRef: string;
  /** Condition class label (not the classification logic) */
  condition: string;
  conditionLabel: string;
  /** Signal strength: low / moderate / high */
  signalStrength: "low" | "moderate" | "high";
  /** Whether the system attempted full analysis */
  fullAnalysis: boolean;
  /** Recovery question if input was too vague */
  recoveryQuestion: string | null;
  /** The governed synthesis output */
  synthesis: {
    verdict: string;
    primaryContradiction: string;
    avoidedDecision: string;
    whyPriorAttemptsFailed: string;
    concreteMove: string;
    defaultPathForecast: string;
    certaintyBoundary: string;
    quotedUserLanguage: string[];
  } | null;
  /** Forecast timeline */
  forecast: {
    alreadyIncurred?: string;
    sevenDays: string;
    thirtyDays: string;
    ninetyDays: string;
    optionCompression?: string;
    consequenceShift?: string;
    controlShiftSummary: string;
  } | null;
  /** Contradiction detected during pre-synthesis check */
  contradictionText: string | null;
  /** Integrity review message (if synthesis was rejected) */
  reviewMessage: string | null;
  /** Encrypted state token for session continuity */
  stateToken: string;

  // ── ELEVATION LAYER (v1) ──────────────────────────────────────────────

  /** Cost of inaction — qualitative exposure + horizon projections */
  costOfInaction?: {
    exposureBand: "low" | "moderate" | "high" | "critical" | "undisclosed";
    horizon30: string;
    horizon60: string;
    horizon90: string;
    executiveWarning: string;
  };

  /** Why execution of the directive will stall */
  executionFailure?: {
    likelyFailureMode: string;
    whyExecutionWillStall: string;
    requiredCorrection: string;
  };

  /** Decision authority interpretive index */
  authorityIndex?: {
    band: "strong" | "strained" | "weak" | "critical";
    label: string;
    boardMeaning: string;
    nextGovernanceMove: string;
  };

  /** Cross-session decision memory trend (when history exists) */
  memoryTrend?: {
    totalDecisions: number;
    dominantState: string;
    repeatedConditions: string[];
    escalationTrend: "stable" | "rising" | "falling" | "insufficient_data";
    executiveSummary: string;
  };

  /** Public-safe recurring pattern authority */
  patternEvidence?: {
    recognitionLine: string;
    observations: string[];
  };

  /** Anchor-bound 8-section narrative (when user input is sufficient) */
  anchorNarrative?: {
    opening: string;
    condition: string;
    whyItExists: string;
    pattern: string;
    costOfInaction: { thirtyDays: string; sixtyDays: string; ninetyDays: string };
    perspective: string;
    requiredMove: string;
    cta: string;
  };
};
