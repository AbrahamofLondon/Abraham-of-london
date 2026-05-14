import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import type { CounselReviewAction, CounselWorkflowStatus } from "@/lib/product/counsel-review-workflow-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toWorkflow(metadata: unknown): CounselReviewAction | null {
  const record = asRecord(metadata);
  if (typeof record.id !== "string" || typeof record.caseId !== "string" || typeof record.status !== "string") {
    return null;
  }
  return {
    id: record.id,
    caseId: record.caseId,
    cycleId: typeof record.cycleId === "string" ? record.cycleId : undefined,
    status: record.status as CounselWorkflowStatus,
    triggerReason: typeof record.triggerReason === "string" ? record.triggerReason : "Counsel review requested.",
    triggerSource: typeof record.triggerSource === "string" ? record.triggerSource : undefined,
    assignedTo: typeof record.assignedTo === "string" ? record.assignedTo : undefined,
    assignedBy: typeof record.assignedBy === "string" ? record.assignedBy : undefined,
    requestedReviewQuestion: typeof record.requestedReviewQuestion === "string" ? record.requestedReviewQuestion : undefined,
    counselResponseSummary: typeof record.counselResponseSummary === "string" ? record.counselResponseSummary : undefined,
    evidenceNodeIds: Array.isArray(record.evidenceNodeIds) ? record.evidenceNodeIds.filter((item): item is string => typeof item === "string") : undefined,
    requiredActionIds: Array.isArray(record.requiredActionIds) ? record.requiredActionIds.filter((item): item is string => typeof item === "string") : undefined,
    operatorDisposition: record.operatorDisposition === "ACCEPTED" || record.operatorDisposition === "REJECTED" || record.operatorDisposition === "PENDING"
      ? record.operatorDisposition
      : undefined,
    nextAction: typeof record.nextAction === "string" ? record.nextAction : undefined,
  };
}

export async function listCounselWorkflowActions(input: {
  cycleId?: string;
  caseId?: string;
}): Promise<CounselReviewAction[]> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { metadata: true },
  });

  return rows
    .map((row) => toWorkflow(asRecord(row.metadata).workflow))
    .filter((item): item is CounselReviewAction => Boolean(item))
    .filter((item) => !input.cycleId || item.cycleId === input.cycleId)
    .filter((item) => !input.caseId || item.caseId === input.caseId);
}

export async function persistCounselWorkflowAction(input: {
  workflow: CounselReviewAction;
  actorId?: string | null;
}): Promise<CounselReviewAction> {
  const existing = await prisma.auditEvent.findFirst({
    where: {
      objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
      objectId: input.workflow.id,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const metadata = {
    workflow: input.workflow,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await prisma.auditEvent.update({
      where: { id: existing.id },
      data: {
        actorType: input.actorId ? "ADMIN" : "SYSTEM",
        actorId: input.actorId ?? null,
        actionType: "UPDATED",
        summary: `Counsel workflow ${input.workflow.id} updated.`,
        metadata: metadata as never,
      },
    });
  } else {
    await prisma.auditEvent.create({
      data: {
        actorType: input.actorId ? "ADMIN" : "SYSTEM",
        actorId: input.actorId ?? null,
        objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
        objectId: input.workflow.id,
        actionType: "CREATED",
        summary: `Counsel workflow ${input.workflow.id} created.`,
        metadata: metadata as never,
      },
    });
  }

  return input.workflow;
}

export async function createCounselWorkflowAction(input: {
  caseId: string;
  cycleId?: string;
  triggerReason: string;
  triggerSource?: string;
  assignedTo?: string;
  assignedBy?: string;
  requestedReviewQuestion?: string;
  actorId?: string | null;
}): Promise<CounselReviewAction> {
  const workflow: CounselReviewAction = {
    id: randomUUID(),
    caseId: input.caseId,
    cycleId: input.cycleId,
    status: "ASSIGNED",
    triggerReason: input.triggerReason,
    triggerSource: input.triggerSource,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy,
    requestedReviewQuestion: input.requestedReviewQuestion,
    operatorDisposition: "PENDING",
  };

  return persistCounselWorkflowAction({
    workflow,
    actorId: input.actorId,
  });
}
