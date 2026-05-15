import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedApi: vi.fn(),
  authorizeClientSafeProvenanceSubject: vi.fn(),
  loadClientSafeProvenance: vi.fn(),
  recordProvenanceAuditEvent: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAuthenticatedApi: mocks.requireAuthenticatedApi,
}));

vi.mock("@/lib/product/client-safe-provenance-access", () => ({
  authorizeClientSafeProvenanceSubject: mocks.authorizeClientSafeProvenanceSubject,
}));

vi.mock("@/lib/admin/client-safe-provenance-composer", () => ({
  loadClientSafeProvenance: mocks.loadClientSafeProvenance,
}));

vi.mock("@/lib/admin/provenance-audit-events", () => ({
  recordProvenanceAuditEvent: mocks.recordProvenanceAuditEvent,
}));

import handler from "./index";

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
    headers: {} as Record<string, string>,
    setHeader: vi.fn((key: string, value: string) => {
      response.headers[key] = value;
    }),
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
  mocks.requireAuthenticatedApi.mockReset();
  mocks.authorizeClientSafeProvenanceSubject.mockReset();
  mocks.loadClientSafeProvenance.mockReset();
  mocks.recordProvenanceAuditEvent.mockReset();
  mocks.requireAuthenticatedApi.mockResolvedValue({
    session: { user: { id: "user_1", email: "client@example.com" } },
    access: { permissions: { isAdmin: false } },
  });
});

describe("/api/client-safe-provenance", () => {
  it("requires authentication before exposing live client-safe provenance", async () => {
    mocks.requireAuthenticatedApi.mockResolvedValueOnce(null);
    const response = res();

    await handler(req({ subjectType: "OVERSIGHT_CYCLE", subjectId: "cycle_001" }), response);

    expect(mocks.authorizeClientSafeProvenanceSubject).not.toHaveBeenCalled();
  });

  it("returns honest unavailable for unsupported subjects", async () => {
    mocks.authorizeClientSafeProvenanceSubject.mockResolvedValueOnce({
      ok: false,
      status: 422,
      reason: "UNSUPPORTED_SUBJECT_TYPE",
    });
    const response = res();

    await handler(req({ subjectType: "DECISION_CASE", subjectId: "case_001" }), response);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.body).toEqual({
      ok: false,
      reason: "UNSUPPORTED_SUBJECT_TYPE",
      message: "Case-specific client-safe provenance is not available for this subject type.",
    });
  });

  it("returns only the client-safe summary for authorised live subjects", async () => {
    mocks.authorizeClientSafeProvenanceSubject.mockResolvedValueOnce({
      ok: true,
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
    });
    mocks.loadClientSafeProvenance.mockResolvedValueOnce({
      version: 1,
      subjectId: "cycle_001",
      accountabilityStatement: "Accountability preserved.",
      provenanceHash: "hash_001",
      deliveryPosture: "DELIVERED",
      outcomePosture: "RECORDED",
      gapCount: 0,
      gapClasses: [],
      confidenceBands: [],
      timelineSummary: [],
      composedAt: "2026-05-15T12:00:00.000Z",
    });
    const response = res();

    await handler(req({ subjectType: "OVERSIGHT_CYCLE", subjectId: "cycle_001" }), response);

    expect(response.body).toEqual({
      ok: true,
      summary: {
        version: 1,
        subjectId: "cycle_001",
        accountabilityStatement: "Accountability preserved.",
        provenanceHash: "hash_001",
        deliveryPosture: "DELIVERED",
        outcomePosture: "RECORDED",
        gapCount: 0,
        gapClasses: [],
        confidenceBands: [],
        timelineSummary: [],
        composedAt: "2026-05-15T12:00:00.000Z",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("governanceEvents");
    expect(JSON.stringify(response.body)).not.toContain("operator");
    expect(response.headers["Cache-Control"]).toBe("private, no-store");
  });
});
