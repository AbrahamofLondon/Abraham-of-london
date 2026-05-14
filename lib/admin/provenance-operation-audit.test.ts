import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/server/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

import {
  buildProvenanceOperationAuditPayload,
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
