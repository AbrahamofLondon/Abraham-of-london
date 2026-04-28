/**
 * PublicConstitutionalResult — the only shape that may cross the API boundary.
 *
 * This DTO defines what the client is allowed to see.
 * Internal scoring, thresholds, weights, signals, keywords, and engine
 * internals must NEVER appear in this type.
 */

export type PublicConstitutionalResult = {
  /** Structural classification: ORDERED, DRIFTING, MISALIGNED, DISORDERED */
  state: "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  /** One-line headline for the condition */
  headline: string;
  /** Short narrative summary of the structural reading */
  summary: string;
  /** System directive — what the user should do next */
  directive: string;
  /** Ordered list of recommendations */
  recommendations: string[];
  /** Escalation indicator */
  escalation?: {
    required: boolean;
    label: string;
  };
};

/**
 * Sanitize internal constitutional report into public-safe DTO.
 * Strips all scoring, thresholds, signals, and engine internals.
 */
export function toPublicResult(report: {
  posture?: string;
  summary?: string | { title?: string; narrative?: string };
  readinessTier?: string;
  keyFindings?: string[];
  authorityType?: string;
}): PublicConstitutionalResult {
  const posture = (report.posture ?? "DRIFTING").toUpperCase();
  const state = (
    posture === "ORDERED" || posture === "DRIFTING" ||
    posture === "MISALIGNED" || posture === "DISORDERED"
      ? posture
      : "DRIFTING"
  ) as PublicConstitutionalResult["state"];

  const rawSummary = report.summary;
  const headline = typeof rawSummary === "string"
    ? rawSummary.slice(0, 80)
    : rawSummary?.title ?? "Structural condition detected";
  const summary = typeof rawSummary === "string"
    ? rawSummary
    : rawSummary?.narrative ?? "The system has identified a structural condition. Further assessment is recommended.";

  const needsEscalation = state === "DISORDERED" || state === "MISALIGNED";

  return {
    state,
    headline,
    summary,
    directive: needsEscalation
      ? "Escalation is indicated. The condition requires structural intervention."
      : "Continue assessment to strengthen the evidence base.",
    recommendations: (report.keyFindings ?? []).slice(0, 5),
    escalation: needsEscalation
      ? { required: true, label: state === "DISORDERED" ? "Immediate intervention" : "Structural correction" }
      : undefined,
  };
}
