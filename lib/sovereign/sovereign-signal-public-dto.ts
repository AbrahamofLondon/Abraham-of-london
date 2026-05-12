/**
 * lib/sovereign/sovereign-signal-public-dto.ts
 *
 * Public-safe Data Transfer Object for Sovereign Intelligence signals.
 *
 * Classification: PUBLIC_SAFE_DTO
 *
 * This module defines the ONLY shape permitted to leave the server boundary
 * in response to client requests. Raw detection predicates, formula weights,
 * exact triggering thresholds, internal scoring factors, and signal calculation
 * methods are NEVER serialised beyond this boundary.
 *
 * The DTO is structurally safe for:
 *   - Executive Reporting surfaces
 *   - Strategy Room intervention context
 *   - Boardroom institutional signal exposure
 *   - Oversight cycle tracking
 *   - Retained intelligence summaries
 *
 * It is NOT sufficient for:
 *   - Internal audit of detection accuracy (use raw engine)
 *   - Commons benchmark computation (use intelligence-commons server-side)
 *   - Pattern matching or cohort scoring (use cohort-intelligence server-side)
 */

import type {
  IntelligenceSignal,
  SignalSeverity,
} from "./intelligence-signals";

// ─── Public-Safe Types ────────────────────────────────────────────────────────

/**
 * Confidence in this signal's applicability to the current case.
 * Derived from evidence posture, not from internal score weights.
 */
export type SignalConfidenceBand = "CONFIRMED" | "INDICATED" | "POSSIBLE" | "INSUFFICIENT";

/**
 * The evidence posture under which this signal was generated.
 * Ensures receivers understand the basis for any claim.
 */
export type SignalEvidencePosture =
  | "MULTI_SOURCE_CORROBORATED"
  | "SINGLE_SOURCE_INDICATED"
  | "THEORETICAL_GROUNDED"
  | "THIN_EVIDENCE";

/**
 * A label for the prevalence band — safe for public surfaces.
 * Never exposes raw percentages that could imply false precision.
 */
export type PrevalenceLabel =
  | "Common — observed in more than a third of comparable cases"
  | "Notable — observed in roughly a quarter of comparable cases"
  | "Occasional — observed in fewer than one in five comparable cases"
  | "Rare — observed in fewer than one in ten comparable cases";

/**
 * The public-safe sovereign signal DTO.
 * Every field here has been reviewed for IP exposure risk.
 */
export type SovereignSignalPublicSummary = {
  /** Stable identifier — does not expose internal predicate names */
  signalId: string;

  /** Signal display name */
  signalName: string;

  /** Short UI tag — one phrase describing the pattern signature */
  patternTag: string;

  /** Severity classification */
  severityBand: SignalSeverity;

  /** Confidence in this signal for the current case */
  confidenceBand: SignalConfidenceBand;

  /** The evidence basis for surfacing this signal */
  evidencePosture: SignalEvidencePosture;

  /** Non-numeric prevalence label — safe for public surfaces */
  prevalenceLabel: PrevalenceLabel;

  /** The institutional narrative — what this pattern means */
  narrativeSummary: string;

  /**
   * Plain-language outcome distribution summary.
   * Qualitative framing only — no raw percentages from internal engine.
   */
  outcomeDistributionSummary: string;

  /**
   * The key differentiator between positive and negative outcomes
   * for organisations showing this pattern.
   */
  differentiatorSummary: string;

  /**
   * The single most productive next move within the diagnostic corridor.
   * This is governed — tied to what the corridor can actually deliver.
   */
  admissibleNextMove: string;

  /**
   * If suppressed or partially withheld, the reason.
   * Null when fully visible within role.
   */
  suppressionNotice: string | null;

  /**
   * Sample and evidence caveat.
   * Required by governance rules — must always be present.
   */
  sampleCaveat: string;

  /** Slug of the supporting content brief */
  briefSlug: string | null;
};

/**
 * The result of a sovereign signal assessment — public-safe.
 */
export type SovereignSignalAssessment = {
  /** Whether sufficient evidence existed to surface signals */
  status: "ASSESSED" | "INSUFFICIENT_EVIDENCE" | "SUPPRESSED";

  /** The public-safe signal summaries — maximum 3 for any surface */
  signals: SovereignSignalPublicSummary[];

  /**
   * Number of signals detected but not surfaced (role-limited, suppressed,
   * or withheld due to thin evidence).
   */
  withheldCount: number;

  /** Single-sentence combined signal framing for executive surfaces */
  executiveSummary: string;

  /** Evidence posture for the overall assessment */
  assessmentEvidencePosture: SignalEvidencePosture;

  /**
   * The highest severity level across all detected signals.
   * Null when no signals detected.
   */
  highestSeverity: SignalSeverity | null;
};

