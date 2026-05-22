/**
 * tests/proxy/global-lock.test.ts
 *
 * Proves: proxy.ts checkGlobalLock correctly diverts non-admin traffic when
 * /api/system/lock-status returns isLocked=true, and passes admin traffic through.
 * Proves: unlock restores normal access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockGetToken, mockReadAccessCookie, mockSessionTracker } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockReadAccessCookie: vi.fn(),
  mockSessionTracker: {
    getSession: vi.fn().mockResolvedValue(null),
    initSession: vi.fn().mockResolvedValue({ id: "sess-1" }),
    recordEvent: vi.fn().mockResolvedValue(undefined),
    recordConversion: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: mockGetToken,
}));

vi.mock("@/lib/server/auth/cookies", () => ({
  readAccessCookie: mockReadAccessCookie,
}));

vi.mock("@/lib/analytics/session-tracker", () => ({
  sessionTracker: mockSessionTracker,
}));

vi.mock("@/lib/constitution/constitutional-authority", () => ({
  validateThreshold: vi.fn().mockReturnValue({ valid: true }),
}));

vi.mock("@/lib/decision/canonical-sections", () => ({
  coerceCanonicalSectionsEnvelope: vi.fn().mockReturnValue(null),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeReq(
  pathname: string,
  opts: { method?: string } = {},
): NextRequest {
  return new NextRequest(`https://www.abrahamoflondon.org${pathname}`, {
    method: opts.method ?? "GET",
  });
}

/** Stub global fetch for checkGlobalLock's call to /api/system/lock-status */
function stubLockStatus(isLocked: boolean) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/api/system/lock-status")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isLocked, available: true }),
        });
      }
      // For any other internal fetch (participant-count, threshold, audit), return empty ok
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }),
  );
}

/** Load a fresh proxy module so lockCache is always null at test start */
async function loadProxy() {
  vi.resetModules();
  return import("@/proxy");
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("proxy global lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: unauthenticated, no access cookie
    mockGetToken.mockResolvedValue(null);
    mockReadAccessCookie.mockReturnValue(null);
    // Unset BYPASS env vars so lockdown runs
    vi.stubEnv("BYPASS_SOVEREIGN", "");
    vi.stubEnv("INTERNAL_BYPASS_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("when system is LOCKED", () => {
    beforeEach(() => {
      stubLockStatus(true);
    });

    it("diverts non-admin API request with 503 SYSTEM_LOCKED", async () => {
      mockGetToken.mockResolvedValue(null); // no token = not admin
      const { proxy } = await loadProxy();
      const req = makeReq("/api/campaigns/some-id");
      const res = await proxy(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBe("SYSTEM_LOCKED");
    });

    it("diverts non-admin page request with redirect to /restricted", async () => {
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/vault/private");
      const res = await proxy(req);

      // Non-API routes redirect (302 or 307)
      expect([302, 307, 308]).toContain(res.status);
      expect(res.headers.get("location")).toMatch(/restricted/);
    });

    it("passes admin (isProxyAdminRole) request through during lockdown", async () => {
      mockGetToken.mockResolvedValue({ role: "admin" });
      const { proxy } = await loadProxy();
      const req = makeReq("/api/reports/some-id");
      const res = await proxy(req);

      // Should NOT be 503 — admin passes through
      expect(res.status).not.toBe(503);
    });

    it("passes OWNER token through during lockdown", async () => {
      mockGetToken.mockResolvedValue({ role: "owner" });
      const { proxy } = await loadProxy();
      const req = makeReq("/api/reports/some-id");
      const res = await proxy(req);

      expect(res.status).not.toBe(503);
    });
  });

  describe("when system is UNLOCKED", () => {
    beforeEach(() => {
      stubLockStatus(false);
    });

    it("does not divert non-admin API traffic", async () => {
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/api/campaigns/some-id");
      const res = await proxy(req);

      expect(res.status).not.toBe(503);
    });

    it("does not divert authenticated traffic", async () => {
      mockGetToken.mockResolvedValue({ role: "member" });
      const { proxy } = await loadProxy();
      const req = makeReq("/api/campaigns/some-id");
      const res = await proxy(req);

      expect(res.status).not.toBe(503);
    });
  });

  describe("lockdown-exempt paths bypass the lock check", () => {
    beforeEach(() => {
      stubLockStatus(true);
    });

    it("/api/auth/** is exempt from lockdown", async () => {
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/api/auth/session");
      const res = await proxy(req);
      expect(res.status).not.toBe(503);
    });

    it("/api/system/lock-status is exempt from lockdown", async () => {
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/api/system/lock-status");
      const res = await proxy(req);
      expect(res.status).not.toBe(503);
    });

    it("/admin/login is exempt from lockdown", async () => {
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/admin/login");
      const res = await proxy(req);
      expect(res.status).not.toBe(503);
    });
  });

  describe("checkGlobalLock fail-open", () => {
    it("does not divert traffic when lock-status fetch throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );
      mockGetToken.mockResolvedValue(null);
      const { proxy } = await loadProxy();
      const req = makeReq("/api/campaigns/some-id");
      const res = await proxy(req);

      // Fail-open: traffic passes through (not 503)
      expect(res.status).not.toBe(503);
    });
  });
});
