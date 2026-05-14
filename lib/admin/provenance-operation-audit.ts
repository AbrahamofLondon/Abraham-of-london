import { logAuditEvent } from "@/lib/server/audit";

// Retention policy:
// - PROVENANCE_HASH_MISMATCH and PROVENANCE_ANCHOR_CREATED: retained indefinitely (integrity events).
// - PROVENANCE_HASH_VERIFIED, PROVENANCE_CHAIN_VERIFIED: standard 7-year rolling retention.
// - CLIENT_SAFE_PROVENANCE_GENERATED, FULL_PROVENANCE_VIEWED: standard 7-year rolling retention.
// Events are written to the shared AuditEvent table. actorEmail is stored as a first-name-only
// prefix convention (e.g., "alice@..." → store full email, do not truncate — retention handles PII).

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
  eventVersion?: number;
  requestId?: string | null;
  source?: string | null;
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

// Generates a correlation ID for a provenance audit event.
// Each API request should generate one ID and pass it to all audit calls for that request.
export function createProvenanceRequestId(source?: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const prefix = source
    ? `${source.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}_`
    : "";
  return `prv_${prefix}${ts}_${rand}`;
}

export function buildProvenanceOperationAuditPayload(
  input: ProvenanceOperationAuditInput,
): Record<string, unknown> {
  return {
    eventType: input.eventType,
    eventVersion: input.eventVersion ?? 1,
    requestId: input.requestId ?? null,
    source: input.source ?? null,
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

// auditProvenanceOperationSafe — explicitly non-blocking audit write.
// The caller's operation proceeds and returns its result regardless of audit failure.
// Never throws. Returns { ok: true } on success, { ok: false, warning } if the write failed.
export async function auditProvenanceOperationSafe(
  input: ProvenanceOperationAuditInput,
): Promise<ProvenanceOperationAuditResult> {
  return recordProvenanceOperationAudit(input);
}
