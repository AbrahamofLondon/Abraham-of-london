/**
 * tests/pages/api/admin/outbound/linkedin/campaigns/validate.test.ts
 *
 * Unit tests for POST /api/admin/outbound/linkedin/campaigns/validate
 *
 * Tests:
 *   - Admin guard (unauthenticated → rejected)
 *   - Method guard (GET → 405)
 *   - Missing postId/slug → 400
 *   - Post not found → 404
 *   - Valid approved post → valid:true, no issues
 *   - needs_review post → valid:false, approval issue
 *   - Bad link → valid:false, link issue
 *   - Bad imagePath → valid:false, imagePath issue
 *   - Missing requiresFinalApproval → issue flagged
 *   - No external post made (dryRun:true in response)
 *   - campaign param routes to getLinkedInCampaignPosts
 *   - textPreview is present and truncated to 200 chars
 *   - idempotency key not exposed in response
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockRequireAdminApi,
  mockGetLinkedInOutboundPosts,
  mockGetLinkedInCampaignPosts,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockGetLinkedInOutboundPosts: vi.fn(),
  mockGetLinkedInCampaignPosts: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

vi.mock("@/lib/outbound/outbound-content-loader", () => ({
  getLinkedInOutboundPosts: mockGetLinkedInOutboundPosts,
  getLinkedInCampaignPosts: mockGetLinkedInCampaignPosts,
}));

import validateHandler from "@/pages/api/admin/outbound/linkedin/campaigns/validate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MockRes = NextApiResponse & { _status: number; _body: unknown };

function makeReq(
  body: Record<string, unknown> = {},
  method = "POST",
): NextApiRequest {
  return { method, headers: {}, body, cookies: {}, query: {} } as unknown as NextApiRequest;
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

function makePost(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "bcoh-li-w01-t",
    provider: "linkedin",
    postType: "thesis",
    filename: "w01-thesis-first-management-system.md",
    slug: "w01-thesis-first-management-system",
    text: "The first management system was probably exhaustion. ".repeat(10),
    status: "ready",
    approvalStatus: "approved",
    scheduledFor: "2026-07-07T08:00:00Z",
    requiresFinalApproval: true,
    link: "https://abrahamoflondon.com/blog/the-accountant-in-uruk",
    imagePath: "/assets/images/blog-series/the-burden-changes-hands/the-accountant-in-uruk.jpg",
    tone: "analytical",
    seriesWeek: 1,
    sequence: 1,
    sourceMaterial: "the-accountant-in-uruk",
    syncTargets: [],
    idempotencyKey: "bcoh-li-w01-t:linkedin:2026-07-07T08:00:00Z",
    ...overrides,
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@test.com" } },
  });
  const defaultPost = makePost();
  mockGetLinkedInOutboundPosts.mockReturnValue({ posts: [defaultPost], errors: [] });
  mockGetLinkedInCampaignPosts.mockReturnValue({ posts: [defaultPost], errors: [] });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/outbound/linkedin/campaigns/validate", () => {
  // ── Auth ───────────────────────────────────────────────────────────────────

  it("rejects unauthenticated requests", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    expect(mockGetLinkedInOutboundPosts).not.toHaveBeenCalled();
    expect(res._body).toBeNull();
  });

  // ── Method guard ───────────────────────────────────────────────────────────

  it("returns 405 for GET", async () => {
    const req = makeReq({}, "GET");
    const res = makeRes();
    await validateHandler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns 405 for DELETE", async () => {
    const req = makeReq({}, "DELETE");
    const res = makeRes();
    await validateHandler(req, res);
    expect(res._status).toBe(405);
  });

  // ── Input validation ───────────────────────────────────────────────────────

  it("returns 400 when neither postId nor slug is provided", async () => {
    const req = makeReq({});
    const res = makeRes();
    await validateHandler(req, res);
    expect(res._status).toBe(400);
    expect((res._body as { ok: boolean }).ok).toBe(false);
  });

  it("returns 404 when postId does not match any post", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({ posts: [], errors: [] });
    const req = makeReq({ postId: "not-a-real-id" });
    const res = makeRes();
    await validateHandler(req, res);
    expect(res._status).toBe(404);
  });

  it("returns 404 when slug does not match any post", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({ posts: [], errors: [] });
    const req = makeReq({ slug: "not-a-real-slug" });
    const res = makeRes();
    await validateHandler(req, res);
    expect(res._status).toBe(404);
  });

  // ── Valid approved post ────────────────────────────────────────────────────

  it("approved post with good link and image returns valid:true, no issues", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { ok: boolean; valid: boolean; issues: string[] };
    expect(res._status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.valid).toBe(true);
    expect(body.issues).toHaveLength(0);
  });

  it("slug lookup also works for approved post", async () => {
    const req = makeReq({ slug: "w01-thesis-first-management-system" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean };
    expect(body.valid).toBe(true);
  });

  // ── Dry-run flag ───────────────────────────────────────────────────────────

  it("response always includes dryRun:true — no external call made", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { dryRun: boolean };
    expect(body.dryRun).toBe(true);
  });

  // ── Approval gate ──────────────────────────────────────────────────────────

  it("needs_review post returns valid:false with approval issue", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ approvalStatus: "needs_review" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.some((i) => /approved/i.test(i))).toBe(true);
  });

  it("rejected post returns valid:false with approval issue", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ approvalStatus: "rejected" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.length).toBeGreaterThan(0);
  });

  // ── RequiresFinalApproval gate ─────────────────────────────────────────────

  it("post with requiresFinalApproval:false returns valid:false", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ requiresFinalApproval: false })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.some((i) => /requiresFinalApproval/i.test(i))).toBe(true);
  });

  // ── Link allowlist gate ────────────────────────────────────────────────────

  it("external link returns valid:false with link issue", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ link: "https://external-domain.com/page" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.some((i) => /allowed/i.test(i))).toBe(true);
  });

  it("www. subdomain link is allowed", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ link: "https://www.abrahamoflondon.com/blog/test" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean };
    expect(body.valid).toBe(true);
  });

  it("null link is accepted", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ link: null })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean };
    expect(body.valid).toBe(true);
  });

  // ── Image path gate ────────────────────────────────────────────────────────

  it("image not under /assets/ returns valid:false with imagePath issue", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ imagePath: "/images/outside-assets.jpg" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.some((i) => /imagePath/i.test(i))).toBe(true);
  });

  it("null imagePath is accepted", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ imagePath: null })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean };
    expect(body.valid).toBe(true);
  });

  // ── Status gate ────────────────────────────────────────────────────────────

  it("draft post returns valid:false with status issue", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({ status: "draft", approvalStatus: "approved" })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.some((i) => /status/i.test(i))).toBe(true);
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  it("response includes post metadata fields", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as Record<string, unknown>;
    expect(body).toHaveProperty("postId");
    expect(body).toHaveProperty("slug");
    expect(body).toHaveProperty("postType");
    expect(body).toHaveProperty("seriesWeek");
    expect(body).toHaveProperty("sequence");
    expect(body).toHaveProperty("approvalStatus");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("requiresFinalApproval");
    expect(body).toHaveProperty("scheduledFor");
    expect(body).toHaveProperty("link");
    expect(body).toHaveProperty("imagePath");
    expect(body).toHaveProperty("textPreview");
  });

  it("textPreview is present and ≤201 chars (200 + ellipsis)", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { textPreview: string };
    expect(body.textPreview.length).toBeLessThanOrEqual(201);
  });

  it("response does not expose full text body", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as Record<string, unknown>;
    expect(body).not.toHaveProperty("text");
  });

  it("response does not expose idempotencyKey", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as Record<string, unknown>;
    expect(body).not.toHaveProperty("idempotencyKey");
  });

  // ── Campaign param ─────────────────────────────────────────────────────────

  it("campaign param routes to getLinkedInCampaignPosts", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t", campaign: "the-burden-changes-hands" });
    const res = makeRes();
    await validateHandler(req, res);
    expect(mockGetLinkedInCampaignPosts).toHaveBeenCalledWith("the-burden-changes-hands");
    expect(mockGetLinkedInOutboundPosts).not.toHaveBeenCalled();
  });

  it("no campaign param routes to getLinkedInOutboundPosts", async () => {
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    expect(mockGetLinkedInOutboundPosts).toHaveBeenCalled();
    expect(mockGetLinkedInCampaignPosts).not.toHaveBeenCalled();
  });

  // ── Multiple issues ────────────────────────────────────────────────────────

  it("multiple gate failures accumulate into issues array", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [makePost({
        approvalStatus: "needs_review",
        requiresFinalApproval: false,
        link: "https://bad-domain.com",
        imagePath: "/wrong/path.jpg",
        status: "draft",
      })],
      errors: [],
    });
    const req = makeReq({ postId: "bcoh-li-w01-t" });
    const res = makeRes();
    await validateHandler(req, res);
    const body = res._body as { valid: boolean; issues: string[] };
    expect(body.valid).toBe(false);
    expect(body.issues.length).toBeGreaterThanOrEqual(4);
  });
});
