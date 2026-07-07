/**
 * lib/playbooks/drift-detection-framework.ts
 *
 * The Drift Detection Framework — genuine drift identification and classification.
 *
 * The product ingests operational signals over time and classifies silent decay:
 * commitment drift, recurring delay, metric divergence, ownership decay,
 * cancellation/recurrence change, and warning patterns. Its distinctive logic is
 * TREND analysis of each signal's series and detection of deterioration that
 * continues AFTER a warning was issued (the most dangerous pattern) versus decay
 * that has stabilised. It shares nothing with the other engines but the envelope.
 */

import {
  type Contradiction,
  type PlaybookAction,
  type PlaybookRunResult,
  type PlaybookRunPosture,
  type Severity,
  PLAYBOOK_CLAIM_BOUNDARY,
  maxSeverity,
  requireArray,
} from "./playbook-run-types";

export const DRIFT_DETECTION_FRAMEWORK_CODE = "drift_detection_framework";

export type DriftKind =
  | "commitment"
  | "delay"
  | "metric"
  | "ownership"
  | "cancellation"
  | "recurrence"
  | "warning";

export interface DriftSignal {
  id: string;
  kind: DriftKind;
  /**
   * Ordered observations over time. For metric/delay: higher = worse.
   * Optional — some kinds (ownership, cancellation) may be flag-only.
   */
  series?: number[];
  /** whether a warning was previously issued on this signal. */
  warned?: boolean;
  /** whether the signal was resolved after the warning. */
  resolved?: boolean;
  note?: string;
}

export interface DriftDetectionInput {
  signals: DriftSignal[];
}

export type DriftClassification =
  | "stable"
  | "emerging_drift"
  | "sustained_drift"
  | "deterioration_after_warning"
  | "resolved";

export interface SignalAssessment {
  id: string;
  kind: DriftKind;
  classification: DriftClassification;
  severity: Severity;
  trend: "worsening" | "improving" | "flat" | "unknown";
  notes: string[];
}

export interface DriftFindings {
  assessments: SignalAssessment[];
  deteriorationAfterWarning: string[]; // signal ids
  unresolvedStable: string[]; // warned, not resolved, but flat
}

/** Slope sign of a numeric series via first-vs-last and monotonic check. */
function trendOf(series: number[] | undefined): SignalAssessment["trend"] {
  if (!series || series.length < 2) return "unknown";
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const delta = last - first;
  const eps = Math.max(1e-9, Math.abs(first) * 0.02);
  if (delta > eps) return "worsening"; // higher = worse by convention
  if (delta < -eps) return "improving";
  return "flat";
}

/** Magnitude of worsening as a fraction, for severity scaling. */
function worseningMagnitude(series: number[] | undefined): number {
  if (!series || series.length < 2) return 0;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const denom = Math.max(1e-9, Math.abs(first));
  return (last - first) / denom;
}

