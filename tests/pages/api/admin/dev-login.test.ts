/**
 * tests/pages/api/admin/dev-login.test.ts
 *
 * Proves that the dev-login endpoint is unreachable in production
 * and correctly secured in development.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockApplyShieldFromRequest, mockConsumeRateLimit } = vi.hoisted(() => ({
  mockApplyShieldFromRequest: vi.fn(),
  mockConsumeRateLimit: vi.fn(),
}));

vi.mock("@/lib/server/security/shield-middleware", () => ({
  applyShieldFromRequest: mockApplyShieldFromRequest,
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  consumePersistentRateLimit: mockConsumeRateLimit,
}));

function makeRequest(body?: Record<string, unknown>, host = "localhost:3000"): NextRequest {
  return new NextRequest(`http://${host}/api/admin/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", host },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/admin/dev-login/route");
}

describe("app/api/admin/dev-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyShieldFromRequest.mockResolvedValue({ blocked: false, delayMs: 0 });
    mockConsumeRateLimit.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  });

  describe("production guard", () => {
    it("returns 404 for POST in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "anything" }));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
      vi.unstubAllEnvs();
    });

    it("returns 404 for GET in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { GET } = await loadRoute();
      const res = await GET();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
      vi.unstubAllEnvs();
    });

    it("does not set any cookies in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "any" }));
      expect(res.status).toBe(404);
      expect(res.headers.get("set-cookie")).toBeNull();
      vi.unstubAllEnvs();
    });

    it("does not call rate limiter in production (hard gate fires first)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { POST } = await loadRoute();
      await POST(makeRequest({ password: "any" }));
      expect(mockConsumeRateLimit).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });
  });

  describe("ENABLE_DEV_LOGIN gate", () => {
    it("returns 404 when ENABLE_DEV_LOGIN is absent (even in development)", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENABLE_DEV_LOGIN", "");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "anything" }));
      expect(res.status).toBe(404);
      vi.unstubAllEnvs();
    });

    it("returns 404 when ENABLE_DEV_LOGIN is 'false'", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENABLE_DEV_LOGIN", "false");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "anything" }));
      expect(res.status).toBe(404);
      vi.unstubAllEnvs();
    });

    it("does not set any cookies when flag is absent", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENABLE_DEV_LOGIN", "");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "anything" }));
      expect(res.headers.get("set-cookie")).toBeNull();
      vi.unstubAllEnvs();
    });
  });

  describe("host restriction", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENABLE_DEV_LOGIN", "true");
      vi.stubEnv("DEV_ADMIN_PASSWORD", "dev-test-password");
    });

    it("returns 404 for a public hostname", async () => {
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "dev-test-password" }, "app.abrahamoflondon.org"));
      expect(res.status).toBe(404);
      vi.unstubAllEnvs();
    });

    it("returns 404 for a staging hostname (non-private)", async () => {
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "dev-test-password" }, "staging.example.com"));
      expect(res.status).toBe(404);
      vi.unstubAllEnvs();
    });

    it("allows localhost:3000", async () => {
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "wrong" }, "localhost:3000"));
      // wrong password, but the host check passed (should get 401, not 404)
      expect(res.status).toBe(401);
      vi.unstubAllEnvs();
    });

    it("allows 127.0.0.1", async () => {
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "wrong" }, "127.0.0.1:3000"));
      expect(res.status).toBe(401);
      vi.unstubAllEnvs();
    });
  });

  describe("development behaviour", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENABLE_DEV_LOGIN", "true");
      vi.stubEnv("DEV_ADMIN_PASSWORD", "dev-test-password");
    });

    it("returns 401 for wrong password", async () => {
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "wrong" }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid credentials");
    });

    it("returns 500 when DEV_ADMIN_PASSWORD is absent", async () => {
      vi.stubEnv("DEV_ADMIN_PASSWORD", "");
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "anything" }));
      expect(res.status).toBe(500);
    });

    it("returns 429 when rate limited", async () => {
      mockConsumeRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterMs: 30000 });
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "dev-test-password" }));
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });

    it("returns 429 when shield blocks the request", async () => {
      mockApplyShieldFromRequest.mockResolvedValueOnce({ blocked: true, delayMs: 0 });
      const { POST } = await loadRoute();
      const res = await POST(makeRequest({ password: "dev-test-password" }));
      expect(res.status).toBe(429);
    });
  });
});
