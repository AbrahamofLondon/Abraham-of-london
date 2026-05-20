import { describe, expect, it } from "vitest";

import {
  getResolvedAdminEmails,
  isResolvedAdminEmail,
} from "./admin-email-resolver";

describe("admin email resolver", () => {
  it("normalises and parses ADMIN_USER_EMAILS", () => {
    const emails = getResolvedAdminEmails({
      ADMIN_USER_EMAILS: " Operator@Example.com, second@example.com; THIRD@example.com ",
    } as unknown as NodeJS.ProcessEnv);

    expect(emails).toContain("operator@example.com");
    expect(emails).toContain("second@example.com");
    expect(emails).toContain("third@example.com");
  });

  it("keeps hardcoded bootstrap addresses", () => {
    expect(isResolvedAdminEmail("INFO@ABRAHAMOFLONDON.ORG", {} as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(isResolvedAdminEmail("reader@example.com", {} as unknown as NodeJS.ProcessEnv)).toBe(false);
  });

  it("authorises ADMIN_USER_EMAILS values without exposing the list publicly", () => {
    expect(isResolvedAdminEmail("operator@example.com", {
      ADMIN_USER_EMAILS: "operator@example.com",
    } as unknown as NodeJS.ProcessEnv)).toBe(true);
  });
});
