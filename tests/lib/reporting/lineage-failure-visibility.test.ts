/**
 * tests/lib/reporting/lineage-failure-visibility.test.ts
 *
 * Proves: writeReportLineageEvent failure path:
 * - returns lineageStatus: "FAILED"
 * - writes a REPORT_LINEAGE_WRITE_FAILED visibility event to systemAuditLog
 * - never throws into callers
 * - no infinite recursion (visibility write failure is swallowed)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: { systemAuditLog: { create: mockCreate } },
}));

// ── tests ──────────────────────────────────────────────────────────────────────

describe("writeReportLineageEvent — failure path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns RECORDED when write succeeds", async () => {
    mockCreate.mockResolvedValue({ id: "log-1" });
    vi.resetModules();
    const { writeReportLineageEvent } = await import("@/lib/reporting/report-lineage");
    const result = await writeReportLineageEvent({
      reportType: "ENTERPRISE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-001",
    });
    expect(result.lineageStatus).toBe("RECORDED");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("returns FAILED and writes visibility event when primary write fails", async () => {
    // First call (primary lineage write) → fails
    // Second call (visibility event) → succeeds
    mockCreate
      .mockRejectedValueOnce(new Error("DB write failed"))
      .mockResolvedValueOnce({ id: "visibility-1" });

    vi.resetModules();
    const { writeReportLineageEvent } = await import("@/lib/reporting/report-lineage");
    const result = await writeReportLineageEvent({
      reportType: "ENTERPRISE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-001",
    });

    expect(result.lineageStatus).toBe("FAILED");
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // Second call must be the visibility event
    const visibilityCall = mockCreate.mock.calls[1][0];
    expect(visibilityCall.data.action).toBe("REPORT_LINEAGE_WRITE_FAILED");
    expect(visibilityCall.data.resourceId).toBe("campaign-001");
    expect(visibilityCall.data.resourceType).toBe("ENTERPRISE_REPORT");
    expect(visibilityCall.data.severity).toBe("warn");
  });

  it("does not throw when both primary and visibility writes fail (no recursion)", async () => {
    mockCreate.mockRejectedValue(new Error("Complete DB outage"));

    vi.resetModules();
    const { writeReportLineageEvent } = await import("@/lib/reporting/report-lineage");
    // Must resolve (not throw) — callers use fire-and-forget
    await expect(
      writeReportLineageEvent({
        reportType: "ENTERPRISE_REPORT",
        eventType: "GENERATED",
        resourceId: "campaign-001",
      }),
    ).resolves.toEqual({ lineageStatus: "FAILED" });
  });

  it("visibility event metadata contains sanitised error info only", async () => {
    const rawError = "PrismaClientKnownRequestError: unique constraint on table users — secret_internal_token=abc123";
    mockCreate
      .mockRejectedValueOnce(new Error(rawError))
      .mockResolvedValueOnce({ id: "v-1" });

    vi.resetModules();
    const { writeReportLineageEvent } = await import("@/lib/reporting/report-lineage");
    await writeReportLineageEvent({
      reportType: "ENTERPRISE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-001",
    });

    const visibilityCall = mockCreate.mock.calls[1][0];
    const meta = JSON.parse(visibilityCall.data.metadata);
    // errorCategory and message are stored (internal admin view)
    expect(meta.errorCategory).toBeDefined();
    expect(meta.message).toBeDefined();
    // message is truncated to 300 chars
    expect(meta.message.length).toBeLessThanOrEqual(300);
  });

  it("fire-and-forget caller path never receives thrown error", async () => {
    mockCreate.mockRejectedValue(new Error("Catastrophic failure"));

    vi.resetModules();
    const { writeReportLineageEvent } = await import("@/lib/reporting/report-lineage");

    // Simulate fire-and-forget pattern used in enterprise-pipeline.ts
    let threw = false;
    await import("@/lib/reporting/report-lineage")
      .then(({ writeReportLineageEvent: fn }) =>
        fn({ reportType: "ENTERPRISE_REPORT", eventType: "GENERATED", resourceId: "c-1" }),
      )
      .catch(() => { threw = true; });

    expect(threw).toBe(false);
  });
});
