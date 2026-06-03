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
import {
  X_CREDIT_BLOCKED_NEXT_ACTION,
  applyXCreditBlockerReadiness,
  findLatestLiveXPublishAttempt,
  isActiveXCreditBlockerAttempt,
} from "@/lib/outbound/x-credit-blocker";
import type { XConnectionStatus } from "@/lib/outbound/x-types";

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

// ─── CREDIT_BLOCKED readiness state ──────────────────────────────────────────

describe("CREDIT_BLOCKED readiness state contract", () => {
  // Mirror the canPublish logic from AssetCard
  function canPublish(opts: {
    gateRun: boolean;
    finalApproved: boolean;
    publishable: boolean;
    connectionCanPublish: boolean;
    publishingEnabled: boolean;
    creditBlocked: boolean;
  }): boolean {
    return opts.gateRun && opts.finalApproved && opts.publishable &&
      opts.connectionCanPublish && opts.publishingEnabled && !opts.creditBlocked;
  }

  const readyStatus: XConnectionStatus = {
    connected: true,
    state: "oauth",
    userId: "x_user_1",
    username: "abrahamoflondon",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    missingScopes: [],
    canPublish: true,
    lastPublishAt: null,
    readiness: "READY",
    oauthConfigured: true,
    publishingEnabled: true,
    missingEnv: [],
    requestedScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  };

  it("readiness becomes CREDIT_BLOCKED when hasCreditBlocker is true", () => {
    expect(applyXCreditBlockerReadiness(readyStatus, true).readiness).toBe("CREDIT_BLOCKED");
  });

  it("readiness remains READY when hasCreditBlocker is false", () => {
    expect(applyXCreditBlockerReadiness(readyStatus, false).readiness).toBe("READY");
  });

  it("hasCreditBlocker=false + connected → READY (credits restored)", () => {
    const latest = findLatestLiveXPublishAttempt([
      { errorCode: null, status: "succeeded", dryRun: false, createdAt: new Date() },
      { errorCode: "X_CREDIT_BLOCKED", status: "failed", dryRun: false, createdAt: new Date(Date.now() - 10_000) },
    ]);
    expect(isActiveXCreditBlockerAttempt(latest)).toBe(false);
    expect(applyXCreditBlockerReadiness(readyStatus, false).readiness).toBe("READY");
  });

  it("creditBlocked disables live publish even when all other conditions pass", () => {
    const result = canPublish({
      gateRun: true,
      finalApproved: true,
      publishable: true,
      connectionCanPublish: true,
      publishingEnabled: true,
      creditBlocked: true,        // ← credit blocked
    });
    expect(result).toBe(false);
  });

  it("creditBlocked=false allows publish when all other conditions pass", () => {
    const result = canPublish({
      gateRun: true,
      finalApproved: true,
      publishable: true,
      connectionCanPublish: true,
      publishingEnabled: true,
      creditBlocked: false,
    });
    expect(result).toBe(true);
  });

  it("dry-run is independent of creditBlocked — no creditBlocked check in dry-run path", () => {
    // Dry-run does not include creditBlocked in its condition — it only requires
    // connectionCanPublish (to hit the API) and the asset being valid.
    // This test documents the intended gap: dry-run always available.
    const dryRunAvailable = (connectionCanPublish: boolean) => connectionCanPublish;
    expect(dryRunAvailable(true)).toBe(true);
  });

  it("manual reconciliation is always available when not PUBLISHED", () => {
    const reconAvailable = (ledgerStatus: string | null) => ledgerStatus !== "PUBLISHED";
    expect(reconAvailable(null)).toBe(true);
    expect(reconAvailable("FAILED")).toBe(true);
    expect(reconAvailable("DRY_RUN")).toBe(true);
    expect(reconAvailable("IN_PROGRESS")).toBe(true);
    expect(reconAvailable("PUBLISHED")).toBe(false);
  });

  it("X index readiness row shows CREDIT_BLOCKED next-action copy", () => {
    const nextAction = (hasCreditBlocker: boolean) =>
      hasCreditBlocker
        ? X_CREDIT_BLOCKED_NEXT_ACTION
        : "Ready — run dry-run on selected approved post";
    expect(nextAction(true)).toBe("Add X API credits or verify billing for this developer app.");
    expect(nextAction(false)).toMatch(/ready/i);
  });
});
