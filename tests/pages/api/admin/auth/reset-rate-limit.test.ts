import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockClear,
  mockClearPostgres,
  mockAbuseFingerprintDeleteMany,
  mockBlockedIdentityDeleteMany,
  mockAbuseEventDeleteMany,
  mockCanaryTripwireDeleteMany,
} = vi.hoisted(() => ({
  mockClear: vi.fn(),
  mockClearPostgres: vi.fn(),
  mockAbuseFingerprintDeleteMany: vi.fn(),
  mockBlockedIdentityDeleteMany: vi.fn(),
  mockAbuseEventDeleteMany: vi.fn(),
  mockCanaryTripwireDeleteMany: vi.fn(),
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  clearPersistentRateLimit: mockClear,
}));

vi.mock("@/lib/server/security/rate-limit-store.postgres", () => ({
  clearPostgresRateLimitBuckets: mockClearPostgres,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abuseFingerprint: { deleteMany: mockAbuseFingerprintDeleteMany },
    blockedIdentity: { deleteMany: mockBlockedIdentityDeleteMany },
    abuseEvent: { deleteMany: mockAbuseEventDeleteMany },
    canaryTripwire: { deleteMany: mockCanaryTripwireDeleteMany },
  },
}));

import handler from "@/pages/api/admin/auth/reset-rate-limit";

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
  _headers: Record<string, string>;
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
    _headers: {} as Record<string, string>,
    status(code: number) {
      response._status = code;
      return response;
    },
    setHeader(key: string, value: string) {
      response._headers[key] = value;
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
  mockClear.mockResolvedValue(false);
  mockClearPostgres.mockResolvedValue(0);
  mockAbuseFingerprintDeleteMany.mockResolvedValue({ count: 0 });
  mockBlockedIdentityDeleteMany.mockResolvedValue({ count: 0 });
  mockAbuseEventDeleteMany.mockResolvedValue({ count: 0 });
  mockCanaryTripwireDeleteMany.mockResolvedValue({ count: 0 });
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
    mockClear.mockResolvedValueOnce(true);
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-verify" }), res);

    expect(res._status).toBe(200);
    expect(res._headers["Content-Type"]).toContain("application/json");
    expect(mockClear).toHaveBeenCalledWith("admin-verify:127.0.0.1");
  });

  it("clears admin send-link throttling in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockClear.mockResolvedValueOnce(true);
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-send-link" }), res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(expect.objectContaining({
      ok: true,
      routeKey: "admin-send-link",
    }));
    expect(mockClear).toHaveBeenCalledWith("admin-send-link:127.0.0.1");
  });

  it("clears Postgres and shield buckets for admin-send-link with a safe email input", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockClearPostgres.mockResolvedValueOnce(1);
    mockAbuseFingerprintDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockBlockedIdentityDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockAbuseEventDeleteMany.mockResolvedValueOnce({ count: 2 });
    const res = makeRes();

    await handler(makeReq({
      routeKey: "admin-send-link",
      email: "Admin@AbrahamOfLondon.org",
    }), res);

    expect(res._status).toBe(200);
    expect(mockClearPostgres).toHaveBeenCalledWith({
      routeKey: "admin-send-link",
      identityKeys: ["127.0.0.1", "admin@abrahamoflondon.org"],
    });
    expect(mockAbuseFingerprintDeleteMany).toHaveBeenCalledWith({
      where: { identityKey: { in: ["127.0.0.1", "admin@abrahamoflondon.org"] } },
    });
    expect(mockBlockedIdentityDeleteMany).toHaveBeenCalledWith({
      where: { identityKey: { in: ["127.0.0.1", "admin@abrahamoflondon.org"] } },
    });
    expect(mockAbuseEventDeleteMany).toHaveBeenCalledWith({
      where: { identityKey: { in: ["127.0.0.1", "admin@abrahamoflondon.org"] } },
    });
    expect(res._body).toEqual(expect.objectContaining({
      ok: true,
      cleared: true,
      clearedBuckets: 1,
      clearedAbuseFingerprints: 1,
      clearedBlockedIdentities: 1,
      clearedAbuseEvents: 2,
    }));
    expect(JSON.stringify(res._body)).not.toContain("Admin@AbrahamOfLondon.org");
    expect(JSON.stringify(res._body)).not.toContain("admin@abrahamoflondon.org");
  });

  it("clears admin-verify buckets without deleting unrelated routes", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockClearPostgres.mockResolvedValueOnce(1);
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-verify" }), res);

    expect(mockClearPostgres).toHaveBeenCalledWith({
      routeKey: "admin-verify",
      identityKeys: ["127.0.0.1"],
    });
    expect(mockClearPostgres).not.toHaveBeenCalledWith(expect.objectContaining({
      routeKey: "api-general",
    }));
  });

  it("returns a safe no-match diagnostic when no buckets are found", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = makeRes();

    await handler(makeReq({ routeKey: "admin-send-link" }), res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(expect.objectContaining({
      ok: true,
      cleared: false,
      reason: "NO_MATCHING_BUCKETS_FOUND",
    }));
  });

  it("rejects non-admin-auth keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = makeRes();

    await handler(makeReq({ routeKey: "api-general" }), res);

    expect(res._status).toBe(400);
    expect(mockClear).not.toHaveBeenCalled();
    expect(mockClearPostgres).not.toHaveBeenCalled();
    expect(mockAbuseFingerprintDeleteMany).not.toHaveBeenCalled();
  });
});
