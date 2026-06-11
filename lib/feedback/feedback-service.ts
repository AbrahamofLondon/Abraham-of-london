import crypto from "crypto";
import type { NextApiRequest } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferrer } from "@/lib/server/request-fingerprint";
import { evaluateFeedbackActions } from "./feedback-action-engine";
import { evaluateFeedbackRouting } from "./feedback-routing-engine";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SCHEMA_VERSION,
  type FeedbackAdoptionAnalytics,
  type FeedbackActionStatus,
  type FeedbackAdminRow,
  type FeedbackCategory,
  type FeedbackEventRecord,
  type FeedbackHealthMetrics,
  type FeedbackPublicResponse,
  type FeedbackRating,
  type FeedbackSeverity,
  type FeedbackSubmitPayload,
} from "./feedback-types";

const feedbackSchema = z.object({
  surface: z.string().trim().min(1).max(120),
  subjectId: z.string().trim().max(240).optional().nullable(),
  rating: z.enum(["positive", "neutral", "negative"]),
  comment: z.string().trim().max(1000).optional().nullable(),
  subjectType: z.string().trim().max(80).optional().nullable(),
  category: z.enum(FEEDBACK_CATEGORIES).optional().nullable(),
  confidence: z.union([z.number().int().min(1).max(5), z.enum(["low", "medium", "high"])]).optional().nullable(),
  followupRequested: z.boolean().optional().nullable(),
  evidenceHash: z.string().trim().max(160).optional().nullable(),
  artifactVersion: z.union([z.string().trim().max(80), z.number()]).optional().nullable(),
  productCode: z.string().trim().max(120).optional().nullable(),
  orderId: z.string().trim().max(160).optional().nullable(),
  artifactId: z.string().trim().max(160).optional().nullable(),
  outcomeHypothesisId: z.string().trim().max(160).optional().nullable(),
  falsificationEntryId: z.string().trim().max(160).optional().nullable(),
  retainerCycleId: z.string().trim().max(160).optional().nullable(),
  caseStudyId: z.string().trim().max(160).optional().nullable(),
  sourceUrl: z.string().trim().max(1000).optional().nullable(),
  userId: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().email().max(240).optional().nullable(),
  sessionId: z.string().trim().max(200).optional().nullable(),
}).strict();

export type NormalizedFeedbackInput = Required<
  Pick<FeedbackSubmitPayload, "surface" | "rating">
> & {
  subjectType: string;
  subjectId: string | null;
  category: FeedbackCategory;
  confidence: number;
  comment: string | null;
  followupRequested: boolean;
  evidenceHash: string | null;
  artifactVersion: string | null;
  productCode: string | null;
  userId: string | null;
  email: string | null;
  sessionId: string | null;
  sourceUrl: string | null;
  referrer: string | null;
  environment: string;
  deployCommit: string | null;
  linkedOrderId: string | null;
  linkedArtifactId: string | null;
  linkedFalsificationEntryId: string | null;
  linkedOutcomeHypothesisId: string | null;
  linkedCaseStudyId: string | null;
  linkedRetainerCycleId: string | null;
  actionStatus: FeedbackActionStatus;
  severity: FeedbackSeverity;
  triageStatus: "unreviewed";
  reviewRequired: boolean;
};

function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeConfidence(value: FeedbackSubmitPayload["confidence"]): number {
  if (value === "low") return 2;
  if (value === "medium") return 3;
  if (value === "high") return 5;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(5, Math.round(value)));
  }
  return 3;
}

function defaultCategory(rating: FeedbackRating): FeedbackCategory {
  if (rating === "negative") return "usefulness";
  if (rating === "neutral") return "clarity";
  return "usefulness";
}

