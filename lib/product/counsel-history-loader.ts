import "server-only";

import { prisma } from "@/lib/prisma.server";
import type { CounselHistory, CounselHistoryEntry } from "@/lib/product/counsel-history-contract";
import type { CounselReviewAction } from "@/lib/product/counsel-review-workflow-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toEntry(row: {
  createdAt: Date;
  metadata: unknown;
}): CounselHistoryEntry | null {
  const workflow = asRecord(asRecord(row.metadata).workflow) as unknown as Partial<CounselReviewAction>;
  if (!workflow.id || !workflow.caseId || !workflow.status || !workflow.triggerReason) {
    return null;
  }
  return {
    id: workflow.id,
    cycleId: workflow.cycleId,
    caseId: workflow.caseId,
    triggeredAt: row.createdAt.toISOString(),
    triggerReason: workflow.triggerReason,
    triggerSource: workflow.triggerSource,
    status: workflow.status,
    assignedTo: workflow.assignedTo,
    requestedReviewQuestion: workflow.requestedReviewQuestion,
    recommendationSummary: workflow.counselResponseSummary,
    evidenceNodeIds: workflow.evidenceNodeIds ?? [],
    operatorDisposition: workflow.operatorDisposition === "ACCEPTED"
      ? "ACCEPTED"
      : workflow.operatorDisposition === "REJECTED"
        ? "REJECTED"
        : workflow.operatorDisposition === "PENDING"
          ? "PENDING"
          : undefined,
    resultingAction: workflow.nextAction,
    outcomeImpact: workflow.evidenceNodeIds?.length
      ? `${workflow.evidenceNodeIds.length} evidence node${workflow.evidenceNodeIds.length === 1 ? "" : "s"} created or referenced.`
      : undefined,
  };
}

export async function loadCounselHistory(input: {
  cycleId?: string;
  caseIds?: string[];
}): Promise<CounselHistory> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      metadata: true,
    },
  });

  const entries = rows
    .map(toEntry)
    .filter((entry): entry is CounselHistoryEntry => Boolean(entry))
    .filter((entry) => !input.cycleId || entry.cycleId === input.cycleId)
    .filter((entry) => !input.caseIds?.length || input.caseIds.includes(entry.caseId));

  const acceptedCount = entries.filter((item) => item.operatorDisposition === "ACCEPTED").length;
  const rejectedCount = entries.filter((item) => item.operatorDisposition === "REJECTED").length;
  const deferredCount = entries.filter((item) => item.operatorDisposition === "DEFERRED").length;
  const assignedCount = entries.filter((item) => item.status === "ASSIGNED").length;
  const reviewedCount = entries.filter((item) =>
    item.status === "COUNSEL_RESPONSE_RECORDED"
    || item.status === "COUNSEL_ACTION_ACCEPTED"
    || item.status === "COUNSEL_ACTION_REJECTED"
  ).length;
  const requiredCount = entries.filter((item) =>
    item.status === "REQUIRED" || item.status === "ASSIGNED" || item.status === "UNDER_REVIEW"
  ).length;
  const openCount = entries.filter((item) =>
    !["COUNSEL_ACTION_ACCEPTED", "COUNSEL_ACTION_REJECTED"].includes(item.status)
  ).length;

  return {
    totalEvents: entries.length,
    requiredCount,
    assignedCount,
    reviewedCount,
    acceptedCount,
    rejectedCount,
    deferredCount,
    openCount,
    summary: entries.length === 0
      ? "No governed counsel escalations were recorded in the current oversight history."
      : `${entries.length} governed counsel event${entries.length === 1 ? "" : "s"} recorded; ${openCount} remain open.`,
    entries,
  };
}
