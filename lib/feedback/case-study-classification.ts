import type { FeedbackEventRecord } from "./feedback-types";

export type CaseStudyCandidateClassification =
  | "testimonial_candidate"
  | "anonymised_case_study_candidate"
  | "proof_candidate_pending_outcome"
  | "private_reference_only"
  | "not_usable";

export type CaseStudyCandidateAssessment = {
  classification: CaseStudyCandidateClassification;
  usableReason: string;
  missing: string[];
  consentStatus: "PENDING" | "GRANTED" | "REVOKED" | "NOT_REQUIRED" | "UNKNOWN";
  evidenceStatus: "EVIDENCE_LINKED" | "EVIDENCE_PENDING" | "METHOD_DEMONSTRATION";
  outcomeStatus: "OUTCOME_LINKED" | "PENDING_OUTCOME" | "NOT_MEASURED";
  publicUseAllowed: false;
  rawCommentPrivate: true;
};

function isPaid(event: FeedbackEventRecord): boolean {
  return Boolean(
    event.linkedOrderId ||
    event.linkedArtifactId ||
    ["boardroom_brief_delivered", "strategy_room_session", "return_brief_outcome", "retainer_review_cycle"].includes(event.surface),
  );
}

export function classifyCaseStudyCandidateFromFeedback(event: FeedbackEventRecord): CaseStudyCandidateAssessment {
  if (event.rating !== "positive") {
    return {
      classification: "not_usable",
      usableReason: "Only positive feedback can enter case-study candidate review.",
      missing: ["positive feedback"],
      consentStatus: "UNKNOWN",
      evidenceStatus: "EVIDENCE_PENDING",
      outcomeStatus: "NOT_MEASURED",
      publicUseAllowed: false,
      rawCommentPrivate: true,
    };
  }

  const missing: string[] = [];
  if (!event.followupRequested && !event.email && !event.userId) missing.push("consent/contact path");
  if (!event.linkedArtifactId && !event.linkedOrderId && !event.evidenceHash) missing.push("linked evidence");
  if (!event.linkedOutcomeHypothesisId) missing.push("outcome evidence");

  const evidenceStatus = event.linkedArtifactId || event.linkedOrderId || event.evidenceHash
    ? "EVIDENCE_LINKED"
    : isPaid(event)
      ? "EVIDENCE_PENDING"
      : "METHOD_DEMONSTRATION";
  const outcomeStatus = event.linkedOutcomeHypothesisId ? "PENDING_OUTCOME" : "NOT_MEASURED";

  let classification: CaseStudyCandidateClassification = "private_reference_only";
  if (!isPaid(event)) {
    classification = event.comment ? "testimonial_candidate" : "private_reference_only";
  } else if (event.linkedOutcomeHypothesisId) {
    classification = "proof_candidate_pending_outcome";
  } else if (event.linkedArtifactId || event.linkedOrderId || event.evidenceHash) {
    classification = "anonymised_case_study_candidate";
  }

  return {
    classification,
    usableReason:
      classification === "proof_candidate_pending_outcome"
        ? "Positive paid feedback has an outcome link, but outcome proof must remain pending until verified."
        : classification === "anonymised_case_study_candidate"
          ? "Positive paid feedback has linked evidence and can be reviewed as an anonymised draft candidate."
          : classification === "testimonial_candidate"
            ? "Positive feedback may be usable as a testimonial only after consent and review."
            : "Feedback may be useful privately but is not ready for public proof.",
    missing,
    consentStatus: "PENDING",
    evidenceStatus,
    outcomeStatus,
    publicUseAllowed: false,
    rawCommentPrivate: true,
  };
}
