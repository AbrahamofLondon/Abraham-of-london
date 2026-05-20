import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpsert, mockUpdate, mockUpdateMany } = vi.hoisted(
  () => ({
    mockFindUnique: vi.fn(),
    mockUpsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockUpdateMany: vi.fn(),
  }),
);

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    linkedInPublishingConnection: {
      findUnique: mockFindUnique,
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
  validateLinkedInOAuthState,
} from "../linkedin-oauth";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LINKEDIN_CLIENT_ID = "test-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "test-client-secret";
  process.env.LINKEDIN_REDIRECT_URI = "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback";
  process.env.LINKEDIN_OAUTH_SCOPES = "openid profile w_member_social";
  process.env.LINKEDIN_PUBLISHING_ENABLED = "true";
  process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = "test-linkedin-token-key-at-least-32-characters";
  process.env.CSRF_SECRET = "test-csrf-secret";
});

describe("LinkedIn OAuth connection", () => {
  it("builds member-profile OAuth authorization URL with minimal scopes", () => {
    const { url, state } = buildAuthorizationUrl();
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://www.linkedin.com/oauth/v2/authorization");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
    expect(parsed.searchParams.get("scope")).toBe("openid profile w_member_social");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(state).toContain(".");
  });

  it("validates signed OAuth state", () => {
    const { state } = buildAuthorizationUrl();
    expect(validateLinkedInOAuthState(state, state)).toBe(true);
    expect(validateLinkedInOAuthState(`${state}x`, state)).toBe(false);
  });

  it("returns safe not-connected status", async () => {
    mockFindUnique.mockResolvedValue(null);

    const status = await getConnectionStatus();

    expect(status.connected).toBe(false);
    expect(status.ownerType).toBe("member");
    expect(status.scopes).toEqual([]);
    expect(JSON.stringify(status)).not.toContain("encrypted:");
  });

  it("returns connected status without token values", async () => {
    mockFindUnique.mockResolvedValue({
      id: "conn-1",
      provider: "linkedin",
      ownerType: "member",
      ownerUrn: "urn:li:person:abc",
      displayName: "Abraham",
      encryptedAccessToken: "encrypted:access-token",
      encryptedRefreshToken: "encrypted:refresh-token",
      expiresAt: new Date(Date.now() + 86400 * 1000),
      scope: "openid profile w_member_social",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVerifiedAt: new Date(),
    });

    const status = await getConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.ownerUrn).toBe("urn:li:person:abc");
    expect(status.scopes).toContain("w_member_social");
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
          scope: "openid profile w_member_social",
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
        ownerUrn: "urn:li:person:abc",
        encryptedAccessToken: "encrypted:plain-access-token",
      }),
    }));
  });

  it("decrypts access token server-side only", async () => {
    mockFindUnique.mockResolvedValue({
      id: "conn-1",
      ownerUrn: "urn:li:person:abc",
      encryptedAccessToken: "encrypted:access-token",
      expiresAt: new Date(Date.now() + 86400 * 1000),
      scope: "openid profile w_member_social",
      status: "active",
    });

    const token = await getLinkedInAccessToken();

    expect(token?.accessToken).toBe("access-token");
    expect(token?.ownerUrn).toBe("urn:li:person:abc");
  });
});
