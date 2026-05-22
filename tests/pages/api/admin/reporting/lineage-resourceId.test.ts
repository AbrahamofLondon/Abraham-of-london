/**
 * tests/pages/api/admin/reporting/lineage-resourceId.test.ts
 *
 * Proves: /api/admin/reporting/lineage/[resourceId] auth, validation,
 * limit capping, error containment, and response shape.
 * This route is Pages Router — auth is independent of the app/admin layout guard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockRequireAdminServer, mockGetAdminReportLineage } = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockGetAdminReportLineage: vi.fn(),
}));

vi.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: mockRequireAdminServer,
}));

vi.mock("@/lib/reporting/report-lineage", () => ({
  getAdminReportLineage: mockGetAdminReportLineage,
}));

// ── helpers ────────────────────────────────────────────────────────────────────

function makeReq(
  resourceId: string | undefined,
  opts: { method?: string; limit?: string } = {},
): NextApiRequest {
  const query: Record<string, string> = {};
  if (resourceId !== undefined) query.resourceId = resourceId;
  if (opts.limit !== undefined) query.limit = opts.limit;
  return {
    method: opts.method ?? "GET",
    query,
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

const MOCK_EVENTS = [
  { id: "evt-1", eventType: "CREATED", version: "1", actor: "a***@test.com", createdAt: new Date().toISOString() },
  { id: "evt-2", eventType: "GENERATED", version: "1", actor: null, createdAt: new Date().toISOString() },
];

// ── tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/admin/reporting/lineage/[resourceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("campaign-001", { method: "POST" }), res as any);
    expect(res.getStatusCode()).toBe(405);
  });

  it("does not call lineage when unauthenticated (guard handles response)", async () => {
    mockRequireAdminServer.mockResolvedValue(null);
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(mockGetAdminReportLineage).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_RESOURCE_ID for empty resourceId", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("  "), res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_RESOURCE_ID");
  });

  it("returns 400 INVALID_RESOURCE_ID for special characters", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("../../admin"), res as any);
    expect(res.getStatusCode()).toBe(400);
    expect((res.getBody() as any).error).toBe("INVALID_RESOURCE_ID");
  });

  it("caps limit at 200 regardless of query param", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockGetAdminReportLineage.mockResolvedValue([]);
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("campaign-001", { limit: "9999" }), res as any);
    expect(mockGetAdminReportLineage).toHaveBeenCalledWith("campaign-001", 200);
  });

  it("returns 200 with events array for valid admin request", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockGetAdminReportLineage.mockResolvedValue(MOCK_EVENTS);
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(200);
    expect((res.getBody() as any).events).toHaveLength(2);
    expect((res.getBody() as any).events[0].eventType).toBe("CREATED");
  });

  it("returns 500 LINEAGE_UNAVAILABLE and does not leak error when lineage throws", async () => {
    mockRequireAdminServer.mockResolvedValue({ user: { id: "a1", email: "a@t.com" } });
    mockGetAdminReportLineage.mockRejectedValue(new Error("Neon connection reset"));
    const { default: handler } = await import(
      "@/pages/api/admin/reporting/lineage/[resourceId]"
    );
    const res = makeRes();
    await handler(makeReq("campaign-001"), res as any);
    expect(res.getStatusCode()).toBe(500);
    expect((res.getBody() as any).error).toBe("LINEAGE_UNAVAILABLE");
    expect(JSON.stringify(res.getBody())).not.toContain("Neon connection reset");
  });
});
