import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockRequireAdminApi,
  mockGetConnectionStatus,
  mockGetResolvedLinkedInOutboundBySlug,
  mockPublishTextPostToLinkedIn,
  mockAttemptCreate,
  mockAttemptUpdate,
  mockAudit,
  mockCheckRateLimit,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockGetConnectionStatus: vi.fn(),
  mockGetResolvedLinkedInOutboundBySlug: vi.fn(),
  mockPublishTextPostToLinkedIn: vi.fn(),
  mockAttemptCreate: vi.fn(),
  mockAttemptUpdate: vi.fn(),
  mockAudit: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    linkedInPublishAttempt: {
      create: mockAttemptCreate,
      update: mockAttemptUpdate,
    },
  },
}));

vi.mock("@/lib/outbound/linkedin-oauth", () => ({
  getConnectionStatus: mockGetConnectionStatus,
}));

vi.mock("@/lib/outbound/linkedin-content-resolver", () => ({
  getResolvedLinkedInOutboundBySlug: mockGetResolvedLinkedInOutboundBySlug,
}));

vi.mock("@/lib/outbound/linkedin-publishing-client", () => ({
  publishTextPostToLinkedIn: mockPublishTextPostToLinkedIn,
}));

vi.mock("@/lib/outbound/linkedin-publishing-audit", () => ({
  recordLinkedInPublishingAuditSafe: mockAudit,
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitHeaders: () => ({}),
}));

import publishHandler from "@/pages/api/admin/outbound/linkedin/publish";

function makeReq(body: Record<string, unknown>, method = "POST"): NextApiRequest {
  return {
    method,
    body,
    headers: {},
    query: {},
    cookies: {},
  } as NextApiRequest;
}

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
  _headers: Record<string, string | number | string[]>;
};

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string | number | string[]>,
    status(code: number) {
      response._status = code;
      return response;
    },
    json(body: unknown) {
      response._body = body;
      return response;
    },
    setHeader(name: string, value: string | number | string[]) {
      response._headers[name] = value;
      return response;
    },
  };
  return response as unknown as MockRes;
}

const activeConnection = {
  connected: true,
  status: "active",
  ownerType: "organization",
  ownerUrn: "urn:li:organization:115850136",
  ownerName: "Abraham of London",
  organizationId: "115850136",
  scopes: ["openid", "profile", "w_member_social", "w_organization_social"],
  publishingEnabled: true,
  expiresAt: "2026-06-01T00:00:00.000Z",
  displayName: "Abraham",
  selectedPublishingTarget: {
    ownerType: "organization",
    ownerUrn: "urn:li:organization:115850136",
    ownerName: "Abraham of London",
    requiredScope: "w_organization_social",
    isDefaultPublishingTarget: true,
    status: "ready",
  },
  memberConnection: {
    ownerUrn: "urn:li:person:abc",
    displayName: "Abraham Adaramola",
    status: "active",
  },
  message: "Connected.",
};

const linkedIn6 = {
  slug: "06-execution-problem-vs-authority-problem",
  filename: "06-execution-problem-vs-authority-problem.mdx",
  title: "Execution Problem vs Authority Problem",
  body: "Not every execution problem is an execution problem.",
  charCount: 52,
  isPosted: false,
  item: {
    title: "Execution Problem vs Authority Problem",
    sequence: 6,
    channel: "linkedin",
    contentType: "post",
    status: "ready",
    draft: false,
    published: true,
    date: "2026-05-19",
    category: "Outbound",
    tier: "public",
    claimRisk: "LOW",
    body: "Not every execution problem is an execution problem.",
    filename: "06-execution-problem-vs-authority-problem.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@abrahamoflondon.org" } },
  });
  mockGetConnectionStatus.mockResolvedValue(activeConnection);
  mockGetResolvedLinkedInOutboundBySlug.mockReturnValue(linkedIn6);
  mockAttemptCreate.mockResolvedValue({ id: "attempt-1" });
  mockAttemptUpdate.mockResolvedValue({});
  mockAudit.mockResolvedValue({ ok: true });
  // Rate limiter: allow by default; individual tests can override for 429 scenarios
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600_000 });
});

describe("POST /api/admin/outbound/linkedin/publish", () => {
  it("denies unauthenticated/admin-missing requests", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(mockGetConnectionStatus).not.toHaveBeenCalled();
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });

  it("returns 409 and records blocked attempt for blocked item", async () => {
    mockGetConnectionStatus.mockResolvedValue({
      ...activeConnection,
      connected: false,
      status: "revoked",
      scopes: [],
      selectedPublishingTarget: {
        ...activeConnection.selectedPublishingTarget,
        status: "not_connected",
      },
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(409);
    expect(mockAttemptCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "blocked" }),
    }));
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });

  it("successful publish records attempt and returns manual metadata", async () => {
    mockPublishTextPostToLinkedIn.mockResolvedValue({
      ok: true,
      status: "succeeded",
      postUrn: "urn:li:share:123",
      postUrl: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A123",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(200);
    const body = res._body as Record<string, any>;
    expect(body.ok).toBe(true);
    expect(body.manualMetadata.status).toBe("posted");
    expect(mockAttemptCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "pending" }),
    }));
    expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "succeeded" }),
    }));
    expect(mockPublishTextPostToLinkedIn).toHaveBeenCalledWith(expect.objectContaining({
      ownerType: "organization",
    }));
  });

  it("provider 401 returns safe error and no token-shaped response", async () => {
    mockPublishTextPostToLinkedIn.mockResolvedValue({
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_TOKEN_INVALID",
      safeMessage: "LinkedIn token is invalid or expired. Reconnect LinkedIn.",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    const text = JSON.stringify(res._body);
    expect(text).toContain("LINKEDIN_TOKEN_INVALID");
    expect(text).not.toMatch(/Bearer|access_token|refresh_token|encrypted/i);
  });

  it("provider 429 returns rate-limit safe error", async () => {
    mockPublishTextPostToLinkedIn.mockResolvedValue({
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_RATE_LIMITED",
      safeMessage: "LinkedIn rate limit reached. Wait before trying again.",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(429);
    expect(JSON.stringify(res._body)).toContain("LINKEDIN_RATE_LIMITED");
  });

  it("Q2 draft post cannot be published", async () => {
    mockGetResolvedLinkedInOutboundBySlug.mockReturnValue({
      ...linkedIn6,
      slug: "a-new-market-reality-why-Q2-2026-matters",
      item: {
        ...linkedIn6.item,
        title: "A new market reality - why Q2 2026 matters",
        status: "draft",
        draft: true,
        published: false,
        linkedReportId: "GMI-Q2-2026",
        requiresLifecycleCheck: true,
        publicationGate: "Publish only after GMI-Q2-2026 is active",
        claimRisk: "MEDIUM",
      },
    });
    const req = makeReq({ slug: "a-new-market-reality-why-Q2-2026-matters", confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(409);
    expect(JSON.stringify(res._body)).toContain("GMI-Q2-2026");
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });
});