// ─── Mapping Functions ────────────────────────────────────────────────────────

function toPrevalenceLabel(prevalencePercent: number): PrevalenceLabel {
  if (prevalencePercent >= 33)
    return "Common — observed in more than a third of comparable cases";
  if (prevalencePercent >= 20)
    return "Notable — observed in roughly a quarter of comparable cases";
  if (prevalencePercent >= 10)
    return "Occasional — observed in fewer than one in five comparable cases";
  return "Rare — observed in fewer than one in ten comparable cases";
}

function toConfidenceBand(
  evidencePosture: SignalEvidencePosture,
  severity: SignalSeverity,
): SignalConfidenceBand {
  if (evidencePosture === "MULTI_SOURCE_CORROBORATED") return "CONFIRMED";
  if (evidencePosture === "SINGLE_SOURCE_INDICATED") return "INDICATED";
  if (evidencePosture === "THIN_EVIDENCE") return "INSUFFICIENT";
  // THEORETICAL_GROUNDED: confidence depends on severity
  if (severity === "CRITICAL" || severity === "ALERT") return "INDICATED";
  return "POSSIBLE";
}

function toOutcomeDistributionSummary(signal: IntelligenceSignal): string {
  const outcomes = signal.outcomes;
  if (outcomes.length === 0) return "Outcome distribution not available for this pattern.";

  // Build qualitative framing from outcomes — never expose raw percentages directly
  const firstOutcome = outcomes[0];
  const hasCondition = outcomes.some((o) => o.condition);

  if (!firstOutcome) return "Outcome distribution not available for this pattern.";

  const qualitative =
    firstOutcome.percentage >= 60
      ? "The majority of comparable organisations"
      : firstOutcome.percentage >= 40
        ? "A significant proportion of comparable organisations"
        : firstOutcome.percentage >= 25
          ? "A notable minority of comparable organisations"
          : "A smaller but significant portion of comparable organisations";

  let summary = `${qualitative} ${firstOutcome.label.toLowerCase()}.`;
  if (hasCondition) {
    summary += " Outcomes vary materially based on the timing and nature of the intervention.";
  }
  if (outcomes.length > 1 && outcomes[1]) {
    summary += ` Absent intervention, ${outcomes[1].label.toLowerCase()}.`;
  }

  return summary;
}

function toAdmissibleNextMove(signal: IntelligenceSignal): string {
  const briefMap: Record<string, string> = {
    "authority-diffusion-revenue-pressure":
      "Commission an authority mapping session with explicit mandate design before next revenue-phase decision.",
    "narrative-coherence-collapse":
      "Initiate a structured operating-truth audit within 90 days. Strategy Room is the governed entry point.",
    "execution-fragility-cascade":
      "Immediate Strategy Room intervention to isolate root causes across the active failure modes. Do not sequence symptomatic fixes.",
    "stable-drift-false-floor":
      "Commission a structural stability assessment — separate from the performance review. These require different inputs.",
    "second-line-drift-scaling":
      "Mandate redesign for the second line before the next scaling event. This is a governance task, not a management task.",
    "intelligence-debt-scaling":
      "Map current intelligence flows against decisions being made at scale. Identify the three most consequential gaps.",
    "sovereign-trajectory-signal":
      "Maintain diagnostic rigour during the growth phase. Return for a structural review at 6 months.",
    "authority-collapse-under-pressure":
      "Authority resolution process required within 21 days. This is a boardroom-eligible escalation.",
    "intervention-blocked":
      "Capacity restoration before structural intervention. Strategy Room can sequence this.",
    "founder-identity-operational-lock":
      "Written mandate design separating the founder's decision role from operational presence. Counsel engagement recommended.",
    "multi-session-plateau":
      "Identify the barrier: capacity, mandate, or sequencing. Each requires a different intervention.",
  };

  return (
    briefMap[signal.id] ??
    "Return to the diagnostic corridor for a structured review of this pattern with an institutional lens."
  );
}

/**
 * Converts a raw IntelligenceSignal to a public-safe DTO.
 *
 * Called server-side only. The raw signal object must NEVER be serialised
 * directly to a public API response.
 *
 * @param signal - Raw signal from the detection engine (SERVER_ONLY)
 * @param evidencePosture - The evidence context this signal was detected under
 * @param suppressionNotice - If partially suppressed, the reason
 */
