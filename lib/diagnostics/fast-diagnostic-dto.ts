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
  /** Arbiter integrity message (if synthesis was rejected) */
  arbiterMessage: string | null;
  /** Encrypted state token for session continuity */
  stateToken: string;
};
