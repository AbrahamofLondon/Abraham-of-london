import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordProvenanceOperationAudit: vi.fn(),
}));

vi.mock("@/lib/admin/provenance-operation-audit", () => ({
  recordProvenanceOperationAudit: mocks.recordProvenanceOperationAudit,
}));

import {
  buildProvenanceAuditMetadata,
  recordProvenanceAuditEvent,
} from "./provenance-audit-events";

beforeEach(() => {
  mocks.recordProvenanceOperationAudit.mockReset();
  mocks.recordProvenanceOperationAudit.mockResolvedValue({ ok: true });
});

describe("buildProvenanceAuditMetadata", () => {
  it("keeps only safe provenance operation metadata", () => {
    const metadata = buildProvenanceAuditMetadata({
      action: "PROVENANCE_VERIFIED",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      hash: "1234567890abcdefEXTRA",
      merkleRoot: "abcdef1234567890EXTRA",
      chainHash: "feedfacecafebeefEXTRA",
    });
    expect(metadata).toEqual({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      scope: null,
      scopeId: null,
      hashPrefix: "1234567890abcdef",
      merkleRootPrefix: "abcdef1234567890",
      chainHashPrefix: "feedfacecafebeef",
    });
    expect(JSON.stringify(metadata)).not.toContain("governanceEvents");
    expect(JSON.stringify(metadata)).not.toContain("suppression");
  });
});

describe("recordProvenanceAuditEvent", () => {
  it("writes a safe audit event", async () => {
    await recordProvenanceAuditEvent({
      action: "PROVENANCE_HASH_MISMATCH",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      hash: "hash_value_123456789",
      actorId: "admin_1",
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "PROVENANCE_HASH_MISMATCH",
      status: "MISMATCH",
      actorId: "admin_1",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
      provenanceHash: "hash_value_123456789",
    }));
  });

  it("fails open when audit logging is unavailable", async () => {
    mocks.recordProvenanceOperationAudit.mockResolvedValueOnce({
      ok: false,
      warning: "Provenance operation completed but audit event could not be recorded.",
    });
    await expect(recordProvenanceAuditEvent({
      action: "FULL_PROVENANCE_VIEWED",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
    })).resolves.toBeUndefined();
  });
});
