import { logAuditEvent } from "@/lib/server/audit";

export type ProvenanceOperationEventType =
  | "PROVENANCE_ANCHOR_CREATED"
  | "PROVENANCE_CHAIN_VERIFIED"
  | "PROVENANCE_HASH_VERIFIED"
  | "PROVENANCE_HASH_MISMATCH"
  | "CLIENT_SAFE_PROVENANCE_GENERATED"
  | "FULL_PROVENANCE_VIEWED";

export type ProvenanceOperationStatus =
  | "SUCCESS"
  | "FAILED"
  | "MISMATCH"
  | "UNAVAILABLE";

export type ProvenanceOperationAuditInput = {
  eventType: ProvenanceOperationEventType;
  subjectType?: string | null;
  subjectId?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  provenanceHash?: string | null;
  merkleRoot?: string | null;
  chainHash?: string | null;
  status?: ProvenanceOperationStatus;
  actorId?: string | null;
  actorEmail?: string | null;
  occurredAt?: string | null;
};

export type ProvenanceOperationAuditResult =
  | { ok: true }
  | { ok: false; warning: string };

function eventSeverity(eventType: ProvenanceOperationEventType, status: ProvenanceOperationStatus) {
  if (eventType === "PROVENANCE_HASH_MISMATCH" || status === "MISMATCH") return "warn";
  if (status === "FAILED") return "error";
  return "low";
}

function auditStatus(status: ProvenanceOperationStatus) {
  if (status === "FAILED") return "failed";
  if (status === "MISMATCH" || status === "UNAVAILABLE") return "warning";
  return "success";
}

export function buildProvenanceOperationAuditPayload(
  input: ProvenanceOperationAuditInput,
): Record<string, unknown> {
  return {
    eventType: input.eventType,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    scope: input.scope ?? null,
    scopeId: input.scopeId ?? null,
    provenanceHash: input.provenanceHash ?? null,
    merkleRoot: input.merkleRoot ?? null,
    chainHash: input.chainHash ?? null,
    status: input.status ?? "SUCCESS",
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export async function recordProvenanceOperationAudit(
  input: ProvenanceOperationAuditInput,
): Promise<ProvenanceOperationAuditResult> {
  const status = input.status ?? "SUCCESS";
  const metadata = buildProvenanceOperationAuditPayload({
    ...input,
    status,
  });

  try {
    await logAuditEvent({
      action: input.eventType,
      actorType: input.actorId || input.actorEmail ? "admin" : "system",
      actorId: input.actorId ?? undefined,
      actorEmail: input.actorEmail ?? undefined,
      resourceType: "provenance",
      resourceId: input.subjectId ?? input.scopeId ?? undefined,
      resourceName: input.subjectType ?? input.scope ?? undefined,
      status: auditStatus(status),
      severity: eventSeverity(input.eventType, status),
      metadata,
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      warning: "Provenance operation completed but audit event could not be recorded.",
    };
  }
}
