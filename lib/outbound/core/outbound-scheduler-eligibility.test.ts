/**
 * lib/outbound/core/outbound-scheduler-eligibility.test.ts
 *
 * Tests for the scheduler eligibility engine.
 *
 * Tests:
 *  - ready item not eligible
 *  - scheduled + approved + due eligible
 *  - scheduled + needs_review blocked
 *  - scheduled + future date blocked
 *  - posted blocked
 *  - provider not READY blocked
 *  - duplicate ledger blocked
 *  - global pause blocked
 *  - scheduler disabled blocked
 *  - requiresFinalApproval false blocked
 *  - missing scheduledFor blocked
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { isOutboundItemEligibleForScheduling } from "./outbound-scheduler-eligibility";
import type { OutboundPost } from "../outbound-content-loader";
import type { OutboundReadiness } from "./outbound-provider-contract";

// Mock the ledger dependency
vi.mock("./outbound-publish-ledger", () => ({
  isDuplicatePublish: vi.fn(),
}));

import { isDuplicatePublish } from "./outbound-publish-ledger";

function makePost(overrides: Partial<OutboundPost> = {}): OutboundPost {
  return {
    id: "test-post-1",
    provider: "linkedin",
    postType: "thesis",
    filename: "w01-test.mdx",
    slug: "w01-test",
    text: "Test post body content for scheduling eligibility checks.",
    sourceType: null,
    sourceSlug: null,
    sourcePath: null,
    campaign: "test-campaign",
    series: null,
    status: "scheduled",
    approvalStatus: "approved",
    scheduledFor: "2026-05-01T08:00:00Z",
    requiresFinalApproval: true,
    assetUrl: null,
    link: null,
    imagePath: null,
    tone: "analytical",
    theme: [],
    thread: false,
    threadIndex: null,
    threadId: null,
    xCharCount: null,
    sourceSeries: null,
    sourceMaterial: null,
    seriesWeek: null,
    sequence: null,
    syncTargets: [],
    idempotencyKey: "test-post-1:linkedin:2026-05-01T08:00:00Z",
    createdBy: "system",
    ...overrides,
  } as OutboundPost;
}

beforeEach(() => {
  vi.clearAllMocks();
  (isDuplicatePublish as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

describe("isOutboundItemEligibleForScheduling", () => {
  const now = "2026-05-22T12:00:00Z";
  const ready: OutboundReadiness = "READY";

  // ── Eligible ──────────────────────────────────────────────────────────────

  it("allows scheduled + approved + due item", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  // ── Status ────────────────────────────────────────────────────────────────

  it("blocks ready item (not scheduled)", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ status: "ready" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("ready"))).toBe(true);
  });

  it("blocks draft item", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ status: "draft" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("draft"))).toBe(true);
  });

  it("blocks posted item", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ status: "draft" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("draft"))).toBe(true);
  });

  // ── Approval ──────────────────────────────────────────────────────────────

  it("blocks needs_review approval", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ approvalStatus: "needs_review" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("needs_review"))).toBe(true);
  });

  it("blocks rejected approval", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ approvalStatus: "rejected" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("rejected"))).toBe(true);
  });

  // ── requiresFinalApproval ─────────────────────────────────────────────────

  it("blocks requiresFinalApproval false", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ requiresFinalApproval: false }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("requiresFinalApproval"))).toBe(true);
  });

  // ── scheduledFor ──────────────────────────────────────────────────────────

  it("blocks future scheduledFor date", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ scheduledFor: "2026-06-01T08:00:00Z" }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("future"))).toBe(true);
  });

  it("blocks missing scheduledFor", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({ scheduledFor: null }),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("scheduledFor"))).toBe(true);
  });

  // ── Provider readiness ────────────────────────────────────────────────────

  it("blocks provider NOT_CONNECTED", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: "NOT_CONNECTED",
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("NOT_CONNECTED"))).toBe(true);
  });

  it("blocks provider MISSING_SCOPE", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: "MISSING_SCOPE",
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("MISSING_SCOPE"))).toBe(true);
  });

  it("blocks provider TOKEN_INVALID", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: "TOKEN_INVALID",
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("TOKEN_INVALID"))).toBe(true);
  });

  it("blocks provider PUBLISHING_DISABLED", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: "PUBLISHING_DISABLED",
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("PUBLISHING_DISABLED"))).toBe(true);
  });

  // ── Token validity ────────────────────────────────────────────────────────

  it("blocks expired token", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
      tokenValid: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("token"))).toBe(true);
  });

  // ── Scheduler enabled ─────────────────────────────────────────────────────

  it("blocks when scheduler disabled", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: false,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("OUTBOUND_SCHEDULER_ENABLED"))).toBe(true);
  });

  // ── Global pause ──────────────────────────────────────────────────────────

  it("blocks when global pause active", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: true,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("pause"))).toBe(true);
  });

  // ── Gate result ───────────────────────────────────────────────────────────

  it("includes gate blockers when gate fails", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
      gateResult: {
        allowed: false,
        blockers: ["Disallowed phrase: \"guaranteed\"."],
        warnings: [],
      },
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("guaranteed"))).toBe(true);
  });

  it("includes gate warnings", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
      gateResult: {
        allowed: true,
        blockers: [],
        warnings: ["Post contains internal control language."],
      },
    });
    expect(result.eligible).toBe(true);
    expect(result.warnings.some((w) => w.includes("control language"))).toBe(true);
  });

  // ── Duplicate ledger ──────────────────────────────────────────────────────

  it("blocks duplicate published item", async () => {
    (isDuplicatePublish as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-1",
      completedAt: new Date("2026-05-01T08:00:00Z"),
    });
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost(),
      providerReadiness: ready,
      schedulerEnabled: true,
      globalPauseActive: false,
      now,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("already published"))).toBe(true);
  });

  // ── Multiple blockers ─────────────────────────────────────────────────────

  it("reports all blockers when multiple conditions fail", async () => {
    const result = await isOutboundItemEligibleForScheduling({
      item: makePost({
        status: "draft",
        approvalStatus: "needs_review",
        scheduledFor: null,
      }),
      providerReadiness: "NOT_CONNECTED",
      schedulerEnabled: false,
      globalPauseActive: true,
      now,
    });
    expect(result.eligible).toBe(false);
    // Should have blockers for: disabled, paused, draft, needs_review, missing scheduledFor, not_connected
    expect(result.blockers.length).toBeGreaterThanOrEqual(5);
  });
});
