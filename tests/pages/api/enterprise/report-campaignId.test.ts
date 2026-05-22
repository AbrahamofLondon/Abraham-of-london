/**
 * tests/pages/api/enterprise/report-campaignId.test.ts
 *
 * Proves: /api/enterprise/report/[campaignId] auth, validation, error taxonomy,
 * raw error suppression, and cohort gate response shape.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockRequireAdminServer, mockRunEnterprisePipeline } = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockRunEnterprisePipeline: vi.fn(),
}));

vi.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: mockRequireAdminServer,
}));

vi.mock("@/lib/alignment/enterprise-pipeline", () => ({
  runEnterprisePipeline: mockRunEnterprisePipeline,
}));

// ── helpers ────────────────────────────────────────────────────────────────────

function makeReq(campaignId: string | undefined, method = "GET"): NextApiRequest {
  return {
    method,
    query: campaignId !== undefined ? { campaignId } : {},
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as NextApiRequest;
}

function makeRes() {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string> = {};
  const res = {
    status(code: number) { statusCode = code; return res; },
    json(data: unknown) { body = data; return res; },
    setHeader(k: string, v: string) { headers[k] = v; return res; },
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
  return res as unknown as NextApiResponse & typeof res;
}

const MOCK_REPORT = {
  metadata: { campaignId: "campaign-001", organisationId: "org-001", participantCount: 6, generatedAt: new Date().toISOString(), organisationName: "Org", campaignTitle: "Test", auditID: "OGR-CAM001" },
  scores: { overall: 72, band: "DRIFTING", dissonanceArea: 600, fragility: "LOW", confidenceScore: 75, completionRate: 80 },
  domainPerformance: [],
  varianceScores: [],
  findings: [],
  strategicGuidance: "Recalibrate.",
  constitution: { constitutionalInput: {}, constitutionalDecision: { route: "DIAGNOSTIC", confidence: 0.7, disqualifiersTriggered: [], recommendedInterventions: [] }, derived: { executiveSummary: "" } },
  kernel: { graphMetrics: { totalNodes: 1, activeContradictions: 0, accumulatedDepth: "shallow" }, signal: { strength: "MODERATE" }, decision: { required: "Act", blocked: false }, simulation: { horizon30: "", horizon60: "", horizon90: "" } },
  costOfDelay: { narrative: "", monthsToCritical: 6, recoveryMultiplier: 1.5, monthlyDegradation: 2 },
  enforcement: { directive: { action: "ALLOW", reason: "OK", escalation: "CLEAR", recommendedToolkit: null }, signals: [] },
  leadershipGap: null,
  teamSnapshots: [],
};

// ── tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/enterprise/report/[campaignId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001", "POST"), res as any);
    expect(res.getStatusCode()).toBe(405);
  });

  it("does not call pipeline when unauthenticated", async () => {
    mockRequireAdminServer.mockResolvedValue(null);
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(mockRunEnterprisePipeline).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_CAMPAIGN_ID for empty campaignId", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq(""), res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_CAMPAIGN_ID");
  });

  it("returns 400 INVALID_CAMPAIGN_ID for path-traversal attempt", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("../../../secret"), res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_CAMPAIGN_ID");
  });

  it("returns 404 for CAMPAIGN_NOT_FOUND pipeline result", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockRunEnterprisePipeline.mockResolvedValue({ ok: false, reason: "CAMPAIGN_NOT_FOUND" });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(404);
    expect((res.getBody() as any).error).toBe("CAMPAIGN_NOT_FOUND");
  });

  it("returns 422 with participantCount for COHORT_TOO_SMALL", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockRunEnterprisePipeline.mockResolvedValue({ ok: false, reason: "COHORT_TOO_SMALL", participantCount: 3 });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(422);
    const body = res.getBody() as any;
    expect(body.error).toBe("COHORT_TOO_SMALL");
    expect(body.participantCount).toBe(3);
  });

  it("returns 500 INTERNAL_ERROR and does NOT forward raw detail on PIPELINE_ERROR", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockRunEnterprisePipeline.mockResolvedValue({
      ok: false,
      reason: "PIPELINE_ERROR",
      detail: "PrismaClientKnownRequestError: Connection refused at neon.tech",
    });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(500);
    const serialized = JSON.stringify(res.getBody());
    expect(serialized).not.toContain("PrismaClient");
    expect(serialized).not.toContain("neon.tech");
    expect(serialized).not.toContain("Connection refused");
  });

  it("returns 500 INTERNAL_ERROR when pipeline throws unexpectedly", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockRunEnterprisePipeline.mockRejectedValue(new Error("Unexpected crash"));
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(500);
    expect((res.getBody() as any).error).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.getBody())).not.toContain("Unexpected crash");
  });

  it("returns 200 with report on success", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockRunEnterprisePipeline.mockResolvedValue({ ok: true, report: MOCK_REPORT });
    const { default: handler } = await import("@/pages/api/enterprise/report/[campaignId]");
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(200);
    expect((res.getBody() as any).metadata.campaignId).toBe("campaign-001");
  });
});
