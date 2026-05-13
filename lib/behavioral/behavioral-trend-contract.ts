export type BehavioralTrendDirection =
  | "IMPROVING"
  | "DETERIORATING"
  | "STABLE"
  | "RECURRING"
  | "INSUFFICIENT_EVIDENCE";

export type BehavioralTrendMetricKey =
  | "meetingAttendanceRate"
  | "meetingCancellationRate"
  | "recurringMeetingStability"
  | "meetingCompletion"
  | "slackResponsiveness"
  | string;

export type BehavioralTrendMetric = {
  signalKey: BehavioralTrendMetricKey;
  currentValue: number | null;
  previousValue: number | null;
  delta: number | null;
  direction: BehavioralTrendDirection;
  evidencePosture: "live" | "snapshot" | "mixed" | "unavailable";
  evidenceWindowStart?: string | null;
  evidenceWindowEnd?: string | null;
  previousWindowStart?: string | null;
  previousWindowEnd?: string | null;
  explanation: string;
};

export type BehavioralTrendSummary = {
  userId: string;
  source: string;
  computedAt: string;
  metrics: BehavioralTrendMetric[];
  /**
   * Overall direction across all measured metrics.
   * DETERIORATING if any critical metric deteriorates; IMPROVING if majority improve;
   * STABLE if no significant movement; INSUFFICIENT_EVIDENCE if data is absent.
   */
  overallDirection: BehavioralTrendDirection;
  /** Plain-language summary for the oversight brief */
  summary: string;
  /** Whether any metric crossed the deterioration threshold */
  hasDeterioration: boolean;
  /** Whether any metric shows sustained recurrence across cycles */
  hasRecurrence: boolean;
  /** Signal keys with explicit repeated drift evidence across more than one prior comparison */
  repeatedDriftSignals?: string[];
  /** Signal keys with insufficient prior data for comparison */
  insufficientDataKeys: string[];
};
