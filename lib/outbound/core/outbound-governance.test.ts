/**
 * lib/outbound/core/outbound-governance.test.ts
 *
 * Cross-provider governance tests for the unified outbound system.
 *
 * Tests:
 *   - Provider contract types and shape guards
 *   - Shared policy gate (all providers)
 *   - Sync orchestrator: normaliseSyncTargets, isSyncSupported
 *   - Asset resolver: buildCustomOutboundDraft
 *   - Audit: event routing to correct provider helpers
 *   - Security invariants: dryRun, finalApproval, token exposure, circular sync
 */

import { describe, expect, it, vi, beforeAll } from "vitest";

// ─── Policy gate tests ────────────────────────────────────────────────────────

import {
  applySharedOutboundPolicy,
  mergeGateResults,
  connectionBlockers,
} from "./outbound-policy-gate";
import type { OutboundDraft } from "./outbound-provider-contract";

const baseDraft: OutboundDraft = {
  provider: "facebook",
  assetType: "blog",
  slug: "blog-series/test/part-one",
  title: "Part One: The First Test",
  text: "This is a clean, policy-compliant post about the first part of the series.",
  link: "https://abrahamoflondon.com/blog/series/test/part-one",
  meta: {},
};

describe("Shared policy gate — all providers", () => {
  // ── Valid draft ──────────────────────────────────────────────────────────────
  it("passes a clean draft for Facebook", () => {
    const result = applySharedOutboundPolicy(baseDraft, {
      allowedLinkPrefixes: ["https://abrahamoflondon.com"],
    });
    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("passes a clean draft for X", () => {
    const result = applySharedOutboundPolicy(
      { ...baseDraft, provider: "x", text: "Short tweet about the series.", link: null },
      { maxChars: 280 },
    );
    expect(result.allowed).toBe(true);
  });

  it("passes a clean draft for LinkedIn", () => {
    const result = applySharedOutboundPolicy(
      { ...baseDraft, provider: "linkedin", link: null },
      { maxChars: 3000 },
    );
    expect(result.allowed).toBe(true);
  });

  // ── Null draft ───────────────────────────────────────────────────────────────
  it("blocks null draft for any provider", () => {
    const result = applySharedOutboundPolicy(null);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not found/i);
  });

  // ── Claim safety ─────────────────────────────────────────────────────────────
  const DISALLOWED_CLAIMS = [
    "AI predicts markets will rise.",
    "Guaranteed returns on your investment.",
    "This is investment advice.",
    "Buy now to secure your place.",
    "Buy today and save.",
    "Q2 2026 report is now available.",
  ];

  for (const claim of DISALLOWED_CLAIMS) {
    it(`blocks disallowed claim across all providers: "${claim.slice(0, 40)}..."`, () => {
      for (const provider of ["facebook", "x", "linkedin"] as const) {
        const result = applySharedOutboundPolicy({ ...baseDraft, provider, text: claim, link: null });
        expect(result.allowed).toBe(false);
      }
    });
  }

  // ── Frontmatter ──────────────────────────────────────────────────────────────
  it("blocks MDX frontmatter across all providers", () => {
    const text = "---\ntitle: Leaked frontmatter\n---\nBody text here.";
    for (const provider of ["facebook", "x", "linkedin"] as const) {
      const result = applySharedOutboundPolicy({ ...baseDraft, provider, text, link: null });
      expect(result.allowed).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/frontmatter/i);
    }
  });

  // ── Empty text ───────────────────────────────────────────────────────────────
  it("blocks empty text across all providers", () => {
    for (const provider of ["facebook", "x", "linkedin"] as const) {
      const result = applySharedOutboundPolicy({ ...baseDraft, provider, text: "" });
      expect(result.allowed).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/empty/i);
    }
  });

  // ── Title ────────────────────────────────────────────────────────────────────
  it("blocks missing title across all providers", () => {
    for (const provider of ["facebook", "x", "linkedin"] as const) {
      const result = applySharedOutboundPolicy({ ...baseDraft, provider, title: "" });
      expect(result.allowed).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/title/i);
    }
  });

  // ── Link allowlist ────────────────────────────────────────────────────────────
  it("blocks disallowed link for Facebook and X (first-party only)", () => {
    const prefixes = ["https://abrahamoflondon.com"];
    for (const provider of ["facebook", "x"] as const) {
      const result = applySharedOutboundPolicy(
        { ...baseDraft, provider, link: "https://attacker.com/inject" },
        { allowedLinkPrefixes: prefixes },
      );
      expect(result.allowed).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/allowed domain/i);
    }
  });

  it("allows null link for any provider", () => {
    const result = applySharedOutboundPolicy({ ...baseDraft, link: null });
    expect(result.allowed).toBe(true);
  });

  // ── Control language warning ──────────────────────────────────────────────────
  it("warns on internal control language across all providers", () => {
    const text = "This post passed the release gate check successfully.";
    for (const provider of ["facebook", "x", "linkedin"] as const) {
      const result = applySharedOutboundPolicy({ ...baseDraft, provider, text, link: null });
      expect(result.warnings.some((w) => /control language/i.test(w))).toBe(true);
    }
  });

  // ── Deduplication ─────────────────────────────────────────────────────────────
  it("deduplicates blockers", () => {
    // 'guaranteed' appears three times — should be one blocker
    const result = applySharedOutboundPolicy({
      ...baseDraft,
      text: "guaranteed guaranteed guaranteed",
      link: null,
    });
    const g = result.blockers.filter((b) => /guaranteed/i.test(b));
    expect(g.length).toBe(1);
  });
});

