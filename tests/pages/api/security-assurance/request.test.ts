import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  rateLimit: vi.fn(),
  notifyDiscord: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    securityAssuranceRequest: {
      create: mocks.create,
    },
  },
}));

vi.mock("@/lib/server/rateLimit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/rateLimit")>(
    "@/lib/server/rateLimit",
  );

  return {
    ...actual,
    rateLimit: mocks.rateLimit,
  };
});

vi.mock("@/lib/notifications/discord", () => ({
  notifyDiscord: mocks.notifyDiscord,
}));

import { securityAssuranceRequestHandler } from "@/pages/api/security-assurance/request";

function makeReq(body: Record<string, unknown>): NextApiRequest {
  return {
    method: "POST",
    body,
    headers: {},
    socket: {},
  } as NextApiRequest;
}

interface MockRes {
  _status: number;
  _body: unknown;
  _headers: Record<string, string | string[]>;
  status(code: number): MockRes;
  json(body: unknown): MockRes;
  setHeader(name: string, value: string | string[]): MockRes;
}

function makeRes(): NextApiResponse & MockRes {
  const res: MockRes = {
    _status: 200,
    _body: null,
    _headers: {},
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
    setHeader(name: string, value: string | string[]) {
      res._headers[name] = value;
      return res;
    },
  };

  return res as unknown as NextApiResponse & MockRes;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockReturnValue({
    ok: true,
    allowed: true,
    remaining: 9,
    resetSeconds: 60,
    limit: 10,
  });
  mocks.create.mockResolvedValue({
    id: "sar_001",
  });
  mocks.notifyDiscord.mockResolvedValue(undefined);
});

describe("POST /api/security-assurance/request", () => {
  it("accepts a valid request and stores it for review", async () => {
    const res = makeRes();

    await securityAssuranceRequestHandler(
      makeReq({
        name: "Ada Lovelace",
        email: "ada@example.com",
        requestedMaterial: "vendor-security-questionnaire",
        procurementStage: "security_review",
        message: "Please share the questionnaire.",
      }),
      res,
    );

    expect(res._status).toBe(200);
    expect(res._body).toEqual({
      ok: true,
      requestId: "sar_001",
      status: "NEW",
      message:
        "Your request has been received for review. We will respond within 48 hours.",
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        organisation: null,
        role: null,
        requestedMaterial: "vendor-security-questionnaire",
        procurementStage: "security_review",
        message: "Please share the questionnaire.",
        status: "NEW",
      },
    });
  });

  it("rejects an invalid material id", async () => {
    const res = makeRes();

    await securityAssuranceRequestHandler(
      makeReq({
        email: "ada@example.com",
        requestedMaterial: "unknown-material",
      }),
      res,
    );

    expect(res._status).toBe(400);
    expect(res._body).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects a request with no email", async () => {
    const res = makeRes();

    await securityAssuranceRequestHandler(
      makeReq({
        requestedMaterial: "vendor-security-questionnaire",
      }),
      res,
    );

    expect(res._status).toBe(400);
    expect(res._body).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not auto-send documents for a valid request", async () => {
    const res = makeRes();

    await securityAssuranceRequestHandler(
      makeReq({
        email: "ada@example.com",
        requestedMaterial: "incident-response-summary",
      }),
      res,
    );

    expect(res._status).toBe(200);
    expect(res._body).not.toHaveProperty("downloadUrl");
    expect(res._body).not.toHaveProperty("materials");
    expect(mocks.notifyDiscord).toHaveBeenCalledOnce();
  });

  it("returns a service-unavailable code when the table is missing", async () => {
    mocks.create.mockRejectedValueOnce({
      code: "P2021",
      name: "PrismaClientKnownRequestError",
    });
    const res = makeRes();

    await securityAssuranceRequestHandler(
      makeReq({
        email: "ada@example.com",
        requestedMaterial: "vendor-security-questionnaire",
      }),
      res,
    );

    expect(res._status).toBe(503);
    expect(res._body).toEqual({
      ok: false,
      code: "REQUEST_SERVICE_UNAVAILABLE",
      message: "Request service unavailable.",
    });
  });
});
