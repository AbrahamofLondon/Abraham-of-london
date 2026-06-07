/**
 * tests/lib/artifacts/artifact-authority.test.ts
 *
 * Unit tests for the artifact authority layer.
 * All Prisma calls are mocked — no DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const {
  mockProductArtifact,
  mockProductArtifactAmendment,
  mockTransaction,
} = vi.hoisted(() => ({
  mockProductArtifact: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockProductArtifactAmendment: {
    create: vi.fn(),
  },
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    productArtifact: mockProductArtifact,
    productArtifactAmendment: mockProductArtifactAmendment,
    $transaction: mockTransaction,
  },
}));

import {
  generateArtifactId,
  hashContent,
  hashInputSnapshot,
  registerArtifact,
  finaliseArtifact,
  failArtifact,
  markArtifactDelivered,
  markArtifactDownloaded,
  amendArtifact,
  revokeArtifact,
  assertDeliveryAuthorised,
  getArtifactsPendingDelivery,
} from "@/lib/artifacts/artifact-authority";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDbArtifact(overrides: Record<string, unknown> = {}) {
  return {
    id: "db-id-001",
    artifactId: "ART-AABBCCDD11223344",
    productCode: "boardroom_brief",
    sourceEntityType: "BRIEF_ORDER",
    sourceEntityId: "order-001",
    userId: null,
    userEmail: "user@example.com",
    organisationId: null,
    version: 1,
    status: "GENERATING",
    inputSnapshotHash: null,
    artifactHash: null,
    evidenceRefs: [],
    falsificationRefs: [],
    outcomeHypothesisId: null,
    deliveryStatus: "PENDING",
    deliveredAt: null,
    publicSafeSummary: null,
    privateNotes: null,
    generatedBy: "system",
    downloadUrl: null,
    manifestId: null,
    parentArtifactId: null,
    createdAt: new Date("2026-06-07T00:00:00Z"),
    updatedAt: new Date("2026-06-07T00:00:00Z"),
    supersededAt: null,
    amendments: [],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("generateArtifactId", () => {
  it("produces ART- prefixed IDs", () => {
    const id = generateArtifactId();
    expect(id).toMatch(/^ART-[A-F0-9]{16}$/);
  });

  it("produces unique IDs on each call", () => {
    const ids = new Set(Array.from({ length: 20 }, generateArtifactId));
    expect(ids.size).toBe(20);
  });
});

describe("hashContent", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashContent("hello world");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashContent("test")).toBe(hashContent("test"));
  });

  it("produces different hashes for different input", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });

  it("accepts Buffer input", () => {
    const hash = hashContent(Buffer.from("buffer test"));
    expect(hash).toHaveLength(64);
  });
});

describe("hashInputSnapshot", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashInputSnapshot({ key: "value", number: 42 });
    expect(hash).toHaveLength(64);
  });

  it("is deterministic regardless of key order", () => {
    const h1 = hashInputSnapshot({ a: 1, b: 2 });
    const h2 = hashInputSnapshot({ b: 2, a: 1 });
    expect(h1).toBe(h2);
  });
});

describe("registerArtifact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a GENERATING artifact record", async () => {
    const dbRecord = makeDbArtifact();
    mockProductArtifact.create.mockResolvedValue(dbRecord);

    const result = await registerArtifact({
      productCode: "boardroom_brief",
      sourceEntityType: "BRIEF_ORDER",
      sourceEntityId: "order-001",
      userEmail: "user@example.com",
    });

    expect(mockProductArtifact.create).toHaveBeenCalledOnce();
    const callArg = mockProductArtifact.create.mock.calls[0][0].data;
    expect(callArg.status).toBe("GENERATING");
    expect(callArg.deliveryStatus).toBe("PENDING");
    expect(callArg.productCode).toBe("boardroom_brief");
    expect(callArg.artifactId).toMatch(/^ART-/);
    expect(result.status).toBe("GENERATING");
  });

  it("hashes inputSnapshot when provided", async () => {
    const dbRecord = makeDbArtifact({ inputSnapshotHash: "abc123" });
    mockProductArtifact.create.mockResolvedValue(dbRecord);

    await registerArtifact({
      productCode: "boardroom_brief",
      sourceEntityType: "BRIEF_ORDER",
      sourceEntityId: "order-001",
      inputSnapshot: { orderId: "order-001", userId: "u1" },
    });

    const callArg = mockProductArtifact.create.mock.calls[0][0].data;
    expect(callArg.inputSnapshotHash).toBeTruthy();
    expect(callArg.inputSnapshotHash).toHaveLength(64);
  });

  it("sets inputSnapshotHash to null when no snapshot provided", async () => {
    mockProductArtifact.create.mockResolvedValue(makeDbArtifact());

    await registerArtifact({
      productCode: "decision_instruments",
      sourceEntityType: "INSTRUMENT_RUN",
      sourceEntityId: "run-001",
    });

    const callArg = mockProductArtifact.create.mock.calls[0][0].data;
    expect(callArg.inputSnapshotHash).toBeNull();
  });
});

describe("finaliseArtifact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status READY and computes artifactHash", async () => {
    const dbRecord = makeDbArtifact({ status: "GENERATING" });
    mockProductArtifact.findUnique.mockResolvedValue(dbRecord);
    const readyRecord = makeDbArtifact({
      status: "READY",
      artifactHash: hashContent("pdf content"),
    });
    mockProductArtifact.update.mockResolvedValue(readyRecord);

    const result = await finaliseArtifact({
      artifactId: dbRecord.artifactId,
      artifactContent: "pdf content",
    });

    expect(result.status).toBe("READY");
    expect(result.artifactHash).toHaveLength(64);

    const updateCall = mockProductArtifact.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("READY");
    expect(updateCall.data.artifactHash).toHaveLength(64);
  });

  it("throws if artifact not found", async () => {
    mockProductArtifact.findUnique.mockResolvedValue(null);

    await expect(
      finaliseArtifact({ artifactId: "MISSING", artifactContent: "x" }),
    ).rejects.toThrow("Artifact not found");
  });

  it("throws if artifact is not in GENERATING state", async () => {
    mockProductArtifact.findUnique.mockResolvedValue(
      makeDbArtifact({ status: "READY" }),
    );

    await expect(
      finaliseArtifact({ artifactId: "ART-AABBCCDD11223344", artifactContent: "x" }),
    ).rejects.toThrow("Only GENERATING artifacts may be finalised");
  });
});

describe("failArtifact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status FAILED and stores reason in privateNotes", async () => {
    const failedRecord = makeDbArtifact({ status: "FAILED", privateNotes: "generation error" });
    mockProductArtifact.update.mockResolvedValue(failedRecord);

    const result = await failArtifact("ART-AABBCCDD11223344", "generation error");

    expect(result.status).toBe("FAILED");
    const updateCall = mockProductArtifact.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("FAILED");
    expect(updateCall.data.privateNotes).toBe("generation error");
  });
});

describe("markArtifactDelivered / markArtifactDownloaded", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks artifact DELIVERED with timestamp", async () => {
    const delivered = makeDbArtifact({
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
    });
    mockProductArtifact.update.mockResolvedValue(delivered);

    const result = await markArtifactDelivered("ART-AABBCCDD11223344");
    expect(result.deliveryStatus).toBe("DELIVERED");
    expect(result.deliveredAt).toBeTruthy();
  });

  it("marks artifact DOWNLOADED", async () => {
    const downloaded = makeDbArtifact({ deliveryStatus: "DOWNLOADED" });
    mockProductArtifact.update.mockResolvedValue(downloaded);

    const result = await markArtifactDownloaded("ART-AABBCCDD11223344");
    expect(result.deliveryStatus).toBe("DOWNLOADED");
  });
});

describe("revokeArtifact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status REVOKED with reason and revokedBy", async () => {
    const revoked = makeDbArtifact({
      status: "REVOKED",
      privateNotes: "REVOKED by admin: compliance order",
      supersededAt: new Date(),
    });
    mockProductArtifact.update.mockResolvedValue(revoked);

    const result = await revokeArtifact(
      "ART-AABBCCDD11223344",
      "compliance order",
      "admin",
    );

    expect(result.status).toBe("REVOKED");
    const updateCall = mockProductArtifact.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("REVOKED");
    expect(updateCall.data.privateNotes).toContain("compliance order");
    expect(updateCall.data.privateNotes).toContain("admin");
  });
});

describe("amendArtifact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates new version, supersedes parent, logs amendment in $transaction", async () => {
    const parent = makeDbArtifact({ status: "READY", version: 1, id: "db-id-001" });
    mockProductArtifact.findUnique.mockResolvedValue(parent);

    const newRecord = makeDbArtifact({ version: 2, parentArtifactId: parent.artifactId });
    mockTransaction.mockImplementation(async (fns: Array<Promise<unknown>>) => {
      return await Promise.all(fns);
    });
    // Mock all three operations in $transaction
    mockProductArtifact.create.mockResolvedValue(newRecord);
    mockProductArtifact.update.mockResolvedValue(makeDbArtifact({ status: "SUPERSEDED" }));
    mockProductArtifactAmendment.create.mockResolvedValue({ id: "amend-001" });

    const result = await amendArtifact({
      parentArtifactId: parent.artifactId,
      reason: "Correction to market data",
      amendedBy: "operator@firm.com",
    });

    expect(mockProductArtifact.findUnique).toHaveBeenCalledOnce();
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(result.version).toBe(2);
    expect(result.parentArtifactId).toBe(parent.artifactId);
  });

  it("throws if parent artifact not found", async () => {
    mockProductArtifact.findUnique.mockResolvedValue(null);

    await expect(
      amendArtifact({
        parentArtifactId: "MISSING",
        reason: "test",
      }),
    ).rejects.toThrow("Parent artifact not found");
  });

  it("throws if parent artifact is REVOKED", async () => {
    mockProductArtifact.findUnique.mockResolvedValue(
      makeDbArtifact({ status: "REVOKED" }),
    );

    await expect(
      amendArtifact({
        parentArtifactId: "ART-AABBCCDD11223344",
        reason: "test",
      }),
    ).rejects.toThrow("Cannot amend a revoked artifact");
  });
});

describe("assertDeliveryAuthorised", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns artifact when READY artifact exists", async () => {
    const readyArtifact = makeDbArtifact({ status: "READY" });
    mockProductArtifact.findFirst.mockResolvedValue(readyArtifact);

    const result = await assertDeliveryAuthorised("BRIEF_ORDER", "order-001");
    expect(result.status).toBe("READY");
  });

  it("throws DELIVERY_BLOCKED when no artifact registered", async () => {
    mockProductArtifact.findFirst.mockResolvedValue(null);

    await expect(
      assertDeliveryAuthorised("BRIEF_ORDER", "order-001"),
    ).rejects.toThrow("DELIVERY_BLOCKED");
  });

  it("throws DELIVERY_BLOCKED when artifact is GENERATING", async () => {
    mockProductArtifact.findFirst.mockResolvedValue(
      makeDbArtifact({ status: "GENERATING" }),
    );

    await expect(
      assertDeliveryAuthorised("BRIEF_ORDER", "order-001"),
    ).rejects.toThrow("DELIVERY_BLOCKED");
  });
});

describe("getArtifactsPendingDelivery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all READY/PENDING artifacts when no productCode filter", async () => {
    const records = [
      makeDbArtifact({ status: "READY", deliveryStatus: "PENDING" }),
      makeDbArtifact({ id: "db-id-002", artifactId: "ART-BBCC", status: "READY", deliveryStatus: "PENDING" }),
    ];
    mockProductArtifact.findMany.mockResolvedValue(records);

    const result = await getArtifactsPendingDelivery();
    expect(result).toHaveLength(2);
  });

  it("filters by productCode when provided", async () => {
    mockProductArtifact.findMany.mockResolvedValue([]);

    await getArtifactsPendingDelivery("boardroom_brief");
    const callArg = mockProductArtifact.findMany.mock.calls[0][0];
    expect(callArg.where.productCode).toBe("boardroom_brief");
  });
});
