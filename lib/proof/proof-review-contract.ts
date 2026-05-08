/**
 * Proof Review Contract — Admin Proof Governance
 *
 * Defines the structure for proof review decisions.
 * No proof may be published without a recorded review decision.
 */

export type ProofReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUPPRESSED";

export type ProofReviewDecision = {
  evidenceId: string;
  reviewerId: string;
  status: ProofReviewStatus;
  reason: string;
  evidenceClass: "SELF_REPORTED" | "BEHAVIOURAL" | "DOCUMENTARY" | "OPERATOR_CONFIRMED";
  sealLevel: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | null;
  verificationMethod: string;
  anonymisationVerified: boolean;
  publicationEligible: boolean;
  reviewedAt: string;
};

export type ProofReviewInput = {
  evidenceId: string;
  status: ProofReviewStatus;
  reason: string;
  evidenceClass: ProofReviewDecision["evidenceClass"];
  sealLevel: ProofReviewDecision["sealLevel"];
  anonymisationVerified: boolean;
};

/**
 * Validate that a review decision meets minimum requirements before recording.
 */
export function validateReviewDecision(input: ProofReviewInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.reason || input.reason.trim().length < 10) {
    errors.push("Review reason must be at least 10 characters");
  }

  if (input.status === "APPROVED" && !input.anonymisationVerified) {
    errors.push("Cannot approve proof without verifying anonymisation");
  }

  if (input.status === "APPROVED" && input.sealLevel === "BRONZE") {
    errors.push("BRONZE seal evidence cannot be approved for publication");
  }

  if (input.status === "APPROVED" && input.evidenceClass === "SELF_REPORTED") {
    errors.push("Self-reported evidence cannot be approved for publication");
  }

  return { valid: errors.length === 0, errors };
}
