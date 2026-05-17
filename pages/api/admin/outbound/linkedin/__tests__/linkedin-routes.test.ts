/**
 * pages/api/admin/outbound/linkedin/__tests__/linkedin-routes.test.ts
 *
 * Route handler tests for the LinkedIn API endpoints.
 * Covers admin guard enforcement, CSRF validation, token exposure prevention,
 * publish validation rules, and success/failure outcome separation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Hoisted mocks — must be declared before vi.mock calls
// ─────────────────────────────────────────────────────────────────────────────

const {
  mockRequireAdminApi,
  mockBuildAuthorizationUrl,
  mockExchangeCodeForToken,
  mockGetConnectionStatus,
  mockPublishToLinkedIn,
  mockGetLinkedInPost,
  mockMarkPostAsPosted,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockBuildAuthorizationUrl: vi.fn(),
  mockExchangeCodeForToken: vi.fn(),
  mockGetConnectionStatus: vi.fn(),
  mockPublishToLinkedIn: vi.fn(),
  mockGetLinkedInPost: vi.fn(),
  mockMarkPostAsPosted: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

vi.mock("@/lib/outbound/linkedin-oauth", () => ({
  buildAuthorizationUrl: mockBuildAuthorizationUrl,
  exchangeCodeForToken: mockExchangeCodeForToken,
  getConnectionStatus: mockGetConnectionStatus,
  publishToLinkedIn: mockPublishToLinkedIn,
}));

vi.mock("@/lib/outbound/linkedin-utils", () => ({
  getLinkedInPost: mockGetLinkedInPost,
  markPostAsPosted: mockMarkPostAsPosted,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import handlers after mocks
// ─────────────────────────────────────────────────────────────────────────────

import connectHandler from "../connect";
import callbackHandler from "../callback";
import statusHandler from "../status";
import publishHandler from "../publish";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeReq(
  overrides: Partial<NextApiRequest> = {},
): NextApiRequest {
  return {
    method: "GET",
    query: {},
    body: {},
    cookies: {},
    headers: {},
    ...overrides,
  } as NextApiRequest;
}

interface MockRes {
  _status: number;
  _body: unknown;
  _headers: Record<string, string | string[]>;
  _redirectUrl: string | null;
  status(code: number): MockRes;
  json(body: unknown): MockRes;
  redirect(code: number, url: string): MockRes;
  setHeader(name: string, value: string | string[]): MockRes;
  end(): MockRes;
}

function makeRes(): NextApiResponse & MockRes {
  const res: MockRes = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string | string[]>,
    _redirectUrl: null,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
    redirect(_code: number, url: string) {
      res._redirectUrl = url;
      return res;
    },
    setHeader(name: string, value: string | string[]) {
      res._headers[name] = value;
      return res;
    },
    end() {
      return res;
    },
  };
  return res as unknown as NextApiResponse & MockRes;
}

const adminGuard = { session: { user: { id: "admin-user-id" } } };

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LINKEDIN_PUBLISHING_ENABLED = "true";
  process.env.LINKEDIN_ORGANIZATION_ID = "115850136";

  // Default: admin guard passes
  mockRequireAdminApi.mockResolvedValue(adminGuard);
});

// ─────────────────────────────────────────────────────────────────────────────
// connect route
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/outbound/linkedin/connect", () => {
  it("requires admin — returns early when guard returns null", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await connectHandler(req, res);

    // Guard handled the response; buildAuthorizationUrl must not be called
    expect(mockBuildAuthorizationUrl).not.toHaveBeenCalled();
    expect(res._redirectUrl).toBeNull();
  });

  it("builds authorization URL with required scopes and state, then redirects", async () => {
    const fakeState = "abc123.hmac";
    const fakeUrl =
      "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=test&scope=w_organization_social+r_organization_social&state=abc123.hmac&redirect_uri=http%3A%2F%2Flocalhost";
    mockBuildAuthorizationUrl.mockReturnValue({ url: fakeUrl, state: fakeState });

    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await connectHandler(req, res);

    expect(mockBuildAuthorizationUrl).toHaveBeenCalledOnce();
    expect(res._redirectUrl).toBe(fakeUrl);
    // State cookie must be set
    const cookie = res._headers["Set-Cookie"] as string;
    expect(cookie).toContain(`linkedin_oauth_state=${fakeState}`);
    expect(cookie).toContain("HttpOnly");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// callback route
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/outbound/linkedin/callback", () => {
  it("rejects when CSRF state cookie is missing", async () => {
    const req = makeReq({
      method: "GET",
      query: { code: "auth-code", state: "some-state" },
      cookies: {}, // no linkedin_oauth_state cookie
    });
    const res = makeRes();

    await callbackHandler(req, res);

    expect(res._redirectUrl).toContain("connection=error");
    expect(res._redirectUrl).toContain("CSRF");
    expect(mockExchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("rejects when state param does not match stored cookie", async () => {
    const req = makeReq({
      method: "GET",
      query: { code: "auth-code", state: "attacker-state" },
      cookies: { linkedin_oauth_state: "real-state-value" },
    });
    const res = makeRes();

    await callbackHandler(req, res);

    expect(res._redirectUrl).toContain("connection=error");
    expect(res._redirectUrl).toContain("mismatch");
    expect(mockExchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("on success, redirects to connection=success and never includes token in redirect URL", async () => {
    const state = "valid-state.sig";
    mockExchangeCodeForToken.mockResolvedValue({ ok: true });

    const req = makeReq({
      method: "GET",
      query: { code: "auth-code", state },
      cookies: { linkedin_oauth_state: state },
    });
    const res = makeRes();

    await callbackHandler(req, res);

    expect(res._redirectUrl).toBe("/outbound/linkedin?connection=success");
    // Must not contain any token-like values in the redirect URL
    expect(res._redirectUrl).not.toContain("token");
    expect(res._redirectUrl).not.toContain("access");
  });

  it("never exposes token values in the response", async () => {
    const state = "valid-state.sig";
    mockExchangeCodeForToken.mockResolvedValue({ ok: true });

    const req = makeReq({
      method: "GET",
      query: { code: "some-code", state },
      cookies: { linkedin_oauth_state: state },
    });
    const res = makeRes();

    await callbackHandler(req, res);

    // response body should not contain token data
    const body = JSON.stringify(res._body ?? "");
    expect(body).not.toContain("access_token");
    expect(body).not.toContain("refresh_token");
    // redirect URL must not contain token fragments
    expect(res._redirectUrl ?? "").not.toMatch(/token|Bearer/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// status route
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/outbound/linkedin/status", () => {
  it("never returns token values in the response", async () => {
    mockGetConnectionStatus.mockResolvedValue({
      connected: true,
      organisationId: "115850136",
      scopes: ["w_organization_social", "r_organization_social"],
      expiresAt: "2026-06-01T00:00:00.000Z",
      publishingEnabled: true,
      message: "Connected.",
    });

    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await statusHandler(req, res);

    expect(res._status).toBe(200);
    const body = res._body as Record<string, unknown>;
    // Must not contain any token fields
    expect(body).not.toHaveProperty("accessToken");
    expect(body).not.toHaveProperty("accessTokenEncrypted");
    expect(body).not.toHaveProperty("refreshToken");
    expect(body).not.toHaveProperty("refreshTokenEncrypted");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// publish route — validation rules
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/admin/outbound/linkedin/publish", () => {
  const connectedStatus = {
    connected: true,
    organisationId: "115850136",
    scopes: ["w_organization_social", "r_organization_social"],
    expiresAt: "2026-06-01T00:00:00.000Z",
    publishingEnabled: true,
    message: "Connected.",
  };

  const readyPost = {
    isPosted: false,
    charCount: 500,
    body: "Post body content here.",
    frontmatter: {
      status: "ready",
      platform: "linkedin",
      channel: "company",
      title: "Test post",
      ctaUrl: undefined,
      ctaLabel: undefined,
    },
  };

  it("returns 503 when LINKEDIN_PUBLISHING_ENABLED is not true", async () => {
    process.env.LINKEDIN_PUBLISHING_ENABLED = "false";
    mockGetConnectionStatus.mockResolvedValue({ ...connectedStatus, publishingEnabled: false });

    const req = makeReq({ method: "POST", body: { filename: "test-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(503);
    const body = res._body as Record<string, unknown>;
    expect(body.errorCode).toBe("LINKEDIN_PUBLISHING_DISABLED");
    expect(mockPublishToLinkedIn).not.toHaveBeenCalled();
    expect(mockMarkPostAsPosted).not.toHaveBeenCalled();
  });

  it("returns error when not connected to LinkedIn", async () => {
    mockGetConnectionStatus.mockResolvedValue({
      ...connectedStatus,
      connected: false,
      message: "No active LinkedIn connection.",
    });

    const req = makeReq({ method: "POST", body: { filename: "test-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    const body = res._body as Record<string, unknown>;
    expect(body.errorCode).toBe("LINKEDIN_NOT_CONNECTED");
    expect(mockPublishToLinkedIn).not.toHaveBeenCalled();
  });

  it("refuses posts with status !== ready", async () => {
    mockGetConnectionStatus.mockResolvedValue(connectedStatus);
    mockGetLinkedInPost.mockReturnValue({
      ...readyPost,
      frontmatter: { ...readyPost.frontmatter, status: "draft" },
    });

    const req = makeReq({ method: "POST", body: { filename: "draft-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    const body = res._body as Record<string, unknown>;
    expect(body.error).toContain('"ready"');
    expect(mockPublishToLinkedIn).not.toHaveBeenCalled();
    expect(mockMarkPostAsPosted).not.toHaveBeenCalled();
  });

  it("refuses posts exceeding 3000 characters", async () => {
    mockGetConnectionStatus.mockResolvedValue(connectedStatus);
    mockGetLinkedInPost.mockReturnValue({
      ...readyPost,
      charCount: 3001,
    });

    const req = makeReq({ method: "POST", body: { filename: "long-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    const body = res._body as Record<string, unknown>;
    expect(body.error).toContain("3,001");
    expect(mockPublishToLinkedIn).not.toHaveBeenCalled();
    expect(mockMarkPostAsPosted).not.toHaveBeenCalled();
  });

  it("on publish success, calls markPostAsPosted and returns ok with linkedinPostUrl", async () => {
    mockGetConnectionStatus.mockResolvedValue(connectedStatus);
    mockGetLinkedInPost.mockReturnValue(readyPost);
    mockPublishToLinkedIn.mockResolvedValue({
      ok: true,
      linkedinPostId: "urn:li:share:7000000000000000001",
      linkedinPostUrl: "https://www.linkedin.com/feed/update/urn:li:share:7000000000000000001",
    });
    mockMarkPostAsPosted.mockReturnValue({ ok: true });

    const req = makeReq({ method: "POST", body: { filename: "ready-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(200);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.linkedinPostUrl).toBe(
      "https://www.linkedin.com/feed/update/urn:li:share:7000000000000000001",
    );
    expect(mockMarkPostAsPosted).toHaveBeenCalledOnce();
  });

  it("on publish failure, does not call markPostAsPosted and returns errorCode", async () => {
    mockGetConnectionStatus.mockResolvedValue(connectedStatus);
    mockGetLinkedInPost.mockReturnValue(readyPost);
    mockPublishToLinkedIn.mockResolvedValue({
      ok: false,
      error: "LinkedIn API returned 500.",
      errorCode: "LINKEDIN_POST_FAILED",
    });

    const req = makeReq({ method: "POST", body: { filename: "ready-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    const body = res._body as Record<string, unknown>;
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("LINKEDIN_POST_FAILED");
    // Must not mark as posted on failure
    expect(mockMarkPostAsPosted).not.toHaveBeenCalled();
  });

  it("requires admin — returns early when guard returns null", async () => {
    mockRequireAdminApi.mockResolvedValue(null);

    const req = makeReq({ method: "POST", body: { filename: "ready-post.md" } });
    const res = makeRes();

    await publishHandler(req, res);

    expect(mockGetConnectionStatus).not.toHaveBeenCalled();
    expect(mockPublishToLinkedIn).not.toHaveBeenCalled();
  });
});
