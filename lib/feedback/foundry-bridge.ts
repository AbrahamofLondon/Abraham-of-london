import { prisma } from "@/lib/prisma.server";
import { logAccessAudit } from "@/lib/access/audit";
import { createFalsificationEntry } from "@/lib/falsification/product-falsification";
import { createCaseStudy } from "@/lib/evidence/case-study-service";
import type { FeedbackEventRecord } from "./feedback-types";

const QUALITY_PLACEHOLDER = "User feedback raised a quality concern requiring human review.";

async function writeSystemFeedbackEvent(
  action: string,
  event: FeedbackEventRecord,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action,
        category: "feedback",
        severity: event.severity === "critical" ? "critical" : event.severity === "high" ? "error" : "info",
        status: "success",
        resourceType: "FEEDBACK",
        resourceId: event.feedbackId,
        actorId: event.userId,
        actorEmail: event.email,
        sessionId: event.sessionId,
        metadata: JSON.stringify({
          feedbackId: event.feedbackId,
          surface: event.surface,
          rating: event.rating,
          category: event.category,
          ...metadata,
        }),
      },
    });
  } catch {
    // Audit visibility should not block feedback handling.
  }
}

export async function createFalsificationFromFeedback(
  event: FeedbackEventRecord,
): Promise<string | null> {
  if (event.linkedFalsificationEntryId) return event.linkedFalsificationEntryId;

  const existing = await prisma.falsificationEntry.findFirst({
    where: {
      sourceEntityType: "FeedbackEvent",
      sourceEntityId: event.feedbackId,
    },
    select: { id: true },
  });
  if (existing?.id) return existing.id;

  const entry = await createFalsificationEntry({
    productCode: event.productCode ?? "unknown",
    artifactId: event.linkedArtifactId,
    sourceEntityType: "FeedbackEvent",
    sourceEntityId: event.feedbackId,
    claimOrRecommendation: QUALITY_PLACEHOLDER,
    confidenceLevel: "MONITORING",
    whatWouldChangeThisView:
      "Human review determines whether the product judgement, source evidence, or recommendation must be amended.",
    observableIndicator:
      "Admin review outcome linked to this feedback event.",
    evidenceCurrentlyMissing:
      "The feedback is a user judgement signal. It is not treated as verified proof until reviewed.",
  });

  await writeSystemFeedbackEvent("FEEDBACK_FALSIFICATION_REVIEW_CREATED", event, {
    falsificationEntryId: entry.id,
  });

  return entry.id;
}

export async function flagBoardroomQualityReview(event: FeedbackEventRecord): Promise<void> {
  if (!event.linkedOrderId) {
    await writeSystemFeedbackEvent("FEEDBACK_BOARDROOM_QUALITY_REVIEW_REQUIRED", event, {
      reason: "No linked order provided; recorded as audit signal only.",
    });
    return;
  }

  const order = await prisma.boardroomBriefOrder.findUnique({
    where: { id: event.linkedOrderId },
    select: { id: true, metadata: true },
  });

  if (!order) {
    await writeSystemFeedbackEvent("FEEDBACK_BOARDROOM_QUALITY_REVIEW_REQUIRED", event, {
      orderId: event.linkedOrderId,
      reason: "Linked order not found; recorded as audit signal only.",
    });
    return;
  }

  const metadata =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};

  await prisma.boardroomBriefOrder.update({
    where: { id: order.id },
    data: {
      metadata: {
        ...metadata,
        feedbackQualityReview: {
          required: true,
          feedbackId: event.feedbackId,
          category: event.category,
          flaggedAt: new Date().toISOString(),
        },
      },
    },
  });

  await logAccessAudit({
    actorType: "SYSTEM",
    action: "FEEDBACK_BOARDROOM_QUALITY_REVIEW_FLAGGED",
    targetType: "BoardroomBriefOrder",
    targetKey: order.id,
    metadata: {
      feedbackId: event.feedbackId,
      surface: event.surface,
      category: event.category,
    },
  });
}

