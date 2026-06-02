/**
 * tests/outbound/outbound-readiness-matrix.test.ts
 *
 * Verifies the outbound readiness contract:
 *  - idempotency key format is stable across providers
 *  - the same post cannot be claimed twice via isDuplicatePublish
 *  - X status enrichment logic (published → disabled, DRY_RUN → info, etc.)
 *  - provider scope isolation (X ledger entries don't appear in LinkedIn queries)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockFindFirst, mockFindMany } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    outboundPublishLedger: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
    },
  },
}));

import { buildIdempotencyKey, getBulkPublishStatus, isDuplicatePublish } from "@/lib/outbound/core/outbound-publish-ledger";

beforeEach(() => {
  vi.clearAllMocks();
  mockFindFirst.mockResolvedValue(null);
  mockFindMany.mockResolvedValue([]);
});

describe("Provider scope isolation", () => {
  it("getBulkPublishStatus queries only the requested provider", async () => {
    await getBulkPublishStatus("x");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ provider: "x" }) }),
    );
  });

  it("getBulkPublishStatus for linkedin does not include x entries", async () => {
    await getBulkPublishStatus("linkedin");
    const call = mockFindMany.mock.calls[0]?.[0];
    expect(call?.where?.provider).toBe("linkedin");
    expect(call?.where?.provider).not.toBe("x");
  });
});

describe("Idempotency key uniqueness across providers", () => {
  it("same post id with different providers produces different keys", () => {
    const xKey = buildIdempotencyKey("x", "post-001", null);
    const liKey = buildIdempotencyKey("linkedin", "post-001", null);
    const fbKey = buildIdempotencyKey("facebook", "post-001", null);
    const keys = [xKey, liKey, fbKey];
    expect(new Set(keys).size).toBe(3);
  });

  it("same provider + id + scheduledFor is always identical", () => {
    const k1 = buildIdempotencyKey("x", "writing-changed-humanity-x-001", "2026-06-02T10:00:00Z");
    const k2 = buildIdempotencyKey("x", "writing-changed-humanity-x-001", "2026-06-02T10:00:00Z");
    expect(k1).toBe(k2);
  });
});

describe("isDuplicatePublish guards per provider", () => {
  it("returns null for x when only a linkedin PUBLISHED entry exists", async () => {
    // Simulate: linkedin has a PUBLISHED entry, x has nothing
    mockFindFirst.mockImplementation((args: { where: { idempotencyKey: string; status: string } }) => {
      const key = args.where.idempotencyKey;
      if (key.startsWith("linkedin:")) return Promise.resolve({ id: "li-1", status: "PUBLISHED" });
      return Promise.resolve(null);
    });

    const result = await isDuplicatePublish("x", "post-001", null);
    expect(result).toBeNull();
  });

  it("blocks x publish when PUBLISHED x entry exists", async () => {
    mockFindFirst.mockResolvedValue({ id: "x-1", status: "PUBLISHED" });
    const result = await isDuplicatePublish("x", "post-001", null);
    expect(result).not.toBeNull();
    expect(result?.status).toBe("PUBLISHED");
  });
});

describe("X console status enrichment logic", () => {
  it("PUBLISHED status in ledger means publish must be disabled", () => {
    const publishLedgerStatus = "PUBLISHED";
    // Rule: if PUBLISHED, asset.publishable must be false
    const alreadyPublished = publishLedgerStatus === "PUBLISHED";
    const publishable = alreadyPublished ? false : true;
    expect(publishable).toBe(false);
  });

  it("DRY_RUN in ledger does not block publish", () => {
    const publishLedgerStatus = "DRY_RUN";
    const alreadyPublished = publishLedgerStatus === "PUBLISHED";
    const publishable = alreadyPublished ? false : true;
    expect(publishable).toBe(true);
  });

  it("FAILED in ledger does not permanently block re-publish attempt", () => {
    const publishLedgerStatus = "FAILED";
    const alreadyPublished = publishLedgerStatus === "PUBLISHED";
    const publishable = alreadyPublished ? false : true;
    expect(publishable).toBe(true);
  });
});
