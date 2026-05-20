import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const { mockClear } = vi.hoisted(() => ({
  mockClear: vi.fn(),
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  clearPersistentRateLimit: mockClear,
}));

import handler from "@/pages/api/admin/auth/reset-rate-limit";

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
};

function makeReq(body: Record<string, unknown>, method = "POST"): NextApiRequest {
  return {
    method,
    body,
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as NextApiRequest;
}

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _body: null,
    status(code: number) {
      response._status = code;
      return response;
    },
    json(body: unknown) {
      response._body = body;
      return response;
    },
  };
  return response as unknown as MockRes;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClear.mockResolvedValue(true);
});

describe("POST /api/admin/auth/reset-rate-limit", () => {
  it("is unavailable in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-verify" }), res);

    expect(res._status).toBe(404);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it("only clears admin auth route keys in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-verify" }), res);

    expect(res._status).toBe(200);
    expect(mockClear).toHaveBeenCalledWith("admin-verify:127.0.0.1");
  });

  it("rejects non-admin-auth keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = makeRes();

    await handler(makeReq({ routeKey: "api-general" }), res);

    expect(res._status).toBe(400);
    expect(mockClear).not.toHaveBeenCalled();
  });
});
