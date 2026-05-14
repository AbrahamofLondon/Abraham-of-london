import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  composeDecisionProvenance: vi.fn(),
  loadOversightCycleArchive: vi.fn(),
  recordProvenanceOperationAudit: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mocks.requireAdminApi,
}));

vi.mock("@/lib/admin/decision-provenance-record", () => ({
  composeDecisionProvenance: mocks.composeDecisionProvenance,
}));

vi.mock("@/lib/product/oversight-cycle-archive", () => ({
  loadOversightCycleArchive: mocks.loadOversightCycleArchive,
}));

vi.mock("@/lib/admin/provenance-operation-audit", () => ({
  recordProvenanceOperationAudit: mocks.recordProvenanceOperationAudit,
  createProvenanceRequestId: () => "prv_test_stubbed",
}));

import handler from "@/pages/api/admin/provenance/verify";

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
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
  mocks.requireAdminApi.mockReset();
  mocks.composeDecisionProvenance.mockReset();
  mocks.loadOversightCycleArchive.mockReset();
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
      userId: "admin_1",
      role: "ADMIN",
      permissions: {
        isAuthenticated: true,
        isAdmin: true,
        isOwner: false,
      },
    },
  });
  mocks.composeDecisionProvenance.mockResolvedValue({
    provenanceHash: "hash_match",
  });
  mocks.loadOversightCycleArchive.mockResolvedValue({
    record: {
      provenanceHash: "hash_match",
    },
  });
});

describe("/api/admin/provenance/verify", () => {
  it("returns 400 when subject data is missing", async () => {
    const response = res();
    await handler(req({ subjectType: "OVERSIGHT_CYCLE" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      ok: false,
      error: "subjectType, subjectId, and expectedHash are required",
    });
  });

  it("denies unauthenticated requests through the admin guard", async () => {
    const response = res();
    mocks.requireAdminApi.mockImplementationOnce(async (_req, apiRes) => {
      apiRes.status(401).json({ ok: false, error: "Authentication required" });
      return null;
    });
    await handler(req({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      expectedHash: "hash_match",
    }), response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(mocks.composeDecisionProvenance).not.toHaveBeenCalled();
  });

  it("matching hashes return MATCH", async () => {
    const response = res();
    await handler(req({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      expectedHash: "hash_match",
    }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      version: 1,
      status: "MATCH",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      expectedHash: "hash_match",
      recomputedHash: "hash_match",
      archivedHash: "hash_match",
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_HASH_VERIFIED",
        source: "PROVENANCE_VERIFY_API",
        status: "SUCCESS",
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_1",
        provenanceHash: "hash_match",
        actorId: "admin_1",
        actorEmail: "admin@example.com",
      }),
    );
  });

  it("mismatched expected hash returns MISMATCH", async () => {
    const response = res();
    await handler(req({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      expectedHash: "wrong_hash",
    }), response);
    expect(response.body).toMatchObject({
      status: "MISMATCH",
      recomputedHash: "hash_match",
      archivedHash: "hash_match",
    });
    expect(mocks.recordProvenanceOperationAudit).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "PROVENANCE_HASH_MISMATCH",
      status: "MISMATCH",
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      provenanceHash: "hash_match",
    }));
  });

  it("does not return raw provenance event labels", async () => {
    mocks.composeDecisionProvenance.mockResolvedValueOnce({
      provenanceHash: "hash_match",
      governanceEvents: [{ label: "Suppressed executive risk detail" }],
      evidenceInputs: [{ label: "Sensitive evidence label" }],
      provenanceGaps: [{ description: "Internal gap detail" }],
    });
    const response = res();
    await handler(req({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_1",
      expectedHash: "hash_match",
    }), response);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("Suppressed executive risk detail");
    expect(serialized).not.toContain("Sensitive evidence label");
    expect(serialized).not.toContain("Internal gap detail");
  });
});
