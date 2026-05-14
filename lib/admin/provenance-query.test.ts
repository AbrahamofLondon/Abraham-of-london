import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import handler from "@/pages/api/admin/provenance/query";

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

beforeEach(() => {
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
  mocks.findMany.mockResolvedValue([
    {
      id: "anchor_001",
      scope: "DAILY",
      scopeId: "2026-05-14",
      merkleRoot: "root_hash",
      previousRoot: null,
      chainHash: "chain_hash",
      leafCount: 2,
      computedAt: new Date("2026-05-14T12:00:00.000Z"),
    },
  ]);
});

describe("/api/admin/provenance/query", () => {
  it("returns anchor summaries only", async () => {
    const response = res();
    await handler(req({ scope: "DAILY", scopeId: "2026-05-14" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toEqual({
      version: 1,
      limit: 50,
      items: [
        {
          anchorId: "anchor_001",
          scope: "DAILY",
          scopeId: "2026-05-14",
          merkleRoot: "root_hash",
          previousRoot: null,
          chainHash: "chain_hash",
          leafCount: 2,
          computedAt: "2026-05-14T12:00:00.000Z",
        },
      ],
    });
    expect(JSON.stringify(response.body)).not.toContain("governanceEvents");
    expect(JSON.stringify(response.body)).not.toContain("suppression");
    expect(JSON.stringify(response.body)).not.toContain("actor");
  });

  it("uses hash filter against merkleRoot or chainHash", async () => {
    const response = res();
    await handler(req({ hash: "abc123" }), response);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: [
          { merkleRoot: "abc123" },
          { chainHash: "abc123" },
        ],
      }),
    }));
  });

  it("uses subjectId as a scopeId fallback for v1 anchor queries", async () => {
    const response = res();
    await handler(req({ subjectId: "acct_001" }), response);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        scopeId: "acct_001",
      }),
    }));
  });

  it("rejects invalid date filters", async () => {
    const response = res();
    await handler(req({ dateFrom: "not-a-date" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      ok: false,
      error: "dateFrom must be a valid date",
    });
  });

  it("does not query when admin guard denies", async () => {
    mocks.requireAdminApi.mockImplementationOnce(async (_req, apiRes) => {
      apiRes.status(401).json({ ok: false, error: "Authentication required" });
      return null;
    });
    const response = res();
    await handler(req(), response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