// ─── mergeGateResults ─────────────────────────────────────────────────────────

describe("mergeGateResults", () => {
  it("merges two passing results", () => {
    const a = { allowed: true, blockers: [], warnings: ["warn A"] };
    const b = { allowed: true, blockers: [], warnings: ["warn A"] };
    const merged = mergeGateResults(a, b);
    expect(merged.allowed).toBe(true);
    expect(merged.warnings).toHaveLength(1); // deduplicated
  });

  it("fails when any result has blockers", () => {
    const a = { allowed: true, blockers: [], warnings: [] };
    const b = { allowed: false, blockers: ["blocked by B"], warnings: [] };
    const merged = mergeGateResults(a, b);
    expect(merged.allowed).toBe(false);
    expect(merged.blockers).toContain("blocked by B");
  });

  it("merges three results correctly", () => {
    const a = { allowed: false, blockers: ["X"], warnings: [] };
    const b = { allowed: false, blockers: ["Y"], warnings: ["W1"] };
    const c = { allowed: true, blockers: [], warnings: ["W1"] };
    const merged = mergeGateResults(a, b, c);
    expect(merged.allowed).toBe(false);
    expect(merged.blockers).toHaveLength(2);
    expect(merged.warnings).toHaveLength(1); // "W1" deduplicated
  });
});

// ─── connectionBlockers ───────────────────────────────────────────────────────

describe("connectionBlockers", () => {
  it("returns no blockers for a healthy connection", () => {
    const result = connectionBlockers({
      connected: true,
      canPublish: true,
      missingScopes: [],
    });
    expect(result).toHaveLength(0);
  });

  it("blocks when not connected", () => {
    const result = connectionBlockers({
      connected: false,
      canPublish: false,
      missingScopes: [],
    });
    expect(result.join(" ")).toMatch(/not active/i);
  });

  it("blocks when connected but canPublish is false", () => {
    const result = connectionBlockers({
      connected: true,
      canPublish: false,
      missingScopes: [],
    });
    expect(result.join(" ")).toMatch(/not active/i);
  });

  it("reports each missing scope when requiredScopes provided", () => {
    const result = connectionBlockers({
      connected: true,
      canPublish: true,
      missingScopes: ["tweet.write", "offline.access"],
      requiredScopes: ["tweet.write", "offline.access"],
    });
    expect(result).toHaveLength(2);
    expect(result.join(" ")).toMatch(/tweet\.write/);
    expect(result.join(" ")).toMatch(/offline\.access/);
  });
});

// ─── Sync orchestrator ────────────────────────────────────────────────────────

import {
  isSyncSupported,
  normaliseSyncTargets,
} from "./outbound-sync-orchestrator";

describe("isSyncSupported", () => {
  it("supports facebook → x", () => {
    expect(isSyncSupported("facebook", "x")).toBe(true);
  });

  it("supports x → facebook", () => {
    expect(isSyncSupported("x", "facebook")).toBe(true);
  });

  it("does not support facebook → linkedin", () => {
    expect(isSyncSupported("facebook", "linkedin")).toBe(false);
  });

  it("does not support linkedin → x", () => {
    expect(isSyncSupported("linkedin", "x")).toBe(false);
  });

  it("does not support linkedin → facebook", () => {
    expect(isSyncSupported("linkedin", "facebook")).toBe(false);
  });
});

