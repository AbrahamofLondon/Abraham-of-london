import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { BoardroomArchiveEntry, BoardroomArchiveSummary } from "@/lib/product/boardroom-archive-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toEntry(metadata: unknown): BoardroomArchiveEntry | null {
  const record = asRecord(metadata);
  if (typeof record.id !== "string" || typeof record.caseId !== "string" || typeof record.qualifiedAt !== "string") {
    return null;
  }
  return {
    id: record.id,
    cycleId: typeof record.cycleId === "string" ? record.cycleId : undefined,
    caseId: record.caseId,
    organisationId: typeof record.organisationId === "string" ? record.organisationId : null,
    qualifiedAt: record.qualifiedAt,
    dossierSummary: typeof record.dossierSummary === "string" ? record.dossierSummary : "Boardroom dossier archived.",
    triggerReason: typeof record.triggerReason === "string" ? record.triggerReason : "Boardroom threshold met.",
    costThreshold: typeof record.costThreshold === "number" ? record.costThreshold : null,
    decisionPathRecommended: typeof record.decisionPathRecommended === "string" ? record.decisionPathRecommended : null,
    objectionsGenerated: typeof record.objectionsGenerated === "number" ? record.objectionsGenerated : 0,
    exportStatus: record.exportStatus === "EXPORTED" || record.exportStatus === "READY" ? record.exportStatus : "NOT_EXPORTED",
  };
}

export async function persistBoardroomArchiveEntries(input: {
  cycleId: string;
  organisationId?: string | null;
  brief: OversightBrief;
  actorId?: string | null;
}): Promise<void> {
  const boardroomActions = input.brief.structuredActions?.filter((item) => item.actionType === "GENERATE_BOARDROOM_DOSSIER") ?? [];
  for (const action of boardroomActions) {
    const objectId = `${input.cycleId}:${action.caseId ?? action.id}`;
    const existing = await prisma.auditEvent.findFirst({
      where: {
        objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
        objectId,
      },
      select: { id: true },
    });
    const metadata: BoardroomArchiveEntry = {
      id: randomUUID(),
      cycleId: input.cycleId,
      caseId: action.caseId ?? action.id,
      organisationId: input.organisationId ?? null,
      qualifiedAt: new Date().toISOString(),
      dossierSummary: action.action,
      triggerReason: action.evidenceBasis,
      costThreshold: input.brief.costOfInaction?.totalEstimated ?? null,
      decisionPathRecommended: action.action,
      objectionsGenerated: 0,
      exportStatus: "READY",
    };
    if (existing) {
      await prisma.auditEvent.update({
        where: { id: existing.id },
        data: {
          actorType: input.actorId ? "ADMIN" : "SYSTEM",
          actorId: input.actorId ?? null,
          actionType: "UPDATED",
          summary: `Boardroom archive updated for cycle ${input.cycleId}.`,
          metadata: { entry: metadata } as never,
        },
      });
    } else {
      await prisma.auditEvent.create({
        data: {
          actorType: input.actorId ? "ADMIN" : "SYSTEM",
          actorId: input.actorId ?? null,
          objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
          objectId,
          actionType: "CREATED",
          summary: `Boardroom archive recorded for cycle ${input.cycleId}.`,
          metadata: { entry: metadata } as never,
        },
      });
    }
  }
}

export async function loadBoardroomArchiveSummary(input: {
  accountId?: string | null;
  organisationId?: string | null;
  cycleId?: string;
  caseIds?: string[];
}): Promise<BoardroomArchiveSummary> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { metadata: true },
  });

  const entries = rows
    .map((row) => toEntry(asRecord(row.metadata).entry))
    .filter((entry): entry is BoardroomArchiveEntry => Boolean(entry))
    .filter((entry) => !input.organisationId || entry.organisationId === input.organisationId)
    .filter((entry) => !input.cycleId || entry.cycleId === input.cycleId)
    .filter((entry) => !input.caseIds?.length || input.caseIds.includes(entry.caseId));

  const currentTriggers = input.cycleId ? entries.filter((entry) => entry.cycleId === input.cycleId).length : 0;
  const previousDossierCount = entries.filter((entry) => entry.cycleId !== input.cycleId).length;
  const unresolvedBoardLevelIssues = entries.filter((entry) => entry.exportStatus !== "EXPORTED").length;
  const caseCounts = new Map<string, number>();
  for (const entry of entries) {
    caseCounts.set(entry.caseId, (caseCounts.get(entry.caseId) || 0) + 1);
  }
  const repeatedExposureCount = [...caseCounts.values()].filter((value) => value > 1).length;

  return {
    totalDossiers: entries.length,
    previousDossierCount,
    unresolvedBoardLevelIssues,
    repeatedExposureCount,
    currentTriggers,
    summary: entries.length === 0
      ? "No boardroom archive entries exist in the current oversight history."
      : `${entries.length} boardroom archive entr${entries.length === 1 ? "y" : "ies"} recorded; ${unresolvedBoardLevelIssues} remain unresolved.`,
    entries,
  };
}
