import {
  recordProvenanceOperationAudit,
  type ProvenanceOperationEventType,
  type ProvenanceOperationStatus,
} from "@/lib/admin/provenance-operation-audit";

export type ProvenanceAuditAction =
  | "PROVENANCE_VERIFIED"
  | "PROVENANCE_HASH_VERIFIED"
  | "PROVENANCE_CHAIN_VERIFIED"
  | "PROVENANCE_ANCHOR_CREATED"
  | "PROVENANCE_HASH_MISMATCH"
  | "CLIENT_SAFE_PROVENANCE_GENERATED"
  | "FULL_PROVENANCE_VIEWED";

export type ProvenanceAuditInput = {
  action: ProvenanceAuditAction;
  requestId?: string | null;
  source?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  hash?: string | null;
  merkleRoot?: string | null;
  chainHash?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  status?: "success" | "warning" | "failed";
};

function prefix(value?: string | null): string | null {
  return value ? value.slice(0, 16) : null;
}

export function buildProvenanceAuditMetadata(input: ProvenanceAuditInput): Record<string, unknown> {
  return {
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    scope: input.scope ?? null,
    scopeId: input.scopeId ?? null,
    hashPrefix: prefix(input.hash),
    merkleRootPrefix: prefix(input.merkleRoot),
    chainHashPrefix: prefix(input.chainHash),
  };
}

function toOperationEventType(action: ProvenanceAuditAction): ProvenanceOperationEventType {
  return action === "PROVENANCE_VERIFIED" ? "PROVENANCE_HASH_VERIFIED" : action;
}

function toOperationStatus(input: ProvenanceAuditInput): ProvenanceOperationStatus {
  if (input.action === "PROVENANCE_HASH_MISMATCH") return "MISMATCH";
  if (input.status === "failed") return "FAILED";
  if (input.status === "warning") return "UNAVAILABLE";
  return "SUCCESS";
}

export async function recordProvenanceAuditEvent(input: ProvenanceAuditInput): Promise<void> {
  await recordProvenanceOperationAudit({
    eventType: toOperationEventType(input.action),
    requestId: input.requestId,
    source: input.source,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    scope: input.scope,
    scopeId: input.scopeId,
    provenanceHash: input.hash,
    merkleRoot: input.merkleRoot,
    chainHash: input.chainHash,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    status: toOperationStatus(input),
  });
}
