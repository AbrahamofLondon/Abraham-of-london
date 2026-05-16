import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSharedCaseByToken: vi.fn(),
  verifySharedGovernedCase: vi.fn(),
}));

vi.mock("@/lib/product/case-sharing", () => ({
  loadSharedCaseByToken: mocks.loadSharedCaseByToken,
}));

vi.mock("@/lib/product/case-sharing-provenance", () => ({
  verifySharedGovernedCase: mocks.verifySharedGovernedCase,
}));

import handler from "@/pages/api/cases/share/verify";

function req(token: string) {
  return {
    method: "GET",
    query: { token },
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
  vi.clearAllMocks();
});

describe("GET /api/cases/share/verify", () => {
  it("allows auditor verification when provenance is supported", async () => {
    mocks.loadSharedCaseByToken.mockResolvedValueOnce({
      state: "ACTIVE",
      share: { role: "AUDITOR" },
      view: { caseId: "case_001", canVerify: true },
    });
    mocks.verifySharedGovernedCase.mockResolvedValueOnce({
      status: "MATCH",
      checkedAt: "2026-05-16T12:00:00.000Z",
      message: "Hash matches. Record integrity confirmed.",
    });
    const response = res();

    await handler(req("auditor_token"), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.verifySharedGovernedCase).toHaveBeenCalledWith("case_001");
    expect(response.body).toEqual({
      ok: true,
      verification: {
        status: "MATCH",
        checkedAt: "2026-05-16T12:00:00.000Z",
        message: "Hash matches. Record integrity confirmed.",
      },
    });
  });

  it("blocks verification for non-auditor links", async () => {
    mocks.loadSharedCaseByToken.mockResolvedValueOnce({
      state: "ACTIVE",
      share: { role: "VIEWER" },
      view: { caseId: "case_001", canVerify: false },
    });
    const response = res();

    await handler(req("viewer_token"), response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      error: "Verification unavailable for this shared view",
    });
  });
});
