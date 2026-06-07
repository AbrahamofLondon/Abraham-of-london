/**
 * P10 — Benchmarking Foundation Tests
 * Benchmark claims are gated on actual data. No fiction without rows.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gmiBenchmarkEntry: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  addBenchmarkEntry,
  canShowBenchmarkClaims,
  getBenchmarksByEdition,
} from "@/lib/intelligence/gmi-benchmark-service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("canShowBenchmarkClaims", () => {
  it("returns false when no benchmark rows exist for edition", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(0);
    const result = await canShowBenchmarkClaims("GMI-Q2-2026");
    expect(result).toBe(false);
  });

  it("returns true when at least one benchmark row exists", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(1);
    const result = await canShowBenchmarkClaims("GMI-Q2-2026");
    expect(result).toBe(true);
  });

  it("is edition-specific — Q3 with no rows returns false", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(0);
    const result = await canShowBenchmarkClaims("GMI-Q3-2026");
    expect(result).toBe(false);
  });
});

describe("addBenchmarkEntry", () => {
  it("creates a benchmark entry linked to a call", async () => {
    const mockEntry = {
      id: "bench_001",
      editionId: "GMI-Q2-2026",
      callId: "call_abc",
      benchmarkType: "consensus_forecast",
      providerName: "Manual",
      benchmarkStatement: "Analyst consensus: market will reprice by Q3",
      benchmarkValue: "65%",
      actualValue: null,
      gmiValue: "70%",
      evaluationWindow: "Q2-2026",
      resultSummary: null,
      sourceReference: "Manual entry — pending verification",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiBenchmarkEntry.create).mockResolvedValueOnce(mockEntry as any);

    const result = await addBenchmarkEntry({
      editionId: "GMI-Q2-2026",
      callId: "call_abc",
      benchmarkType: "consensus_forecast",
      providerName: "Manual",
      benchmarkStatement: "Analyst consensus: market will reprice by Q3",
      benchmarkValue: "65%",
      gmiValue: "70%",
      evaluationWindow: "Q2-2026",
      sourceReference: "Manual entry — pending verification",
    });

    expect(result.editionId).toBe("GMI-Q2-2026");
    expect(result.callId).toBe("call_abc");
  });

  it("callId can be null (edition-level benchmark)", async () => {
    const mockEntry = {
      id: "bench_002",
      editionId: "GMI-Q2-2026",
      callId: null, // edition-level, not tied to specific call
      benchmarkType: "market_estimate",
      providerName: "Manual",
      benchmarkStatement: "Edition-level benchmark",
      benchmarkValue: null,
      actualValue: null,
      gmiValue: null,
      evaluationWindow: "Q2-2026",
      resultSummary: null,
      sourceReference: "Manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiBenchmarkEntry.create).mockResolvedValueOnce(mockEntry as any);

    const result = await addBenchmarkEntry({
      editionId: "GMI-Q2-2026",
      callId: null,
      benchmarkType: "market_estimate",
      providerName: "Manual",
      benchmarkStatement: "Edition-level benchmark",
      evaluationWindow: "Q2-2026",
      sourceReference: "Manual",
    });

    expect(result.callId).toBeNull();
    expect(result.benchmarkStatement).toBe("Edition-level benchmark");
  });
});

describe("getBenchmarksByEdition", () => {
  it("returns array of benchmark entries", async () => {
    const mockEntries = [
      { id: "bench_001", editionId: "GMI-Q2-2026", callId: null },
      { id: "bench_002", editionId: "GMI-Q2-2026", callId: "call_abc" },
    ];
    vi.mocked(prisma.gmiBenchmarkEntry.findMany).mockResolvedValueOnce(
      mockEntries as any
    );

    const result = await getBenchmarksByEdition("GMI-Q2-2026");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("returns empty array when no entries exist", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.findMany).mockResolvedValueOnce([]);
    const result = await getBenchmarksByEdition("GMI-Q3-2026");
    expect(result).toEqual([]);
  });
});