function deriveSubjectType(surface: string, subjectType?: string | null): string {
  const explicit = clean(subjectType);
  if (explicit) return explicit;
  if (surface.includes("boardroom_brief")) return "boardroom_brief";
  if (surface.includes("retainer")) return "retainer_cycle";
  if (surface.includes("return_brief")) return "outcome";
  if (surface === "return-brief") return "return_brief";
  if (surface.includes("decision_centre")) return "decision_case";
  return "surface";
}

export function isPaidFeedback(input: {
  surface: string;
  productCode: string | null;
  linkedOrderId?: string | null;
  linkedArtifactId?: string | null;
}): boolean {
  const paidSurfaces = new Set([
    "boardroom_brief_delivered",
    "strategy_room_session",
    "return_brief_outcome",
    "retainer_review_cycle",
    "admin_delivery",
  ]);
  const freeSurfaces = new Set([
    "pressure_signal_result",
    "fast_diagnostic_result",
    "boardroom_brief_sample",
    "case_study_public",
    "playbook_download",
  ]);

  if (input.linkedOrderId || input.linkedArtifactId) return true;
  if (paidSurfaces.has(input.surface)) return true;
  if (freeSurfaces.has(input.surface)) return false;
  return Boolean(input.productCode);
}

function deriveInitialState(input: NormalizedFeedbackInput): Pick<
  NormalizedFeedbackInput,
  "actionStatus" | "severity" | "reviewRequired"
> {
  const seriousNegative =
    input.rating === "negative" &&
    ["accuracy", "trust", "evidence_quality", "outcome_relevance"].includes(input.category);
  const paid = isPaidFeedback(input);

  if (seriousNegative && paid) {
    return { actionStatus: "triage_required", severity: "high", reviewRequired: true };
  }
  if (input.rating === "negative") {
    return { actionStatus: "triage_required", severity: "medium", reviewRequired: true };
  }
  if (input.rating === "positive" && input.followupRequested) {
    return { actionStatus: "linked_to_sales_followup", severity: "low", reviewRequired: false };
  }
  return { actionStatus: "logged", severity: "low", reviewRequired: false };
}

export function normalizeFeedbackPayload(
  payload: unknown,
  req?: NextApiRequest,
): NormalizedFeedbackInput {
  const parsed = feedbackSchema.parse(payload);
  const confidence = normalizeConfidence(parsed.confidence);
  const category = parsed.category ?? defaultCategory(parsed.rating);
  const referrer = req ? getReferrer(req) : null;
  const base: Omit<NormalizedFeedbackInput, "actionStatus" | "severity" | "reviewRequired"> = {
    surface: parsed.surface,
    subjectType: deriveSubjectType(parsed.surface, parsed.subjectType),
    subjectId: clean(parsed.subjectId),
    rating: parsed.rating,
    category,
    confidence,
    comment: clean(parsed.comment),
    followupRequested: Boolean(parsed.followupRequested),
    evidenceHash: clean(parsed.evidenceHash),
    artifactVersion: parsed.artifactVersion === undefined || parsed.artifactVersion === null
      ? null
      : String(parsed.artifactVersion).trim() || null,
    productCode: clean(parsed.productCode),
    userId: clean(parsed.userId),
    email: clean(parsed.email),
    sessionId: clean(parsed.sessionId),
    sourceUrl: clean(parsed.sourceUrl),
    referrer,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    deployCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || null,
    linkedOrderId: clean(parsed.orderId),
    linkedArtifactId: clean(parsed.artifactId),
    linkedFalsificationEntryId: clean(parsed.falsificationEntryId),
    linkedOutcomeHypothesisId: clean(parsed.outcomeHypothesisId),
    linkedCaseStudyId: clean(parsed.caseStudyId),
    linkedRetainerCycleId: clean(parsed.retainerCycleId),
    triageStatus: "unreviewed",
  };

  return {
    ...base,
    ...deriveInitialState(base as NormalizedFeedbackInput),
  };
}

