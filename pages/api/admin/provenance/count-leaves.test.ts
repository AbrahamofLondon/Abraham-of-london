import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  countOversightProvenanceLeaves: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mocks.requireAdminApi,
}));

vi.mock("@/lib/admin/provenance-anchor-runner", () => ({
  countOversightProvenanceLeaves: mocks.countOversightProvenanceLeaves,
}));

import handler from "./count-leaves";

function req(query: Record<string, string> = {}, method = "GET") {
  return { method, query } as unknown as NextApiRequest;
}

function res() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response as unknown as NextApiResponse & typeof response;
}

const adminSession = {
  session: { user: { id: "admin_1", email: "admin@example.com" } },
  access: { permissions: { isAuthenticated: true, isAdmin: true, isOwner: false } },
};

beforeEach(() => {
  mocks.requireAdminApi.mockReset();
  mocks.countOversightProvenanceLeaves.mockReset();
  mocks.requireAdminApi.mockResolvedValue(adminSession);
});

describe("/api/admin/provenance/count-leaves", () => {
  it("returns zero validLeafCount with canCreateAnchor false when no leaves exist", async () => {
    mocks.countOversightProvenanceLeaves.mockResolvedValueOnce({
      version: 1,
      scope: "DAILY",
      scopeId: "2026-05-14",
      validLeafCount: 0,
      unavailableCount: 3,
      canCreateAnchor: false,
      message: "No valid provenance records found for this scope/scopeId. Anchor creation would be unavailable.",
    });
    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      version: 1,
      scope: "DAILY",
      scopeId: "2026-05-14",
      validLeafCount: 0,
      unavailableCount: 3,
      canCreateAnchor: false,
    });
  });

  it("returns positive validLeafCount with canCreateAnchor true when leaves are available", async () => {
    mocks.countOversightProvenanceLeaves.mockResolvedValueOnce({
      version: 1,
      scope: "ACCOUNT",
      scopeId: "acct_001",
      validLeafCount: 7,
      unavailableCount: 1,
      canCreateAnchor: true,
      message: "7 valid provenance records found. Anchor can be created.",
    });
    const response = res();
    await handler(req({ scope: "ACCOUNT", scopeId: "acct_001" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      validLeafCount: 7,
      canCreateAnchor: true,
    });
  });

  it("response does not expose raw provenance records, events, or suppression details", async () => {
    mocks.countOversightProvenanceLeaves.mockResolvedValueOnce({
      version: 1,
      scope: "DAILY",
      scopeId: "2026-05-14",
      validLeafCount: 2,
      unavailableCount: 0,
      canCreateAnchor: true,
      message: "2 valid provenance records found. Anchor can be created.",
    });
    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain("provenanceHash");
    expect(body).not.toContain("governanceEvents");
    expect(body).not.toContain("suppression");
    expect(body).not.toContain("leaves");
  });

  it("returns 400 when scope or scopeId is missing", async () => {
    const response = res();
    await handler(req({ scope: "DAILY" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toMatchObject({ ok: false, error: "scope and scopeId are required" });
  });

  it("passes limit to countOversightProvenanceLeaves when provided", async () => {
    mocks.countOversightProvenanceLeaves.mockResolvedValueOnce({
      version: 1,
      scope: "DAILY",
      scopeId: "2026-05-14",
      validLeafCount: 5,
      unavailableCount: 0,
      canCreateAnchor: true,
      message: "5 valid provenance records found. Anchor can be created.",
    });
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14", limit: "25" }), res());
    expect(mocks.countOversightProvenanceLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25 }),
    );
  });

  it("returns 405 for non-GET requests", async () => {
    const response = res();
    await handler(req({}, "POST"), response);
    expect(response.status).toHaveBeenCalledWith(405);
  });
});
