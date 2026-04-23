/**
 * Retainer Qualification Engine
 *
 * Determines whether a retainer offer should be presented.
 * A retainer is offered ONLY when:
 * 1. Contradiction persists across assessments
 * 2. Pattern recurrence detected
 * 3. Multi-stakeholder divergence present
 *
 * No other condition qualifies. This is enforcement, not upsell.
 */

export type RetainerQualification = {
  qualifies: boolean;
  reason: "contradiction_persistence" | "recurrence_detected" | "stakeholder_divergence" | null;
  evidence: string;
  severity: "high" | "critical";
};

export type QualificationInputs = {
  /** Contradictions persisting across multiple assessments */
  persistingContradictions: string[];
  /** Tensions that resolved but returned */
  recurringPatterns: string[];
  /** Structural contradictions from multi-stakeholder analysis */
  stakeholderContradictions: Array<{ domain: string; gap: number; severity: string }>;
  /** Longitudinal classification */
  longitudinalClassification?: string;
};

export function evaluateRetainerQualification(inputs: QualificationInputs): RetainerQualification {
  const {
    persistingContradictions,
    recurringPatterns,
    stakeholderContradictions,
    longitudinalClassification,
  } = inputs;

  // Check 1: Contradiction persistence
  if (persistingContradictions.length > 0) {
    return {
      qualifies: true,
      reason: "contradiction_persistence",
      evidence: `${persistingContradictions.length} contradiction${persistingContradictions.length > 1 ? "s" : ""} persisting across assessments: ${persistingContradictions.slice(0, 3).join(", ")}.`,
      severity: persistingContradictions.length >= 3 ? "critical" : "high",
    };
  }

  // Check 2: Recurrence detection
  if (recurringPatterns.length > 0 || longitudinalClassification === "recurring") {
    return {
      qualifies: true,
      reason: "recurrence_detected",
      evidence: recurringPatterns.length > 0
        ? `Previously resolved pattern${recurringPatterns.length > 1 ? "s" : ""} returned: ${recurringPatterns.slice(0, 3).join(", ")}. The root cause was not addressed.`
        : "Longitudinal analysis has classified the condition as recurring.",
      severity: "critical",
    };
  }

  // Check 3: Stakeholder divergence
  const structuralDivergences = stakeholderContradictions.filter((c) => c.gap >= 35);
  if (structuralDivergences.length > 0) {
    return {
      qualifies: true,
      reason: "stakeholder_divergence",
      evidence: `${structuralDivergences.length} structural divergence${structuralDivergences.length > 1 ? "s" : ""} across authority: ${structuralDivergences.map((d) => `${d.domain} (${d.gap}-point gap)`).join(", ")}.`,
      severity: structuralDivergences.some((d) => d.gap >= 50) ? "critical" : "high",
    };
  }

  return { qualifies: false, reason: null, evidence: "", severity: "high" };
}
