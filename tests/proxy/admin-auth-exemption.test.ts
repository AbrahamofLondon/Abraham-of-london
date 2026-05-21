/**
 * tests/proxy/admin-auth-exemption.test.ts
 *
 * Verifies that the proxy PUBLIC_PREFIXES correctly exempts admin auth
 * bootstrap endpoints while keeping privileged admin APIs protected.
 */

import { describe, expect, it } from "vitest";

import { isProxyAdminRole, isPublicPath } from "@/proxy";

describe("proxy admin-auth bootstrap exemption", () => {
  it("bypasses /api/admin/auth/send-link", () => {
    expect(isPublicPath("/api/admin/auth/send-link")).toBe(true);
  });

  it("bypasses /api/admin/auth/verify", () => {
    expect(isPublicPath("/api/admin/auth/verify")).toBe(true);
  });

  it("bypasses /api/admin/auth/callback", () => {
    expect(isPublicPath("/api/admin/auth/callback")).toBe(true);
  });

  it("bypasses /api/admin/auth/reset-rate-limit", () => {
    expect(isPublicPath("/api/admin/auth/reset-rate-limit")).toBe(true);
  });

  it("does NOT bypass /api/admin/outbound/linkedin/publish", () => {
    expect(isPublicPath("/api/admin/outbound/linkedin/publish")).toBe(false);
  });

  it("does NOT bypass /api/admin/outbound/linkedin/status", () => {
    expect(isPublicPath("/api/admin/outbound/linkedin/status")).toBe(false);
  });

  it("does NOT bypass /admin/intelligence/gmi-signal-monitor", () => {
    expect(isPublicPath("/admin/intelligence/gmi-signal-monitor")).toBe(false);
  });

  it("does NOT bypass /admin/outbound/linkedin", () => {
    expect(isPublicPath("/admin/outbound/linkedin")).toBe(false);
  });

  it("still bypasses /admin/login", () => {
    expect(isPublicPath("/admin/login")).toBe(true);
  });

  it("still bypasses /api/auth paths (NextAuth callbacks)", () => {
    expect(isPublicPath("/api/auth/session")).toBe(true);
    expect(isPublicPath("/api/auth/callback/google")).toBe(true);
  });

  it("accepts normalized admin and owner roles for protected admin routing", () => {
    expect(isProxyAdminRole("ADMIN")).toBe(true);
    expect(isProxyAdminRole("admin")).toBe(true);
    expect(isProxyAdminRole("owner")).toBe(true);
  });
});
