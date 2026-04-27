/**
 * Case Review Policy — Human Review Gate
 *
 * Only approved drafts can become public evidence.
 * Rejected drafts remain internal.
 * Published cases must retain sourceOutcomeId internally.
 * Public output must remove identifying details.
 */

import type { CaseStudyDraft, CaseStudyDraftStatus } from "./case-study-types";

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewAction = "submit_for_review" | "approve" | "reject" | "request_changes";

export type ReviewDecision = {
  action: ReviewAction;
  reviewerId: string;
  notes?: string;
  reviewedAt: string;
};

export type ReviewResult = {
  allowed: boolean;
  newStatus: CaseStudyDraftStatus;
  reason?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION MAP
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<CaseStudyDraftStatus, CaseStudyDraftStatus[]> = {
  draft: ["needs_review"],
  needs_review: ["approved", "rejected"],
  approved: ["published", "needs_review"],
  rejected: ["needs_review"],
  published: ["needs_review"], // Recall for correction
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a review action on a case draft.
 * Enforces the state transition rules.
 */
export function executeReview(
  draft: CaseStudyDraft,
  decision: ReviewDecision,
): ReviewResult {
  const allowedNext = ALLOWED_TRANSITIONS[draft.status];

  let newStatus: CaseStudyDraftStatus;

  switch (decision.action) {
    case "approve":
      if (draft.status === "needs_review") {
        newStatus = "approved";
      } else {
        return { allowed: false, newStatus: draft.status, reason: `Cannot approve from status: ${draft.status}` };
      }
      break;

    case "reject":
      if (draft.status === "needs_review") {
        newStatus = "rejected";
      } else {
        return { allowed: false, newStatus: draft.status, reason: `Cannot reject from status: ${draft.status}` };
      }
      break;

    case "submit_for_review":
      if (draft.status === "draft") {
        newStatus = "needs_review";
      } else {
        return { allowed: false, newStatus: draft.status, reason: `Cannot submit for review from status: ${draft.status}` };
      }
      break;

    case "request_changes":
      if (draft.status === "needs_review" || draft.status === "approved" || draft.status === "draft") {
        newStatus = "needs_review";
      } else {
        return { allowed: false, newStatus: draft.status, reason: `Cannot request changes from status: ${draft.status}` };
      }
      break;

    default:
      return { allowed: false, newStatus: draft.status, reason: `Unknown action: ${decision.action}` };
  }

  if (!allowedNext.includes(newStatus)) {
    return {
      allowed: false,
      newStatus: draft.status,
      reason: `Transition from ${draft.status} to ${newStatus} is not permitted`,
    };
  }

  return { allowed: true, newStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICATION CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a draft is ready for publication.
 * Only approved drafts with valid integrity seals may be published.
 */
export function canPublish(draft: CaseStudyDraft): ReviewResult {
  if (draft.status !== "approved") {
    return { allowed: false, newStatus: draft.status, reason: "Only approved drafts can be published" };
  }

  if (!draft.integritySeal.publicationAllowed) {
    return { allowed: false, newStatus: draft.status, reason: "Integrity seal does not permit publication" };
  }

  if (draft.integritySeal.sealLevel === "BRONZE") {
    return { allowed: false, newStatus: draft.status, reason: "BRONZE seal level is insufficient for publication" };
  }

  return { allowed: true, newStatus: "published" };
}

// ─────────────────────────────────────────────────────────────────────────────
// SANITISATION FOR PUBLIC OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip identifying details from a draft for public output.
 * Internal fields (sourceOutcomeId, sourceContractId, sourceDecisionId) are removed.
 */
export function sanitiseForPublicOutput(draft: CaseStudyDraft): Record<string, unknown> {
  return {
    title: draft.title,
    classification: draft.classification,
    verificationBasis: draft.verificationBasis,
    confidentialityNotes: draft.confidentialityNotes,
    situation: draft.situation,
    contradiction: draft.contradiction,
    decision: draft.decision,
    intervention: draft.intervention,
    outcome: draft.outcome,
    financialImpactGBP: draft.financialImpactGBP,
    timeframeDays: draft.timeframeDays,
    confidence: draft.confidence,
    integritySeal: draft.integritySeal,
    status: draft.status,
    publishedAt: draft.updatedAt ?? draft.createdAt,
  };
}
