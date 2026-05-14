import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listRetainedReviewCycles: vi.fn(),
  composeDecisionProvenance: vi.fn(),
  provenanceChainAnchor: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  recordProvenanceAuditEvent: vi.fn(),
}));

vi.mock("@/lib/product/retained-cadence-service", () => ({
  listRetainedReviewCycles: mocks.listRetainedReviewCycles,
}));

vi.mock("@/lib/admin/decision-provenance-record", () => ({
  composeDecisionProvenance: mocks.composeDecisionProvenance,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    provenanceChainAnchor: mocks.provenanceChainAnchor,
  },
}));

vi.mock("@/lib/admin/provenance-audit-events", () => ({
  recordProvenanceAuditEvent: mocks.recordProvenanceAuditEvent,
}));

import { createOversightProvenanceAnchor } from "@/lib/admin/provenance-anchor-runner";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";

function cycle(overrides: Partial<RetainedReviewCycle> = {}): RetainedReviewCycle {
  return {
    cycleId: "cycle_001",
    accountId: "acct_001",
    organisationId: "org_001",
    sponsorUserId: "user_001",
    sponsorEmail: "sponsor@example.com",
    cadenceState: "REVIEW_COMPLETED",
    cadenceSource: "scheduled",
    cadenceType: "monthly",
    scheduledFor: "2026-05-10T00:00:00.000Z",
    completedAt: "2026-05-14T09:00:00.000Z",
    skippedAt: null,
    skippedReason: null,
    escalationReason: null,
    operatorId: "operator_001",
    evidencePosture: "OPERATOR_RECORDED",
    createdAt: "2026-05-14T08:00:00.000Z",
    updatedAt: "2026-05-14T09:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
  mocks.listRetainedReviewCycles.mockReset();
  mocks.composeDecisionProvenance.mockReset();
  mocks.provenanceChainAnchor.findFirst.mockReset();
  mocks.provenanceChainAnchor.create.mockReset();
  mocks.recordProvenanceAuditEvent.mockReset();
  mocks.provenanceChainAnchor.findFirst.mockResolvedValue(null);
  mocks.provenanceChainAnchor.create.mockImplementation(async ({ data }) => ({
    id: "anchor_created",
    version: data.version,
    scope: data.scope,
    scopeId: data.scopeId,
    leafCount: data.leafCount,
    merkleRoot: data.merkleRoot,
    previousRoot: data.previousRoot,
    chainHash: data.chainHash,
    computedAt: data.computedAt,
    fromTimestamp: data.fromTimestamp,
    toTimestamp: data.toTimestamp,
    metadata: data.metadata,
    createdAt: new Date("2026-05-14T12:00:00.000Z"),
  }));
});

