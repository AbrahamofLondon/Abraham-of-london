/**
 * tests/outbound/outbound-readiness-resolver.test.ts
 *
 * Verifies the canonical outbound provider readiness resolver.
 *
 * Tests:
 *   - X missing env => CONFIG_REQUIRED
 *   - X connected + tweet.write + HTTP 402 => CREDIT_BLOCKED
 *   - X later successful publish => READY
 *   - LinkedIn missing org scope => SCOPE_REQUIRED
 *   - LinkedIn business verification failed => BUSINESS_VERIFICATION_FAILED
 *   - Facebook missing app secret/page id => CONFIG_REQUIRED
 *   - Facebook token present but missing scope => SCOPE_REQUIRED
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks (must be before any vi.mock) ───────────────────────────────

const {
  mockGetXConnectionStatus,
  mockGetConnectionStatus,
  mockGetLinkedInOAuthSmokeDiagnostics,
  mockGetFacebookConnectionStatus,
  mockFindMany,
} = vi.hoisted(() => ({
  mockGetXConnectionStatus: vi.fn(),
  mockGetConnectionStatus: vi.fn(),
  mockGetLinkedInOAuthSmokeDiagnostics: vi.fn(),
  mockGetFacebookConnectionStatus: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/outbound/x-oauth", () => ({
  getXConnectionStatus: mockGetXConnectionStatus,
}));

vi.mock("@/lib/outbound/linkedin-oauth", () => ({
  getConnectionStatus: mockGetConnectionStatus,
  getLinkedInOAuthSmokeDiagnostics: mockGetLinkedInOAuthSmokeDiagnostics,
}));

vi.mock("@/lib/outbound/facebook-oauth", () => ({
  getFacebookConnectionStatus: mockGetFacebookConnectionStatus,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    xPublishAttempt: {
      findMany: mockFindMany,
    },
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  resolveXReadiness,
  resolveLinkedInReadiness,
  resolveFacebookReadiness,
  resolveOutboundProviderReadiness,
} from "@/lib/outbound/core/outbound-readiness-resolver";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);

  // Default: publishing enabled for all
  setEnv("X_PUBLISHING_ENABLED", "true");
  setEnv("LINKEDIN_PUBLISHING_ENABLED", "true");
  setEnv("FACEBOOK_PUBLISHING_ENABLED", "true");
});

// ─── X Tests ──────────────────────────────────────────────────────────────────

describe("X readiness resolver", () => {
  it("returns DISABLED when X_PUBLISHING_ENABLED is not true", async () => {
    setEnv("X_PUBLISHING_ENABLED", "false");
    const result = await resolveXReadiness();
    expect(result.status).toBe("DISABLED");
    expect(result.canPublish).toBe(false);
  });

  it("returns CONFIG_REQUIRED when X_CLIENT_ID is missing", async () => {
    setEnv("X_CLIENT_ID", undefined);
    const result = await resolveXReadiness();
    expect(result.status).toBe("CONFIG_REQUIRED");
    expect(result.canPublish).toBe(false);
    expect(result.evidence.some((e) => e.includes("X_CLIENT_ID"))).toBe(true);
  });

  it("returns OAUTH_REQUIRED when no token stored", async () => {
    setEnv("X_CLIENT_ID", "test-client-id");
    mockGetXConnectionStatus.mockResolvedValue({
      connected: false,
      state: "not_connected",
      scopes: [],
      missingScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      readiness: "READY_TO_CONNECT",
      canPublish: false,
    });
    const result = await resolveXReadiness();
    expect(result.status).toBe("OAUTH_REQUIRED");
    expect(result.canPublish).toBe(false);
  });

  it("returns CREDIT_BLOCKED when latest live publish returned HTTP 402", async () => {
    setEnv("X_CLIENT_ID", "test-client-id");
    mockGetXConnectionStatus.mockResolvedValue({
      connected: true,
      state: "oauth",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      missingScopes: [],
      readiness: "READY",
      canPublish: true,
    });
    mockFindMany.mockResolvedValue([
      {
        errorCode: "X_CREDIT_BLOCKED",
        status: "failed",
        dryRun: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    const result = await resolveXReadiness();
    expect(result.status).toBe("CREDIT_BLOCKED");
    expect(result.canPublish).toBe(false);
    expect(result.evidence.some((e) => e.includes("credit") || e.includes("402"))).toBe(true);
  });

  it("returns READY when connected, scopes ok, no credit blocker", async () => {
    setEnv("X_CLIENT_ID", "test-client-id");
    mockGetXConnectionStatus.mockResolvedValue({
      connected: true,
      state: "oauth",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      missingScopes: [],
      readiness: "READY",
      canPublish: true,
    });
    mockFindMany.mockResolvedValue([
      {
        errorCode: null,
        status: "succeeded",
        dryRun: false,
        createdAt: new Date(),
      },
    ]);
    const result = await resolveXReadiness();
    expect(result.status).toBe("READY");
    expect(result.canPublish).toBe(true);
  });

  it("returns READY after a later successful publish clears credit blocker", async () => {
    setEnv("X_CLIENT_ID", "test-client-id");
    mockGetXConnectionStatus.mockResolvedValue({
      connected: true,
      state: "oauth",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      missingScopes: [],
      readiness: "READY",
      canPublish: true,
    });
    // Latest attempt is a success — credit blocker is cleared
    mockFindMany.mockResolvedValue([
      {
        errorCode: null,
        status: "succeeded",
        dryRun: false,
        createdAt: new Date(),
      },
      {
        errorCode: "X_CREDIT_BLOCKED",
        status: "failed",
        dryRun: false,
        createdAt: new Date(Date.now() - 86400000),
      },
    ]);
    const result = await resolveXReadiness();
    expect(result.status).toBe("READY");
    expect(result.canPublish).toBe(true);
  });
});

// ─── LinkedIn Tests ───────────────────────────────────────────────────────────

describe("LinkedIn readiness resolver", () => {
  beforeEach(() => {
    setEnv("LINKEDIN_LEGACY_CLIENT_ID", "test-client-id");
    setEnv("LINKEDIN_LEGACY_CLIENT_SECRET", "test-secret");
    setEnv("LINKEDIN_LEGACY_REDIRECT_URI", "https://example.com/callback");
    setEnv("LINKEDIN_TOKEN_ENCRYPTION_KEY", "test-key-32-chars-minimum-here!");
    setEnv("NEXTAUTH_URL", "https://example.com");
    setEnv("LINKEDIN_ORGANIZATION_URN", "urn:li:organization:123");
  });

  it("returns DISABLED when LINKEDIN_PUBLISHING_ENABLED is not true", async () => {
    setEnv("LINKEDIN_PUBLISHING_ENABLED", "false");
    const result = await resolveLinkedInReadiness();
    expect(result.status).toBe("DISABLED");
    expect(result.canPublish).toBe(false);
  });

  it("returns CONFIG_REQUIRED when env vars missing", async () => {
    setEnv("LINKEDIN_LEGACY_CLIENT_ID", undefined);
    setEnv("LINKEDIN_CLIENT_ID", undefined);
    mockGetLinkedInOAuthSmokeDiagnostics.mockResolvedValue({
      configured: false,
      missingEnv: ["LINKEDIN_LEGACY_CLIENT_ID or LINKEDIN_CLIENT_ID"],
      requestedScopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
    });
    const result = await resolveLinkedInReadiness();
    expect(result.status).toBe("CONFIG_REQUIRED");
    expect(result.canPublish).toBe(false);
  });

  it("returns SCOPE_REQUIRED when w_organization_social is missing", async () => {
    mockGetLinkedInOAuthSmokeDiagnostics.mockResolvedValue({
      configured: true,
      missingEnv: [],
      organizationUrnConfigured: true,
      requestedScopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
    });
    mockGetConnectionStatus.mockResolvedValue({
      connected: true,
      status: "active",
      scopes: ["openid", "profile", "w_member_social"],
      selectedPublishingTarget: {
        ownerType: "organization",
        status: "required_scope_missing",
        requiredScope: "w_organization_social",
      },
    });
    const result = await resolveLinkedInReadiness();
    expect(result.status).toBe("SCOPE_REQUIRED");
    expect(result.canPublish).toBe(false);
    expect(result.missingScopes).toContain("w_organization_social");
  });

  it("returns BUSINESS_VERIFICATION_FAILED when org scope present but target not ready", async () => {
    mockGetLinkedInOAuthSmokeDiagnostics.mockResolvedValue({
      configured: true,
      missingEnv: [],
      organizationUrnConfigured: true,
      requestedScopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
    });
    mockGetConnectionStatus.mockResolvedValue({
      connected: true,
      status: "active",
      scopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
      selectedPublishingTarget: {
        ownerType: "organization",
        status: "organization_urn_missing",
      },
    });
    const result = await resolveLinkedInReadiness();
    expect(result.status).toBe("BUSINESS_VERIFICATION_FAILED");
    expect(result.canPublish).toBe(false);
  });

  it("returns READY when scope approved and org access verified", async () => {
    mockGetLinkedInOAuthSmokeDiagnostics.mockResolvedValue({
      configured: true,
      missingEnv: [],
      organizationUrnConfigured: true,
      requestedScopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
    });
    mockGetConnectionStatus.mockResolvedValue({
      connected: true,
      status: "active",
      scopes: ["openid", "profile", "w_member_social", "w_organization_social", "r_organization_social"],
      selectedPublishingTarget: {
        ownerType: "organization",
        status: "ready",
      },
      publishingEnabled: true,
    });
    const result = await resolveLinkedInReadiness();
    expect(result.status).toBe("READY");
    expect(result.canPublish).toBe(true);
  });
});

// ─── Facebook Tests ───────────────────────────────────────────────────────────

describe("Facebook readiness resolver", () => {
  it("returns DISABLED when FACEBOOK_PUBLISHING_ENABLED is not true", async () => {
    setEnv("FACEBOOK_PUBLISHING_ENABLED", "false");
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("DISABLED");
    expect(result.canPublish).toBe(false);
  });

  it("returns CONFIG_REQUIRED when FACEBOOK_APP_ID is missing", async () => {
    setEnv("FACEBOOK_APP_ID", undefined);
    setEnv("FACEBOOK_PAGE_ID", "test-page-id");
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("CONFIG_REQUIRED");
    expect(result.canPublish).toBe(false);
  });

  it("returns CONFIG_REQUIRED when FACEBOOK_PAGE_ID is missing", async () => {
    setEnv("FACEBOOK_APP_ID", "test-app-id");
    setEnv("FACEBOOK_APP_SECRET", "test-secret");
    setEnv("FACEBOOK_REDIRECT_URI", "https://example.com/callback");
    setEnv("FACEBOOK_PAGE_ID", undefined);
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("CONFIG_REQUIRED");
    expect(result.canPublish).toBe(false);
  });

  it("returns OAUTH_REQUIRED when no token stored", async () => {
    setEnv("FACEBOOK_APP_ID", "test-app-id");
    setEnv("FACEBOOK_APP_SECRET", "test-secret");
    setEnv("FACEBOOK_REDIRECT_URI", "https://example.com/callback");
    setEnv("FACEBOOK_PAGE_ID", "test-page-id");
    mockGetFacebookConnectionStatus.mockResolvedValue({
      connected: false,
      state: "not_connected",
      requiredPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      grantedPermissions: [],
      missingPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      canPublish: false,
      readiness: "NOT_CONNECTED",
    });
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("OAUTH_REQUIRED");
    expect(result.canPublish).toBe(false);
  });

  it("returns SCOPE_REQUIRED when token present but missing permissions", async () => {
    setEnv("FACEBOOK_APP_ID", "test-app-id");
    setEnv("FACEBOOK_APP_SECRET", "test-secret");
    setEnv("FACEBOOK_REDIRECT_URI", "https://example.com/callback");
    setEnv("FACEBOOK_PAGE_ID", "test-page-id");
    mockGetFacebookConnectionStatus.mockResolvedValue({
      connected: true,
      state: "oauth",
      requiredPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      grantedPermissions: ["pages_show_list"],
      missingPermissions: ["pages_manage_posts", "pages_read_engagement"],
      canPublish: false,
      readiness: "MISSING_PERMISSION",
    });
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("SCOPE_REQUIRED");
    expect(result.canPublish).toBe(false);
    expect(result.missingScopes).toContain("pages_manage_posts");
  });

  it("returns READY when all present", async () => {
    setEnv("FACEBOOK_APP_ID", "test-app-id");
    setEnv("FACEBOOK_APP_SECRET", "test-secret");
    setEnv("FACEBOOK_REDIRECT_URI", "https://example.com/callback");
    setEnv("FACEBOOK_PAGE_ID", "test-page-id");
    mockGetFacebookConnectionStatus.mockResolvedValue({
      connected: true,
      state: "oauth",
      requiredPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      grantedPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      missingPermissions: [],
      canPublish: true,
      readiness: "READY",
    });
    const result = await resolveFacebookReadiness();
    expect(result.status).toBe("READY");
    expect(result.canPublish).toBe(true);
  });
});

// ─── Unified resolver ─────────────────────────────────────────────────────────

describe("resolveOutboundProviderReadiness unified resolver", () => {
  it("routes to X resolver for provider=x", async () => {
    setEnv("X_PUBLISHING_ENABLED", "false");
    const result = await resolveOutboundProviderReadiness("x");
    expect(result.status).toBe("DISABLED");
  });

  it("routes to LinkedIn resolver for provider=linkedin", async () => {
    setEnv("LINKEDIN_PUBLISHING_ENABLED", "false");
    const result = await resolveOutboundProviderReadiness("linkedin");
    expect(result.status).toBe("DISABLED");
  });

  it("routes to Facebook resolver for provider=facebook", async () => {
    setEnv("FACEBOOK_PUBLISHING_ENABLED", "false");
    const result = await resolveOutboundProviderReadiness("facebook");
    expect(result.status).toBe("DISABLED");
  });
});
