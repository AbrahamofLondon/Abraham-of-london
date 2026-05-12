/**
 * Fast Diagnostic public DTO — the shape returned by the scoring API.
 * This file has NO server-only guard so it can be imported by both
 * the API route (server) and the page component (client).
 *
 * No scoring logic. No thresholds. No classification rules.
 * Types only.
 */

import type { SovereignSignalPublicSummary } from "@/lib/sovereign/sovereign-signal-public-dto";

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
  /** Checkpoint ID for efficacy tracking */
  checkpointId?: string;

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

  // ── SIGNAL SUPREMACY LAYER (v2) ───────────────────────────────────────

  /**
   * Named intelligence signals detected from the diagnostic inputs.
   * Public-safe DTOs only — raw detection predicates never leave the server.
   * Maximum 3 signals surfaced; ordered by severity (CRITICAL first).
   */
  detectedSignals?: SovereignSignalPublicSummary[];

  /**
   * Highest severity across all detected signals — null when none detected.
   * Used for quick conditional rendering without iterating detectedSignals.
   */
  highestSignalSeverity?: "WATCH" | "CONCERN" | "ALERT" | "CRITICAL" | null;

  /**
   * Executive summary of the signal assessment — one sentence.
   * Present when detectedSignals is non-empty.
   */
  signalExecutiveSummary?: string | null;

  /**
   * Comparison band for this case against the observed platform dataset.
   * Present when the basis is sufficient (maturityLevel ≥ 1).
   */
  comparisonBand?: string | null;

  /**
   * Governance caveat for any comparison band claim surfaced.
   * Always render below the band label if comparisonBand is present.
   */
  comparisonBandCaveat?: string | null;

  /**
   * Public-safe label describing the comparison basis type (P9 — distribution maturity).
   * Example: "Compared against observed platform records."
   */
  comparisonBasisLabel?: string | null;

  /**
   * Distribution maturity level 0–5 for this comparison basis (P9).
   * Surfaces the quality signal of the comparison claim.
   */
  comparisonMaturityLevel?: number | null;
};
