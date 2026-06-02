import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    linkedInPublishingConnection: {
      findMany: mockFindMany,
    },
  },
}));

import { getLinkedInOAuthSmokeDiagnostics } from "@/lib/outbound/linkedin-oauth";

const LINKEDIN_ENV = [
  "LINKEDIN_LEGACY_CLIENT_ID",
  "LINKEDIN_LEGACY_CLIENT_SECRET",
  "LINKEDIN_LEGACY_REDIRECT_URI",
  "LINKEDIN_LEGACY_OAUTH_SCOPES",
  "LINKEDIN_CLIENT_ID",
  "LINKEDIN_CLIENT_SECRET",
  "LINKEDIN_REDIRECT_URI",
  "LINKEDIN_OAUTH_SCOPES",
  "LINKEDIN_TOKEN_ENCRYPTION_KEY",
  "LINKEDIN_ORGANIZATION_URN",
  "LINKEDIN_DEFAULT_OWNER_TYPE",
  "LINKEDIN_ACTIVE_PROFILE",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "CSRF_SECRET",
] as const;

function clearLinkedInEnv() {
  for (const key of LINKEDIN_ENV) {
    delete process.env[key];
  }
}

function configureLinkedInEnv() {
  process.env.LINKEDIN_ACTIVE_PROFILE = "legacy";
  process.env.LINKEDIN_LEGACY_CLIENT_ID = "legacy-client-id";
  process.env.LINKEDIN_LEGACY_CLIENT_SECRET = "legacy-client-secret";
  process.env.LINKEDIN_LEGACY_REDIRECT_URI =
    "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback";
  process.env.LINKEDIN_LEGACY_OAUTH_SCOPES =
    "openid profile email w_member_social w_organization_social";
  process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY =
    "test-linkedin-token-key-at-least-32-characters";
  process.env.LINKEDIN_ORGANIZATION_URN = "urn:li:organization:115850136";
  process.env.LINKEDIN_DEFAULT_OWNER_TYPE = "organization";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.CSRF_SECRET = "test-csrf-secret";
}

beforeEach(() => {
  vi.clearAllMocks();
  clearLinkedInEnv();
  mockFindMany.mockResolvedValue([]);
});

describe("admin outbound LinkedIn smoke diagnostics", () => {
  it("reports the requested smoke contract without secrets", async () => {
    configureLinkedInEnv();

    const diagnostics = await getLinkedInOAuthSmokeDiagnostics();

    expect(diagnostics).toMatchObject({
      configured: true,
      missingEnv: [],
      redirectUri: "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback",
      authStartReachable: true,
      callbackConfigured: true,
      organizationUrnConfigured: true,
      tokenRecordExists: false,
      tokenExpired: null,
      readiness: "READY_TO_CONNECT",
    });
    expect(diagnostics.requestedScopes).toContain("w_organization_social");
    expect(JSON.stringify(diagnostics)).not.toMatch(/legacy-client-secret|access_token|refresh_token|encrypted/i);
  });

  it("distinguishes organisation URN missing from generic config missing", async () => {
    configureLinkedInEnv();
    delete process.env.LINKEDIN_ORGANIZATION_URN;

    const diagnostics = await getLinkedInOAuthSmokeDiagnostics();

    expect(diagnostics.missingEnv).toContain("LINKEDIN_ORGANIZATION_URN");
    expect(diagnostics.organizationUrnConfigured).toBe(false);
    expect(diagnostics.readiness).toBe("ORG_URN_MISSING");
  });

  it("reports missing critical configuration before OAuth start is considered ready", async () => {
    configureLinkedInEnv();
    delete process.env.LINKEDIN_LEGACY_CLIENT_SECRET;

    const diagnostics = await getLinkedInOAuthSmokeDiagnostics();

    expect(diagnostics.configured).toBe(false);
    expect(diagnostics.missingEnv).toContain("LINKEDIN_LEGACY_CLIENT_SECRET or LINKEDIN_CLIENT_SECRET");
    expect(diagnostics.authStartReachable).toBe(false);
    expect(diagnostics.readiness).toBe("CONFIG_MISSING");
  });
});
