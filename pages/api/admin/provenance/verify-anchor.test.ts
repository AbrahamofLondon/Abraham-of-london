import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildProvenanceChainHash } from "@/lib/admin/provenance-chain-ledger";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  findFirst: vi.fn(),
  recordProvenanceOperationAudit: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mocks.requireAdminApi,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    provenanceChainAnchor: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("@/lib/admin/provenance-operation-audit", () => ({
  recordProvenanceOperationAudit: mocks.recordProvenanceOperationAudit,
  createProvenanceRequestId: () => "prv_test_stubbed",
}));

import handler from "./verify-anchor";

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

function anchorRow(overrides: {
  id?: string;
  merkleRoot?: string;
  previousRoot?: string | null;
  computedAt?: string;
  chainHash?: string;
} = {}) {
  const id = overrides.id ?? "anchor_001";
  const merkleRoot = overrides.merkleRoot ?? "root_001";
  const previousRoot = overrides.previousRoot !== undefined ? overrides.previousRoot : null;
  const computedAt = overrides.computedAt ?? "2026-05-14T12:00:00.000Z";
  const chainHash = overrides.chainHash ?? buildProvenanceChainHash({
    version: 1,
    scope: "DAILY",
    scopeId: "2026-05-14",
    merkleRoot,
    previousRoot,
    computedAt,
    fromTimestamp: null,
    toTimestamp: null,
  });
  return {
    id,
    version: 1,
    scope: "DAILY",
    scopeId: "2026-05-14",
    leafCount: 1,
    merkleRoot,
    previousRoot,
    chainHash,
    computedAt: new Date(computedAt),
    fromTimestamp: null,
    toTimestamp: null,
  };
}

const adminSession = {
  session: { user: { id: "admin_1", email: "admin@example.com" } },
  access: { permissions: { isAuthenticated: true, isAdmin: true, isOwner: false } },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-14T14:00:00.000Z"));
  mocks.requireAdminApi.mockReset();
  mocks.findFirst.mockReset();
  mocks.recordProvenanceOperationAudit.mockReset();
  mocks.recordProvenanceOperationAudit.mockResolvedValue({ ok: true });
  mocks.requireAdminApi.mockResolvedValue(adminSession);
});

describe("/api/admin/provenance/verify-anchor", () => {
  it("returns UNAVAILABLE when anchor is not found", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const response = res();
    await handler(req({ anchorId: "missing_anchor" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      version: 1,
      status: "UNAVAILABLE",
      anchorId: "missing_anchor",
      failures: [{ reason: "Anchor not found." }],
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_CHAIN_VERIFIED",
        source: "PROVENANCE_VERIFY_ANCHOR_API",
        status: "UNAVAILABLE",
      }),
    );
  });

  it("returns VALID for an intact anchor with no previous anchor", async () => {
    const row = anchorRow();
    mocks.findFirst
      .mockResolvedValueOnce(row)   // find anchor by id
      .mockResolvedValueOnce(null); // find previous (none)
    const response = res();
    await handler(req({ anchorId: "anchor_001" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      version: 1,
      status: "VALID",
      anchorId: "anchor_001",
      failures: [],
      storedPreviousRoot: null,
      expectedPreviousRoot: null,
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_CHAIN_VERIFIED",
        source: "PROVENANCE_VERIFY_ANCHOR_API",
        status: "SUCCESS",
        actorId: "admin_1",
        actorEmail: "admin@example.com",
      }),
    );
  });

  it("returns CORRUPT when chainHash does not match recomputed value", async () => {
    const row = anchorRow({ chainHash: "tampered_hash" });
    mocks.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(null);
    const response = res();
    await handler(req({ anchorId: "anchor_001" }), response);
    expect(response.body).toMatchObject({
      status: "CORRUPT",
      failures: expect.arrayContaining([
        expect.objectContaining({ reason: expect.stringContaining("chainHash") }),
      ]),
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({ status: "FAILED" }),
    );
  });

  it("returns CORRUPT when previousRoot does not match previous anchor merkleRoot", async () => {
    const row = anchorRow({ previousRoot: "wrong_root" });
    mocks.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce({ merkleRoot: "correct_previous_root" });
    const response = res();
    await handler(req({ anchorId: "anchor_001" }), response);
    expect(response.body).toMatchObject({
      status: "CORRUPT",
      failures: expect.arrayContaining([
        expect.objectContaining({ reason: expect.stringContaining("previousRoot") }),
      ]),
    });
  });

  it("returns VALID when previousRoot matches previous anchor merkleRoot", async () => {
    const row = anchorRow({
      merkleRoot: "root_002",
      previousRoot: "root_001",
      computedAt: "2026-05-14T13:00:00.000Z",
    });
    mocks.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce({ merkleRoot: "root_001" });
    const response = res();
    await handler(req({ anchorId: "anchor_002" }), response);
    expect(response.body).toMatchObject({
      status: "VALID",
      failures: [],
      storedPreviousRoot: "root_001",
      expectedPreviousRoot: "root_001",
    });
  });

  it("response contains no raw provenance events, suppression details, or leaf payloads", async () => {
    const row = anchorRow();
    mocks.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(null);
    const response = res();
    await handler(req({ anchorId: "anchor_001" }), response);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain("governanceEvents");
    expect(body).not.toContain("suppression");
    expect(body).not.toContain("leaves");
    expect(body).not.toContain("provenanceHash");
  });

  it("logs a safe audit event containing scope and hash metadata", async () => {
    const row = anchorRow();
    mocks.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(null);
    await handler(req({ anchorId: "anchor_001" }), res());
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_CHAIN_VERIFIED",
        source: "PROVENANCE_VERIFY_ANCHOR_API",
        scope: "DAILY",
        scopeId: "2026-05-14",
        actorId: "admin_1",
        actorEmail: "admin@example.com",
      }),
    );
    const call = mocks.recordProvenanceOperationAudit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty("leaves");
    expect(call).not.toHaveProperty("governanceEvents");
    expect(call).not.toHaveProperty("suppression");
  });

  it("returns 400 when anchorId is missing", async () => {
    const response = res();
    await handler(req({}), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toMatchObject({ ok: false, error: "anchorId is required" });
  });

  it("returns 405 for non-GET requests", async () => {
    const response = res();
    await handler(req({}, "POST"), response);
    expect(response.status).toHaveBeenCalledWith(405);
  });
});
