import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getActiveLinkedInProfileKey,
  getLinkedInAppProfileDiagnostics,
  resolveLinkedInAppProfile,
} from "./linkedin-app-profile";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://www.abrahamoflondon.org";
  process.env.LINKEDIN_CLIENT_ID = "";
  process.env.LINKEDIN_CLIENT_SECRET = "";
  process.env.LINKEDIN_REDIRECT_URI = "";
  process.env.LINKEDIN_LEGACY_CLIENT_ID = "legacy-id";
  process.env.LINKEDIN_LEGACY_CLIENT_SECRET = "legacy-secret";
  process.env.LINKEDIN_LEGACY_REDIRECT_URI =
    "https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback";
  process.env.LINKEDIN_COMMUNITY_CLIENT_ID = "community-id";
  process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET = "community-secret";
  process.env.LINKEDIN_COMMUNITY_REDIRECT_URI =
    "https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("LinkedIn application profiles", () => {
  it("resolves the Community Management profile with narrow organisation scopes", () => {
    const profile = resolveLinkedInAppProfile("community");

    expect(profile.clientId).toBe("community-id");
    expect(profile.requiredScopes).toEqual([
      "openid",
      "profile",
      "email",
      "r_organization_admin",
      "r_organization_social",
      "w_organization_social",
    ]);
    expect(profile.requiredScopes.join(" ")).not.toMatch(/ads|events/i);
  });

  it("resolves the legacy profile from profile-based variables", () => {
    const profile = resolveLinkedInAppProfile("legacy");

    expect(profile.profileKey).toBe("legacy");
    expect(profile.clientId).toBe("legacy-id");
    expect(profile.clientSecret).toBe("legacy-secret");
  });

  it("defaults active publishing to legacy until a valid profile is selected", () => {
    delete process.env.LINKEDIN_ACTIVE_PROFILE;
    expect(getActiveLinkedInProfileKey()).toBe("legacy");

    process.env.LINKEDIN_ACTIVE_PROFILE = "pending-community-approval";
    expect(getActiveLinkedInProfileKey()).toBe("legacy");
  });

  it("fails safely when the selected profile is incomplete", () => {
    process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET = "";

    expect(() => resolveLinkedInAppProfile("community")).toThrow(
      "LinkedIn community application profile is incomplete.",
    );
  });

  it("returns diagnostics without secret values", () => {
    const diagnostics = getLinkedInAppProfileDiagnostics();
    const text = JSON.stringify(diagnostics);

    expect(diagnostics.profiles.community.clientSecretPresent).toBe(true);
    expect(text).not.toContain("community-secret");
    expect(text).not.toContain("legacy-secret");
  });
});