export async function createPatternObservationFromFeedback(
  event: FeedbackEventRecord,
  occurrenceCount: number,
  patternType = "repeated_negative_surface",
): Promise<string | null> {
  const patternLabel =
    patternType === "retainer_health_warning"
      ? `Retainer health warning: ${event.linkedRetainerCycleId ?? event.surface}`
      : `Repeated negative feedback: ${event.surface}`;

  const existing = await (prisma as any).patternObservation.findFirst({
    where: {
      patternType,
      patternLabel,
      status: "ACTIVE",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    const sourceRunIds = Array.isArray(existing.sourceRunIds) ? existing.sourceRunIds : [];
    const surfaceIn = Array.isArray(existing.surfaceIn) ? existing.surfaceIn : [];
    const updated = await (prisma as any).patternObservation.update({
      where: { id: existing.id },
      data: {
        observationCount: Math.max(occurrenceCount, existing.observationCount ?? 1),
        sourceRunIds: Array.from(new Set([...sourceRunIds, event.feedbackId])),
        surfaceIn: Array.from(new Set([...surfaceIn, event.surface])),
        recommendedAction:
          patternType === "retainer_health_warning"
            ? "Review retainer cycle health and client governance risk."
            : "Review the affected product surface before expanding feedback placement.",
        riskOfRepeat: "HIGH",
      },
    });
    return updated.id;
  }

  const created = await (prisma as any).patternObservation.create({
    data: {
      userId: event.userId,
      userEmail: event.email,
      organisationId: null,
      patternType,
      patternLabel,
      patternDetail:
        patternType === "retainer_health_warning"
          ? "Repeated negative feedback was recorded against a retainer review cycle."
          : "Multiple negative feedback events were recorded against the same surface within the review window.",
      observationCount: occurrenceCount,
      sourceRunIds: [event.feedbackId],
      recommendedAction:
        patternType === "retainer_health_warning"
          ? "Review retainer cycle health and client governance risk."
          : "Review the affected product surface before expanding feedback placement.",
      riskOfRepeat: "HIGH",
      surfaceIn: [event.surface],
      status: "ACTIVE",
    },
  });

  await writeSystemFeedbackEvent("FEEDBACK_PATTERN_OBSERVED", event, {
    patternObservationId: created.id,
    patternType,
    occurrenceCount,
  });

  return created.id;
}

export async function createCaseStudyCandidateFromFeedback(
  event: FeedbackEventRecord,
): Promise<string | null> {
  if (event.linkedCaseStudyId) return event.linkedCaseStudyId;
  if (!event.linkedArtifactId && !event.linkedOrderId) return null;

  const existingLink = await prisma.caseStudyEvidence.findFirst({
    where: { sourceType: "feedback_event", sourceId: event.feedbackId },
    select: { caseStudyId: true },
  });
  if (existingLink?.caseStudyId) return existingLink.caseStudyId;

  const evidenceLinks = [
    { sourceType: "feedback_event", sourceId: event.feedbackId, notes: "Positive paid-product feedback. Comment not public by default." },
  ];
  if (event.linkedArtifactId) {
    evidenceLinks.push({
      sourceType: "product_artifact",
      sourceId: event.linkedArtifactId,
      notes: "Linked artifact for case-study candidate review.",
    });
  }
  if (event.linkedOrderId) {
    evidenceLinks.push({
      sourceType: "boardroom_brief_order",
      sourceId: event.linkedOrderId,
      notes: "Linked order for case-study candidate review.",
    });
  }

  const record = await createCaseStudy({
    title: `Feedback candidate: ${event.productCode ?? event.surface}`,
    productCode: event.productCode ?? undefined,
    caseType: "feedback_candidate",
    evidenceStatus: event.linkedArtifactId ? "EVIDENCE_LINKED" : "METHOD_DEMONSTRATION",
    outcomeStatus: event.linkedOutcomeHypothesisId ? "PENDING_REVIEW" : "NOT_MEASURED",
    visibilityStatus: "DRAFT",
    narrative: {
      pressureCondition: "Positive paid-product feedback was received.",
      interventionPerformed: "Candidate created for private case-study review only.",
      currentOutcomeState: "No public proof has been created.",
      adminNotes:
        "Generated from FeedbackEvent. Raw feedback comment must remain private unless reviewed, anonymised, and consent rules pass.",
    },
    evidenceLinks,
    adminRef: event.feedbackId,
  });

  await writeSystemFeedbackEvent("FEEDBACK_CASE_STUDY_CANDIDATE_CREATED", event, {
    caseStudyId: record.id,
  });

  return record.id;
}

export async function linkFeedbackToOutcomeHypothesis(
  event: FeedbackEventRecord,
): Promise<string | null> {
  if (!event.linkedOutcomeHypothesisId) return null;
  const existing = await prisma.outcomeHypothesis.findUnique({
    where: { hypothesisId: event.linkedOutcomeHypothesisId },
    select: { hypothesisId: true },
  });
  if (!existing) return null;

  await writeSystemFeedbackEvent(
    event.rating === "negative" && event.category === "outcome_relevance"
      ? "FEEDBACK_OUTCOME_REVIEW_REQUIRED"
      : "FEEDBACK_OUTCOME_HYPOTHESIS_LINKED",
    event,
    { outcomeHypothesisId: existing.hypothesisId },
  );

  return existing.hypothesisId;
}

export async function linkFeedbackToRetainerCycle(
  event: FeedbackEventRecord,
): Promise<string | null> {
  if (!event.linkedRetainerCycleId) return null;
  const existing = await prisma.oversightReviewCycle.findUnique({
    where: { id: event.linkedRetainerCycleId },
    select: { id: true },
  });
  if (!existing) return null;

  await writeSystemFeedbackEvent("FEEDBACK_RETAINER_CYCLE_LINKED", event, {
    retainerCycleId: existing.id,
  });

  return existing.id;
}

export async function recordSalesFollowupSignal(event: FeedbackEventRecord): Promise<void> {
  await writeSystemFeedbackEvent("FEEDBACK_SALES_FOLLOWUP_SIGNAL", event, {
    contactAvailable: Boolean(event.email || event.userId),
    consentRequired: true,
  });
}

export async function recordConversionReadinessSignal(event: FeedbackEventRecord): Promise<void> {
  await writeSystemFeedbackEvent("FEEDBACK_CONVERSION_READINESS_SIGNAL", event, {
    discountCreated: false,
    attributionStatus: "signal_only",
  });
}
