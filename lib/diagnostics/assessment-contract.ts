/**
 * Assessment Decision Result — the canonical output contract.
 *
 * Every assessment engine must produce this exact structure.
 * No UI may compute meaning. UI renders only this object.
 *
 * This is the defensible core: evidence chain, contradiction detection,
 * decision implication, and explicit validity boundaries.
 */

export type SignalStrength = "WEAK" | "MODERATE" | "STRONG" | "REQUIRES_VALIDATION";

export type EvidenceLink = {
  /** What input produced this observation */
  inputSource: string;
  /** What pattern was observed */
  observedPattern: string;
  /** How much this observation contributes to the primary signal (0-1) */
  weight: number;
  /** Why this matters — in decision terms, not analytical terms */
  explanation: string;
};

export type AssessmentDecisionResult = {
  assessmentType: "PURPOSE" | "CONSTITUTIONAL" | "TEAM" | "ENTERPRISE";

  /** The dominant pattern the system detected — not a diagnosis, a signal */
  primarySignal: string;

  /** How confident the system is in this signal */
  signalStrength: SignalStrength;

  /** The chain of evidence that produced this signal — traceable, falsifiable */
  evidenceChain: EvidenceLink[];

  /** Where the user's own answers contradict each other */
  internalContradictions: string[];

  /** The binary decision this result surfaces */
  decisionInFrontOfYou: string;

  /** One action. Observable. Doable in 24-72 hours. Tied to the signal. */
  minimumViableMove: string;

  /** What happens if nothing changes — one sentence, not dramatic */
  ifUnchanged: string;

  /** What this result is based on and what it cannot claim */
  validityBoundary: string;

  /** Specific actions that would make this signal stronger */
  whatWouldStrengthenThis: string[];

  /** Where this pattern breaks at scale */
  scaleImplication: string;

  /** Raw scores for transparency — not for display prominence */
  scores: Record<string, number>;
};

/**
 * Compute signal strength from consistency, input quality, and coverage.
 *
 * STRONG: consistent pattern + specific inputs + adequate coverage
 * MODERATE: directional pattern + some specificity
 * WEAK: noisy pattern or insufficient inputs
 * REQUIRES_VALIDATION: contradictory signals that need external evidence
 */
export function computeSignalStrength(params: {
  consistencyScore: number;    // 0-100 from detectInternalContradictions
  specificityScore: number;    // 0-100 from specificityScore()
  inputCoverage: number;       // 0-1: what fraction of questions/domains were answered
  contradictionCount: number;  // number of internal contradictions detected
}): SignalStrength {
  const { consistencyScore, specificityScore, inputCoverage, contradictionCount } = params;

  // Contradictions that exceed threshold require external validation
  if (contradictionCount >= 3) return "REQUIRES_VALIDATION";

  const composite = (
    consistencyScore * 0.35 +
    specificityScore * 0.30 +
    (inputCoverage * 100) * 0.25 +
    (contradictionCount === 0 ? 10 : 0) // bonus for zero contradictions
  );

  if (composite >= 72) return "STRONG";
  if (composite >= 45) return "MODERATE";
  return "WEAK";
}

/**
 * Build an evidence chain from domain scores and detected patterns.
 */
export function buildEvidenceChain(
  observations: Array<{
    source: string;
    pattern: string;
    score: number;
    maxScore: number;
    explanation: string;
  }>,
): EvidenceLink[] {
  const totalWeight = observations.reduce((s, o) => s + o.score, 0) || 1;

  return observations
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((o) => ({
      inputSource: o.source,
      observedPattern: o.pattern,
      weight: Math.round((o.score / totalWeight) * 100) / 100,
      explanation: o.explanation,
    }));
}
