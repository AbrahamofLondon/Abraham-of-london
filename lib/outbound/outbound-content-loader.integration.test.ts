/**
 * lib/outbound/outbound-content-loader.integration.test.ts
 *
 * Integration tests for the outbound content loader.
 * Reads ACTUAL content files from content/outbound/facebook/ and content/outbound/x/.
 * No fs mocking — this validates real governance invariants on real content.
 *
 * Governance invariants verified here:
 *   - All posts have requiresFinalApproval: true (production safety)
 *   - No duplicate IDs across facebook and x providers
 *   - X posts: xCharCount declared within ±15 of actual weighted character count
 *   - Facebook posts: text body is non-empty
 *   - X thread items: threadIndex and threadId both present
 *   - All scheduledFor dates are valid ISO strings
 *   - No post has status=scheduled without approvalStatus=approved
 *   - Posts are excluded from public feeds (loaded only through admin API / server fns)
 *   - getOutboundPostsDue returns empty (no post is approved+scheduled in test context)
 */

import { describe, it, expect } from "vitest";
import {
  getFacebookOutboundPosts,
  getXOutboundPosts,
  getOutboundPostsDue,
} from "./outbound-content-loader";

// ─── X char count helper (mirrors validate-outbound-content.mjs logic) ────────

const X_TWEET_MAX = 280;
const X_URL_LEN = 23;

function countXChars(text: string, link: string | null): number {
  const full = link ? `${text}\n${link}` : text;
  const withPlaceholders = full.replace(/https?:\/\/\S+/g, "_".repeat(X_URL_LEN));
  return withPlaceholders.length;
}

// ─── Load actual content ──────────────────────────────────────────────────────

