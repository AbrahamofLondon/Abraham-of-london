import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveIdentity: vi.fn(),
  revokeCaseShare: vi.fn(),
  prisma: {
    auditEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/resolve-identity", () => ({
  resolveIdentity: mocks.resolveIdentity,
}));

vi.mock("@/lib/product/case-sharing", () => ({
  revokeCaseShare: mocks.revokeCaseShare,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: mocks.prisma,
}));

import handler from "@/pages/api/cases/share/revoke";

function req(body: unknown) {
  return {
    method: "POST",
    body,
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
  mocks.resolveIdentity.mockResolvedValue({
    authenticated: true,
    email: "owner@example.com",
    subjectId: "user_001",
  });
  mocks.revokeCaseShare.mockResolvedValue({
    ok: true,
    share: {
      id: "share_001",
      caseId: "case_001",
      role: "VIEWER",
    },
  });
});

describe("POST /api/cases/share/revoke", () => {
  it("revokes an existing share without deleting it", async () => {
    const response = res();

    await handler(req({ shareId: "share_001" }), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(mocks.revokeCaseShare).toHaveBeenCalledWith({
      shareId: "share_001",
      requesterEmail: "owner@example.com",
    });
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "CASE_SHARE_REVOKED",
        metadata: {
          caseId: "case_001",
          role: "VIEWER",
        },
      }),
    });
  });
});
