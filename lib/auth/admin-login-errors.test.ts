import { describe, expect, it } from "vitest";

import { getAdminLoginErrorMessage } from "./admin-login-errors";

describe("getAdminLoginErrorMessage", () => {
  it("maps email provider misconfiguration to a specific admin-facing message", () => {
    expect(getAdminLoginErrorMessage({
      error: "EMAIL_PROVIDER_NOT_CONFIGURED",
    })).toBe(
      "Email sign-in is not configured in this environment. Use Google sign-in or configure RESEND_API_KEY.",
    );
  });

  it("uses known JSON errors instead of a generic invalid-response message", () => {
    const message = getAdminLoginErrorMessage({ error: "EMAIL_PROVIDER_NOT_CONFIGURED" });

    expect(message).not.toContain("Authentication service returned an invalid response");
  });
});