function mapFeedbackEvent(row: any): FeedbackEventRecord {
  return {
    id: row.id,
    feedbackId: row.feedbackId,
    surface: row.surface,
    subjectType: row.subjectType,
    subjectId: row.subjectId ?? null,
    rating: row.rating,
    category: row.category,
    confidence: row.confidence,
    comment: row.comment ?? null,
    followupRequested: Boolean(row.followupRequested),
    evidenceHash: row.evidenceHash ?? null,
    artifactVersion: row.artifactVersion ?? null,
    productCode: row.productCode ?? null,
    userId: row.userId ?? null,
    email: row.email ?? null,
    sessionId: row.sessionId ?? null,
    sourceUrl: row.sourceUrl ?? null,
    referrer: row.referrer ?? null,
    environment: row.environment ?? "unknown",
    deployCommit: row.deployCommit ?? null,
    schemaVersion: row.schemaVersion ?? FEEDBACK_SCHEMA_VERSION,
    actionStatus: row.actionStatus,
    severity: row.severity,
    triageStatus: row.triageStatus,
    reviewRequired: Boolean(row.reviewRequired),
    reviewedAt: row.reviewedAt ?? null,
    reviewedBy: row.reviewedBy ?? null,
    linkedOrderId: row.linkedOrderId ?? null,
    linkedArtifactId: row.linkedArtifactId ?? null,
    linkedFalsificationEntryId: row.linkedFalsificationEntryId ?? null,
    linkedOutcomeHypothesisId: row.linkedOutcomeHypothesisId ?? null,
    linkedCaseStudyId: row.linkedCaseStudyId ?? null,
    linkedRetainerCycleId: row.linkedRetainerCycleId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function mirrorFeedbackAudit(event: FeedbackEventRecord): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action: "FEEDBACK_SUBMITTED",
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
          confidence: event.confidence,
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          actionStatus: event.actionStatus,
          reviewRequired: event.reviewRequired,
        }),
      },
    });
  } catch {
    // Feedback persistence must not fail because the mirror failed.
  }
}

async function updateFeedbackEvent(
  feedbackId: string,
  data: Record<string, unknown>,
): Promise<FeedbackEventRecord> {
  const updated = await (prisma as any).feedbackEvent.update({
    where: { feedbackId },
    data,
  });
  return mapFeedbackEvent(updated);
}

export async function submitFeedback(
  payload: unknown,
  req?: NextApiRequest,
): Promise<FeedbackPublicResponse> {
  const input = normalizeFeedbackPayload(payload, req);
  const feedbackId = `fb_${crypto.randomUUID()}`;

  const created = await (prisma as any).feedbackEvent.create({
    data: {
      feedbackId,
      surface: input.surface,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      rating: input.rating,
      category: input.category,
      confidence: input.confidence,
      comment: input.comment,
      followupRequested: input.followupRequested,
      evidenceHash: input.evidenceHash,
      artifactVersion: input.artifactVersion,
      productCode: input.productCode,
      userId: input.userId,
      email: input.email,
      sessionId: input.sessionId,
      sourceUrl: input.sourceUrl,
      referrer: input.referrer,
      environment: input.environment,
      deployCommit: input.deployCommit,
      schemaVersion: FEEDBACK_SCHEMA_VERSION,
      actionStatus: input.actionStatus,
      severity: input.severity,
      triageStatus: input.triageStatus,
      reviewRequired: input.reviewRequired,
      linkedOrderId: input.linkedOrderId,
      linkedArtifactId: input.linkedArtifactId,
      linkedFalsificationEntryId: input.linkedFalsificationEntryId,
      linkedOutcomeHypothesisId: input.linkedOutcomeHypothesisId,
      linkedCaseStudyId: input.linkedCaseStudyId,
      linkedRetainerCycleId: input.linkedRetainerCycleId,
    },
  });

  let event = mapFeedbackEvent(created);
  await mirrorFeedbackAudit(event);

  const action = await evaluateFeedbackActions(event);
  const hasActionUpdates = Object.values(action).some((value) => value !== undefined);
  if (hasActionUpdates) {
    event = await updateFeedbackEvent(event.feedbackId, action);
  }
  const routing = await evaluateFeedbackRouting(event);

  return {
    ok: true,
    feedbackId: event.feedbackId,
    actionStatus: event.actionStatus,
    reviewRequired: event.reviewRequired,
    publicMessage: routing.publicMessage,
    nextActions: routing.userCtas.map((cta) => ({
      id: cta.id,
      label: cta.label,
      href: cta.href,
    })),
    routing: {
      actionKind: routing.actionKind,
      reviewEscalationState: routing.reviewEscalationState,
    },
  };
}

