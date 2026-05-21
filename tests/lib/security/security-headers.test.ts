import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SECURITY_CONFIG,
  createSecurityHeaders,
} from "@/lib/security/index";

describe("createSecurityHeaders", () => {
  it("does not emit HSTS outside production even when enabled by config", () => {
    vi.stubEnv("NODE_ENV", "development");

    const headers = createSecurityHeaders({
      ...DEFAULT_SECURITY_CONFIG,
      hsts: {
        ...DEFAULT_SECURITY_CONFIG.hsts,
        enabled: true,
      },
    });

    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });
});
