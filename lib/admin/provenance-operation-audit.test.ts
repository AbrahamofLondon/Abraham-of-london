import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/server/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

import {
  auditProvenanceOperationSafe,
  buildProvenanceOperationAuditPayload,
  createProvenanceRequestId,
  recordProvenanceOperationAudit,
} from "./provenance-operation-audit";

beforeEach(() => {
  mocks.logAuditEvent.mockReset();
});

describe("buildProvenanceOperationAuditPayload", () => {
  it("excludes raw provenance records, governance events, and suppression details", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_ANCHOR_CREATED",
      scope: "DAILY",
      scopeId: "2026-05-14",
      provenanceHash: "hash_001",
      merkleRoot: "root_001",
      chainHash: "chain_001",
      status: "SUCCESS",
      occurredAt: "2026-05-14T12:00:00.000Z",
    });

    expect(payload).toEqual({
      eventType: "PROVENANCE_ANCHOR_CREATED",
      eventVersion: 1,
      requestId: null,
      source: null,
      subjectType: null,
      subjectId: null,
      scope: "DAILY",
      scopeId: "2026-05-14",
      provenanceHash: "hash_001",
      merkleRoot: "root_001",
      chainHash: "chain_001",
      status: "SUCCESS",
      occurredAt: "2026-05-14T12:00:00.000Z",
    });

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("governanceEvents");
    expect(serialized).not.toContain("evidenceInputs");
    expect(serialized).not.toContain("suppression");
    expect(serialized).not.toContain("actorNotes");
  });
});

describe("recordProvenanceOperationAudit", () => {
  it("writes a safe anchor-created audit event", async () => {
    const result = await recordProvenanceOperationAudit({
      eventType: "PROVENANCE_ANCHOR_CREATED",
      scope: "ACCOUNT",
      scopeId: "acct_001",
      merkleRoot: "root_hash",
      chainHash: "chain_hash",
      actorId: "admin_1",
      occurredAt: "2026-05-14T12:00:00.000Z",
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "PROVENANCE_ANCHOR_CREATED",
      actorType: "admin",
      actorId: "admin_1",
      resourceType: "provenance",
      resourceId: "acct_001",
      resourceName: "ACCOUNT",
      status: "success",
      severity: "low",
      metadata: expect.objectContaining({
        eventType: "PROVENANCE_ANCHOR_CREATED",
        scope: "ACCOUNT",
        scopeId: "acct_001",
        merkleRoot: "root_hash",
        chainHash: "chain_hash",
      }),
    }));
  });

  it("logs mismatch events with warning status and severity", async () => {
    await recordProvenanceOperationAudit({
      eventType: "PROVENANCE_HASH_MISMATCH",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      provenanceHash: "hash_actual",
      status: "MISMATCH",
    });

    expect(mocks.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "PROVENANCE_HASH_MISMATCH",
      status: "warning",
      severity: "warn",
      metadata: expect.objectContaining({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        provenanceHash: "hash_actual",
        status: "MISMATCH",
      }),
    }));
  });

  it("degrades safely when audit logging fails", async () => {
    mocks.logAuditEvent.mockRejectedValueOnce(new Error("audit unavailable"));
    await expect(recordProvenanceOperationAudit({
      eventType: "PROVENANCE_CHAIN_VERIFIED",
      scope: "DAILY",
      scopeId: "2026-05-14",
      status: "SUCCESS",
    })).resolves.toEqual({
      ok: false,
      warning: "Provenance operation completed but audit event could not be recorded.",
    });
  });
});

describe("createProvenanceRequestId", () => {
  it("returns a non-empty string", () => {
    const id = createProvenanceRequestId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("prefixes with prv_", () => {
    const id = createProvenanceRequestId();
    expect(id.startsWith("prv_")).toBe(true);
  });

  it("includes a normalised source prefix when source is provided", () => {
    const id = createProvenanceRequestId("VERIFY");
    expect(id).toContain("verify");
  });

  it("strips non-alphanumeric characters from the source prefix", () => {
    const id = createProvenanceRequestId("VERIFY-CHAIN");
    expect(id).not.toContain("-");
    expect(id).toContain("verifychain");
  });

  it("successive calls produce different IDs", () => {
    const a = createProvenanceRequestId("anchor");
    const b = createProvenanceRequestId("anchor");
    expect(a).not.toBe(b);
  });
});

describe("buildProvenanceOperationAuditPayload — v2 fields", () => {
  it("defaults eventVersion to 1 when not provided", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_HASH_VERIFIED",
      status: "SUCCESS",
    });
    expect(payload.eventVersion).toBe(1);
  });

  it("preserves eventVersion when explicitly provided", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_HASH_VERIFIED",
      eventVersion: 2,
      status: "SUCCESS",
    });
    expect(payload.eventVersion).toBe(2);
  });

  it("includes requestId when provided", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_HASH_VERIFIED",
      requestId: "prv_abc123",
      status: "SUCCESS",
    });
    expect(payload.requestId).toBe("prv_abc123");
  });

  it("sets requestId to null when omitted", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_HASH_VERIFIED",
      status: "SUCCESS",
    });
    expect(payload.requestId).toBeNull();
  });

  it("includes source when provided", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_CHAIN_VERIFIED",
      source: "PROVENANCE_VERIFY_CHAIN_API",
      status: "SUCCESS",
    });
    expect(payload.source).toBe("PROVENANCE_VERIFY_CHAIN_API");
  });

  it("sets source to null when omitted", () => {
    const payload = buildProvenanceOperationAuditPayload({
      eventType: "PROVENANCE_CHAIN_VERIFIED",
      status: "SUCCESS",
    });
    expect(payload.source).toBeNull();
  });
});

describe("auditProvenanceOperationSafe", () => {
  it("returns { ok: true } when audit logging succeeds", async () => {
    mocks.logAuditEvent.mockResolvedValueOnce(undefined);
    const result = await auditProvenanceOperationSafe({
      eventType: "PROVENANCE_HASH_VERIFIED",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      requestId: "prv_test_abc",
      source: "PROVENANCE_VERIFY_API",
      status: "SUCCESS",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false, warning } when audit logging fails — never throws", async () => {
    mocks.logAuditEvent.mockRejectedValueOnce(new Error("db down"));
    const result = await auditProvenanceOperationSafe({
      eventType: "PROVENANCE_ANCHOR_CREATED",
      scope: "DAILY",
      scopeId: "2026-05-14",
      status: "SUCCESS",
    });
    expect(result).toEqual({
      ok: false,
      warning: "Provenance operation completed but audit event could not be recorded.",
    });
  });

  it("passes requestId and source through to the audit payload", async () => {
    mocks.logAuditEvent.mockResolvedValueOnce(undefined);
    await auditProvenanceOperationSafe({
      eventType: "CLIENT_SAFE_PROVENANCE_GENERATED",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      requestId: "prv_clientsafe_abc",
      source: "CLIENT_SAFE_PROVENANCE_API",
      status: "SUCCESS",
    });
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          requestId: "prv_clientsafe_abc",
          source: "CLIENT_SAFE_PROVENANCE_API",
          eventVersion: 1,
        }),
      }),
    );
  });
});
