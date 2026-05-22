// lib/intelligence/gmi-event-store.ts
// Reads persisted GMI release events from systemAuditLog.
// Events are written by recordGmiReleaseEventSafe via logAuditEvent;
// the action field is the GMI event type, metadata contains the full envelope.
import "server-only";

import type { GmiReleaseEvent } from "./gmi-release-events";

async function getPrisma(): Promise<any> {
  const { prisma } = await import("@/lib/prisma.server");
  return prisma;
}

function rowToEvent(row: {
  id: string;
  action: string;
  resourceId: string | null;
  metadata: string | null;
  createdAt: Date;
}): GmiReleaseEvent | null {
  try {
    const meta = JSON.parse(row.metadata ?? "{}");
    // The recorder stores the full event envelope under metadata.eventType, etc.
    return {
      eventVersion: 1,
      eventType: (meta.eventType ?? row.action) as GmiReleaseEvent["eventType"],
      severity: meta.severity ?? "INFO",
      reportId: meta.reportId ?? row.resourceId ?? "",
      relatedReportId: meta.relatedReportId ?? undefined,
      sourceRowId: meta.sourceRowId ?? undefined,
      callId: meta.callId ?? undefined,
      actor: meta.actor ?? "SYSTEM",
      requestId: meta.requestId ?? undefined,
      source: meta.source ?? undefined,
      occurredAt: meta.occurredAt ?? row.createdAt.toISOString(),
      summary: meta.summary ?? "",
      safeMetadata: typeof meta.safeMetadata === "object" && meta.safeMetadata !== null
        ? meta.safeMetadata
        : {},
    };
  } catch {
    return null;
  }
}

export async function getGmiEventsForReport(
  reportId: string,
  limit = 100,
): Promise<GmiReleaseEvent[]> {
  try {
    const prisma = await getPrisma();
    const rows = await prisma.systemAuditLog.findMany({
      where: {
        resourceId: reportId,
        action: { startsWith: "GMI_" },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
      select: { id: true, action: true, resourceId: true, metadata: true, createdAt: true },
    });
    return rows.map(rowToEvent).filter((e: GmiReleaseEvent | null): e is GmiReleaseEvent => e !== null);
  } catch {
    return [];
  }
}

export async function getRecentGmiEvents(limit = 50): Promise<GmiReleaseEvent[]> {
  try {
    const prisma = await getPrisma();
    const rows = await prisma.systemAuditLog.findMany({
      where: { action: { startsWith: "GMI_" } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      select: { id: true, action: true, resourceId: true, metadata: true, createdAt: true },
    });
    return rows.map(rowToEvent).filter((e: GmiReleaseEvent | null): e is GmiReleaseEvent => e !== null);
  } catch {
    return [];
  }
}