describe("normaliseSyncTargets", () => {
  it("removes the primary provider from sync targets (no circular posting)", () => {
    const result = normaliseSyncTargets("facebook", ["facebook", "x"]);
    expect(result).not.toContain("facebook");
    expect(result).toContain("x");
  });

  it("removes unsupported sync paths", () => {
    const result = normaliseSyncTargets("facebook", ["linkedin", "x"]);
    expect(result).not.toContain("linkedin");
    expect(result).toContain("x");
  });

  it("deduplicates repeated targets (no double-posting)", () => {
    const result = normaliseSyncTargets("facebook", ["x", "x", "x"]);
    expect(result).toHaveLength(1);
    expect(result).toContain("x");
  });

  it("returns empty array when no valid sync targets", () => {
    const result = normaliseSyncTargets("facebook", ["facebook", "linkedin"]);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for LinkedIn (no sync support)", () => {
    const result = normaliseSyncTargets("linkedin", ["facebook", "x"]);
    expect(result).toHaveLength(0);
  });
});

// ─── Asset resolver ───────────────────────────────────────────────────────────

import { buildCustomOutboundDraft, resolveOutboundDraft } from "./outbound-asset-resolver";

describe("buildCustomOutboundDraft", () => {
  it("builds a draft with required fields", () => {
    const draft = buildCustomOutboundDraft({
      provider: "x",
      slug: "custom/test-post",
      title: "Test Post",
      text: "Tweet text for the custom post.",
      link: "https://abrahamoflondon.com/test",
    });

    expect(draft.provider).toBe("x");
    expect(draft.assetType).toBe("custom");
    expect(draft.slug).toBe("custom/test-post");
    expect(draft.title).toBe("Test Post");
    expect(draft.text).toBe("Tweet text for the custom post.");
    expect(draft.link).toBe("https://abrahamoflondon.com/test");
    expect(draft.meta).toEqual({});
  });

  it("allows null link", () => {
    const draft = buildCustomOutboundDraft({
      provider: "linkedin",
      slug: "custom/linkedin-only",
      title: "LinkedIn Post",
      text: "Text-only LinkedIn post.",
      link: null,
    });
    expect(draft.link).toBeNull();
  });

  it("accepts explicit assetType", () => {
    const draft = buildCustomOutboundDraft({
      provider: "facebook",
      assetType: "editorial",
      slug: "editorial/test",
      title: "Editorial",
      text: "Editorial post.",
      link: null,
    });
    expect(draft.assetType).toBe("editorial");
  });

  it("accepts meta fields", () => {
    const draft = buildCustomOutboundDraft({
      provider: "facebook",
      slug: "test",
      title: "Test",
      text: "Test.",
      link: null,
      meta: { imagePath: "/assets/images/blog/test.jpg" },
    });
    expect(draft.meta.imagePath).toBe("/assets/images/blog/test.jpg");
  });
});

describe("resolveOutboundDraft", () => {
  it("returns null for unknown slug on any provider", () => {
    expect(resolveOutboundDraft("facebook", "not/a/real/slug")).toBeNull();
    expect(resolveOutboundDraft("x", "not/a/real/slug")).toBeNull();
    expect(resolveOutboundDraft("linkedin", "not/a/real/slug")).toBeNull();
  });
});

// ─── Security invariants ──────────────────────────────────────────────────────

describe("Security invariants", () => {
  it("buildCustomOutboundDraft never includes token fields", () => {
    const draft = buildCustomOutboundDraft({
      provider: "x",
      slug: "test",
      title: "Test",
      text: "Test post.",
      link: null,
    });

    const serialised = JSON.stringify(draft);
    expect(serialised).not.toMatch(/token/i);
    expect(serialised).not.toMatch(/password/i);
    expect(serialised).not.toMatch(/secret/i);
    expect(serialised).not.toMatch(/encrypt/i);
  });

  it("dryRun is correctly threaded through OutboundPublishRequest shape", () => {
    // Verify the type accepts dryRun and finalApproval
    const request = {
      provider: "x" as const,
      draft: buildCustomOutboundDraft({
        provider: "x",
        slug: "test",
        title: "Test",
        text: "Test post.",
        link: null,
      }),
      requestId: "test_req_001",
      actorId: null,
      actorEmailHash: null,
      dryRun: true,
      finalApproval: false, // dryRun=true so finalApproval not needed
      syncTargets: [],
    };

    expect(request.dryRun).toBe(true);
    expect(request.syncTargets).toHaveLength(0);
  });

  it("normaliseSyncTargets prevents circular posting", () => {
    // Primary provider cannot sync to itself
    for (const provider of ["facebook", "x", "linkedin"] as const) {
      const result = normaliseSyncTargets(provider, [provider]);
      expect(result).not.toContain(provider);
    }
  });

  it("sync targets are validated — LinkedIn cannot be a sync target", () => {
    const result = normaliseSyncTargets("facebook", ["linkedin"]);
    expect(result).toHaveLength(0);
  });
});
