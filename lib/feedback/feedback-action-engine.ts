import { prisma } from "@/lib/prisma.server";
import {
  createCaseStudyCandidateFromFeedback,
  createFalsificationFromFeedback,
  createPatternObservationFromFeedback,
  flagBoardroomQualityReview,
  linkFeedbackToOutcomeHypothesis,
  linkFeedbackToRetainerCycle,
  recordConversionReadinessSignal,
  recordSalesFollowupSignal,
} from "./foundry-bridge";
import type {
  FeedbackActionResult,
  FeedbackActionStatus,
  FeedbackEventRecord,
  FeedbackSeverity,
} from "./feedback-types";

const SERIOUS_NEGATIVE_CATEGORIES = new Set([
  "accuracy",
  "trust",
  "evidence_quality",
  "outcome_relevance",
]);

const FREE_SURFACES = new Set([
  "pressure_signal_result",
  "fast_diagnostic_result",
  "boardroom_brief_sample",
  "case_study_public",
  "playbook_download",
]);

const PAID_SURFACES = new Set([
  "boardroom_brief_delivered",
  "strategy_room_session",
  "return_brief_outcome",
  "retainer_review_cycle",
  "admin_delivery",
]);

function isPaid(event: FeedbackEventRecord): boolean {
  if (event.linkedOrderId || event.linkedArtifactId) return true;
  if (PAID_SURFACES.has(event.surface)) return true;
  if (FREE_SURFACES.has(event.surface)) return false;
  return Boolean(event.productCode);
}

function rankSeverity(current: FeedbackSeverity, next: FeedbackSeverity): FeedbackSeverity {
  const rank: Record<FeedbackSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  return rank[next] > rank[current] ? next : current;
}

function chooseActionStatus(
  current: FeedbackActionStatus,
  next: FeedbackActionStatus,
): FeedbackActionStatus {
  const rank: Record<FeedbackActionStatus, number> = {
    logged: 1,
    linked_to_sales_followup: 2,
    linked_to_case_study_candidate: 3,
    triage_required: 4,
    linked_to_quality_review: 5,
    linked_to_risk: 6,
    closed_no_action: 0,
    resolved: 0,
  };
  return rank[next] > rank[current] ? next : current;
}

async function countRecentNegativeSurfaceEvents(event: FeedbackEventRecord): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return (prisma as any).feedbackEvent.count({
    where: {
      surface: event.surface,
      rating: "negative",
      createdAt: { gte: since },
    },
  });
}

async function countNegativeRetainerEvents(event: FeedbackEventRecord): Promise<number> {
  if (!event.linkedRetainerCycleId) return 0;
  return (prisma as any).feedbackEvent.count({
    where: {
      linkedRetainerCycleId: event.linkedRetainerCycleId,
      rating: "negative",
    },
  });
}

export async function evaluateFeedbackActions(
  event: FeedbackEventRecord,
): Promise<FeedbackActionResult> {
  let actionStatus = event.actionStatus;
  let severity = event.severity;
  let reviewRequired = event.reviewRequired;
  const updates: FeedbackActionResult = {};
  const paid = isPaid(event);

  if (
    event.rating === "negative" &&
    SERIOUS_NEGATIVE_CATEGORIES.has(event.category) &&
    paid
  ) {
    const falsificationEntryId = await createFalsificationFromFeedback(event);
    if (falsificationEntryId) updates.linkedFalsificationEntryId = falsificationEntryId;
    reviewRequired = true;
    severity = rankSeverity(severity, "high");
    actionStatus = chooseActionStatus(actionStatus, "linked_to_risk");
  }

  if (event.rating === "negative" && event.surface === "boardroom_brief_delivered") {
    await flagBoardroomQualityReview(event);
    reviewRequired = true;
    severity = rankSeverity(severity, "high");
    actionStatus = chooseActionStatus(actionStatus, "linked_to_quality_review");
  }

  if (event.rating === "negative") {
    const recentNegativeCount = await countRecentNegativeSurfaceEvents(event);
    if (recentNegativeCount >= 3) {
      await createPatternObservationFromFeedback(event, recentNegativeCount);
      reviewRequired = true;
      severity = rankSeverity(severity, "high");
      actionStatus = chooseActionStatus(actionStatus, "triage_required");
    }
  }

  if (event.rating === "positive" && paid && (event.linkedArtifactId || event.linkedOrderId)) {
    const caseStudyId = await createCaseStudyCandidateFromFeedback(event);
    if (caseStudyId) updates.linkedCaseStudyId = caseStudyId;
    actionStatus = chooseActionStatus(actionStatus, "linked_to_case_study_candidate");
  }

  if (event.rating === "positive" && event.followupRequested) {
    await recordSalesFollowupSignal(event);
    actionStatus = chooseActionStatus(actionStatus, "linked_to_sales_followup");
  }

  if (event.rating === "positive" && !paid) {
    await recordConversionReadinessSignal(event);
  }

  if (event.surface === "return_brief_outcome") {
    const outcomeHypothesisId = await linkFeedbackToOutcomeHypothesis(event);
    if (outcomeHypothesisId) updates.linkedOutcomeHypothesisId = outcomeHypothesisId;
    if (event.rating === "negative" && event.category === "outcome_relevance") {
      reviewRequired = true;
      severity = rankSeverity(severity, "high");
      actionStatus = chooseActionStatus(actionStatus, "linked_to_risk");
    }
  }

  if (event.surface === "retainer_review_cycle") {
    const retainerCycleId = await linkFeedbackToRetainerCycle(event);
    if (retainerCycleId) updates.linkedRetainerCycleId = retainerCycleId;
    if (event.rating === "negative") {
      const count = await countNegativeRetainerEvents(event);
      if (count >= 2) {
        await createPatternObservationFromFeedback(event, count, "retainer_health_warning");
        reviewRequired = true;
        severity = rankSeverity(severity, "high");
        actionStatus = chooseActionStatus(actionStatus, "triage_required");
      }
    }
  }

  if (actionStatus !== event.actionStatus) updates.actionStatus = actionStatus;
  if (severity !== event.severity) updates.severity = severity;
  if (reviewRequired !== event.reviewRequired) updates.reviewRequired = reviewRequired;
  if (reviewRequired && event.triageStatus === "unreviewed") {
    updates.triageStatus = "unreviewed";
  }

  return updates;
}
