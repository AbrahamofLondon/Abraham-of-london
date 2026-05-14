import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildProvenanceChainHash } from "@/lib/admin/provenance-chain-ledger";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mocks.requireAdminApi,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    provenanceChainAnchor: {
      findMany: mocks.findMany,
    },
  },
}));

import handler from "./verify-chain";

function req(query: Record<string, string> = {}, method = "GET") {
  return {
    method,
    query,
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

function row(overrides: {
  id: string;
  merkleRoot: string;
  previousRoot: string | null;
  computedAt: string;
  chainHash?: string;
}) {
  const base = {
    id: overrides.id,
    version: 1,
    scope: "DAILY",
    scopeId: "2026-05-14",
    leafCount: 1,
    merkleRoot: overrides.merkleRoot,
    previousRoot: overrides.previousRoot,
    computedAt: new Date(overrides.computedAt),
    fromTimestamp: null,
    toTimestamp: null,
  };
  return {
    ...base,
    chainHash: overrides.chainHash ?? buildProvenanceChainHash({
      version: 1,
      scope: base.scope,
      scopeId: base.scopeId,
      merkleRoot: base.merkleRoot,
      previousRoot: base.previousRoot,
      computedAt: overrides.computedAt,
      fromTimestamp: null,
      toTimestamp: null,
    }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-14T14:00:00.000Z"));
  mocks.requireAdminApi.mockReset();
  mocks.findMany.mockReset();
  mocks.requireAdminApi.mockResolvedValue({
    access: {
      permissions: {
        isAuthenticated: true,
        isAdmin: true,
        isOwner: false,
      },
    },
  });
});

describe("/api/admin/provenance/verify-chain", () => {
  it("returns 400 when scope or scopeId is missing", async () => {
    const response = res();
    await handler(req({ scope: "DAILY" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      ok: false,
      error: "scope and scopeId are required",
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("returns UNAVAILABLE for an empty chain", async () => {
    mocks.findMany.mockResolvedValueOnce([]);
    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toEqual({
      version: 1,
      status: "UNAVAILABLE",
      scope: "DAILY",
      scopeId: "2026-05-14",
      anchorCount: 0,
      latestMerkleRoot: null,
      latestChainHash: null,
      checkedAt: "2026-05-14T14:00:00.000Z",
      failures: [],
    });
  });

  it("returns CONTINUOUS for a valid chain", async () => {
    const first = row({
      id: "anchor_001",
      merkleRoot: "root_001",
      previousRoot: null,
      computedAt: "2026-05-14T12:00:00.000Z",
    });
    const second = row({
      id: "anchor_002",
      merkleRoot: "root_002",
      previousRoot: "root_001",
      computedAt: "2026-05-14T13:00:00.000Z",
    });
    mocks.findMany.mockResolvedValueOnce([first, second]);

    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      version: 1,
      status: "CONTINUOUS",
      anchorCount: 2,
      latestMerkleRoot: "root_002",
      latestChainHash: second.chainHash,
      failures: [],
    });
  });

  it("returns BROKEN when previousRoot linkage is broken", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        id: "anchor_001",
        merkleRoot: "root_001",
        previousRoot: null,
        computedAt: "2026-05-14T12:00:00.000Z",
      }),
      row({
        id: "anchor_002",
        merkleRoot: "root_002",
        previousRoot: "wrong_root",
        computedAt: "2026-05-14T13:00:00.000Z",
      }),
    ]);

    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.body).toMatchObject({
      status: "BROKEN",
      anchorCount: 2,
    });
    expect(JSON.stringify(response.body)).toContain("previousRoot");
  });

  it("returns BROKEN when chainHash does not match recomputation", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        id: "anchor_001",
        merkleRoot: "root_001",
        previousRoot: null,
        computedAt: "2026-05-14T12:00:00.000Z",
        chainHash: "tampered",
      }),
    ]);

    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.body).toMatchObject({
      status: "BROKEN",
      anchorCount: 1,
    });
    expect(JSON.stringify(response.body)).toContain("chainHash");
  });

  it("does not return raw provenance events or suppression details", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        id: "anchor_001",
        merkleRoot: "root_001",
        previousRoot: null,
        computedAt: "2026-05-14T12:00:00.000Z",
      }),
    ]);

    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain("governanceEvents");
    expect(body).not.toContain("suppression");
    expect(body).not.toContain("leaves");
    expect(body).not.toContain("provenanceHash");
  });
});
