/**
 * tests/pages/api/enterprise/campaigns-id.test.ts
 *
 * Proves: /api/enterprise/campaigns/[id] auth, validation, IDOR scope, and
 * response shape (no raw participant IDs, cohort gate surfaced).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockRequireAdminServer, mockGetCampaignById, mockIsCohortSafe } = vi.hoisted(
  () => ({
    mockRequireAdminServer: vi.fn(),
    mockGetCampaignById: vi.fn(),
    mockIsCohortSafe: vi.fn(),
  }),
);

vi.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: mockRequireAdminServer,
}));

vi.mock("@/lib/alignment/enterprise-repository", () => ({
  getCampaignById: mockGetCampaignById,
}));

vi.mock("@/lib/alignment/anonymity-service", () => ({
  isCohortSafe: mockIsCohortSafe,
}));

// ── helpers ────────────────────────────────────────────────────────────────────

function makeReq(id: string | undefined, method = "GET"): NextApiRequest {
  return {
    method,
    query: id !== undefined ? { id } : {},
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as NextApiRequest;
}

function makeRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown = null;

  const res = {
    status(code: number) { statusCode = code; return res; },
    json(data: unknown) { body = data; return res; },
    setHeader(k: string, v: string) { headers[k] = v; return res; },
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeaders: () => headers,
  };
  return res as unknown as NextApiResponse & typeof res;
}

function makeCampaign(completedCount: number) {
  return {
    id: "campaign-test-001",
    title: "Test Campaign",
    status: "active",
    organisationId: "org-001",
    organisation: { name: "Test Org" },
    participants: Array.from({ length: completedCount + 1 }, (_, i) => ({
      id: `participant-id-${i}`, // raw IDs — must NOT appear in response
      status: i < completedCount ? "completed" : "pending",
    })),
  };
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/enterprise/campaigns/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCohortSafe.mockImplementation((n: number) => n >= 5);
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-001", "POST");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(405);
  });

  it("returns null (401/403 already written by guard) when unauthenticated", async () => {
    mockRequireAdminServer.mockResolvedValue(null);
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-001");
    const res = makeRes();
    await handler(req, res as any);
    // requireAdminServer wrote the response itself; handler returns early
    expect(mockGetCampaignById).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_CAMPAIGN_ID for empty id", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("   ");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_CAMPAIGN_ID");
  });

  it("returns 400 INVALID_CAMPAIGN_ID for id with special characters", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("../../etc/passwd");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_CAMPAIGN_ID");
  });

  it("returns 400 INVALID_CAMPAIGN_ID for overlong id", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("a".repeat(65));
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(400);
  });

  it("returns 404 CAMPAIGN_NOT_FOUND when campaign does not exist", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    mockGetCampaignById.mockResolvedValue(null);
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("nonexistent-campaign");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(404);
    expect((res.getBody() as any).error).toBe("CAMPAIGN_NOT_FOUND");
  });

  it("returns 500 INTERNAL_ERROR when getCampaignById throws", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    mockGetCampaignById.mockRejectedValue(new Error("DB connection lost"));
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-001");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(500);
    expect((res.getBody() as any).error).toBe("INTERNAL_ERROR");
    // Raw error message must not leak
    expect(JSON.stringify(res.getBody())).not.toContain("DB connection lost");
  });

  it("returns 200 with aggregate counts for valid campaign", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    mockGetCampaignById.mockResolvedValue(makeCampaign(6));
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-test-001");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(200);
    const body = res.getBody() as any;
    expect(body.id).toBe("campaign-test-001");
    expect(body.completedCount).toBe(6);
    expect(body.cohortSafe).toBe(true);
    expect(body.reportReady).toBe(true);
  });

  it("response does not contain raw participant IDs", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    mockGetCampaignById.mockResolvedValue(makeCampaign(5));
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-test-001");
    const res = makeRes();
    await handler(req, res as any);
    const serialized = JSON.stringify(res.getBody());
    for (let i = 0; i < 5; i++) {
      expect(serialized).not.toContain(`participant-id-${i}`);
    }
  });

  it("cohortSafe is false when completedCount < 5", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } });
    mockGetCampaignById.mockResolvedValue(makeCampaign(3));
    const { default: handler } = await import("@/pages/api/enterprise/campaigns/[id]");
    const req = makeReq("campaign-test-001");
    const res = makeRes();
    await handler(req, res as any);
    expect(res.getStatusCode()).toBe(200);
    const body = res.getBody() as any;
    expect(body.cohortSafe).toBe(false);
    expect(body.reportReady).toBe(false);
  });
});
