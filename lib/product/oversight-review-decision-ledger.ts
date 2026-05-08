import "server-only";

import { createHash, randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import type { ClientSafeOversightBrief, OversightSuppression } from "@/lib/product/client-safe-oversight-brief";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function sanitizeBriefSnapshot(brief: OversightBrief | null | undefined) {
  if (!brief) return null;
  return {
    briefId: brief.briefId,
    accountId: brief.accountId,
    periodStart: brief.periodStart,
    periodEnd: brief.periodEnd,
    activeCaseIds: brief.activeCases.map((item) => item.caseId),
    activeCaseCount: brief.activeCases.length,
    requiredActionCount: brief.requiredActions.length,
    costOfInaction: brief.costOfInaction ?? null,
    counsel: brief.counsel,
    boardroom: brief.boardroom,
    verification: brief.verification,
    retainedEnforcement: brief.retainedEnforcement ?? null,
    decisionCredit: brief.decisionCredit
      ? {
          score: brief.decisionCredit.score,
          trend: brief.decisionCredit.trend,
        }
      : null,
    patternRecurrence: brief.patternRecurrence
      ? {
          status: brief.patternRecurrence.status,
          priorCount: brief.patternRecurrence.priorCount,
        }
      : null,
  };
}

function hashSnapshot(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

export async function persistOversightReviewDecision(input: {
  decisionRecord: OversightReviewDecisionRecord;
  internalBrief: OversightBrief;
  clientSafeBrief?: ClientSafeOversightBrief | null;
  suppressions: OversightSuppression[];
  cycleComparison?: OversightCycleComparison | null;
}): Promise<{ persisted: boolean; auditEventId?: string; warnings: string[] }> {
  const warnings: string[] = [];
  const internalSnapshot = sanitizeBriefSnapshot(input.internalBrief);
  const clientSafeSnapshot = sanitizeBriefSnapshot(input.clientSafeBrief?.brief);

  const created = await prisma.auditEvent.create({
    data: {
      actorType: input.decisionRecord.operatorId ? "ADMIN" : "SYSTEM",
      actorId: input.decisionRecord.operatorId ?? null,
      objectType: "OVERSIGHT_REVIEW_DECISION",
      objectId: input.decisionRecord.accountId,
      actionType: "UPDATED",
      summary: `Oversight review decision ${input.decisionRecord.decision} recorded for cycle ${input.decisionRecord.cycleId}.`,
      metadata: {
        decisionRecord: input.decisionRecord,
        internalSnapshot,
        internalSnapshotHash: hashSnapshot(internalSnapshot),
        clientSafeSnapshot,
        clientSafeSnapshotHash: hashSnapshot(clientSafeSnapshot),
        suppressions: input.suppressions,
        cycleComparison: input.cycleComparison
          ? {
              available: input.cycleComparison.available,
              deltas: input.cycleComparison.deltas,
              warnings: input.cycleComparison.warnings,
            }
          : null,
      } as never,
    },
    select: { id: true },
  });

  return {
    persisted: true,
    auditEventId: created.id,
    warnings,
  };
}

export async function loadLatestOversightReviewDecision(input: {
  accountId: string;
  organisationId?: string | null;
}): Promise<OversightReviewDecisionRecord | null> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_REVIEW_DECISION",
      objectId: input.accountId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      metadata: true,
    },
  });

  for (const row of rows) {
    const metadata = asRecord(row.metadata);
    const record = asRecord(metadata.decisionRecord);
    if (!record.id || !record.accountId || !record.cycleId || !record.decision) continue;
    if (input.organisationId && record.organisationId && record.organisationId !== input.organisationId) continue;
    return {
      id: typeof record.id === "string" ? record.id : randomUUID(),
      accountId: String(record.accountId),
      organisationId: typeof record.organisationId === "string" ? record.organisationId : null,
      cycleId: String(record.cycleId),
      briefId: typeof record.briefId === "string" ? record.briefId : null,
      decision: String(record.decision) as OversightReviewDecisionRecord["decision"],
      reasons: Array.isArray(record.reasons) ? record.reasons.filter((item): item is OversightReviewDecisionRecord["reasons"][number] => typeof item === "string") : [],
      operatorId: typeof record.operatorId === "string" ? record.operatorId : null,
      operatorNote: typeof record.operatorNote === "string" ? record.operatorNote : null,
      efficacyGrade: String(record.efficacyGrade ?? "WITHHOLD"),
      efficacyScore: typeof record.efficacyScore === "number" ? record.efficacyScore : 0,
      clientSafe: Boolean(record.clientSafe),
      deliveryAllowed: Boolean(record.deliveryAllowed),
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    };
  }

  return null;
}
