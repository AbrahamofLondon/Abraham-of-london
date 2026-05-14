import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/server/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

import {
  buildProvenanceAuditMetadata,
  recordProvenanceAuditEvent,
} from "./provenance-audit-events";

beforeEach(() => {
  mocks.logAuditEvent.mockReset();
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
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "PROVENANCE_HASH_MISMATCH",
      actorType: "admin",
      actorId: "admin_1",
      resourceType: "provenance",
      resourceId: "cycle_001",
      status: "warning",
      severity: "warn",
      metadata: expect.objectContaining({
        hashPrefix: "hash_value_12345",
      }),
    }));
  });

  it("fails open when audit logging is unavailable", async () => {
    mocks.logAuditEvent.mockRejectedValueOnce(new Error("audit unavailable"));
    await expect(recordProvenanceAuditEvent({
      action: "FULL_PROVENANCE_VIEWED",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
    })).resolves.toBeUndefined();
  });
});
