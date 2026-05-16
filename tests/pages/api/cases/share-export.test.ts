import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSharedCaseByToken: vi.fn(),
}));

vi.mock("@/lib/product/case-sharing", () => ({
  loadSharedCaseByToken: mocks.loadSharedCaseByToken,
}));

import handler from "@/pages/api/cases/share/export";

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

describe("GET /api/cases/share/export", () => {
  it("blocks exports when the shared view does not allow them", async () => {
    mocks.loadSharedCaseByToken.mockResolvedValueOnce({
      state: "ACTIVE",
      share: { role: "VIEWER" },
      view: { canExport: false },
    });
    const response = res();

    await handler(req("viewer_token"), response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      error: "Export is not enabled for this shared view",
    });
  });

  it("returns only the client-safe shared view when export is allowed", async () => {
    mocks.loadSharedCaseByToken.mockResolvedValueOnce({
      state: "ACTIVE",
      share: { role: "AUDITOR" },
      view: {
        caseRef: "case_001",
        canExport: true,
        summary: "Client-safe summary.",
      },
    });
    const response = res();

    await handler(req("auditor_token"), response);

    expect(response.statusCode).toBe(200);
    expect(response.headers["Content-Disposition"]).toContain("shared-case-case_001.json");
    expect(response.body).toMatchObject({
      ok: true,
      sharedCase: {
        caseRef: "case_001",
        summary: "Client-safe summary.",
      },
    });
  });
});
