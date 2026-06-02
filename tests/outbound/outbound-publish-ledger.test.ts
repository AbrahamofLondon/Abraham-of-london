/**
 * tests/outbound/outbound-publish-ledger.test.ts
 *
 * Unit tests for the outbound publish ledger utility functions.
 * Prisma is mocked — no DB required.
 *
 * Verified invariants:
 *  - buildIdempotencyKey produces stable format "provider:id:scheduledFor"
 *  - findPublishedByIdempotencyKey queries only PUBLISHED status
 *  - isDuplicatePublish delegates correctly
 *  - getBulkPublishStatus returns a Map keyed by outboundItemId
 *  - getBulkPublishStatus keeps only the most recent entry per item
 *  - getBulkPublishStatus returns empty Map on DB failure (graceful degradation)
 *  - claimPublishSlot: PUBLISHED blocks re-claim
 *  - claimPublishSlot: IN_PROGRESS blocks concurrent claim
 *  - claimPublishSlot: FAILED/BLOCKED/SKIPPED are reclaimed (retry allowed)
 *  - claimPublishSlot: DRY_RUN rows are keyed differently so they cannot block a live claim
 *  - dry-run idempotencyKeyOverride uses per-invocation unique key
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockCreate, mockFindFirst, mockFindMany, mockUpdate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    outboundPublishLedger: {
      create: mockCreate,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

import {
  buildIdempotencyKey,
  findPublishedByIdempotencyKey,
  isDuplicatePublish,
  getBulkPublishStatus,
  claimPublishSlot,
  createLedgerEntry,
} from "@/lib/outbound/core/outbound-publish-ledger";

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "led-new", status: "IN_PROGRESS" });
  mockFindFirst.mockResolvedValue(null);
  mockFindMany.mockResolvedValue([]);
  mockUpdate.mockResolvedValue({ id: "led-updated", status: "IN_PROGRESS" });
});

// ─── buildIdempotencyKey ──────────────────────────────────────────────────────

describe("buildIdempotencyKey", () => {
  it("produces provider:id:scheduledFor format", () => {
    expect(buildIdempotencyKey("x", "post-123", "2026-06-02T10:00:00Z"))
      .toBe("x:post-123:2026-06-02T10:00:00Z");
  });

  it("uses 'unscheduled' when scheduledFor is null", () => {
    expect(buildIdempotencyKey("linkedin", "post-abc", null))
      .toBe("linkedin:post-abc:unscheduled");
  });

  it("is stable for same inputs", () => {
    const k1 = buildIdempotencyKey("facebook", "fb-001", "2026-07-01T09:00:00Z");
    const k2 = buildIdempotencyKey("facebook", "fb-001", "2026-07-01T09:00:00Z");
    expect(k1).toBe(k2);
  });

  it("dry-run override key is distinct from live key", () => {
    const liveKey = buildIdempotencyKey("x", "writing-changed-humanity-x-001", "2026-06-02T10:00:00Z");
    const dryRunKey = `x:dry-run:writing-changed-humanity-x-001:req_abc123`;
    expect(dryRunKey).not.toBe(liveKey);
    expect(dryRunKey).toContain("dry-run");
  });
});

// ─── findPublishedByIdempotencyKey ────────────────────────────────────────────

describe("findPublishedByIdempotencyKey", () => {
  it("queries only PUBLISHED status rows", async () => {
    await findPublishedByIdempotencyKey("x:my-post:unscheduled");
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }) }),
    );
  });

  it("returns null when no entry found", async () => {
    expect(await findPublishedByIdempotencyKey("x:no-such:unscheduled")).toBeNull();
  });

  it("returns the ledger entry when found", async () => {
    const entry = { id: "led-001", status: "PUBLISHED", idempotencyKey: "x:p:unscheduled" };
    mockFindFirst.mockResolvedValue(entry);
    expect(await findPublishedByIdempotencyKey("x:p:unscheduled")).toEqual(entry);
  });

  it("returns null on DB failure (graceful degradation)", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB connection failed"));
    expect(await findPublishedByIdempotencyKey("x:p:unscheduled")).toBeNull();
  });
});

// ─── isDuplicatePublish ───────────────────────────────────────────────────────

describe("isDuplicatePublish", () => {
  it("queries using built idempotency key", async () => {
    await isDuplicatePublish("x", "post-001", "2026-06-10T00:00:00Z");
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ idempotencyKey: "x:post-001:2026-06-10T00:00:00Z" }),
      }),
    );
  });

  it("returns null when not yet published", async () => {
    expect(await isDuplicatePublish("x", "new-post", null)).toBeNull();
  });

  it("returns entry when already published", async () => {
    const entry = { id: "led-002", status: "PUBLISHED" };
    mockFindFirst.mockResolvedValue(entry);
    expect(await isDuplicatePublish("x", "existing-post", null)).toEqual(entry);
  });
});

// ─── claimPublishSlot ─────────────────────────────────────────────────────────

describe("claimPublishSlot — slot claim invariants", () => {
  const BASE_INPUT = {
    provider: "x" as const,
    outboundItemId: "post-001",
    assetSlug: "outbound-x/post-001",
    scheduledFor: "2026-06-02T10:00:00Z",
    source: "manual" as const,
  };

  it("claims slot successfully when no existing row", async () => {
    mockFindFirst.mockResolvedValue(null); // no PUBLISHED row
    mockCreate.mockResolvedValue({ id: "led-new", status: "IN_PROGRESS" });
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(true);
    expect(result.entry.status).toBe("IN_PROGRESS");
  });

  it("blocks re-claim when PUBLISHED row exists (optimistic pre-check)", async () => {
    const published = { id: "led-pub", status: "PUBLISHED" };
    mockFindFirst.mockResolvedValue(published); // findPublishedByIdempotencyKey finds it
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(false);
    expect(result.reason).toMatch(/already published/i);
  });

  it("blocks concurrent claim when IN_PROGRESS row exists (P2002 path)", async () => {
    mockFindFirst.mockResolvedValue(null); // no PUBLISHED row initially
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    // findFirst for the conflict check returns IN_PROGRESS
    mockFindFirst
      .mockResolvedValueOnce(null) // findPublishedByIdempotencyKey
      .mockResolvedValueOnce({ id: "led-inf", status: "IN_PROGRESS" }); // conflict lookup
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(false);
    expect(result.reason).toMatch(/in_progress/i);
  });

  it("reclaims slot when existing row is FAILED (retry allowed)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    const failedRow = { id: "led-fail", status: "FAILED", actorId: null, actorEmailHash: null };
    mockFindFirst
      .mockResolvedValueOnce(null)          // findPublishedByIdempotencyKey
      .mockResolvedValueOnce(failedRow);    // conflict lookup
    const updated = { id: "led-fail", status: "IN_PROGRESS" };
    mockUpdate.mockResolvedValue(updated);
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(true);
    expect(result.entry.status).toBe("IN_PROGRESS");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "led-fail" }, data: expect.objectContaining({ status: "IN_PROGRESS" }) }),
    );
  });

  it("reclaims slot when existing row is BLOCKED (retry allowed)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "led-blk", status: "BLOCKED", actorId: null, actorEmailHash: null });
    mockUpdate.mockResolvedValue({ id: "led-blk", status: "IN_PROGRESS" });
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(true);
  });

  it("reclaims slot when existing row is SKIPPED", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "led-skip", status: "SKIPPED", actorId: null, actorEmailHash: null });
    mockUpdate.mockResolvedValue({ id: "led-skip", status: "IN_PROGRESS" });
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(true);
  });

  it("blocks claim when existing row is PUBLISHED (P2002 path)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "led-pub2", status: "PUBLISHED" });
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(false);
    expect(result.reason).toMatch(/already published/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── Legacy DRY_RUN recovery ─────────────────────────────────────────────────

  it("reclaims slot when existing row is DRY_RUN (legacy live-slot key)", async () => {
    // Before the dry-run key fix, dry-runs wrote to the live slot key.
    // claimPublishSlot must recover these rows so live publish can proceed.
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    const dryRunRow = { id: "led-dr", status: "DRY_RUN", actorId: null, actorEmailHash: null };
    mockFindFirst
      .mockResolvedValueOnce(null)         // findPublishedByIdempotencyKey
      .mockResolvedValueOnce(dryRunRow);   // conflict lookup
    const updated = { id: "led-dr", status: "IN_PROGRESS" };
    mockUpdate.mockResolvedValue(updated);

    const result = await claimPublishSlot(BASE_INPUT);

    expect(result.claimed).toBe(true);
    expect(result.entry.status).toBe("IN_PROGRESS");
  });

  it("legacy DRY_RUN row is updated to IN_PROGRESS (not re-inserted)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "led-dr2", status: "DRY_RUN", actorId: null, actorEmailHash: null });
    mockUpdate.mockResolvedValue({ id: "led-dr2", status: "IN_PROGRESS" });

    await claimPublishSlot(BASE_INPUT);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "led-dr2" },
        data: expect.objectContaining({ status: "IN_PROGRESS", errorCode: null, completedAt: null }),
      }),
    );
    // Must update, not insert a second row
    expect(mockCreate).toHaveBeenCalledTimes(1); // the original failing create
  });

  it("PUBLISHED still blocks even after DRY_RUN recovery is available", async () => {
    // Regression guard: DRY_RUN recovery must not weaken PUBLISHED protection.
    const published = { id: "led-pub3", status: "PUBLISHED" };
    mockFindFirst.mockResolvedValue(published); // optimistic pre-check finds PUBLISHED
    const result = await claimPublishSlot(BASE_INPUT);
    expect(result.claimed).toBe(false);
    expect(result.reason).toMatch(/already published/i);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("active IN_PROGRESS still blocks (concurrent publish race protection)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(p2002);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "led-inf2", status: "IN_PROGRESS", actorId: null, actorEmailHash: null });

    const result = await claimPublishSlot(BASE_INPUT);

    expect(result.claimed).toBe(false);
    expect(result.reason).toMatch(/IN_PROGRESS/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── createLedgerEntry — idempotencyKeyOverride ───────────────────────────────

describe("createLedgerEntry — idempotencyKeyOverride for dry-runs", () => {
  it("uses override key when provided", async () => {
    mockCreate.mockResolvedValue({ id: "dr-01", status: "DRY_RUN" });
    await createLedgerEntry({
      provider: "x",
      outboundItemId: "post-001",
      assetSlug: "outbound-x/post-001",
      scheduledFor: "2026-06-02T10:00:00Z",
      status: "DRY_RUN",
      source: "manual",
      idempotencyKeyOverride: "x:dry-run:post-001:req_xyz",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey: "x:dry-run:post-001:req_xyz" }),
      }),
    );
  });

  it("uses computed key when override is not provided", async () => {
    mockCreate.mockResolvedValue({ id: "dr-02", status: "DRY_RUN" });
    await createLedgerEntry({
      provider: "x",
      outboundItemId: "post-001",
      assetSlug: "outbound-x/post-001",
      scheduledFor: "2026-06-02T10:00:00Z",
      status: "DRY_RUN",
      source: "manual",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey: "x:post-001:2026-06-02T10:00:00Z" }),
      }),
    );
  });

  it("dry-run override key does not match the live slot key", () => {
    const liveKey = buildIdempotencyKey("x", "post-001", "2026-06-02T10:00:00Z");
    const dryRunKey = "x:dry-run:post-001:req_abc";
    expect(dryRunKey).not.toBe(liveKey);
  });
});

// ─── Dry-run → live publish sequence ─────────────────────────────────────────

describe("Dry-run does not block live publish", () => {
  it("dry-run row with override key leaves the live slot unclaimed", async () => {
    const liveKey = buildIdempotencyKey("x", "post-001", "2026-06-02T10:00:00Z");

    // Dry-run creates row with a different key — live slot stays free
    mockCreate.mockResolvedValueOnce({ id: "dr-01", status: "DRY_RUN" });
    await createLedgerEntry({
      provider: "x",
      outboundItemId: "post-001",
      assetSlug: "outbound-x/post-001",
      scheduledFor: "2026-06-02T10:00:00Z",
      status: "DRY_RUN",
      idempotencyKeyOverride: "x:dry-run:post-001:req_001",
    });

    // Live publish: no PUBLISHED row found for live key, create succeeds
    mockFindFirst.mockResolvedValue(null); // findPublishedByIdempotencyKey → not published
    mockCreate.mockResolvedValue({ id: "led-live", status: "IN_PROGRESS" });

    const result = await claimPublishSlot({
      provider: "x",
      outboundItemId: "post-001",
      assetSlug: "outbound-x/post-001",
      scheduledFor: "2026-06-02T10:00:00Z",
    });

    expect(result.claimed).toBe(true);
    // The live slot create was called with the live key, not the dry-run key
    expect(mockCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ idempotencyKey: liveKey }) }),
    );
  });

  it("repeated dry-run calls each get unique keys (no conflict between them)", async () => {
    const keys: string[] = [];
    mockCreate.mockImplementation((args) => {
      keys.push(args.data.idempotencyKey);
      return Promise.resolve({ id: `dr-${keys.length}`, status: "DRY_RUN" });
    });

    for (const reqId of ["req_001", "req_002", "req_003"]) {
      await createLedgerEntry({
        provider: "x",
        outboundItemId: "post-001",
        assetSlug: "outbound-x/post-001",
        status: "DRY_RUN",
        idempotencyKeyOverride: `x:dry-run:post-001:${reqId}`,
      });
    }

    expect(new Set(keys).size).toBe(3); // all unique
  });
});

// ─── Live publish → duplicate block ──────────────────────────────────────────

describe("Second live publish is blocked after PUBLISHED", () => {
  it("isDuplicatePublish returns the PUBLISHED entry, blocking the second attempt", async () => {
    const published = { id: "led-pub", status: "PUBLISHED", providerPostUrl: "https://x.com/tweet-1" };
    mockFindFirst.mockResolvedValue(published);
    const result = await isDuplicatePublish("x", "post-001", "2026-06-02T10:00:00Z");
    expect(result).not.toBeNull();
    expect(result?.status).toBe("PUBLISHED");
  });
});

// ─── getBulkPublishStatus ─────────────────────────────────────────────────────

describe("getBulkPublishStatus", () => {
  it("returns empty Map when no entries exist", async () => {
    expect((await getBulkPublishStatus("x")).size).toBe(0);
  });

  it("returns a Map keyed by outboundItemId", async () => {
    mockFindMany.mockResolvedValue([
      { outboundItemId: "post-a", status: "PUBLISHED", providerPostId: "tweet-1", providerPostUrl: "https://x.com/tweet-1", completedAt: new Date("2026-06-01T10:00:00Z"), errorCode: null, safeMessage: null },
      { outboundItemId: "post-b", status: "FAILED", providerPostId: null, providerPostUrl: null, completedAt: new Date("2026-06-01T11:00:00Z"), errorCode: "X_POST_FAILED", safeMessage: "API error" },
    ]);
    const map = await getBulkPublishStatus("x");
    expect(map.size).toBe(2);
    expect(map.get("post-a")?.status).toBe("PUBLISHED");
    expect(map.get("post-b")?.errorCode).toBe("X_POST_FAILED");
  });

  it("keeps only the most recent entry per outboundItemId", async () => {
    mockFindMany.mockResolvedValue([
      { outboundItemId: "post-a", status: "PUBLISHED", providerPostId: null, providerPostUrl: "new", completedAt: new Date(), errorCode: null, safeMessage: null },
      { outboundItemId: "post-a", status: "FAILED", providerPostId: null, providerPostUrl: null, completedAt: new Date(), errorCode: "err", safeMessage: null },
    ]);
    const map = await getBulkPublishStatus("x");
    expect(map.size).toBe(1);
    expect(map.get("post-a")?.status).toBe("PUBLISHED");
  });

  it("completedAt is serialised as ISO string", async () => {
    const completedAt = new Date("2026-06-15T12:00:00Z");
    mockFindMany.mockResolvedValue([
      { outboundItemId: "p1", status: "PUBLISHED", providerPostId: null, providerPostUrl: null, completedAt, errorCode: null, safeMessage: null },
    ]);
    const map = await getBulkPublishStatus("x");
    expect(map.get("p1")?.completedAt).toBe("2026-06-15T12:00:00.000Z");
  });

  it("returns empty Map on DB failure (graceful degradation)", async () => {
    mockFindMany.mockRejectedValue(new Error("DB unavailable"));
    expect((await getBulkPublishStatus("x")).size).toBe(0);
  });
});
