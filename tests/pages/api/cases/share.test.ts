import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveIdentity: vi.fn(),
  checkActionEntitlement: vi.fn(),
  createCaseShare: vi.fn(),
  listCaseShares: vi.fn(),
  prisma: {
    auditEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/resolve-identity", () => ({
  resolveIdentity: mocks.resolveIdentity,
}));

vi.mock("@/lib/product/action-entitlement", () => ({
  checkActionEntitlement: mocks.checkActionEntitlement,
}));

vi.mock("@/lib/product/case-sharing", () => ({
  createCaseShare: mocks.createCaseShare,
  listCaseShares: mocks.listCaseShares,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: mocks.prisma,
}));

import handler from "@/pages/api/cases/share";

function req(body: unknown, method = "POST") {
  return {
    method,
    body,
    query: {},
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
  mocks.checkActionEntitlement.mockResolvedValue({ allowed: true });
  mocks.createCaseShare.mockResolvedValue({
    ok: true,
    token: "case_token",
    share: {
      id: "share_001",
      caseId: "case_001",
      ownerEmail: "owner@example.com",
      recipientEmail: "reviewer@example.com",
      role: "AUDITOR",
      status: "ACTIVE",
      tokenHash: "hashed",
      allowExport: true,
      expiresAt: "2026-05-23T12:00:00.000Z",
      createdAt: "2026-05-16T12:00:00.000Z",
      revokedAt: null,
    },
  });
});

describe("POST /api/cases/share", () => {
  it("lets a Professional user create a share link and logs safe metadata", async () => {
    const response = res();

    await handler(req({
      caseId: "case_001",
      role: "AUDITOR",
      recipientEmail: "reviewer@example.com",
      expiresInDays: 7,
      allowExport: true,
    }), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      shareId: "share_001",
      role: "AUDITOR",
    });
    expect(String((response.body as { shareUrl: string }).shareUrl)).toContain("/case/shared/");
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "CASE_SHARE_CREATED",
        metadata: {
          caseId: "case_001",
          role: "AUDITOR",
          allowExport: true,
          hasRecipientEmail: true,
          expiresAt: "2026-05-23T12:00:00.000Z",
        },
      }),
    });
    expect(JSON.stringify(mocks.prisma.auditEvent.create.mock.calls[0]?.[0])).not.toContain("Authority remains unclear");
  });

  it("returns PROFESSIONAL_REQUIRED for free users", async () => {
    mocks.checkActionEntitlement.mockResolvedValueOnce({
      allowed: false,
      reason: "PROFESSIONAL_REQUIRED",
      message: "Sharing cases with reviewers is a Professional collaboration feature.",
    });
    const response = res();

    await handler(req({ caseId: "case_001", role: "VIEWER" }), response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      error: "Sharing cases with reviewers is a Professional collaboration feature.",
      code: "PROFESSIONAL_REQUIRED",
      actionType: "share_case",
    });
  });

  it("blocks non-owners from creating shares", async () => {
    mocks.createCaseShare.mockResolvedValueOnce({ ok: false, reason: "CASE_ACCESS_REQUIRED" });
    const response = res();

    await handler(req({ caseId: "case_001", role: "VIEWER" }), response);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ ok: false, error: "Case access required" });
  });
});
