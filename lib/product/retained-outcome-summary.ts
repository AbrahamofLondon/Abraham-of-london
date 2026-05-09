import { prisma } from "@/lib/prisma.server";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";

export type RecommendationEffectiveness = {
  actedOn: number;
  blocked: number;
  abandoned: number;
  disputed: number;
  totalOutcomeScore: number;
  sourceLabel: string;
  thinState: boolean;
};

export type RetainedOutcomeSummary = {
  confirmedOutcomes: number;
  blockedOutcomes: number;
  abandonedOutcomes: number;
  disputedFindings: number;
  latestOutcomeDate?: string | null;
  evidencePosture: "VERIFIED" | "USER_REPORTED" | "INSUFFICIENT_EVIDENCE";
  thinState: boolean;
  historyState: "THIN" | "SUFFICIENT";
  sourceLabel: "Retained Outcome History";
  /** Whether prior recommendations were acted on, blocked, abandoned, or disputed */
  recommendationEffectiveness?: RecommendationEffectiveness | null;
};

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export async function buildRetainedOutcomeSummary(input: {
  email?: string | null;
  userId?: string | null;
  organisationId?: string | null;
}): Promise<RetainedOutcomeSummary> {
  const email = normalizeEmail(input.email);
  const organisation = input.organisationId
    ? await prisma.organisation.findUnique({
        where: { id: input.organisationId },
        select: { slug: true },
      }).catch(() => null)
    : null;

  const diagnosticRecords = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "outcome_verification",
      ...(email || input.userId
        ? {
            OR: [
              ...(email ? [{ userEmail: email }] : []),
              ...(input.userId ? [{ userId: input.userId }] : []),
            ],
          }
        : {}),
    },
    select: {
      responsesJson: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const parsed = diagnosticRecords.map((row) => {
    try {
      return JSON.parse(row.responsesJson || "{}") as {
        outcomeClassification?: string;
        checkpointResponseStatus?: string;
        createdAt?: string;
      };
    } catch {
      return {};
    }
  });
  const verifiedOutcomeRecords = organisation?.slug
    ? await prisma.outcomeVerificationRecord.findMany({
        where: {
          organisationKey: organisation.slug,
        },
        select: {
          outcomeClassification: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }).catch(() => [])
    : [];

  const confirmedOutcomes = parsed.filter((item) =>
    item.outcomeClassification === "ACTION_CONFIRMED" || item.outcomeClassification === "OUTCOME_IMPROVED"
  ).length + verifiedOutcomeRecords.filter((item) =>
    item.outcomeClassification === "ACTION_CONFIRMED" || item.outcomeClassification === "OUTCOME_IMPROVED"
  ).length;
  const blockedOutcomes = parsed.filter((item) =>
    item.outcomeClassification === "ACTION_BLOCKED"
  ).length + verifiedOutcomeRecords.filter((item) =>
    item.outcomeClassification === "ACTION_BLOCKED"
  ).length;
  const abandonedOutcomes = parsed.filter((item) =>
    item.checkpointResponseStatus === "ABANDONED"
  ).length;
  const disputedFindings = parsed.filter((item) =>
    item.outcomeClassification === "SYSTEM_FINDING_DISPUTED"
  ).length + verifiedOutcomeRecords.filter((item) =>
    item.outcomeClassification === "SYSTEM_FINDING_DISPUTED"
  ).length;

  const latestOutcomeDate = [
    diagnosticRecords[0]?.createdAt?.toISOString?.() ?? null,
    verifiedOutcomeRecords[0]?.createdAt?.toISOString?.() ?? null,
  ].filter((value): value is string => Boolean(value)).sort().reverse()[0] ?? null;
  const total = confirmedOutcomes + blockedOutcomes + abandonedOutcomes + disputedFindings;

  // ── Recommendation Effectiveness (via outcome model) ──
  let recommendationEffectiveness: RecommendationEffectiveness | null = null;
  if (total >= 2) {
    const { compareFollowupOutcome } = await import("@/lib/decision/recommendation-outcome-model");
    // Derive comparison from aggregate outcome classifications
    const hasImproved = confirmedOutcomes > blockedOutcomes;
    const comparison = compareFollowupOutcome({
      readinessTierBefore: blockedOutcomes > confirmedOutcomes ? "FRAGILE" : "EMERGING",
      readinessTierAfter: confirmedOutcomes > blockedOutcomes ? "EXECUTION_READY" : blockedOutcomes > 0 ? "FRAGILE" : "STABILIZING",
      clarityDelta: hasImproved ? 1 : -1,
      authorityDelta: disputedFindings > 0 ? -1 : 0,
      convertedAfterGuidance: confirmedOutcomes > 0,
    });
    recommendationEffectiveness = {
      actedOn: confirmedOutcomes,
      blocked: blockedOutcomes,
      abandoned: abandonedOutcomes,
      disputed: disputedFindings,
      totalOutcomeScore: comparison.totalOutcomeScore,
      sourceLabel: "Recommendation effectiveness — derived from outcome verification, not independently verified",
      thinState: total < 5,
    };
  }

  const summary: RetainedOutcomeSummary = {
    confirmedOutcomes,
    blockedOutcomes,
    abandonedOutcomes,
    disputedFindings,
    latestOutcomeDate,
    evidencePosture: confirmedOutcomes > 0 ? "VERIFIED" : total > 0 ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
    thinState: total < 3,
    historyState: total < 3 ? "THIN" : "SUFFICIENT",
    sourceLabel: "Retained Outcome History",
    recommendationEffectiveness,
  };

  if (summary.thinState) {
    await recordSuppression(createSuppressionInput({
      scopeId: input.organisationId ?? email ?? input.userId ?? "retained-outcomes",
      scopeType: input.organisationId ? "ORGANISATION" : "ACCOUNT",
      surface: "RETAINED_OUTCOME_SUMMARY",
      fieldName: "outcomeHistory",
      evidenceSource: "Retained outcome history",
      evidencePosture: summary.evidencePosture,
      sourceLabel: summary.sourceLabel,
      suppressionReason: "Insufficient sample.",
      suppressionRule: "THIN_HISTORY_SUPPRESSED",
      suppressionRuleCategory: "THIN_HISTORY",
      operatorReviewAvailable: true,
    })).catch(() => null);
  }

  return summary;
}
