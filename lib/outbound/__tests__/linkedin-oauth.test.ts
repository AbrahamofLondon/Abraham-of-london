/**
 * lib/outbound/__tests__/linkedin-oauth.test.ts
 *
 * Tests for the LinkedIn OAuth and publishing service.
 *
 * Note: These tests validate logic, error handling, and validation rules.
 * They do not make real HTTP calls to LinkedIn.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Prisma — use vi.hoisted() to create mocks before hoisted vi.mock calls
// ─────────────────────────────────────────────────────────────────────────────

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
    integrationToken: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
      update: mockUpdate,
      updateMany: mockUpdateMany,
    },
  },
}));

vi.mock("@/lib/integrations/encryption", () => ({
  encrypt: (s: string) => `encrypted:${s}`,
  decrypt: (s: string) => s.replace("encrypted:", ""),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildAuthorizationUrl,
  getConnectionStatus,
  publishToLinkedIn,
} from "../linkedin-oauth";

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  process.env.LINKEDIN_CLIENT_ID = "test-client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "test-client-secret";
  process.env.LINKEDIN_ORGANIZATION_ID = "115850136";
  process.env.LINKEDIN_REDIRECT_URI = "http://localhost:3000/api/admin/outbound/linkedin/callback";
  process.env.LINKEDIN_PUBLISHING_ENABLED = "true";
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "test-encryption-key-at-least-32-chars!!";
  process.env.CSRF_SECRET = "test-csrf-secret";
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: buildAuthorizationUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("buildAuthorizationUrl", () => {
  it("should build a valid authorization URL with required scopes", () => {
    const { url, state } = buildAuthorizationUrl();

    expect(url).toContain("https://www.linkedin.com/oauth/v2/authorization");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("w_organization_social");
    expect(url).toContain("r_organization_social");
    expect(url).toContain("state=");
    expect(state).toBeDefined();
    expect(state.length).toBeGreaterThan(0);
  });

  it("should include a signed state parameter", () => {
    const { url } = buildAuthorizationUrl();
    const stateParam = new URL(url).searchParams.get("state");
    expect(stateParam).toBeDefined();
    expect(stateParam).toContain(".");
    const parts = stateParam!.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]!.length).toBeGreaterThan(0);
    expect(parts[1]!.length).toBeGreaterThan(0);
  });

  it("should throw if LINKEDIN_CLIENT_ID is missing", () => {
    delete process.env.LINKEDIN_CLIENT_ID;
    expect(() => buildAuthorizationUrl()).toThrow("LINKEDIN_CLIENT_ID");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: getConnectionStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("getConnectionStatus", () => {
  it("should return not connected when no token exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    const status = await getConnectionStatus();

    expect(status.connected).toBe(false);
    expect(status.organisationId).toBe("115850136");
    expect(status.scopes).toEqual([]);
    expect(status.expiresAt).toBeNull();
    expect(status.publishingEnabled).toBe(true);
    expect(status.message).toContain("Not connected");
  });

  it("should return connected status when active token exists", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockFindUnique.mockResolvedValue({
      id: "test-id",
      provider: "linkedin",
      organisationId: "115850136",
      accessTokenEncrypted: "encrypted:test-token",
      refreshTokenEncrypted: null,
      accessTokenExpiresAt: futureDate,
      refreshTokenExpiresAt: null,
      scopes: "w_organization_social r_organization_social",
      connectedBy: "user-1",
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      status: "active",
    });

    const status = await getConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.organisationId).toBe("115850136");
    expect(status.scopes).toContain("w_organization_social");
    expect(status.scopes).toContain("r_organization_social");
    expect(status.expiresAt).toBe(futureDate.toISOString());
    expect(status.publishingEnabled).toBe(true);
  });

  it("should return not connected when token is expired/revoked", async () => {
    mockFindUnique.mockResolvedValue({
      id: "test-id",
      provider: "linkedin",
      organisationId: "115850136",
      accessTokenEncrypted: "encrypted:test-token",
      refreshTokenEncrypted: null,
      accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refreshTokenExpiresAt: null,
      scopes: "w_organization_social",
      connectedBy: "user-1",
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      status: "revoked",
    });

    const status = await getConnectionStatus();

    expect(status.connected).toBe(false);
    expect(status.message).toContain("revoked");
  });

  it("should never return token values", async () => {
    mockFindUnique.mockResolvedValue({
      id: "test-id",
      provider: "linkedin",
      organisationId: "115850136",
      accessTokenEncrypted: "encrypted:test-token",
      refreshTokenEncrypted: "encrypted:refresh-token",
      accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refreshTokenExpiresAt: null,
      scopes: "w_organization_social",
      connectedBy: "user-1",
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      status: "active",
    });

    const status = await getConnectionStatus();

    const statusStr = JSON.stringify(status);
    expect(statusStr).not.toContain("test-token");
    expect(statusStr).not.toContain("refresh-token");
    expect(statusStr).not.toContain("encrypted:");
    expect(statusStr).not.toContain("accessTokenEncrypted");
    expect(statusStr).not.toContain("refreshTokenEncrypted");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: publishToLinkedIn
// ─────────────────────────────────────────────────────────────────────────────

describe("publishToLinkedIn", () => {
  it("should return LINKEDIN_NOT_CONNECTED when no token exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await publishToLinkedIn("Test body");

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("LINKEDIN_NOT_CONNECTED");
  });

  it("should return LINKEDIN_PUBLISHING_DISABLED when disabled", async () => {
    process.env.LINKEDIN_PUBLISHING_ENABLED = "false";

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockFindUnique.mockResolvedValue({
      id: "test-id",
      provider: "linkedin",
      organisationId: "115850136",
      accessTokenEncrypted: "encrypted:test-token",
      refreshTokenEncrypted: null,
      accessTokenExpiresAt: futureDate,
      refreshTokenExpiresAt: null,
      scopes: "w_organization_social r_organization_social",
      connectedBy: "user-1",
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      status: "active",
    });

    const result = await publishToLinkedIn("Test body");

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("LINKEDIN_PUBLISHING_DISABLED");
  });

  it("should return LINKEDIN_SCOPE_MISSING when w_organization_social is missing", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockFindUnique.mockResolvedValue({
      id: "test-id",
      provider: "linkedin",
      organisationId: "115850136",
      accessTokenEncrypted: "encrypted:test-token",
      refreshTokenEncrypted: null,
      accessTokenExpiresAt: futureDate,
      refreshTokenExpiresAt: null,
      scopes: "r_organization_social",
      connectedBy: "user-1",
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      status: "active",
    });

    const result = await publishToLinkedIn("Test body");

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("LINKEDIN_SCOPE_MISSING");
  });

  it("should not expose tokens in error messages", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await publishToLinkedIn("Test body");

    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain("test-token");
    expect(resultStr).not.toContain("encrypted:");
    expect(resultStr).not.toContain("accessTokenEncrypted");
  });
});
