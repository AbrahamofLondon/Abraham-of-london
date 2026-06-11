import { prisma } from "@/lib/prisma.server";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { FeedbackEventRecord } from "./feedback-types";

export type ClientContinuitySummary = {
  feedbackReceived: number;
  qualityConcernsUnderReview: number;
  outcomeHypothesisLinked: boolean;
  caseMemoryUpdated: boolean;
  nextReviewRecommended: boolean;
  unresolvedFeedback: number;
  retainerReadinessSignal: boolean;
  summary: string;
};

function mapEvent(row: any): FeedbackEventRecord {
  return {
    ...row,
    subjectId: row.subjectId ?? null,
    comment: null,
    productCode: row.productCode ?? null,
    userId: row.userId ?? null,
    email: row.email ?? null,
    sessionId: row.sessionId ?? null,
    sourceUrl: row.sourceUrl ?? null,
    referrer: row.referrer ?? null,
    deployCommit: row.deployCommit ?? null,
    reviewedAt: row.reviewedAt ?? null,
    reviewedBy: row.reviewedBy ?? null,
    linkedOrderId: row.linkedOrderId ?? null,
    linkedArtifactId: row.linkedArtifactId ?? null,
    linkedFalsificationEntryId: row.linkedFalsificationEntryId ?? null,
    linkedOutcomeHypothesisId: row.linkedOutcomeHypothesisId ?? null,
    linkedCaseStudyId: row.linkedCaseStudyId ?? null,
    linkedRetainerCycleId: row.linkedRetainerCycleId ?? null,
  };
}

export function buildClientContinuitySummary(events: FeedbackEventRecord[]): ClientContinuitySummary {
  const feedbackReceived = events.length;
  const qualityConcernsUnderReview = events.filter((event) => event.reviewRequired || event.triageStatus === "in_review").length;
  const unresolvedFeedback = events.filter((event) =>
    event.reviewRequired && event.triageStatus !== "reviewed" && event.triageStatus !== "closed",
  ).length;
  const outcomeHypothesisLinked = events.some((event) => Boolean(event.linkedOutcomeHypothesisId));
  const retainerReadinessSignal = events.some((event) =>
    event.surface === "retainer_review_cycle" ||
    (event.surface === "decision_centre_case" && event.confidence >= 4) ||
    (event.rating === "negative" && ["trust", "accuracy", "outcome_relevance"].includes(event.category)),
  );

  const parts = ["Your case memory has been updated."];
  if (qualityConcernsUnderReview > 0) {
    parts.push(`${qualityConcernsUnderReview} feedback signal${qualityConcernsUnderReview === 1 ? " is" : "s are"} under quality review.`);
  }
  parts.push(outcomeHypothesisLinked ? "Outcome evidence is linked." : "Outcome evidence remains pending.");

  return {
    feedbackReceived,
    qualityConcernsUnderReview,
    outcomeHypothesisLinked,
    caseMemoryUpdated: feedbackReceived > 0,
    nextReviewRecommended: unresolvedFeedback > 0 || retainerReadinessSignal,
    unresolvedFeedback,
    retainerReadinessSignal,
    summary: parts.join(" "),
  };
}

export function feedbackEventsToGovernedMemory(events: FeedbackEventRecord[]): GovernedMemoryItem[] {
  return events.slice(0, 3).map((event) => ({
    id: `feedback-memory-${event.feedbackId}`,
    label: "Feedback received",
    summary: event.reviewRequired
      ? `Feedback on ${event.category.replace(/_/g, " ")} is recorded for review.`
      : `Feedback on ${event.category.replace(/_/g, " ")} was recorded.`,
    sourceSurface: "DECISION_CENTRE",
    capturedAt: event.createdAt.toISOString(),
    evidenceOrigin: "SELF_REPORTED",
    status: event.reviewRequired && event.triageStatus !== "reviewed" ? "UNRESOLVED" : "ACTIVE",
    confidenceLabel: event.confidence >= 4 ? "CAPTURED" : "PARTIAL",
    audienceSafe: true,
    relatedCaseId: event.subjectId,
  }));
}

export async function loadClientContinuitySummaryForCase(caseId: string): Promise<{
  summary: ClientContinuitySummary;
  memory: GovernedMemoryItem[];
}> {
  const rows = await (prisma as any).feedbackEvent.findMany({
    where: {
      OR: [
        { surface: "decision_centre_case", subjectId: caseId },
        { subjectType: "decision_centre_case", subjectId: caseId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);
  const events = rows.map(mapEvent);
  return {
    summary: buildClientContinuitySummary(events),
    memory: feedbackEventsToGovernedMemory(events),
  };
}
