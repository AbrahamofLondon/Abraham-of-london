import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockRateLimit,
  mockFindUnique,
  mockDelete,
  mockUserUpsert,
} = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
  mockUserUpsert: vi.fn(),
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  consumePersistentRateLimit: mockRateLimit,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    verificationToken: {
      findUnique: mockFindUnique,
      delete: mockDelete,
    },
    user: {
      upsert: mockUserUpsert,
    },
  },
}));

import handler from "@/pages/api/admin/auth/verify";

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
  _headers: Record<string, string | string[]>;
  _redirect: string | null;
};

function makeReq(query: Record<string, unknown>): NextApiRequest {
  return {
    method: "GET",
    query,
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as NextApiRequest;
}

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string | string[]>,
    _redirect: null as string | null,
    status(code: number) {
      response._status = code;
      return response;
    },
    json(body: unknown) {
      response._body = body;
      return response;
    },
    setHeader(key: string, value: string | string[]) {
      response._headers[key] = value;
      return response;
    },
    redirect(code: number, destination: string) {
      response._status = code;
      response._redirect = destination;
      return response;
    },
  };
  return response as unknown as MockRes;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXTAUTH_SECRET", "test-nextauth-secret-at-least-32-chars");
  mockRateLimit.mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    source: "redis",
  });
  mockFindUnique.mockResolvedValue({
    identifier: "admin@abrahamoflondon.org",
    token: "token-value",
    expires: new Date(Date.now() + 60_000),
  });
  mockDelete.mockResolvedValue({});
  mockUserUpsert.mockResolvedValue({
    id: "user_1",
    email: "admin@abrahamoflondon.org",
    role: "ADMIN",
    name: null,
  });
});

describe("GET /api/admin/auth/verify", () => {
  it("returns JSON retryAfter when rate-limited", async () => {
    mockRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 12_000,
      source: "redis",
    });

    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      token: "secret-token",
      returnTo: "/admin/outbound/linkedin",
    });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(429);
    expect(res._headers["Retry-After"]).toBe("12");
    expect(res._body).toEqual(expect.objectContaining({
      ok: false,
      error: "RATE_LIMIT_EXCEEDED",
      retryAfter: 12,
      message: "Too many verification attempts. Please wait and request a fresh sign-in link.",
    }));
  });

  it("does not consume token when rate-limited", async () => {
    mockRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 1_000,
      source: "redis",
    });

    await handler(makeReq({
      email: "admin@abrahamoflondon.org",
      token: "secret-token",
      returnTo: "/admin",
    }), makeRes());

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("does not include the raw token in rate-limit response", async () => {
    mockRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 1_000,
      source: "redis",
    });

    const res = makeRes();
    await handler(makeReq({
      email: "admin@abrahamoflondon.org",
      token: "very-secret-token",
      returnTo: "/admin",
    }), res);

    expect(JSON.stringify(res._body)).not.toContain("very-secret-token");
  });
});
