/**
 * tests/pages/api/admin/outbound/linkedin/publish.test.ts
 *
 * Unit tests for POST /api/admin/outbound/linkedin/publish
 *
 * Tests:
 *   - Admin guard (unauthenticated → rejected)
 *   - Idempotency: duplicate publish blocked
 *   - dryRun does not consume rate limit
 *   - Gate blocks with 409
 *   - Successful publish writes PUBLISHED ledger row
 *   - Failed publish writes FAILED ledger row
 *   - Provider 401 returns safe error
 *   - Provider 429 returns rate-limit safe error
 *   - Q2 draft post cannot be published
 *   - Token expiry blocks publish
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockRequireAdminApi,
  mockRequireTierApi,
  mockGetConnectionStatus,
  mockGetResolvedLinkedInOutboundBySlug,
  mockPublishTextPostToLinkedIn,
  mockAudit,
  mockCheckRateLimit,
  mockCreateLedgerEntry,
  mockClaimPublishSlot,
  mockCompletePublishSlot,
  mockMarkPostAsPosted,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockRequireTierApi: vi.fn(),
  mockGetConnectionStatus: vi.fn(),
  mockGetResolvedLinkedInOutboundBySlug: vi.fn(),
  mockPublishTextPostToLinkedIn: vi.fn(),
  mockAudit: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockCreateLedgerEntry: vi.fn(),
  mockClaimPublishSlot: vi.fn(),
  mockCompletePublishSlot: vi.fn(),
  mockMarkPostAsPosted: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
  requireTierApi: mockRequireTierApi,
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

vi.mock("@/lib/outbound/core/outbound-publish-ledger", () => ({
  createLedgerEntry: mockCreateLedgerEntry,
  claimPublishSlot: mockClaimPublishSlot,
  completePublishSlot: mockCompletePublishSlot,
  getItemPublishStatus: vi.fn(),
}));

vi.mock("@/lib/outbound/linkedin-utils", () => ({
  markPostAsPosted: mockMarkPostAsPosted,
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
  organisationId: "115850136",
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
    campaign: "decision-authority-infrastructure-launch",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@abrahamoflondon.org" } },
  });
  mockRequireTierApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@abrahamoflondon.org" } },
    access: { tier: "owner" },
  });
  mockGetConnectionStatus.mockResolvedValue(activeConnection);
  mockGetResolvedLinkedInOutboundBySlug.mockReturnValue(linkedIn6);
  mockAudit.mockResolvedValue({ ok: true });
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600_000 });
  mockCreateLedgerEntry.mockResolvedValue({ id: "ledger-1" });
  mockClaimPublishSlot.mockResolvedValue({
    claimed: true,
    entry: { id: "claimed-slot-1", status: "IN_PROGRESS" },
  });
  mockCompletePublishSlot.mockResolvedValue({ id: "claimed-slot-1", status: "PUBLISHED" });
  mockMarkPostAsPosted.mockReturnValue({ ok: true });
});

describe("POST /api/admin/outbound/linkedin/publish", () => {
  // ── Auth ───────────────────────────────────────────────────────────────────

  it("denies unauthenticated/admin-missing requests", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(mockGetConnectionStatus).not.toHaveBeenCalled();
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });

  // ── Idempotency ────────────────────────────────────────────────────────────

  it("blocks duplicate publish with 409", async () => {
    mockClaimPublishSlot.mockResolvedValue({
      claimed: false,
      entry: {
        id: "existing-ledger-1",
        status: "PUBLISHED",
        providerPostId: "urn:li:share:123",
        providerPostUrl: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A123",
        completedAt: new Date(),
      },
      reason: "Item already published (ledger ID: existing-ledger-1).",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(409);
    expect(JSON.stringify(res._body)).toContain("already been published");
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });

  it("allows forceRepublish with owner privileges", async () => {
    mockClaimPublishSlot.mockResolvedValue({
      claimed: false,
      entry: {
        id: "existing-ledger-1",
        status: "PUBLISHED",
        providerPostId: "urn:li:share:123",
        providerPostUrl: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A123",
        completedAt: new Date(),
      },
      reason: "Item already published.",
    });
    mockPublishTextPostToLinkedIn.mockResolvedValue({
      ok: true,
      status: "succeeded",
      postUrn: "urn:li:share:456",
      postUrl: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A456",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true, forceRepublish: true, forceRepublishNote: "Owner override" });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(200);
    expect(mockPublishTextPostToLinkedIn).toHaveBeenCalled();
  });

  // ── dryRun ─────────────────────────────────────────────────────────────────

  it("dryRun does not consume rate limit quota", async () => {
    const req = makeReq({ slug: linkedIn6.slug, confirm: true, dryRun: true });
    const res = makeRes();

    await publishHandler(req, res);

    // Rate limit should NOT have been checked for dryRun
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(res._status).toBe(200);
    const body = res._body as Record<string, any>;
    expect(body.dryRun).toBe(true);
    // dryRun writes DRY_RUN ledger entry
    expect(mockCreateLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ status: "DRY_RUN" }),
    );
  });

  // ── Gate ───────────────────────────────────────────────────────────────────

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
    expect(mockCreateLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ status: "BLOCKED" }),
    );
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });

  // ── Successful publish ─────────────────────────────────────────────────────

  it("successful publish writes PUBLISHED ledger row", async () => {
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
    // Should have completed the claimed slot as PUBLISHED
    expect(mockCompletePublishSlot).toHaveBeenCalledWith(
      "claimed-slot-1",
      "PUBLISHED",
      expect.objectContaining({ providerPostId: "urn:li:share:123" }),
    );
    // Should have attempted file writeback
    expect(mockMarkPostAsPosted).toHaveBeenCalled();
  });

  // ── Failed publish ─────────────────────────────────────────────────────────

  it("failed publish writes FAILED ledger row", async () => {
    mockPublishTextPostToLinkedIn.mockResolvedValue({
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_POST_FAILED",
      safeMessage: "LinkedIn publishing failed.",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(400);
    expect(mockCompletePublishSlot).toHaveBeenCalledWith(
      "claimed-slot-1",
      "FAILED",
      expect.objectContaining({ errorCode: "LINKEDIN_POST_FAILED" }),
    );
  });

  // ── Provider errors ────────────────────────────────────────────────────────

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

  // ── Q2 draft ───────────────────────────────────────────────────────────────

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

  // ── Token expiry ───────────────────────────────────────────────────────────

  it("expired token blocks publish with 401", async () => {
    mockGetConnectionStatus.mockResolvedValue({
      ...activeConnection,
      expiresAt: "2025-01-01T00:00:00.000Z",
    });
    const req = makeReq({ slug: linkedIn6.slug, confirm: true });
    const res = makeRes();

    await publishHandler(req, res);

    expect(res._status).toBe(401);
    expect(JSON.stringify(res._body)).toContain("expired");
    expect(mockPublishTextPostToLinkedIn).not.toHaveBeenCalled();
  });
});