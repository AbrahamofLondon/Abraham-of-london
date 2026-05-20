import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockApplyShield,
  mockRateLimit,
  mockVerificationCreate,
  mockUserUpsert,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockApplyShield: vi.fn(),
  mockRateLimit: vi.fn(),
  mockVerificationCreate: vi.fn(),
  mockUserUpsert: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("@/lib/server/security/shield-middleware", () => ({
  applyShield: mockApplyShield,
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  consumePersistentRateLimit: mockRateLimit,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    verificationToken: {
      create: mockVerificationCreate,
    },
    user: {
      upsert: mockUserUpsert,
    },
  },
}));

vi.mock("@/lib/email/core/sendEmail", () => ({
  sendEmail: mockSendEmail,
}));

import handler from "@/pages/api/admin/auth/send-link";

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
  _headers: Record<string, string>;
};

function makeReq(body: Record<string, unknown>): NextApiRequest {
  return {
    method: "POST",
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
    json(body: unknown) {
      response._body = body;
      return response;
    },
    setHeader(key: string, value: string) {
      response._headers[key] = value;
      return response;
    },
  };
  return response as unknown as MockRes;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "");
  mockApplyShield.mockResolvedValue({ blocked: false, delayMs: 0 });
  mockRateLimit.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  mockVerificationCreate.mockResolvedValue({});
  mockUserUpsert.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({ ok: true, provider: "resend" });
});

describe("POST /api/admin/auth/send-link", () => {
  it("returns JSON when email provider is not configured", async () => {
    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      returnTo: "%252Fadmin%252Foutbound%252Flinkedin",
    });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(503);
    expect(res._body).toEqual(expect.objectContaining({
      ok: false,
      error: "EMAIL_PROVIDER_NOT_CONFIGURED",
      message: "Email sign-in is not configured in this environment. Use Google sign-in or configure RESEND_API_KEY.",
    }));
    expect(mockVerificationCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("uses normalised local returnTo when sending a configured magic link", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      returnTo: "%252Fadmin%252Foutbound%252Flinkedin",
    });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("returnTo=%2Fadmin%2Foutbound%2Flinkedin"),
    }));
  });

  it("returns JSON (not HTML) for a non-admin email — no enumeration", async () => {
    const req = makeReq({
      email: "notanadmin@example.com",
      returnTo: "/admin",
    });
    const res = makeRes();

    await handler(req, res);

    // Must return JSON with status 200 (neutral — prevents enumeration)
    expect(res._status).toBe(200);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.message).toBe("string");
    // Must never create a token or send an email for non-admin emails
    expect(mockVerificationCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects a missing email with JSON 400", async () => {
    const req = makeReq({ returnTo: "/admin" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(false);
    expect(body.error).toBe("INVALID_EMAIL");
    expect(mockVerificationCreate).not.toHaveBeenCalled();
  });

  it("returns DATABASE_URL_INVALID JSON when Prisma init fails with invalid URL", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    const initError = Object.assign(
      new Error("Invalid `prisma.verificationToken.create()` invocation:\n\nerror: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`."),
      { constructor: { name: "PrismaClientInitializationError" } },
    );
    mockVerificationCreate.mockRejectedValueOnce(initError);

    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      returnTo: "/admin",
    });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(500);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(false);
    expect(body.error).toBe("DATABASE_URL_INVALID");
    expect(typeof body.message).toBe("string");
    // Must never expose DATABASE_URL value
    expect(JSON.stringify(body)).not.toContain("postgresql://");
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("returns TOKEN_STORAGE_FAILED JSON for other Prisma errors", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    mockVerificationCreate.mockRejectedValueOnce(new Error("Unique constraint failed"));

    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      returnTo: "/admin",
    });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(500);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(false);
    expect(body.error).toBe("TOKEN_STORAGE_FAILED");
  });

  it("never exposes a connection string value in the response body", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    const initError = new Error("url must start with the protocol `postgresql://`");
    mockVerificationCreate.mockRejectedValueOnce(initError);

    const req = makeReq({
      email: "admin@abrahamoflondon.org",
      returnTo: "/admin",
    });
    const res = makeRes();

    await handler(req, res);

    const raw = JSON.stringify(res._body ?? "");
    // error code and friendly message may contain the word DATABASE_URL — that is expected.
    // What must not appear is an actual connection string value.
    expect(raw).not.toMatch(/file:\/\//);
    expect(raw).not.toMatch(/postgresql:\/\/[^"]+@/);  // no user:password@host pattern
    expect(raw).not.toMatch(/postgres:\/\/[^"]+@/);
    expect(raw).not.toContain("prisma/dev.db");
  });
});
