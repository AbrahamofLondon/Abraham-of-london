import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockFindMany, mockUpsert, mockUpdate, mockUpdateMany } = vi.hoisted(
  () => ({
    mockFindUnique: vi.fn(),
    mockFindMany: vi.fn(),
    mockUpsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockUpdateMany: vi.fn(),
  }),
);

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    linkedInPublishingConnection: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      upsert: mockUpsert,
      update: mockUpdate,
      updateMany: mockUpdateMany,
    },
  },
}));

vi.mock("../linkedin-token-encryption", () => ({
  encryptLinkedInToken: (value: string) => `encrypted:${value}`,
  decryptLinkedInToken: (value: string) => value.replace("encrypted:", ""),
}));

import {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getConnectionStatus,
  getLinkedInAccessToken,
  readLinkedInOAuthState,
  validateLinkedInOAuthState,
} from "../linkedin-oauth";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LINKEDIN_CLIENT_ID = "test-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "test-client-secret";
  process.env.LINKEDIN_REDIRECT_URI = "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback";
  process.env.LINKEDIN_OAUTH_SCOPES = "openid profile w_member_social w_organization_social r_organization_social";
  process.env.LINKEDIN_DEFAULT_OWNER_TYPE = "organization";
  process.env.LINKEDIN_ORGANIZATION_URN = "urn:li:organization:115850136";
  process.env.LINKEDIN_PUBLISHING_ENABLED = "true";
  process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = "test-linkedin-token-key-at-least-32-characters";
  process.env.CSRF_SECRET = "test-csrf-secret";
  process.env.LINKEDIN_ACTIVE_PROFILE = "legacy";
  process.env.LINKEDIN_COMMUNITY_CLIENT_ID = "community-client-id";
  process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET = "community-client-secret";
  process.env.LINKEDIN_COMMUNITY_REDIRECT_URI =
    "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback";
});

describe("LinkedIn OAuth connection", () => {
  it("builds OAuth authorization URL with member and organization scopes", () => {
    const { url, state } = buildAuthorizationUrl();
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://www.linkedin.com/oauth/v2/authorization");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
    expect(parsed.searchParams.get("scope")).toBe("openid profile w_member_social w_organization_social r_organization_social");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(state).toContain(".");
  });

  it("validates signed OAuth state", () => {
    const { state } = buildAuthorizationUrl();
    expect(validateLinkedInOAuthState(state, state)).toBe(true);
    expect(validateLinkedInOAuthState(`${state}x`, state)).toBe(false);
  });

  it("builds Community OAuth state and URL from the selected app profile", () => {
    const { url, state } = buildAuthorizationUrl("community");
    const parsed = new URL(url);
    const payload = readLinkedInOAuthState(state, state);

    expect(parsed.searchParams.get("client_id")).toBe("community-client-id");
    expect(parsed.searchParams.get("scope")).toContain("r_organization_admin");
    expect(payload?.profileKey).toBe("community");
    expect(readLinkedInOAuthState(`${state}x`, state)).toBeNull();
  });

  it("returns safe not-connected status", async () => {
    mockFindMany.mockResolvedValue([]);

    const status = await getConnectionStatus();

    expect(status.connected).toBe(false);
    expect(status.ownerType).toBe("organization");
    expect(status.scopes).toEqual([]);
    expect(JSON.stringify(status)).not.toContain("encrypted:");
  });

  it("returns connected status without token values", async () => {
    const future = new Date(Date.now() + 86400 * 1000);
    mockFindMany.mockResolvedValue([
      {
        id: "member-conn",
        provider: "linkedin",
        profileKey: "legacy",
        ownerType: "member",
        ownerUrn: "urn:li:person:abc",
        ownerName: "Abraham",
        displayName: "Abraham",
        isDefaultPublishingTarget: false,
        requiredScope: "w_member_social",
        encryptedAccessToken: "encrypted:access-token",
        encryptedRefreshToken: "encrypted:refresh-token",
        expiresAt: future,
        scope: "openid profile w_member_social w_organization_social r_organization_social",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastVerifiedAt: new Date(),
      },
      {
      id: "conn-1",
      provider: "linkedin",
      profileKey: "legacy",
      ownerType: "organization",
      ownerUrn: "urn:li:organization:115850136",
      ownerName: "Abraham of London",
      displayName: "Abraham of London",
      isDefaultPublishingTarget: true,
      requiredScope: "w_organization_social",
      encryptedAccessToken: "encrypted:access-token",
      encryptedRefreshToken: "encrypted:refresh-token",
      expiresAt: future,
      scope: "openid profile w_member_social w_organization_social r_organization_social",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVerifiedAt: new Date(),
      },
    ]);

    const status = await getConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.ownerUrn).toBe("urn:li:organization:115850136");
    expect(status.scopes).toContain("w_organization_social");
    expect(JSON.stringify(status)).not.toContain("access-token");
    expect(JSON.stringify(status)).not.toContain("refresh-token");
  });

  it("stores exchanged token encrypted", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "plain-access-token",
          expires_in: 3600,
          scope: "openid profile w_member_social w_organization_social r_organization_social",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: "abc", name: "Abraham" }),
      }));

    const result = await exchangeCodeForToken("code", "admin-1");

    expect(result.ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        ownerType: "member",
        profileKey: "legacy",
        ownerUrn: "urn:li:person:abc",
        encryptedAccessToken: "encrypted:plain-access-token",
      }),
    }));
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        ownerType: "organization",
        profileKey: "legacy",
        ownerUrn: "urn:li:organization:115850136",
        requiredScope: "w_organization_social",
      }),
    }));
  });

  it("decrypts access token server-side only", async () => {
    mockFindMany.mockResolvedValue([{
      id: "conn-1",
      profileKey: "legacy",
      ownerType: "organization",
      ownerUrn: "urn:li:organization:115850136",
      ownerName: "Abraham of London",
      displayName: "Abraham of London",
      encryptedAccessToken: "encrypted:access-token",
      expiresAt: new Date(Date.now() + 86400 * 1000),
      scope: "openid profile w_member_social w_organization_social",
      status: "active",
    }]);

    const token = await getLinkedInAccessToken();

    expect(token?.accessToken).toBe("access-token");
    expect(token?.ownerUrn).toBe("urn:li:organization:115850136");
  });
});