describe("createOversightProvenanceAnchor", () => {
  it("creates an anchor from valid oversight cycle provenance records", async () => {
    mocks.listRetainedReviewCycles.mockResolvedValue([
      cycle({ cycleId: "cycle_001", updatedAt: "2026-05-14T09:00:00.000Z" }),
      cycle({ cycleId: "cycle_002", updatedAt: "2026-05-14T10:00:00.000Z" }),
    ]);
    mocks.composeDecisionProvenance
      .mockResolvedValueOnce({ provenanceHash: "hash_001" })
      .mockResolvedValueOnce({ provenanceHash: "hash_002" });

    const result = await createOversightProvenanceAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
    });

    expect(result.status).toBe("ANCHORED");
    expect(result.leafCount).toBe(2);
    expect(result.unavailableCount).toBe(0);
    expect(mocks.provenanceChainAnchor.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        scope: "DAILY",
        scopeId: "2026-05-14",
        leafCount: 2,
      }),
    }));
  });

  it("returns unavailable instead of creating a fake anchor when no valid leaves exist", async () => {
    mocks.listRetainedReviewCycles.mockResolvedValue([
      cycle({ cycleId: "cycle_001" }),
    ]);
    mocks.composeDecisionProvenance.mockResolvedValueOnce({ provenanceHash: "" });

    const result = await createOversightProvenanceAnchor({
      scope: "CYCLE_BATCH",
      scopeId: "cycle_001",
    });

    expect(result).toMatchObject({
      status: "UNAVAILABLE",
      leafCount: 0,
      requestedCount: 1,
      unavailableCount: 1,
      anchor: null,
    });
    expect(mocks.provenanceChainAnchor.create).not.toHaveBeenCalled();
  });

  it("counts unavailable records without storing raw record data", async () => {
    mocks.listRetainedReviewCycles.mockResolvedValue([
      cycle({ cycleId: "cycle_001" }),
      cycle({ cycleId: "cycle_002", updatedAt: "2026-05-14T10:00:00.000Z" }),
    ]);
    mocks.composeDecisionProvenance
      .mockResolvedValueOnce({ provenanceHash: "hash_001" })
      .mockRejectedValueOnce(new Error("compose failed"));

    const result = await createOversightProvenanceAnchor({
      scope: "ACCOUNT",
      scopeId: "acct_001",
    });

    expect(result).toMatchObject({
      status: "ANCHORED",
      requestedCount: 2,
      leafCount: 1,
      unavailableCount: 1,
    });
    const metadata = mocks.provenanceChainAnchor.create.mock.calls[0]?.[0].data.metadata;
    expect(metadata).toEqual({
      subjectCount: 1,
      subjectTypes: ["OVERSIGHT_CYCLE"],
      unavailableCount: 1,
      hasRawPayloads: false,
    });
    const stored = JSON.stringify(mocks.provenanceChainAnchor.create.mock.calls[0]?.[0].data);
    expect(stored).not.toContain("governanceEvents");
    expect(stored).not.toContain("suppression");
    expect(stored).not.toContain("operator notes");
    expect(stored).not.toContain("hash_002");
  });

  it("keeps metadata safe", async () => {
    mocks.listRetainedReviewCycles.mockResolvedValue([
      cycle({ cycleId: "cycle_001" }),
    ]);
    mocks.composeDecisionProvenance.mockResolvedValueOnce({
      provenanceHash: "hash_001",
      governanceEvents: [{ label: "Suppressed protected field" }],
    });

    await createOversightProvenanceAnchor({
      scope: "ORGANISATION",
      scopeId: "org_001",
    });

    const metadata = JSON.stringify(mocks.provenanceChainAnchor.create.mock.calls[0]?.[0].data.metadata);
    expect(metadata).toContain("OVERSIGHT_CYCLE");
    expect(metadata).not.toContain("Suppressed protected field");
    expect(metadata).not.toContain("governanceEvents");
    expect(metadata).not.toContain("provenanceHash");
  });

  it("produces the same Merkle root for the same leaves in different source order", async () => {
    const firstCycle = cycle({ cycleId: "cycle_001", updatedAt: "2026-05-14T09:00:00.000Z" });
    const secondCycle = cycle({ cycleId: "cycle_002", updatedAt: "2026-05-14T10:00:00.000Z" });

    mocks.listRetainedReviewCycles.mockResolvedValueOnce([firstCycle, secondCycle]);
    mocks.composeDecisionProvenance
      .mockResolvedValueOnce({ provenanceHash: "hash_001" })
      .mockResolvedValueOnce({ provenanceHash: "hash_002" });
    const first = await createOversightProvenanceAnchor({ scope: "DAILY", scopeId: "2026-05-14" });

    mocks.listRetainedReviewCycles.mockResolvedValueOnce([secondCycle, firstCycle]);
    mocks.composeDecisionProvenance
      .mockResolvedValueOnce({ provenanceHash: "hash_001" })
      .mockResolvedValueOnce({ provenanceHash: "hash_002" });
    const second = await createOversightProvenanceAnchor({ scope: "DAILY", scopeId: "2026-05-14" });

    expect(first.status).toBe("ANCHORED");
    expect(second.status).toBe("ANCHORED");
    expect(first.anchor?.merkleRoot).toBe(second.anchor?.merkleRoot);
  });

  it("links the next anchor to the previous root", async () => {
    mocks.listRetainedReviewCycles.mockResolvedValue([
      cycle({ cycleId: "cycle_001" }),
    ]);
    mocks.composeDecisionProvenance.mockResolvedValue({ provenanceHash: "hash_001" });
    mocks.provenanceChainAnchor.findFirst.mockResolvedValueOnce({ merkleRoot: "previous_root" });

    const result = await createOversightProvenanceAnchor({
      scope: "CYCLE_BATCH",
      scopeId: "cycle_001",
    });

    expect(result.status).toBe("ANCHORED");
    expect(result.anchor?.previousRoot).toBe("previous_root");
    expect(mocks.provenanceChainAnchor.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        previousRoot: "previous_root",
      }),
    }));
  });
});
