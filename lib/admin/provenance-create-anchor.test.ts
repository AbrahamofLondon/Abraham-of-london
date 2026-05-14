import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  createOversightProvenanceAnchor: vi.fn(),
  recordProvenanceOperationAudit: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mocks.requireAdminApi,
}));

vi.mock("@/lib/admin/provenance-anchor-runner", () => ({
  createOversightProvenanceAnchor: mocks.createOversightProvenanceAnchor,
}));

vi.mock("@/lib/admin/provenance-operation-audit", () => ({
  recordProvenanceOperationAudit: mocks.recordProvenanceOperationAudit,
  createProvenanceRequestId: () => "prv_test_stubbed",
}));

import handler from "@/pages/api/admin/provenance/create-anchor";

function req(body: Record<string, unknown> = {}, method = "POST") {
  return {
    method,
    body,
  } as unknown as NextApiRequest;
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

beforeEach(() => {
  mocks.requireAdminApi.mockReset();
  mocks.createOversightProvenanceAnchor.mockReset();
  mocks.recordProvenanceOperationAudit.mockReset();
  mocks.recordProvenanceOperationAudit.mockResolvedValue({ ok: true });
  mocks.requireAdminApi.mockResolvedValue({
    session: {
      user: {
        id: "admin_1",
        email: "admin@example.com",
      },
    },
    access: {
      permissions: {
        isAuthenticated: true,
        isAdmin: true,
        isOwner: false,
      },
    },
  });
});

describe("/api/admin/provenance/create-anchor", () => {
  it("rejects missing scope or scopeId", async () => {
    const response = res();
    await handler(req({ scope: "DAILY" }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      ok: false,
      error: "scope and scopeId are required",
    });
    expect(mocks.createOversightProvenanceAnchor).not.toHaveBeenCalled();
  });

  it("returns unavailable when no leaves can be anchored", async () => {
    mocks.createOversightProvenanceAnchor.mockResolvedValueOnce({
      version: 1,
      status: "UNAVAILABLE",
      scope: "DAILY",
      scopeId: "2026-05-14",
      requestedCount: 0,
      leafCount: 0,
      unavailableCount: 0,
      anchor: null,
      reason: "No retained oversight cycles matched the requested anchor scope.",
    });

    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toEqual({
      version: 1,
      status: "UNAVAILABLE",
      scope: "DAILY",
      scopeId: "2026-05-14",
      requestedCount: 0,
      leafCount: 0,
      unavailableCount: 0,
      anchor: null,
      reason: "No retained oversight cycles matched the requested anchor scope.",
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_ANCHOR_CREATED",
        source: "PROVENANCE_CREATE_ANCHOR_API",
        scope: "DAILY",
        scopeId: "2026-05-14",
        merkleRoot: null,
        chainHash: null,
        status: "UNAVAILABLE",
        actorId: "admin_1",
        actorEmail: "admin@example.com",
      }),
    );
    const firstCall = mocks.recordProvenanceOperationAudit.mock.calls[0] as [{ requestId: unknown }] | undefined;
    expect(typeof firstCall?.[0]?.requestId).toBe("string");
  });

  it("returns anchor summary only when anchor is created", async () => {
    mocks.createOversightProvenanceAnchor.mockResolvedValueOnce({
      version: 1,
      status: "ANCHORED",
      scope: "ACCOUNT",
      scopeId: "acct_001",
      requestedCount: 2,
      leafCount: 2,
      unavailableCount: 0,
      anchor: {
        id: "anchor_001",
        version: 1,
        scope: "ACCOUNT",
        scopeId: "acct_001",
        leafCount: 2,
        merkleRoot: "root_hash",
        previousRoot: null,
        chainHash: "chain_hash",
        computedAt: "2026-05-14T12:00:00.000Z",
        fromTimestamp: null,
        toTimestamp: null,
      },
    });

    const response = res();
    await handler(req({
      scope: "ACCOUNT",
      scopeId: "acct_001",
      limit: "25",
    }), response);

    expect(mocks.createOversightProvenanceAnchor).toHaveBeenCalledWith({
      scope: "ACCOUNT",
      scopeId: "acct_001",
      limit: 25,
      fromTimestamp: undefined,
      toTimestamp: undefined,
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_ANCHOR_CREATED",
        source: "PROVENANCE_CREATE_ANCHOR_API",
        scope: "ACCOUNT",
        scopeId: "acct_001",
        merkleRoot: "root_hash",
        chainHash: "chain_hash",
        status: "SUCCESS",
        actorId: "admin_1",
        actorEmail: "admin@example.com",
      }),
    );
    expect(response.body).toEqual({
      version: 1,
      status: "ANCHORED",
      scope: "ACCOUNT",
      scopeId: "acct_001",
      requestedCount: 2,
      leafCount: 2,
      unavailableCount: 0,
      anchor: {
        id: "anchor_001",
        version: 1,
        scope: "ACCOUNT",
        scopeId: "acct_001",
        leafCount: 2,
        merkleRoot: "root_hash",
        previousRoot: null,
        chainHash: "chain_hash",
        computedAt: "2026-05-14T12:00:00.000Z",
        fromTimestamp: null,
        toTimestamp: null,
      },
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("governanceEvents");
    expect(serialized).not.toContain("suppression");
    expect(serialized).not.toContain("actor");
    expect(serialized).not.toContain("provenanceHash");
  });
});