export function toSovereignSignalPublicSummary(
  signal: IntelligenceSignal,
  evidencePosture: SignalEvidencePosture = "SINGLE_SOURCE_INDICATED",
  suppressionNotice: string | null = null,
): SovereignSignalPublicSummary {
  const confidenceBand = toConfidenceBand(evidencePosture, signal.severity);

  return {
    signalId: signal.id,
    signalName: signal.name,
    patternTag: signal.tag,
    severityBand: signal.severity,
    confidenceBand,
    evidencePosture,
    prevalenceLabel: toPrevalenceLabel(signal.prevalencePercent),
    narrativeSummary: signal.narrative,
    outcomeDistributionSummary: toOutcomeDistributionSummary(signal),
    differentiatorSummary: signal.differentiator,
    admissibleNextMove: toAdmissibleNextMove(signal),
    suppressionNotice,
    sampleCaveat:
      "Signal patterns are derived from the diagnostic dataset and institutional framework case knowledge. " +
      "They represent observed tendencies, not determinate predictions. Individual organisations may differ " +
      "materially from dataset patterns. No signal constitutes a guarantee of any outcome.",
    briefSlug: signal.briefSlug ?? null,
  };
}

/**
 * Builds a public-safe signal assessment from a set of raw signals.
 *
 * Rules enforced:
 * - Maximum 3 signals surfaced per assessment (highest severity first)
 * - Remaining signals counted as withheldCount
 * - CRITICAL signals always included if present
 * - executiveSummary is generated at the assessment level, not per signal
 *
 * @param signals - Full set of detected signals (SERVER_ONLY input)
 * @param evidencePosture - Overall evidence context
 * @param maxSurface - Maximum signals to surface (default 3)
 */
export function buildSovereignSignalAssessment(
  signals: IntelligenceSignal[],
  evidencePosture: SignalEvidencePosture = "SINGLE_SOURCE_INDICATED",
  maxSurface = 3,
): SovereignSignalAssessment {
  if (signals.length === 0) {
    return {
      status: "ASSESSED",
      signals: [],
      withheldCount: 0,
      executiveSummary:
        "No institutional signals were detected. The diagnostic profile does not currently match any named risk pattern in the dataset.",
      assessmentEvidencePosture: evidencePosture,
      highestSeverity: null,
    };
  }

  const SEVERITY_ORDER: Record<SignalSeverity, number> = {
    CRITICAL: 4, ALERT: 3, CONCERN: 2, WATCH: 1,
  };

  const sorted = [...signals].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );

  const surfaced = sorted.slice(0, maxSurface);
  const withheld = sorted.slice(maxSurface);

  const dtos = surfaced.map((s) =>
    toSovereignSignalPublicSummary(s, evidencePosture, null),
  );

  const highestSeverity = sorted[0]?.severity ?? null;

  const critical = signals.filter((s) => s.severity === "CRITICAL");
  const alerts = signals.filter((s) => s.severity === "ALERT");
  const concerns = signals.filter((s) => s.severity === "CONCERN");

  let executiveSummary: string;
  if (critical.length > 0) {
    executiveSummary = `${critical.length} critical institutional signal${critical.length > 1 ? "s were" : " was"} detected. Immediate structural review is warranted. ${withheld.length > 0 ? `${withheld.length} additional pattern${withheld.length > 1 ? "s were" : " was"} identified but withheld for review.` : ""}`.trim();
  } else if (alerts.length > 0) {
    executiveSummary = `${alerts.length} alert-level pattern${alerts.length > 1 ? "s are" : " is"} active in this case. ${concerns.length > 0 ? `${concerns.length} further concern-level pattern${concerns.length > 1 ? "s" : ""} noted.` : ""}${withheld.length > 0 ? ` ${withheld.length} pattern${withheld.length > 1 ? "s" : ""} withheld.` : ""}`.trim();
  } else if (concerns.length > 0) {
    executiveSummary = `${concerns.length} concern-level institutional pattern${concerns.length > 1 ? "s" : ""} noted. These are early-indicator conditions that warrant monitoring.`;
  } else {
    executiveSummary = "Watch-level patterns detected. No acute structural signals are active.";
  }

  return {
    status: "ASSESSED",
    signals: dtos,
    withheldCount: withheld.length,
    executiveSummary,
    assessmentEvidencePosture: evidencePosture,
    highestSeverity,
  };
}

/**
 * Builds a suppressed assessment for thin-evidence or insufficient-record cases.
 */
export function buildInsufficientEvidenceAssessment(): SovereignSignalAssessment {
  return {
    status: "INSUFFICIENT_EVIDENCE",
    signals: [],
    withheldCount: 0,
    executiveSummary:
      "No institutional signal has been surfaced because the record does not yet contain enough evidence. " +
      "Signal assessment requires at least one completed diagnostic stage.",
    assessmentEvidencePosture: "THIN_EVIDENCE",
    highestSeverity: null,
  };
}
