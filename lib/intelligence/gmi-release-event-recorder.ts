import { logAuditEvent } from "@/lib/server/audit";
import type { GmiReleaseEvent } from "./gmi-release-events";

export type GmiReleaseEventRecordResult =
  | { ok: true }
  | { ok: false; warning: string };

export type GmiReleaseAuditSink = (event: GmiReleaseEvent) => Promise<unknown>;

function severityForAudit(event: GmiReleaseEvent): "low" | "medium" | "high" {
  if (event.severity === "BLOCKER") return "high";
  if (event.severity === "WARNING" || event.severity === "APPROVAL") return "medium";
  return "low";
}

function statusForAudit(event: GmiReleaseEvent): "success" | "warning" | "pending" {
  if (event.severity === "BLOCKER" || event.severity === "WARNING") return "warning";
  if (event.severity === "APPROVAL") return "pending";
  return "success";
}

export async function defaultGmiReleaseAuditSink(event: GmiReleaseEvent): Promise<unknown> {
  return logAuditEvent({
    action: event.eventType,
    actorType: event.actor === "ADMIN" ? "admin" : "system",
    resourceType: "admin",
    resourceId: event.reportId,
    resourceName: "GMI release governance",
    status: statusForAudit(event),
    severity: severityForAudit(event),
    requestId: event.requestId,
    subCategory: "gmi_release_event",
    tags: ["gmi", "market-intelligence", "release-governance"],
    metadata: {
      eventVersion: event.eventVersion,
      eventType: event.eventType,
      severity: event.severity,
      reportId: event.reportId,
      relatedReportId: event.relatedReportId ?? null,
      sourceRowId: event.sourceRowId ?? null,
      callId: event.callId ?? null,
      actor: event.actor ?? "SYSTEM",
      requestId: event.requestId ?? null,
      source: event.source ?? null,
      occurredAt: event.occurredAt,
      summary: event.summary,
      safeMetadata: event.safeMetadata,
    },
  });
}

export async function recordGmiReleaseEventWithSink(
  event: GmiReleaseEvent,
  sink: GmiReleaseAuditSink,
): Promise<GmiReleaseEventRecordResult> {
  try {
    await sink(event);
    return { ok: true };
  } catch {
    return {
      ok: false,
      warning: "GMI release event could not be recorded; release operation should continue with manual audit follow-up.",
    };
  }
}

export async function recordGmiReleaseEventSafe(
  event: GmiReleaseEvent,
): Promise<GmiReleaseEventRecordResult> {
  return recordGmiReleaseEventWithSink(event, defaultGmiReleaseAuditSink);
}
