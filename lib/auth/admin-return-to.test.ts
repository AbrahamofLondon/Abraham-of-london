import { describe, expect, it } from "vitest";

import { normalizeAdminReturnTo } from "./admin-return-to";

describe("normalizeAdminReturnTo", () => {
  it("decodes a double-encoded local admin path", () => {
    expect(normalizeAdminReturnTo("%252Fadmin%252Foutbound%252Flinkedin")).toBe(
      "/admin/outbound/linkedin",
    );
  });

  it("rejects external URLs", () => {
    expect(normalizeAdminReturnTo("https://evil.example/admin")).toBe("/admin");
    expect(normalizeAdminReturnTo("https%3A%2F%2Fevil.example%2Fadmin")).toBe("/admin");
  });

  it("rejects protocol-relative URLs", () => {
    expect(normalizeAdminReturnTo("//evil.example/admin")).toBe("/admin");
    expect(normalizeAdminReturnTo("%2F%2Fevil.example%2Fadmin")).toBe("/admin");
  });

  it("preserves safe local paths with query strings", () => {
    expect(normalizeAdminReturnTo("/admin/outbound/linkedin?tab=ready")).toBe(
      "/admin/outbound/linkedin?tab=ready",
    );
  });
});
