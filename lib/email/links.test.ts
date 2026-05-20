import { afterEach, describe, expect, it, vi } from "vitest";

describe("EmailLinks admin verify origin", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("uses localhost when NEXTAUTH_URL is local", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.abrahamoflondon.org");
    const { EmailLinks } = await import("./links");

    expect(EmailLinks.adminVerify("token", "admin@example.com", "/admin")).toContain(
      "http://localhost:3000/api/admin/auth/verify",
    );
  });

  it("uses production origin when NEXTAUTH_URL is production", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://www.abrahamoflondon.org");
    const { EmailLinks } = await import("./links");

    expect(EmailLinks.adminVerify("token", "admin@example.com", "/admin")).toContain(
      "https://www.abrahamoflondon.org/api/admin/auth/verify",
    );
  });
});
