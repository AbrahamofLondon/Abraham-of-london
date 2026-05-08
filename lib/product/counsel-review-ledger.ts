/**
 * lib/product/counsel-review-ledger.ts — Governed counsel review tracking.
 *
 * Counsel cannot bypass system governance. Counsel must become evidence.
 * If counsel remains just "talk to Abraham," the product becomes consulting.
 */

export type CounselReviewState =
  | "NOT_REQUIRED"
  | "TRIGGERED"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "RECOMMENDATION_RECORDED"
  | "CLIENT_ACTION_REQUIRED"
  | "OUTCOME_PENDING"
  | "CLOSED";

export type CounselReviewEntry = {
  id: string;
  caseId: string;
  cycleId?: string;
  triggerReason: string;
  state: CounselReviewState;
  assignedAt?: string | null;
  reviewedAt?: string | null;
  closedAt?: string | null;
  recommendation?: string | null;
  evidenceCreated: boolean;
  actionRequired?: string | null;
  outcome?: "ACCEPTED" | "REJECTED" | "DEFERRED" | null;
};

export type CounselReviewLedger = {
  entries: CounselReviewEntry[];
  activeReviews: number;
  closedReviews: number;
  recommendationsRecorded: number;
  evidenceNodesCreated: number;
  summary: string;
};

/**
 * Assemble a counsel review ledger from available entries.
 */
export function assembleCounselReviewLedger(
  entries: CounselReviewEntry[],
): CounselReviewLedger {
  const activeReviews = entries.filter(
    (e) => e.state !== "CLOSED" && e.state !== "NOT_REQUIRED",
  ).length;
  const closedReviews = entries.filter((e) => e.state === "CLOSED").length;
  const recommendationsRecorded = entries.filter(
    (e) => e.state === "RECOMMENDATION_RECORDED" || e.recommendation,
  ).length;
  const evidenceNodesCreated = entries.filter((e) => e.evidenceCreated).length;

  return {
    entries,
    activeReviews,
    closedReviews,
    recommendationsRecorded,
    evidenceNodesCreated,
    summary: entries.length === 0
      ? "No counsel reviews recorded."
      : `${entries.length} counsel review${entries.length !== 1 ? "s" : ""}. ${activeReviews} active. ${recommendationsRecorded} recommendation${recommendationsRecorded !== 1 ? "s" : ""} recorded. ${evidenceNodesCreated} created evidence.`,
  };
}
