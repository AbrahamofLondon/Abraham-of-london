/**
 * tests/pages/api/cases/benchmark-context.test.ts
 *
 * Route-level tests for GET /api/cases/benchmark-context.
 *
 * Strategy: mock prisma.$queryRaw and prisma.benchmarkAggregate.findUnique
 * to avoid DB access. Tests cover method validation, input sanitisation,
 * availability tiers, and public response field leakage.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  aggregateRowToBenchmarkContext,
  type BenchmarkAggregateRow,
} from "@/lib/product/benchmark-context-aggregate";
import { BENCHMARK_MIN_N } from "@/lib/product/outcome-contribution-contract";

// ─── Mock prisma ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    benchmarkAggregate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// ─── Import handler and mocked prisma after mocking ──────────────────────────

const { prisma } = await import("@/lib/prisma");
const { default: handler } = await import("@/pages/api/cases/benchmark-context");

// ─── Test helpers ─────────────────────────────────────────────────────────────

function zeroRow(overrides: Partial<BenchmarkAggregateRow> = {}): BenchmarkAggregateRow {
  return {
    assessmentKind: null,
    total: 0, improved: 0, resolved: 0, unchanged: 0, worsened: 0, abandoned: 0,
    immediate: 0, short: 0, medium: 0, long: 0, didNotAct: 0,
    findingAccurateTotal: 0, findingAccurateTrue: 0,
    recommendationUsefulTotal: 0, recommendationUsefulTrue: 0,
    ...overrides,
  };
}

function populatedRawRow(n: number, kind: string | null = null): Record<string, unknown> {
  return {
    assessmentKind: kind,
    total: n,
    improved: Math.floor(n * 0.4),
    resolved: Math.floor(n * 0.2),
    unchanged: Math.floor(n * 0.2),
    worsened: Math.floor(n * 0.1),
    abandoned: Math.floor(n * 0.1),
    immediate: Math.floor(n * 0.3),
    short: Math.floor(n * 0.4),
    medium: Math.floor(n * 0.2),
    long: Math.floor(n * 0.05),
    didNotAct: Math.floor(n * 0.05),
    findingAccurateTotal: n,
    findingAccurateTrue: Math.floor(n * 0.75),
    recommendationUsefulTotal: n,
    recommendationUsefulTrue: Math.floor(n * 0.70),
  };
}

// Stale timestamp (2 hours ago)
const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
// Fresh timestamp (10 minutes ago)
const freshDate = new Date(Date.now() - 10 * 60 * 1000);

function makePrismaAggregateRecord(n: number, computedAt: Date, kind: string | null = null) {
  const row = populatedRawRow(n, kind);
  return {
    key: kind ?? "__ALL__",
    assessmentKind: kind,
    n,
    improved: row.improved, resolved: row.resolved, unchanged: row.unchanged,
    worsened: row.worsened, abandoned: row.abandoned,
    timeImmediate: row.immediate, timeShort: row.short, timeMedium: row.medium,
    timeLong: row.long, timeDidNotAct: row.didNotAct,
    findingAccurateTotal: row.findingAccurateTotal, findingAccurateTrue: row.findingAccurateTrue,
    recommendationUsefulTotal: row.recommendationUsefulTotal, recommendationUsefulTrue: row.recommendationUsefulTrue,
    computedAt,
    createdAt: computedAt,
    updatedAt: computedAt,
    id: "test-id",
  };
}

function makeReq(
  method: string = "GET",
  query: Record<string, string> = {},
) {
  return { method, query } as unknown as import("next").NextApiRequest;
}

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn((k: string, v: string) => { headers[k] = v; }),
    _headers: headers,
  };
  return res as unknown as import("next").NextApiResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no cached aggregate (cache miss → run SQL)
  (prisma.benchmarkAggregate.findUnique as Mock).mockResolvedValue(null);
  // Default: SQL returns empty
  (prisma.$queryRaw as Mock).mockResolvedValue([]);
  // Default: upsert succeeds silently
  (prisma.benchmarkAggregate.upsert as Mock).mockResolvedValue({});
});

// ─── Method validation ────────────────────────────────────────────────────────

describe("Method validation", () => {
  it("rejects POST with 405", async () => {
    const req = makeReq("POST");
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("rejects DELETE with 405", async () => {
    const req = makeReq("DELETE");
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("accepts GET", async () => {
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── assessmentKind sanitisation ─────────────────────────────────────────────

describe("assessmentKind sanitisation", () => {
  it("passes valid assessmentKind through", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET", { assessmentKind: "FAST_DIAGNOSTIC" });
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { filter: { assessmentKind: string | null } };
    expect(body.filter.assessmentKind).toBe("FAST_DIAGNOSTIC");
  });

  it("rejects SQL injection attempt — sanitises to null, runs safe parameterised query", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET", { assessmentKind: "'; DROP TABLE users; --" });
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { filter: { assessmentKind: string | null }; ok: boolean };
    // Invalid value is sanitised to null — raw string never reaches SQL
    expect(body.filter.assessmentKind).toBeNull();
    // Request succeeds — the safe parameterised query ran with null filter
    expect(body.ok).toBe(true);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects lowercase assessmentKind", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET", { assessmentKind: "fast_diagnostic" });
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { filter: { assessmentKind: string | null } };
    expect(body.filter.assessmentKind).toBeNull();
  });

  it("treats empty string as null filter", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET", { assessmentKind: "" });
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { filter: { assessmentKind: string | null } };
    expect(body.filter.assessmentKind).toBeNull();
  });
});

// ─── NO_DATA: empty contributions ────────────────────────────────────────────

describe("NO_DATA — no contributions", () => {
  it("returns availability=NO_DATA when SQL returns empty", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { availability: string } };
    expect(body.benchmark.availability).toBe("NO_DATA");
  });

  it("does not expose rates when NO_DATA", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { improvementRate: unknown; findingAccuracyRate: unknown } };
    expect(body.benchmark.improvementRate).toBeNull();
    expect(body.benchmark.findingAccuracyRate).toBeNull();
  });
});

// ─── BUILDING: below threshold ────────────────────────────────────────────────

describe("BUILDING — below threshold", () => {
  it("returns availability=BUILDING when total < 50", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(30)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { availability: string; n: number } };
    expect(body.benchmark.availability).toBe("BUILDING");
    expect(body.benchmark.n).toBe(30);
  });

  it("does not expose rates when BUILDING", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(BENCHMARK_MIN_N - 1)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { improvementRate: unknown } };
    expect(body.benchmark.improvementRate).toBeNull();
  });
});

// ─── AVAILABLE: at or above threshold ────────────────────────────────────────

describe("AVAILABLE — at or above threshold", () => {
  it("returns availability=AVAILABLE when total >= 50", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(BENCHMARK_MIN_N)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { availability: string } };
    expect(body.benchmark.availability).toBe("AVAILABLE");
  });

  it("includes non-null improvementRate when AVAILABLE", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { improvementRate: number | null } };
    expect(typeof body.benchmark.improvementRate).toBe("number");
  });

  it("includes sourceLabel and disclaimer always", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { sourceLabel: string; disclaimer: string } };
    expect(body.benchmark.sourceLabel).toBeTruthy();
    expect(body.benchmark.disclaimer).toBeTruthy();
  });

  it("merges multiple kind rows into a global total", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([
      populatedRawRow(60, "FAST_DIAGNOSTIC"),
      populatedRawRow(40, "EXECUTIVE_REPORTING"),
    ]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { n: number; availability: string } };
    expect(body.benchmark.n).toBe(100);
    expect(body.benchmark.availability).toBe("AVAILABLE");
  });
});

// ─── Materialised cache: hit ──────────────────────────────────────────────────

describe("Cache hit — fresh materialised row", () => {
  it("serves from BenchmarkAggregate without running SQL", async () => {
    (prisma.benchmarkAggregate.findUnique as Mock).mockResolvedValue(
      makePrismaAggregateRecord(100, freshDate),
    );
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns AVAILABLE from fresh cached row", async () => {
    (prisma.benchmarkAggregate.findUnique as Mock).mockResolvedValue(
      makePrismaAggregateRecord(100, freshDate),
    );
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { availability: string } };
    expect(body.benchmark.availability).toBe("AVAILABLE");
  });
});

// ─── Materialised cache: stale ────────────────────────────────────────────────

describe("Cache miss/stale — runs SQL aggregate", () => {
  it("runs SQL when cached row is stale", async () => {
    (prisma.benchmarkAggregate.findUnique as Mock).mockResolvedValue(
      makePrismaAggregateRecord(100, staleDate),
    );
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(120)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns fresh SQL result when cache is stale", async () => {
    (prisma.benchmarkAggregate.findUnique as Mock).mockResolvedValue(
      makePrismaAggregateRecord(100, staleDate),
    );
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(120)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as { benchmark: { n: number } };
    expect(body.benchmark.n).toBe(120);
  });
});

// ─── Leakage guard ───────────────────────────────────────────────────────────

describe("Leakage guard — no individual data in response", () => {
  it("response body does not contain email", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const json = JSON.stringify((res.json as Mock).mock.calls[0][0]);
    expect(json).not.toContain("email");
  });

  it("response body does not contain caseId", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("caseId");
  });

  it("response body does not contain actorId", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("actorId");
  });

  it("response body does not contain contributionId", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("contributionId");
  });

  it("response body does not contain decisionText or rawDecision", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([populatedRawRow(100)]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    const body = (res.json as Mock).mock.calls[0][0] as Record<string, unknown>;
    const json = JSON.stringify(body);
    expect(json).not.toContain("decisionText");
    expect(json).not.toContain("rawDecision");
  });
});

// ─── HTTP headers ────────────────────────────────────────────────────────────

describe("HTTP caching headers", () => {
  it("sets Cache-Control to public, max-age=3600", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("max-age=3600"),
    );
  });

  it("sets Vary header", async () => {
    (prisma.$queryRaw as Mock).mockResolvedValue([]);
    const req = makeReq("GET");
    const res = makeRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Vary", expect.any(String));
  });
});
