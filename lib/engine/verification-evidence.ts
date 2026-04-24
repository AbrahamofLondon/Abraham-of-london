/**
 * #4 — Verification Evidence Requirements
 *
 * For high-stakes claims, the system requires proof.
 * "You scored Decision Integrity 80%. Prove it."
 *
 * WHY IRREPLICABLE: Creates unfakeable data. Gaming is impossible
 * because reality is always the truth.
 */

export type VerificationRequest = {
  domain: string;
  claimedScore: number;
  requiredEvidence: string;
  evidenceType: "decision_list" | "calendar_audit" | "stakeholder_check" | "outcome_record";
  /** Minimum items needed */
  minimumItems: number;
};

export type VerificationResult = {
  domain: string;
  claimedScore: number;
  verifiedScore: number;
  gap: number;
  verified: boolean;
  blindSpotDetected: boolean;
  narrative: string;
};

/**
 * Determine what verification is needed based on scores.
 * High scores on verifiable domains trigger evidence requirements.
 */
export function computeVerificationRequirements(
  scores: Record<string, number>,
  assessmentType: string,
): VerificationRequest[] {
  const requests: VerificationRequest[] = [];

  for (const [domain, score] of Object.entries(scores)) {
    // Only require verification for high claims (>70%) on verifiable domains
    if (score < 70) continue;

    if (domain === "decision" || domain === "decision_integrity") {
      requests.push({
        domain,
        claimedScore: score,
        requiredEvidence: "List your last 5 decisions with: context, what you chose, what it cost, whether it tracked your stated principle.",
        evidenceType: "decision_list",
        minimumItems: 3,
      });
    }

    if (domain === "behaviour" || domain === "operational_behaviour") {
      requests.push({
        domain,
        claimedScore: score,
        requiredEvidence: "What percentage of your last 90 days was spent on stated priorities vs reactive work? Estimate honestly.",
        evidenceType: "calendar_audit",
        minimumItems: 1,
      });
    }

    if (domain === "authority" || domain === "authority_clarity") {
      requests.push({
        domain,
        claimedScore: score,
        requiredEvidence: "For the 3 most recent contested decisions: who decided? Was it the formally authorised person?",
        evidenceType: "stakeholder_check",
        minimumItems: 2,
      });
    }

    if (domain === "execution" || domain === "execution_trust") {
      requests.push({
        domain,
        claimedScore: score,
        requiredEvidence: "Name 3 decisions made in the last quarter. For each: was the outcome what was intended? If not, why?",
        evidenceType: "outcome_record",
        minimumItems: 2,
      });
    }
  }

  return requests;
}

/**
 * Score verification evidence against the claimed score.
 */
export function scoreVerification(
  claimed: number,
  evidenceItems: Array<{ consistent: boolean; explanation: string }>,
): VerificationResult {
  const consistent = evidenceItems.filter((e) => e.consistent).length;
  const total = evidenceItems.length;
  const ratio = total > 0 ? consistent / total : 0;

  const verifiedScore = Math.round(claimed * ratio);
  const gap = claimed - verifiedScore;
  const blindSpotDetected = gap >= 20;

  const narrative = blindSpotDetected
    ? `Claimed ${claimed}% but evidence supports ${verifiedScore}%. A ${gap}-point gap indicates a blind spot — the condition is weaker than self-report suggests.`
    : gap >= 10
    ? `Claimed ${claimed}%, evidence supports ${verifiedScore}%. Minor gap (${gap} points) — self-awareness is close but not exact.`
    : `Claimed ${claimed}%, evidence supports ${verifiedScore}%. Self-report and evidence are aligned.`;

  return {
    domain: "",
    claimedScore: claimed,
    verifiedScore,
    gap,
    verified: gap < 15,
    blindSpotDetected,
    narrative,
  };
}
