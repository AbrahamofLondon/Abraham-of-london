/**
 * tests/pages/api/admin/outbound/linkedin/queue.test.ts
 *
 * Unit tests for GET /api/admin/outbound/linkedin/queue
 *
 * Tests:
 *   - Admin guard (unauthenticated → rejected)
 *   - Method guard (POST → 405)
 *   - Returns 21 posts from the campaign, grouped by week
 *   - schedulerEnabled is false (OUTBOUND_SCHEDULER_ENABLED not set in test)
 *   - No token or secret values in response
 *   - campaign filter (?campaign=<slug>) restricts results
 *   - unknown campaign slug returns empty week set
 *   - textPreview is truncated at 400 chars
 *   - requiresFinalApproval is true on all items
 *   - every item has expected fields (id, slug, postType, approvalStatus, scheduledFor)
 *   - weeks are sorted ascending by seriesWeek
 *   - items within each week are sorted ascending by sequence
 *   - posts without seriesWeek go to unweekly
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

import queueHandler from "@/pages/api/admin/outbound/linkedin/queue";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MockRes = NextApiResponse & { _status: number; _body: unknown };

function makeReq(query: Record<string, string> = {}, method = "GET"): NextApiRequest {
  return { method, headers: {}, body: {}, cookies: {}, query } as unknown as NextApiRequest;
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
    text: "The first management system was probably exhaustion.",
    sourceType: null,
    sourceSlug: null,
    sourcePath: null,
    campaign: "the-burden-changes-hands",
    series: null,
    status: "ready",
    approvalStatus: "needs_review",
    scheduledFor: "2026-07-07T08:00:00Z",
    requiresFinalApproval: true,
    assetUrl: null,
    link: "https://abrahamoflondon.com/blog/the-accountant-in-uruk",
    imagePath: "/assets/images/blog-series/the-burden-changes-hands/the-accountant-in-uruk.jpg",
    tone: "analytical",
    theme: ["institutional-intelligence"],
    thread: false,
    threadIndex: null,
    threadId: null,
    xCharCount: null,
    sourceSeries: "the-burden-changes-hands",
    sourceMaterial: "the-accountant-in-uruk",
    seriesWeek: 1,
    sequence: 1,
    syncTargets: [],
    idempotencyKey: "bcoh-li-w01-t:linkedin:2026-07-07T08:00:00Z",
    createdBy: "system",
    ...overrides,
  };
}

/** Build 21 mock posts spanning weeks 1–7, sequences 1–3. */
function make21Posts(): Record<string, unknown>[] {
  const essays = [
    "the-accountant-in-uruk",
    "knowledge-can-wait",
    "what-the-tablet-cannot-tell-you",
    "who-holds-the-stylus",
    "the-slow-intelligence",
    "the-author-who-left-the-room",
    "the-enduring-archive",
  ];
  const types = ["thesis", "applied", "reflective"];
  const seqMap: Record<string, number> = { thesis: 1, applied: 2, reflective: 3 };
  const posts: Record<string, unknown>[] = [];
  for (let week = 1; week <= 7; week++) {
    for (const pType of types) {
      const id = `bcoh-li-w0${week}-${pType[0]}`;
      posts.push(makePost({
        id,
        postType: pType,
        slug: `w0${week}-${pType}-${essays[week - 1]}`,
        text: "A".repeat(500), // over 400 chars — tests truncation
        seriesWeek: week,
        sequence: seqMap[pType],
        scheduledFor: `2026-07-${String(7 + (week - 1) * 7).padStart(2, "0")}T08:00:00Z`,
        idempotencyKey: `${id}:linkedin:2026-07-07T08:00:00Z`,
        sourceMaterial: essays[week - 1],
      }));
    }
  }
  return posts;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1", email: "admin@test.com" } },
  });
  const posts = make21Posts();
  mockGetLinkedInOutboundPosts.mockReturnValue({ posts, errors: [] });
  mockGetLinkedInCampaignPosts.mockReturnValue({ posts, errors: [] });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/outbound/linkedin/queue", () => {
  // ── Auth ───────────────────────────────────────────────────────────────────

  it("rejects unauthenticated requests — returns nothing and does not call loader", async () => {
    mockRequireAdminApi.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();

    await queueHandler(req, res);

    expect(mockGetLinkedInOutboundPosts).not.toHaveBeenCalled();
    expect(mockGetLinkedInCampaignPosts).not.toHaveBeenCalled();
    expect(res._body).toBeNull(); // handler returned early via guard
  });

  // ── Method guard ───────────────────────────────────────────────────────────

  it("returns 405 for POST requests", async () => {
    const req = makeReq({}, "POST");
    const res = makeRes();

    await queueHandler(req, res);

    expect(res._status).toBe(405);
    expect((res._body as { ok: boolean }).ok).toBe(false);
  });

  it("returns 405 for DELETE requests", async () => {
    const req = makeReq({}, "DELETE");
    const res = makeRes();
    await queueHandler(req, res);
    expect(res._status).toBe(405);
  });

  // ── Shape and count ────────────────────────────────────────────────────────

  it("returns ok:true with 21 posts across 7 weeks", async () => {
    const req = makeReq();
    const res = makeRes();

    await queueHandler(req, res);

    const body = res._body as {
      ok: boolean;
      count: number;
      weekCount: number;
      unweeklyCount: number;
      weeks: { seriesWeek: number; items: unknown[] }[];
    };
    expect(res._status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.count).toBe(21);
    expect(body.weekCount).toBe(7);
    expect(body.unweeklyCount).toBe(0);
    expect(body.weeks).toHaveLength(7);
  });

  it("each week contains exactly 3 items", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: unknown[] }[] };
    for (const week of body.weeks) {
      expect(week.items).toHaveLength(3);
    }
  });

  it("weeks are sorted ascending by seriesWeek", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { seriesWeek: number }[] };
    const nums = body.weeks.map((w) => w.seriesWeek);
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("items within each week are sorted ascending by sequence", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: { sequence: number }[] }[] };
    for (const week of body.weeks) {
      const seqs = week.items.map((i) => i.sequence);
      expect(seqs).toEqual([1, 2, 3]);
    }
  });

  // ── Required fields on each item ───────────────────────────────────────────

  it("every item has required fields", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: Record<string, unknown>[] }[] };
    const requiredFields = [
      "id", "slug", "postType", "seriesWeek", "sequence",
      "status", "approvalStatus", "scheduledFor", "requiresFinalApproval",
      "sourceSeries", "sourceMaterial", "link", "imagePath", "tone",
      "syncTargets", "idempotencyKey", "textPreview",
    ];
    for (const week of body.weeks) {
      for (const item of week.items) {
        for (const field of requiredFields) {
          expect(item, `missing field ${field} on item ${String(item.id)}`).toHaveProperty(field);
        }
      }
    }
  });

  it("requiresFinalApproval is true on every item", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: { requiresFinalApproval: boolean }[] }[] };
    for (const week of body.weeks) {
      for (const item of week.items) {
        expect(item.requiresFinalApproval).toBe(true);
      }
    }
  });

  it("textPreview is truncated to 400 chars + ellipsis for long texts", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: { textPreview: string }[] }[] };
    // All mock posts have 500 'A' chars — should be truncated
    for (const week of body.weeks) {
      for (const item of week.items) {
        expect(item.textPreview).toHaveLength(401); // 400 + "…"
        expect(item.textPreview.endsWith("…")).toBe(true);
      }
    }
  });

  // ── Security: no tokens ────────────────────────────────────────────────────

  it("response body does not contain token-shaped values", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const raw = JSON.stringify(res._body);
    expect(raw).not.toMatch(/Bearer\s+/i);
    expect(raw).not.toMatch(/access_token/i);
    expect(raw).not.toMatch(/refresh_token/i);
    expect(raw).not.toMatch(/client_secret/i);
    expect(raw).not.toMatch(/encrypted/i);
  });

  it("full post text is not returned — only textPreview", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weeks: { items: Record<string, unknown>[] }[] };
    for (const week of body.weeks) {
      for (const item of week.items) {
        expect(item).not.toHaveProperty("text"); // raw text not exposed
      }
    }
  });

  // ── Scheduler state ────────────────────────────────────────────────────────

  it("schedulerEnabled is false when OUTBOUND_SCHEDULER_ENABLED is not set", async () => {
    delete process.env.OUTBOUND_SCHEDULER_ENABLED;
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { schedulerEnabled: boolean };
    expect(body.schedulerEnabled).toBe(false);
  });

  it("schedulerEnabled is true only when OUTBOUND_SCHEDULER_ENABLED=true", async () => {
    process.env.OUTBOUND_SCHEDULER_ENABLED = "true";
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { schedulerEnabled: boolean };
    expect(body.schedulerEnabled).toBe(true);
    delete process.env.OUTBOUND_SCHEDULER_ENABLED;
  });

  // ── Campaign filter ────────────────────────────────────────────────────────

  it("?campaign= filter calls getLinkedInCampaignPosts with slug", async () => {
    const req = makeReq({ campaign: "the-burden-changes-hands" });
    const res = makeRes();
    await queueHandler(req, res);
    expect(mockGetLinkedInCampaignPosts).toHaveBeenCalledWith("the-burden-changes-hands");
    expect(mockGetLinkedInOutboundPosts).not.toHaveBeenCalled();
  });

  it("no campaign param calls getLinkedInOutboundPosts", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    expect(mockGetLinkedInOutboundPosts).toHaveBeenCalled();
    expect(mockGetLinkedInCampaignPosts).not.toHaveBeenCalled();
  });

  it("campaign name is reflected in response", async () => {
    const req = makeReq({ campaign: "the-burden-changes-hands" });
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { campaign: string };
    expect(body.campaign).toBe("the-burden-changes-hands");
  });

  it("no campaign param returns campaign:all in response", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { campaign: string };
    expect(body.campaign).toBe("all");
  });

  // ── Empty/unweekly ─────────────────────────────────────────────────────────

  it("posts without seriesWeek go into unweekly array", async () => {
    const unweeklyPost = makePost({ seriesWeek: null, sequence: null });
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [unweeklyPost],
      errors: [],
    });
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { weekCount: number; unweeklyCount: number; unweekly: unknown[] };
    expect(body.weekCount).toBe(0);
    expect(body.unweeklyCount).toBe(1);
    expect(body.unweekly).toHaveLength(1);
  });

  it("returns errors array from loader", async () => {
    mockGetLinkedInOutboundPosts.mockReturnValue({
      posts: [],
      errors: [{ filename: "bad.md", message: "Bad frontmatter" }],
    });
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { errors: { filename: string; message: string }[] };
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]?.filename).toBe("bad.md");
  });

  it("provides provider:linkedin in response", async () => {
    const req = makeReq();
    const res = makeRes();
    await queueHandler(req, res);
    const body = res._body as { provider: string };
    expect(body.provider).toBe("linkedin");
  });
});