const { posts: fbPosts, errors: fbErrors } = getFacebookOutboundPosts();
const { posts: xPosts, errors: xErrors } = getXOutboundPosts();
const allPosts = [...fbPosts, ...xPosts];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Integration: actual content files", () => {
  // ── Basic sanity ────────────────────────────────────────────────────────────

  it("loads at least one Facebook post", () => {
    expect(fbPosts.length).toBeGreaterThan(0);
  });

  it("loads at least one X post", () => {
    expect(xPosts.length).toBeGreaterThan(0);
  });

  it("has no file-read errors in facebook dir", () => {
    expect(fbErrors).toHaveLength(0);
  });

  it("has no file-read errors in x dir", () => {
    expect(xErrors).toHaveLength(0);
  });

  // ── Governance: requiresFinalApproval ───────────────────────────────────────

  it("every post has requiresFinalApproval: true (no post can bypass approval)", () => {
    const violations = allPosts.filter((p) => !p.requiresFinalApproval);
    expect(violations.map((p) => `${p.provider}/${p.slug}`)).toEqual([]);
  });

  // ── Governance: no duplicate IDs ────────────────────────────────────────────

  it("no two posts share the same id (duplicate ID check)", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const post of allPosts) {
      if (seen.has(post.id)) {
        dupes.push(`${post.id} (also in ${seen.get(post.id)})`);
      } else {
        seen.set(post.id, `${post.provider}/${post.slug}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  // ── Governance: no unapproved scheduled posts ───────────────────────────────

  it("no post is status=scheduled without approvalStatus=approved", () => {
    const violations = allPosts.filter(
      (p) => p.status === "scheduled" && p.approvalStatus !== "approved",
    );
    expect(violations.map((p) => `${p.provider}/${p.slug}`)).toEqual([]);
  });

  // ── Governance: scheduler disabled means nothing is due ─────────────────────

  it("getOutboundPostsDue returns empty for facebook (nothing approved+scheduled yet)", () => {
    const due = getOutboundPostsDue("facebook");
    expect(due).toHaveLength(0);
  });

  it("getOutboundPostsDue returns empty for x (nothing approved+scheduled yet)", () => {
    const due = getOutboundPostsDue("x");
    expect(due).toHaveLength(0);
  });

  // ── Content: non-empty body ─────────────────────────────────────────────────

  it("every Facebook post has a non-empty text body", () => {
    const empty = fbPosts.filter((p) => !p.text || p.text.trim() === "");
    expect(empty.map((p) => p.slug)).toEqual([]);
  });

  it("every X post has a non-empty text body", () => {
    const empty = xPosts.filter((p) => !p.text || p.text.trim() === "");
    expect(empty.map((p) => p.slug)).toEqual([]);
  });

  // ── X char count ────────────────────────────────────────────────────────────

  it("every X post stays within 280 weighted chars", () => {
    const overLimit = xPosts.filter((p) => {
      const count = countXChars(p.text, p.link);
      return count > X_TWEET_MAX;
    });
    expect(
      overLimit.map((p) => `${p.slug} (${countXChars(p.text, p.link)} chars)`),
    ).toEqual([]);
  });

  it("every X post with declared xCharCount is within ±15 of actual weighted count", () => {
    const drift = xPosts.filter((p) => {
      if (p.xCharCount === null) return false;
      const actual = countXChars(p.text, p.link);
      return Math.abs(actual - p.xCharCount) > 15;
    });
    expect(
      drift.map(
        (p) =>
          `${p.slug}: declared=${p.xCharCount}, actual=${countXChars(p.text, p.link)}`,
      ),
    ).toEqual([]);
  });

  // ── Thread integrity ────────────────────────────────────────────────────────

  it("every X thread item has both threadIndex and threadId", () => {
    const broken = xPosts.filter(
      (p) =>
        p.thread === true &&
        (p.threadIndex === null || p.threadId === null),
    );
    expect(broken.map((p) => p.slug)).toEqual([]);
  });

  it("thread items sharing a threadId all have distinct threadIndex values", () => {
    const byThread = new Map<string, number[]>();
    for (const p of xPosts) {
      if (!p.thread || !p.threadId || p.threadIndex === null) continue;
      const existing = byThread.get(p.threadId) ?? [];
      existing.push(p.threadIndex);
      byThread.set(p.threadId, existing);
    }
    const conflicts: string[] = [];
    for (const [threadId, indices] of byThread) {
      const unique = new Set(indices);
      if (unique.size !== indices.length) {
        conflicts.push(`threadId "${threadId}" has duplicate indices: ${indices.join(", ")}`);
      }
    }
    expect(conflicts).toEqual([]);
  });

  // ── scheduledFor validity ───────────────────────────────────────────────────

  it("every scheduledFor is a valid ISO date string where present", () => {
    const invalid = allPosts.filter((p) => {
      if (!p.scheduledFor) return false;
      return isNaN(new Date(p.scheduledFor).getTime());
    });
    expect(invalid.map((p) => `${p.slug}: "${p.scheduledFor}"`)).toEqual([]);
  });

  // ── Idempotency key format ──────────────────────────────────────────────────

  it("every idempotencyKey matches the pattern id:provider:scheduledFor|unscheduled", () => {
    const malformed = allPosts.filter((p) => {
      const expected = `${p.id}:${p.provider}:${p.scheduledFor ?? "unscheduled"}`;
      return p.idempotencyKey !== expected;
    });
    expect(malformed.map((p) => `${p.slug}: "${p.idempotencyKey}"`)).toEqual(
      [],
    );
  });

  it("all idempotencyKeys are unique (no duplicate publish risk)", () => {
    const keys = allPosts.map((p) => p.idempotencyKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  // ── Provider integrity ──────────────────────────────────────────────────────

  it("all posts from getFacebookOutboundPosts have provider=facebook", () => {
    const wrong = fbPosts.filter((p) => p.provider !== "facebook");
    expect(wrong.map((p) => p.slug)).toEqual([]);
  });

  it("all posts from getXOutboundPosts have provider=x", () => {
    const wrong = xPosts.filter((p) => p.provider !== "x");
    expect(wrong.map((p) => p.slug)).toEqual([]);
  });

  // ── Public feed exclusion (architectural invariant) ─────────────────────────

  it("loader exports named server-only functions (no default export = not a Next.js page)", async () => {
    // Verify the module exports the expected server-only functions.
    // If this module were imported client-side, assertServerRuntime() would throw.
    // Here in node environment, we just verify the expected API surface exists.
    expect(typeof getFacebookOutboundPosts).toBe("function");
    expect(typeof getXOutboundPosts).toBe("function");
    expect(typeof getOutboundPostsDue).toBe("function");
    // Dynamic import (ESM-compatible) to verify no default export
    const mod = await import("./outbound-content-loader");
    expect((mod as Record<string, unknown>).default).toBeUndefined();
  });
});