export async function listFeedbackEvents(limit = 100): Promise<FeedbackEventRecord[]> {
  const rows = await (prisma as any).feedbackEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(250, limit)),
  });
  return rows.map(mapFeedbackEvent);
}

function pct(part: number, total: number): number | null {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

export async function getFeedbackHealthMetrics(): Promise<FeedbackHealthMetrics> {
  const [
    totalFeedback,
    positive,
    negative,
    reviewRequiredCount,
    paidProductNegativeCount,
    boardroomTotal,
    boardroomPositive,
    unresolvedPatternCount,
    weightedRows,
  ] = await Promise.all([
    (prisma as any).feedbackEvent.count(),
    (prisma as any).feedbackEvent.count({ where: { rating: "positive" } }),
    (prisma as any).feedbackEvent.count({ where: { rating: "negative" } }),
    (prisma as any).feedbackEvent.count({ where: { reviewRequired: true } }),
    (prisma as any).feedbackEvent.count({
      where: {
        rating: "negative",
        OR: [
          { linkedOrderId: { not: null } },
          { linkedArtifactId: { not: null } },
          { surface: { in: ["boardroom_brief_delivered", "strategy_room_session", "retainer_review_cycle"] } },
        ],
      },
    }),
    (prisma as any).feedbackEvent.count({ where: { surface: "boardroom_brief_delivered" } }),
    (prisma as any).feedbackEvent.count({ where: { surface: "boardroom_brief_delivered", rating: "positive" } }),
    (prisma as any).patternObservation.count({
      where: {
        patternType: { in: ["repeated_negative_surface", "retainer_health_warning"] },
        status: "ACTIVE",
      },
    }),
    (prisma as any).feedbackEvent.findMany({
      select: { rating: true, confidence: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
  ]);

  const totalWeight = weightedRows.reduce(
    (sum: number, row: { confidence: number | null }) => sum + Math.max(1, Math.min(5, row.confidence ?? 3)),
    0,
  );
  const positiveWeight = weightedRows
    .filter((row: { rating: string }) => row.rating === "positive")
    .reduce((sum: number, row: { confidence: number | null }) => sum + Math.max(1, Math.min(5, row.confidence ?? 3)), 0);
  const negativeWeight = weightedRows
    .filter((row: { rating: string }) => row.rating === "negative")
    .reduce((sum: number, row: { confidence: number | null }) => sum + Math.max(1, Math.min(5, row.confidence ?? 3)), 0);

  return {
    totalFeedback,
    positiveRate: pct(positive, totalFeedback),
    negativeRate: pct(negative, totalFeedback),
    confidenceWeightedPositiveRate: pct(positiveWeight, totalWeight),
    confidenceWeightedNegativeRate: pct(negativeWeight, totalWeight),
    reviewRequiredCount,
    paidProductNegativeCount,
    boardroomBriefDeliveredPositiveRate: pct(boardroomPositive, boardroomTotal),
    unresolvedPatternCount,
    positiveHighConfidenceRate: pct(
      weightedRows.filter((row: { rating: string; confidence: number | null }) =>
        row.rating === "positive" && (row.confidence ?? 3) >= 4,
      ).length,
      weightedRows.length,
    ),
    negativeHighConfidenceRate: pct(
      weightedRows.filter((row: { rating: string; confidence: number | null }) =>
        row.rating === "negative" && (row.confidence ?? 3) >= 4,
      ).length,
      weightedRows.length,
    ),
    followupRequestedCount: await (prisma as any).feedbackEvent.count({ where: { followupRequested: true } }),
  };
}

export async function getFeedbackAdminRows(limit = 100): Promise<FeedbackAdminRow[]> {
  const events = await listFeedbackEvents(limit);
  return events.map((event) => ({
    feedbackId: event.feedbackId,
    surface: event.surface,
    rating: event.rating,
    category: event.category,
    confidence: event.confidence,
    productCode: event.productCode,
    actionStatus: event.actionStatus,
    severity: event.severity,
    reviewRequired: event.reviewRequired,
    createdAt: event.createdAt,
    linkedCaseStudyId: event.linkedCaseStudyId,
    linkedFalsificationEntryId: event.linkedFalsificationEntryId,
  }));
}

export async function getFeedbackAdoptionAnalytics(): Promise<FeedbackAdoptionAnalytics> {
  const rows = await (prisma as any).feedbackEvent.findMany({
    select: {
      surface: true,
      rating: true,
      category: true,
      confidence: true,
      followupRequested: true,
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const bySurfaceMap = new Map<string, {
    total: number;
    positive: number;
    positiveHigh: number;
    negativeHigh: number;
    followups: number;
  }>();
  const categoryMap = new Map<string, { surface: string; category: string; count: number }>();

  for (const row of rows as Array<{
    surface: string;
    rating: string;
    category: string;
    confidence: number | null;
    followupRequested: boolean;
  }>) {
    const current = bySurfaceMap.get(row.surface) ?? {
      total: 0,
      positive: 0,
      positiveHigh: 0,
      negativeHigh: 0,
      followups: 0,
    };
    current.total += 1;
    if (row.rating === "positive") current.positive += 1;
    if (row.rating === "positive" && (row.confidence ?? 3) >= 4) current.positiveHigh += 1;
    if (row.rating === "negative" && (row.confidence ?? 3) >= 4) current.negativeHigh += 1;
    if (row.followupRequested) current.followups += 1;
    bySurfaceMap.set(row.surface, current);

    const categoryKey = `${row.surface}:${row.category}`;
    const category = categoryMap.get(categoryKey) ?? { surface: row.surface, category: row.category, count: 0 };
    category.count += 1;
    categoryMap.set(categoryKey, category);
  }

  async function countAudit(actions: string[], days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.systemAuditLog.count({
      where: {
        action: { in: actions },
        createdAt: { gte: since },
      },
    }).catch(() => 0);
  }

  return {
    bySurface: Array.from(bySurfaceMap.entries()).map(([surface, value]) => ({
      surface,
      total: value.total,
      positiveRate: pct(value.positive, value.total),
      positiveHighConfidenceRate: pct(value.positiveHigh, value.total),
      negativeHighConfidenceRate: pct(value.negativeHigh, value.total),
      followupRequestedCount: value.followups,
    })),
    categoryDistribution: Array.from(categoryMap.values()).sort((a, b) => b.count - a.count),
    conversionSignals: {
      freeFeedbackToCheckout14d: await countAudit(["CHECKOUT_COMPLETED", "stripe.checkout.completed", "purchase.completed"], 14),
      feedbackToSaveCase14d: await countAudit(["DECISION_CASE_SAVED", "decision_centre.case_saved"], 14),
      feedbackToReturnVisit14d: await countAudit(["RETURN_VISIT", "session.returned"], 14),
      feedbackToCaseStudyConsent30d: await countAudit(["CASE_STUDY_CONSENT_GRANTED", "case_study.consent_granted"], 30),
      feedbackToRetainerEvaluation30d: await countAudit(["FEEDBACK_RETAINER_READINESS_EVALUATION_CREATED", "retainer_readiness.candidate_created"], 30),
    },
  };
}
