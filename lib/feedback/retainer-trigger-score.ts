import { prisma } from "@/lib/prisma.server";
import type { FeedbackEventRecord } from "./feedback-types";

export type RetainerTriggerClass = "not_ready" | "candidate" | "review_ready" | "retainer_recommended";

export type RetainerTriggerInput = {
  governedCaseCount?: number;
  returnBriefCount?: number;
  unresolvedOutcomeHypothesisCount?: number;
  trustAccuracyOutcomeFeedbackCount?: number;
  decisionCentreUsageCount?: number;
  paidArtifactFeedbackCount?: number;
  missedReviewCycleCount?: number;
  highConfidenceOversightPositiveCount?: number;
  governanceContinuityNegativeCount?: number;
  repeatedReturnVisitCount?: number;
};

export type RetainerTriggerScore = {
  readiness: RetainerTriggerClass;
  score: number;
  signals: string[];
  note: string;
};

function addSignal(signals: string[], condition: boolean, label: string, weight: number): number {
  if (!condition) return 0;
  signals.push(label);
  return weight;
}

export function calculateRetainerTriggerScore(input: RetainerTriggerInput): RetainerTriggerScore {
  const signals: string[] = [];
  let score = 0;

  score += addSignal(signals, (input.governedCaseCount ?? 0) >= 2, "2+ governed cases", 0.18);
  score += addSignal(signals, (input.returnBriefCount ?? 0) >= 1, "Return Brief history", 0.12);
  score += addSignal(signals, (input.unresolvedOutcomeHypothesisCount ?? 0) >= 1, "unresolved outcome hypotheses", 0.14);
  score += addSignal(signals, (input.trustAccuracyOutcomeFeedbackCount ?? 0) >= 2, "repeated trust/accuracy/outcome feedback", 0.16);
  score += addSignal(signals, (input.decisionCentreUsageCount ?? 0) >= 2, "repeated Decision Centre usage", 0.14);
  score += addSignal(signals, (input.paidArtifactFeedbackCount ?? 0) >= 1, "paid artifact feedback", 0.12);
  score += addSignal(signals, (input.missedReviewCycleCount ?? 0) >= 1, "missed review cycle", 0.08);
  score += addSignal(signals, (input.highConfidenceOversightPositiveCount ?? 0) >= 1, "high-confidence oversight feedback", 0.12);
  score += addSignal(signals, (input.governanceContinuityNegativeCount ?? 0) >= 1, "governance continuity concern", 0.1);
  score += addSignal(signals, (input.repeatedReturnVisitCount ?? 0) >= 2, "repeated return visits after delivery", 0.08);

  const rounded = Math.min(1, Math.round(score * 100) / 100);
  const readiness: RetainerTriggerClass =
    rounded >= 0.72 ? "retainer_recommended" :
    rounded >= 0.48 ? "review_ready" :
    rounded >= 0.26 ? "candidate" :
    "not_ready";

  return {
    readiness,
    score: rounded,
    signals,
    note: "Internal heuristic only. It is not objective truth, does not create a contract, and requires governed review.",
  };
}

function readinessToSchemaClass(readiness: RetainerTriggerClass): "NOT_READY" | "CANDIDATE" | "REVIEW_READY" {
  if (readiness === "review_ready" || readiness === "retainer_recommended") return "REVIEW_READY";
  if (readiness === "candidate") return "CANDIDATE";
  return "NOT_READY";
}

function toArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function scoreFeedbackCluster(events: FeedbackEventRecord[]): RetainerTriggerScore {
  const surfaces = events.map((event) => event.surface);
  const seriousFeedback = events.filter((event) =>
    ["trust", "accuracy", "outcome_relevance"].includes(event.category),
  );
  return calculateRetainerTriggerScore({
    governedCaseCount: new Set(events.filter((event) => event.surface === "decision_centre_case").map((event) => event.subjectId)).size,
    returnBriefCount: events.filter((event) => event.surface === "return_brief_outcome").length,
    unresolvedOutcomeHypothesisCount: events.filter((event) => event.linkedOutcomeHypothesisId && event.rating !== "positive").length,
    trustAccuracyOutcomeFeedbackCount: seriousFeedback.length,
    decisionCentreUsageCount: surfaces.filter((surface) => surface === "decision_centre_case").length,
    paidArtifactFeedbackCount: events.filter((event) => event.linkedArtifactId || event.linkedOrderId).length,
    highConfidenceOversightPositiveCount: events.filter((event) =>
      event.rating === "positive" && event.confidence >= 4 && ["retainer_review_cycle", "decision_centre_case"].includes(event.surface),
    ).length,
    governanceContinuityNegativeCount: events.filter((event) =>
      event.rating === "negative" && ["retainer_review_cycle", "decision_centre_case"].includes(event.surface),
    ).length,
  });
}

export async function createRetainerReadinessEvaluationFromFeedbackCluster(input: {
  feedbackIds: string[];
  patternObservationId?: string | null;
  adminEmail: string;
}): Promise<{ id: string; readinessClass: string; score: RetainerTriggerScore }> {
  const rows = await (prisma as any).feedbackEvent.findMany({
    where: { feedbackId: { in: input.feedbackIds } },
    orderBy: { createdAt: "desc" },
  });
  const events = rows as FeedbackEventRecord[];
  const score = scoreFeedbackCluster(events);
  const sourceIds = [
    ...input.feedbackIds.map((id) => `feedback:${id}`),
    ...(input.patternObservationId ? [`pattern:${input.patternObservationId}`] : []),
  ];

  const created = await prisma.retainerReadinessEvaluation.create({
    data: {
      userEmail: events.find((event) => event.email)?.email ?? null,
      durableMemoryPresent: events.some((event) => event.surface === "decision_centre_case"),
      recurringDecisionPattern: events.length >= 2,
      outcomeHistoryPresent: events.some((event) => Boolean(event.linkedOutcomeHypothesisId)),
      repeatedHighRisk: events.filter((event) => event.severity === "high" || event.severity === "critical").length >= 2,
      evidenceQualityScore: events.some((event) => event.linkedArtifactId || event.evidenceHash) ? 0.7 : 0.35,
      organisationSignalScore: score.score,
      overallReadinessScore: score.score,
      readinessClass: readinessToSchemaClass(score.readiness),
      adminApprovalRequired: true,
      evaluatorNotes: [
        "Created from feedback cluster by admin action.",
        score.note,
        `Signals: ${score.signals.join(", ") || "none"}.`,
      ].join(" "),
      evidenceSourceIds: sourceIds,
    },
    select: { id: true, readinessClass: true },
  });

  await prisma.systemAuditLog.create({
    data: {
      action: "FEEDBACK_RETAINER_READINESS_EVALUATION_CREATED",
      category: "feedback",
      severity: "info",
      status: "success",
      resourceType: "RETAINER_READINESS_EVALUATION",
      resourceId: created.id,
      actorEmail: input.adminEmail,
      metadata: JSON.stringify({
        feedbackIds: input.feedbackIds,
        patternObservationId: input.patternObservationId ?? null,
        score,
      }),
    },
  }).catch(() => undefined);

  const pattern = input.patternObservationId
    ? await (prisma as any).patternObservation.findUnique?.({ where: { id: input.patternObservationId } }).catch(() => null)
    : null;
  const existingSourceIds = toArray(pattern?.sourceRunIds);
  if (pattern?.id) {
    await (prisma as any).patternObservation.update({
      where: { id: pattern.id },
      data: {
        sourceRunIds: Array.from(new Set([...existingSourceIds, ...input.feedbackIds, created.id])),
        recommendedAction: "Retainer readiness evaluation created from feedback cluster. Review before any offer.",
      },
    }).catch(() => undefined);
  }

  return { id: created.id, readinessClass: created.readinessClass, score };
}
