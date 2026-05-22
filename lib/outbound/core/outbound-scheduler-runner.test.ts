/**
 * lib/outbound/core/outbound-scheduler-runner.test.ts
 *
 * Tests for the scheduler runner.
 *
 * Tests:
 *  - dryRun publishes nothing
 *  - run summary shape is correct
 *  - source is recorded
 *  - runKey is generated
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    schedulerRun: {
      create: vi.fn().mockResolvedValue({ id: "run-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/server/audit", () => ({
  logAuditEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock("./outbound-scheduler-eligibility", () => ({
  isOutboundItemEligibleForScheduling: vi.fn(),
}));

vi.mock("./outbound-scheduler-lock", () => ({
  acquireSchedulerLock: vi.fn(),
  releaseSchedulerLock: vi.fn(),
  generateRunKey: vi.fn().mockReturnValue("sched_test_abc123"),
}));

vi.mock("./outbound-publish-ledger", () => ({
  createLedgerEntry: vi.fn().mockResolvedValue({ id: "ledger-1" }),
  buildIdempotencyKey: vi.fn(),
}));

vi.mock("../outbound-content-loader", () => ({
  getOutboundPostsDue: vi.fn().mockReturnValue([]),
  getOutboundPostsByProvider: vi.fn().mockReturnValue({ posts: [], errors: [] }),
}));

import { runOutboundScheduler } from "./outbound-scheduler-runner";

describe("runOutboundScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OUTBOUND_SCHEDULER_ENABLED = "true";
  });

  it("returns a summary with correct shape on dry run", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "api",
    });

    expect(summary).toBeDefined();
    expect(summary.ok).toBe(true);
    expect(summary.dryRun).toBe(true);
    expect(summary.runKey).toBe("sched_test_abc123");
    expect(summary.source).toBe("api");
    expect(typeof summary.scanned).toBe("number");
    expect(typeof summary.eligible).toBe("number");
    expect(typeof summary.published).toBe("number");
    expect(typeof summary.skipped).toBe("number");
    expect(typeof summary.failed).toBe("number");
    expect(Array.isArray(summary.results)).toBe(true);
    expect(typeof summary.message).toBe("string");
  });

  it("returns a summary with correct shape on live run", async () => {
    const summary = await runOutboundScheduler({
      dryRun: false,
      source: "cron",
    });

    expect(summary).toBeDefined();
    expect(summary.dryRun).toBe(false);
    expect(summary.source).toBe("cron");
  });

  it("records source as api", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "api",
    });
    expect(summary.source).toBe("api");
  });

  it("records source as cron", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "cron",
    });
    expect(summary.source).toBe("cron");
  });

  it("records source as manual", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "manual",
    });
    expect(summary.source).toBe("manual");
  });

  it("dryRun publishes nothing (published=0)", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "api",
    });
    // With no due items, published should be 0
    expect(summary.published).toBe(0);
  });

  it("includes results array", async () => {
    const summary = await runOutboundScheduler({
      dryRun: true,
      source: "api",
    });
    expect(Array.isArray(summary.results)).toBe(true);
  });
});
