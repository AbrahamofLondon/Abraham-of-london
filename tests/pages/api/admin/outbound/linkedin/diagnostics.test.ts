/**
 * tests/pages/api/admin/outbound/linkedin/diagnostics.test.ts
 *
 * Tests for GET /api/admin/outbound/linkedin/diagnostics
 *
 * Tests:
 *   - Admin guard (unauthenticated → rejected)
 *   - Method guard (POST → 405)
 *   - Returns READY when connected and active
 *   - Returns NOT_CONNECTED when no connection
 *   - Returns MISSING_SCOPE when scope absent
 *   - Returns TOKEN_EXPIRED when token expired
 *   - Never returns token values
 *   - Includes failure summary
 *   - Includes profile diagnostics
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockRequireAdminApi,
  mockGetConnectionStatus,
  mockGetLinkedInAppProfileDiagnostics,
  mockGetFailureSummary,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockGetConnectionStatus: vi.fn(),
  mockGetLinkedInAppProfileDiagnostics: vi.fn(),
  mockGetFailureSummary: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

vi.mock("@/lib/outbound/linkedin-oauth", () => ({
  getConnectionStatus: mockGetConnectionStatus,
}));

vi.mock("@/lib/integrations/linkedin/linkedin-app-profile", () => ({
  getLinkedInAppProfileDiagnostics: mockGetLinkedInAppProfileDiagnostics,
}));

vi.mock("@/lib/outbound/core/outbound-publish-ledger", () => ({
  getFailureSummary: mockGetFailureSummary,
}));

import diagnosticsHandler from "@/pages/api/admin/outbound/linkedin/diagnostics";

type MockRes = NextApiResponse & { _status: number; _body: unknown };

function makeReq(method = "GET"): NextApiRequest {
  return { method, headers: {}, body: {}, cookies: {}, query: {} } as unknown as NextApiRequest;
}

function makeRes(): MockRes {
  const r = {
    _status: 200,
    _body: null as unknown,
    status(code: number) { r._status = code; return r; },
    json(body: unknown) { r._body = body; return r; },
    setHeader() { return r; },
  };
  return r as unknown as MockRes;
}

function makeConnectionStatus(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    connected: true,
    activeProfileKey: "legacy",
    ownerType: "organization",
    ownerUrn: "urn:li:organization:123",
    organisationId: "123",
    displayName: "John Doe",
    ownerName: "Abraham of London",
    scopes: ["w_organization_social", "r_organization_social", "openid", "profile", "email"],
    expiresAt: "2027-01-01T00:00:00Z",
    status: "active",
    publishingEnabled: true,
    selectedPublishingTarget: {
      profileKey: "legacy",
      ownerType: "organization",
      ownerUrn: "urn:li:organization:123",
      ownerName: "Abraham of London",
      requiredScope: "w_organization_social",
      isDefaultPublishingTarget: true,
      status: "ready",
    },
    profiles: {
      legacy: {
        profileKey: "legacy",
        configured: true,
        connected: true,
        status: "active",
        scopes: ["w_organization_social"],
        missingRequiredScopes: [],
        intendedUse: "Legacy workflows",
        memberConnection: { ownerUrn: null, displayName: null, status: "not_connected" },
        organizationConnection: { ownerUrn: "urn:li:organization:123", ownerName: "Abraham of London", status: "active" },
      },
      community: {
        profileKey: "community",
        configured: false,
        connected: false,
        status: "not_connected",
        scopes: [],
        missingRequiredScopes: ["w_organization_social"],
        intendedUse: "Community management",
        memberConnection: { ownerUrn: null, displayName: null, status: "not_connected" },
        organizationConnection: { ownerUrn: null, ownerName: null, status: "not_connected" },
      },
    },
    memberConnection: { ownerUrn: null, displayName: null, status: "not_connected" },
    message: "LinkedIn publishing target ready: Abraham of London.",
    ...overrides,
  };
}

function makeAppDiagnostics(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    activeProfile: "legacy",
    activeProfileValid: true,
    callbackRouteExpectedUrl: "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback",
    profiles: {
      legacy: {
        clientIdPresent: true,
        clientSecretPresent: true,
        redirectUriPresent: true,
        configured: true,
        requiredScopes: ["w_organization_social", "r_organization_social"],
        intendedUse: "Legacy workflows",
      },
      community: {
        clientIdPresent: false,
        clientSecretPresent: false,
        redirectUriPresent: false,
        configured: false,
        requiredScopes: ["w_organization_social"],
        intendedUse: "Community management",
      },
    },
    ...overrides,
  };
}

function makeFailureSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    failureCount: 0,
    lastFailure: null,
    lastSuccess: {
      id: "ledger-1",
      assetSlug: "w01-thesis-first-management-system",
      providerPostUrl: "https://www.linkedin.com/feed/update/urn:li:activity:123",
      createdAt: new Date("2026-05-22T10:00:00Z"),
    },
    lastDryRun: {
      id: "ledger-2",
      assetSlug: "w02-thesis-archive-no-expiry",
      createdAt: new Date("2026-05-22T09:00:00Z"),
    },
    recentBlockedReasons: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@test.com" } },
  });
  mockGetConnectionStatus.mockResolvedValue(makeConnectionStatus());
  mockGetLinkedInAppProfileDiagnostics.mockReturnValue(makeAppDiagnostics());
  mockGetFailureSummary.mockResolvedValue(makeFailureSummary());
});

describe("GET /api/admin/outbound/linkedin/diagnostics", () => {
  it("rejects unauthenticated requests", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    expect(res._body).toBeNull();
  });

  it("returns 405 for POST requests", async () => {
    const req = makeReq("POST");
    const res = makeRes();
    await diagnosticsHandler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns READY when connected and active", async () => {
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { readiness: string };
    expect(body.readiness).toBe("READY");
  });

  it("returns NOT_CONNECTED when not connected", async () => {
    mockGetConnectionStatus.mockResolvedValue(makeConnectionStatus({
      connected: false,
      status: "not_connected",
      selectedPublishingTarget: { ...makeConnectionStatus().selectedPublishingTarget, status: "not_connected" },
      message: "LinkedIn publishing target blocked: not_connected.",
    }));
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { readiness: string };
    expect(body.readiness).toBe("NOT_CONNECTED");
  });

  it("returns MISSING_SCOPE when scope absent", async () => {
    mockGetConnectionStatus.mockResolvedValue(makeConnectionStatus({
      scopes: ["openid", "profile"],
      selectedPublishingTarget: { ...makeConnectionStatus().selectedPublishingTarget, status: "required_scope_missing" },
    }));
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { readiness: string; missingScopes: string[] };
    expect(body.readiness).toBe("MISSING_SCOPE");
    expect(body.missingScopes.length).toBeGreaterThan(0);
  });

  it("returns TOKEN_EXPIRED when token expired", async () => {
    mockGetConnectionStatus.mockResolvedValue(makeConnectionStatus({
      expiresAt: "2025-01-01T00:00:00Z",
      status: "expired",
    }));
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { readiness: string };
    expect(body.readiness).toBe("TOKEN_EXPIRED");
  });

  it("returns PUBLISHING_DISABLED when publishing disabled", async () => {
    mockGetConnectionStatus.mockResolvedValue(makeConnectionStatus({
      publishingEnabled: false,
    }));
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { readiness: string };
    expect(body.readiness).toBe("PUBLISHING_DISABLED");
  });

  it("never returns token values in response", async () => {
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const raw = JSON.stringify(res._body);
    expect(raw).not.toMatch(/access_token/i);
    expect(raw).not.toMatch(/refresh_token/i);
    expect(raw).not.toMatch(/encrypted/i);
    expect(raw).not.toMatch(/client_secret/i);
    expect(raw).not.toMatch(/Bearer\s+/i);
  });

  it("includes failure summary in response", async () => {
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { recentFailures: { failureCount24h: number; lastSuccess: unknown } };
    expect(body.recentFailures).toBeDefined();
    expect(body.recentFailures.failureCount24h).toBe(0);
    expect(body.recentFailures.lastSuccess).toBeDefined();
  });

  it("includes profile diagnostics", async () => {
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { profiles: { legacy: unknown; community: unknown } };
    expect(body.profiles).toBeDefined();
    expect(body.profiles.legacy).toBeDefined();
    expect(body.profiles.community).toBeDefined();
  });

  it("includes provider field", async () => {
    const req = makeReq();
    const res = makeRes();
    await diagnosticsHandler(req, res);
    const body = res._body as { provider: string };
    expect(body.provider).toBe("linkedin");
  });
});