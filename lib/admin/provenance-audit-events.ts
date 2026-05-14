import { logAuditEvent } from "@/lib/server/audit";

export type ProvenanceAuditAction =
  | "PROVENANCE_VERIFIED"
  | "PROVENANCE_ANCHOR_CREATED"
  | "PROVENANCE_HASH_MISMATCH"
  | "CLIENT_SAFE_PROVENANCE_GENERATED"
  | "FULL_PROVENANCE_VIEWED";

export type ProvenanceAuditInput = {
  action: ProvenanceAuditAction;
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

export async function recordProvenanceAuditEvent(input: ProvenanceAuditInput): Promise<void> {
  try {
    await logAuditEvent({
      action: input.action,
      actorType: input.actorId || input.actorEmail ? "admin" : "system",
      actorId: input.actorId ?? undefined,
      actorEmail: input.actorEmail ?? undefined,
      resourceType: "provenance",
      resourceId: input.subjectId ?? input.scopeId ?? undefined,
      resourceName: input.subjectType ?? input.scope ?? undefined,
      status: input.status ?? (input.action === "PROVENANCE_HASH_MISMATCH" ? "warning" : "success"),
      severity: input.action === "PROVENANCE_HASH_MISMATCH" ? "warn" : "low",
      metadata: buildProvenanceAuditMetadata(input),
    });
  } catch {
    // Provenance operations fail open if audit logging is unavailable.
  }
}
