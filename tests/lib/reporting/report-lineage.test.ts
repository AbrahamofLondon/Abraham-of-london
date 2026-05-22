/**
 * tests/lib/reporting/report-lineage.test.ts
 *
 * Acceptance tests for Brief 3: Report Lineage & Chain-of-Custody Layer.
 * Verifies: write creates correct audit log, read returns events in order,
 * privacy sanitisation, admin vs client views.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockCreate, mockFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    systemAuditLog: {
      create: mockCreate,
      findMany: mockFindMany,
    },
  },
}));

// ── imports (after mocks) ─────────────────────────────────────────────────────

import {
  writeReportLineageEvent,
  getReportLineage,
  getAdminReportLineage,
  type WriteLineageInput,
} from "@/lib/reporting/report-lineage";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<{
  id: string;
  action: string;
  actorEmail: string | null;
  metadata: string | null;
  createdAt: Date;
}> = {}) {
  return {
    id: "log-abc-123",
    action: "REPORT_GENERATED",
    actorEmail: "jane.doe@example.com",
    metadata: JSON.stringify({ reportType: "EXECUTIVE_REPORT", version: "1" }),
    createdAt: new Date("2026-05-22T10:00:00Z"),
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("writeReportLineageEvent", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("creates a systemAuditLog row with REPORT_ prefixed action", async () => {
    mockCreate.mockResolvedValue({});
    const input: WriteLineageInput = {
      reportType: "EXECUTIVE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-001",
      version: "1",
    };
    await writeReportLineageEvent(input);

    expect(mockCreate).toHaveBeenCalledOnce();
    const { data } = mockCreate.mock.calls[0][0];
    expect(data.action).toBe("REPORT_GENERATED");
    expect(data.resourceId).toBe("campaign-001");
    expect(data.resourceType).toBe("EXECUTIVE_REPORT");
    expect(data.severity).toBe("info");
    expect(data.status).toBe("success");
    expect(data.actorType).toBe("system");
  });

  it("stores version and reportType inside metadata JSON", async () => {
    mockCreate.mockResolvedValue({});
    await writeReportLineageEvent({
      reportType: "ENTERPRISE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-002",
      version: "2",
      metadata: { format: "json" },
    });

    const { data } = mockCreate.mock.calls[0][0];
    const meta = JSON.parse(data.metadata);
    expect(meta.reportType).toBe("ENTERPRISE_REPORT");
    expect(meta.version).toBe("2");
    expect(meta.format).toBe("json");
  });

  it("uses severity 'warn' for REVOKED events", async () => {
    mockCreate.mockResolvedValue({});
    await writeReportLineageEvent({
      reportType: "EXECUTIVE_REPORT",
      eventType: "REVOKED",
      resourceId: "key-xyz",
    });

    const { data } = mockCreate.mock.calls[0][0];
    expect(data.severity).toBe("warn");
  });

  it("stores actorId and marks actorType 'admin' when actorId provided", async () => {
    mockCreate.mockResolvedValue({});
    await writeReportLineageEvent({
      reportType: "EXECUTIVE_REPORT",
      eventType: "VIEWED",
      resourceId: "campaign-003",
      actorId: "user-admin-1",
      actorEmail: "admin@example.com",
    });

    const { data } = mockCreate.mock.calls[0][0];
    expect(data.actorId).toBe("user-admin-1");
    expect(data.actorEmail).toBe("admin@example.com");
    expect(data.actorType).toBe("admin");
  });

  it("does not throw when prisma.create rejects (fire-and-forget contract)", async () => {
    mockCreate.mockRejectedValue(new Error("DB connection error"));
    await expect(
      writeReportLineageEvent({
        reportType: "EXECUTIVE_REPORT",
        eventType: "EXPORTED",
        resourceId: "campaign-004",
      })
    ).resolves.not.toThrow();
  });

  it("returns lineageStatus RECORDED on success", async () => {
    mockCreate.mockResolvedValue({});
    const result = await writeReportLineageEvent({
      reportType: "EXECUTIVE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-005",
    });
    expect(result.lineageStatus).toBe("RECORDED");
  });

  it("returns lineageStatus FAILED when prisma rejects", async () => {
    mockCreate.mockRejectedValue(new Error("DB unavailable"));
    const result = await writeReportLineageEvent({
      reportType: "EXECUTIVE_REPORT",
      eventType: "GENERATED",
      resourceId: "campaign-006",
    });
    expect(result.lineageStatus).toBe("FAILED");
  });
});

describe("getReportLineage (sanitized=true — client-safe)", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("returns events mapped to LineageEventView shape", async () => {
    mockFindMany.mockResolvedValue([makeRow()]);
    const events = await getReportLineage("campaign-001");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "log-abc-123",
      eventType: "GENERATED",
      version: "1",
      createdAt: "2026-05-22T10:00:00.000Z",
    });
  });

  it("sanitises actor email to show only first char and domain", async () => {
    mockFindMany.mockResolvedValue([makeRow({ actorEmail: "jane.doe@example.com" })]);
    const events = await getReportLineage("campaign-001", { sanitized: true });
    expect(events[0].actor).toBe("j***@example.com");
  });

  it("returns null actor when actorEmail is null", async () => {
    mockFindMany.mockResolvedValue([makeRow({ actorEmail: null })]);
    const events = await getReportLineage("campaign-001");
    expect(events[0].actor).toBeNull();
  });

  it("strips REPORT_ prefix from eventType", async () => {
    mockFindMany.mockResolvedValue([makeRow({ action: "REPORT_EXPORTED" })]);
    const events = await getReportLineage("campaign-001");
    expect(events[0].eventType).toBe("EXPORTED");
  });

  it("returns events in chronological order (asc query)", async () => {
    const rows = [
      makeRow({ id: "log-1", action: "REPORT_CREATED", createdAt: new Date("2026-05-22T08:00:00Z") }),
      makeRow({ id: "log-2", action: "REPORT_GENERATED", createdAt: new Date("2026-05-22T09:00:00Z") }),
      makeRow({ id: "log-3", action: "REPORT_VIEWED", createdAt: new Date("2026-05-22T10:00:00Z") }),
    ];
    mockFindMany.mockResolvedValue(rows);
    const events = await getReportLineage("campaign-001");
    expect(events.map((e) => e.eventType)).toEqual(["CREATED", "GENERATED", "VIEWED"]);
  });

  it("queries with correct resourceId and REPORT_ action filter", async () => {
    mockFindMany.mockResolvedValue([]);
    await getReportLineage("campaign-xyz");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          resourceId: "campaign-xyz",
          action: { startsWith: "REPORT_" },
        },
      })
    );
  });

  it("caps limit at 200", async () => {
    mockFindMany.mockResolvedValue([]);
    await getReportLineage("campaign-001", { limit: 9999 });
    const call = mockFindMany.mock.calls[0][0];
    expect(call.take).toBeLessThanOrEqual(200);
  });

  it("returns empty array when prisma throws", async () => {
    mockFindMany.mockRejectedValue(new Error("connection refused"));
    const events = await getReportLineage("campaign-err");
    expect(events).toEqual([]);
  });
});

describe("getAdminReportLineage (sanitized=false — admin view)", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("exposes full actor email without sanitisation", async () => {
    mockFindMany.mockResolvedValue([makeRow({ actorEmail: "admin@corp.com" })]);
    const events = await getAdminReportLineage("campaign-001");
    expect(events[0].actor).toBe("admin@corp.com");
  });

  it("accepts a custom limit up to 200", async () => {
    mockFindMany.mockResolvedValue([]);
    await getAdminReportLineage("campaign-001", 100);
    const call = mockFindMany.mock.calls[0][0];
    expect(call.take).toBe(100);
  });
});
