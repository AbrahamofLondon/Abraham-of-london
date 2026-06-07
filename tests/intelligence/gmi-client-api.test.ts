/**
 * P10 — Client API Foundation Tests
 * Read-only, public-safe. No private fields. Provenance included. Rate limit headers present.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the data service
vi.mock("@/lib/intelligence/gmi-data-service.server", () => ({
  getLatestPublishedEditionId: vi.fn().mockResolvedValue("GMI-Q2-2026"),
  getGmiCallLedger: vi.fn().mockResolvedValue({
    data: [
      {
        callId: "call_001",
        editionId: "GMI-Q2-2026",
        editionSlug: "gmi-q2-2026",
        callStatement: "Public call statement",
        category: "macro",
        region: "global",
        assetClass: null,
        theme: null,
        confidenceBand: "medium",
        currentStatus: "PENDING_REVIEW",
        currentScore: null,
        scoreLabel: null,
        lastReviewedAt: null,
        nextReviewDue: null,
        methodologyVersion: "2.1",
        rubricVersion: "3.0",
        reviewedBy: "admin@example.com", // should NOT appear in public response
        justification: "internal justification text", // should NOT appear in public response
        sourceAppendixRefs: ["src_001"], // should NOT appear
        evidenceSummary: "some evidence",
      },
    ],
    provenance: { sourceType: "DB", sourceType2: "DB" },
  }),
  getGmiPerformanceMetrics: vi.fn().mockResolvedValue({
    data: { totalCalls: 8, reviewedCalls: 0 },
    provenance: { sourceType: "DB" },
  }),
  getGmiFalsificationRules: vi.fn().mockResolvedValue({
    data: [
      {
        id: "rule_001",
        editionId: "GMI-Q2-2026",
        thesisId: "thesis_a",
        thesisStatement: "Public thesis",
        falsificationCondition: "Public condition",
        observableIndicator: "Public indicator",
        thresholdType: "qualitative",
        thresholdValue: "50%",
        currentStatus: "monitoring",
        publicExplanation: "Public explanation",
        nextReviewDue: null,
        lastReviewedAt: null,
        adminNotes: "SECRET ADMIN NOTES", // should NOT appear
      },
    ],
    provenance: { sourceType: "DB" },
  }),
  getGmiBoardPulseData: vi.fn().mockResolvedValue({
    data: { summary: "Board pulse summary", signals: [] },
    provenance: { sourceType: "DB" },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gmiReleaseSnapshot: {
      findMany: vi.fn().mockResolvedValue([
        {
          editionId: "GMI-Q2-2026",
          editionSlug: "gmi-q2-2026",
          releaseStatus: "PUBLISHED",
          publishedAt: new Date("2026-06-06T10:00:00Z"),
          createdAt: new Date("2026-06-06T09:00:00Z"),
        },
      ]),
      count: vi.fn().mockResolvedValue(1),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(path: string, params?: Record<string, string>): NextRequest {
  const url = new URL(path, "https://www.abrahamoflondon.org");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url.toString());
}

describe("/api/gmi/editions", () => {
  it("returns 200 with data and provenance", async () => {
    const { GET } = await import("@/app/api/gmi/editions/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("provenance");
    expect(body.provenance).toHaveProperty("generatedAt");
    expect(body.provenance).toHaveProperty("source", "db");
  });

  it("includes Cache-Control and X-RateLimit-Limit headers", async () => {
    const { GET } = await import("@/app/api/gmi/editions/route");
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toContain("public");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
  });
});

describe("/api/gmi/calls", () => {
  it("returns 200 with public call data", async () => {
    const { GET } = await import("@/app/api/gmi/calls/route");
    const req = makeRequest("/api/gmi/calls", { edition: "GMI-Q2-2026" });
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("does NOT include reviewedBy in public response", async () => {
    const { GET } = await import("@/app/api/gmi/calls/route");
    const req = makeRequest("/api/gmi/calls", { edition: "GMI-Q2-2026" });
    const response = await GET(req);
    const body = await response.json();

    if (body.data.length > 0) {
      expect(body.data[0]).not.toHaveProperty("reviewedBy");
      expect(body.data[0]).not.toHaveProperty("justification");
      expect(body.data[0]).not.toHaveProperty("sourceAppendixRefs");
    }
  });

  it("includes provenance metadata", async () => {
    const { GET } = await import("@/app/api/gmi/calls/route");
    const req = makeRequest("/api/gmi/calls", { edition: "GMI-Q2-2026" });
    const response = await GET(req);
    const body = await response.json();
    expect(body.provenance).toHaveProperty("editionId");
    expect(body.provenance).toHaveProperty("generatedAt");
    expect(body.provenance).toHaveProperty("source", "db");
  });

  it("includes rate limit header", async () => {
    const { GET } = await import("@/app/api/gmi/calls/route");
    const req = makeRequest("/api/gmi/calls", { edition: "GMI-Q2-2026" });
    const response = await GET(req);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
  });
});

describe("/api/gmi/falsification", () => {
  it("does NOT include adminNotes in public response", async () => {
    const { GET } = await import("@/app/api/gmi/falsification/route");
    const req = makeRequest("/api/gmi/falsification", { edition: "GMI-Q2-2026" });
    const response = await GET(req);
    const body = await response.json();

    if (body.data.length > 0) {
      expect(body.data[0]).not.toHaveProperty("adminNotes");
    }

    expect(body).toHaveProperty("provenance");
  });
});