export function runDriftDetectionFramework(
  input: DriftDetectionInput,
): PlaybookRunResult<DriftFindings> {
  const signals = requireArray(input?.signals, "signals") as DriftSignal[];

  const base: Omit<PlaybookRunResult<DriftFindings>, "posture" | "overallSeverity" | "score"> = {
    playbook: DRIFT_DETECTION_FRAMEWORK_CODE,
    findings: { assessments: [], deteriorationAfterWarning: [], unresolvedStable: [] },
    contradictions: [],
    evidenceGaps: [],
    actions: [],
    claimBoundary: PLAYBOOK_CLAIM_BOUNDARY,
  };

  if (signals.length === 0) {
    return {
      ...base,
      posture: "INSUFFICIENT_EVIDENCE",
      overallSeverity: "LOW",
      score: null,
      evidenceGaps: ["No signals supplied — drift cannot be detected."],
    };
  }

  const assessments: SignalAssessment[] = [];
  const contradictions: Contradiction[] = [];
  const evidenceGaps: string[] = [];
  const deteriorationAfterWarning: string[] = [];
  const unresolvedStable: string[] = [];
  const severities: Severity[] = [];
  let penalty = 0;

  for (const s of signals) {
    const notes: string[] = [];
    const trend = trendOf(s.series);
    const mag = worseningMagnitude(s.series);

    if (!s.series || s.series.length < 2) {
      if (s.kind === "metric" || s.kind === "delay" || s.kind === "recurrence") {
        evidenceGaps.push(`Signal "${s.id}" (${s.kind}) has no comparable series — trend unknown.`);
      }
    }

    // Contradiction: marked resolved but the series is still worsening.
    if (s.resolved && trend === "worsening") {
      contradictions.push({
        ref: s.id,
        detail: `Signal marked resolved but its series is still worsening (${(mag * 100).toFixed(0)}%).`,
      });
    }

    // Classification
    let classification: DriftClassification;
    let severity: Severity = "LOW";
    if (s.resolved && trend !== "worsening") {
      classification = "resolved";
      severity = "LOW";
    } else if (s.warned && !s.resolved && trend === "worsening") {
      classification = "deterioration_after_warning";
      severity = mag > 0.5 ? "CRITICAL" : "HIGH";
      deteriorationAfterWarning.push(s.id);
      penalty += mag > 0.5 ? 28 : 18;
      notes.push("Decay continued after a warning was issued — highest-priority pattern.");
    } else if (s.warned && !s.resolved && trend !== "worsening") {
      classification = "sustained_drift";
      severity = "MEDIUM";
      unresolvedStable.push(s.id);
      penalty += 8;
      notes.push("Warned and unresolved, but not currently worsening.");
    } else if (trend === "worsening") {
      classification = mag > 0.3 ? "sustained_drift" : "emerging_drift";
      severity = mag > 0.3 ? "HIGH" : "MEDIUM";
      penalty += mag > 0.3 ? 14 : 7;
      notes.push(`Worsening trend (${(mag * 100).toFixed(0)}%).`);
    } else if (s.kind === "ownership" || s.kind === "cancellation") {
      // flag-only kinds without improving evidence are treated as emerging.
      classification = s.resolved ? "resolved" : "emerging_drift";
      severity = s.resolved ? "LOW" : "MEDIUM";
      if (!s.resolved) penalty += 6;
    } else {
      classification = "stable";
      severity = "LOW";
    }

    severities.push(severity);
    assessments.push({ id: s.id, kind: s.kind, classification, severity, trend, notes });
  }

  const actions: PlaybookAction[] = [];
  if (deteriorationAfterWarning.length > 0) {
    actions.push({
      action: `Intervene on deterioration-after-warning signals now: ${deteriorationAfterWarning.join(", ")}.`,
      rationale: "Decay continuing past a warning indicates the warning system itself is not producing correction.",
      severity: "CRITICAL",
    });
  }
  if (unresolvedStable.length > 0) {
    actions.push({
      action: `Close out warned-but-unresolved signals: ${unresolvedStable.join(", ")}.`,
      rationale: "Stability after a warning is fragile; unresolved items re-accelerate.",
      severity: "MEDIUM",
    });
  }
  if (contradictions.length > 0) {
    actions.push({
      action: "Correct signals marked resolved that are still worsening.",
      rationale: "A false 'resolved' status conceals active decay from oversight.",
      severity: "HIGH",
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const overallSeverity = maxSeverity(severities);

  let posture: PlaybookRunPosture;
  if (contradictions.length > 0) posture = "CONTRADICTORY_INPUT";
  else if (evidenceGaps.length > 0) posture = "PARTIAL";
  else posture = "ACTIONABLE";

  return {
    ...base,
    posture,
    overallSeverity,
    score,
    findings: { assessments, deteriorationAfterWarning, unresolvedStable },
    contradictions,
    evidenceGaps,
    actions,
  };
}
