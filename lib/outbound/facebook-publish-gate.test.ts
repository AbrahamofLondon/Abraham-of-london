import { beforeAll, describe, expect, it, vi } from "vitest";

import { canPublishFacebookPost } from "./facebook-publish-gate";
import type { FacebookPublishedAsset, FacebookConnectionStatus } from "./facebook-types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const readyConnection: FacebookConnectionStatus = {
  connected: true,
  state: "oauth",
  pageId: "123456789",
  pageName: "Abraham of London",
  requiredPermissions: ["pages_manage_posts", "pages_read_engagement"],
  grantedPermissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
  missingPermissions: [],
  canPublish: true,
  crossPostToXAssumed: "unknown",
  lastPublishAt: null,
  readiness: "READY",
  oauthConfigured: true,
  envTokenPresent: false,
};

const envTokenConnection: FacebookConnectionStatus = {
  ...readyConnection,
  state: "env_token",
  warning: "Using environment variable token. OAuth connection is recommended for production.",
};

const notConnected: FacebookConnectionStatus = {
  connected: false,
  state: "not_connected",
  pageId: null,
  pageName: null,
  requiredPermissions: ["pages_manage_posts", "pages_read_engagement"],
  grantedPermissions: [],
  missingPermissions: ["pages_manage_posts", "pages_read_engagement"],
  canPublish: false,
  crossPostToXAssumed: "unknown",
  lastPublishAt: null,
  readiness: "NOT_CONNECTED",
  oauthConfigured: true,
  envTokenPresent: false,
};

const missingPermConnection: FacebookConnectionStatus = {
  ...readyConnection,
  grantedPermissions: ["pages_read_engagement"],
  missingPermissions: ["pages_manage_posts"],
  canPublish: false,
  readiness: "MISSING_PERMISSION",
};

const validAsset: FacebookPublishedAsset = {
  assetType: "blog",
  slug: "blog-series/the-burden-changes-hands/the-accountant-in-uruk",
  title: "The Accountant in Uruk",
  text: "In a warehouse in Uruk, someone realised that clay could remember what the mind was struggling to hold.\n\nPart of the series: The Burden Changes Hands\nhttps://abrahamoflondon.com/blog/series/the-burden-changes-hands/the-accountant-in-uruk",
  link: "https://abrahamoflondon.com/blog/series/the-burden-changes-hands/the-accountant-in-uruk",
  imagePath: "/assets/images/blog-series/the-burden-changes-hands/the-accountant-in-uruk.jpg",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("canPublishFacebookPost", () => {
  it("passes a valid asset with ready connection", () => {
    const result = canPublishFacebookPost(validAsset, readyConnection);
    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("warns (not blocks) on env_token connection", () => {
    const result = canPublishFacebookPost(validAsset, envTokenConnection);
    expect(result.allowed).toBe(true);
    expect(result.warnings.some((w) => w.toLowerCase().includes("oauth"))).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks when asset is null", () => {
    const result = canPublishFacebookPost(null, readyConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not found/i);
  });

  it("blocks when not connected", () => {
    const result = canPublishFacebookPost(validAsset, notConnected);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not active/i);
  });

  it("blocks when connection is null", () => {
    const result = canPublishFacebookPost(validAsset, null);
    expect(result.allowed).toBe(false);
  });

  it("blocks when required permissions are missing", () => {
    const result = canPublishFacebookPost(validAsset, missingPermConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/pages_manage_posts/);
  });

  it("blocks disallowed link domains", () => {
    const result = canPublishFacebookPost(
      {
        ...validAsset,
        link: "https://competitor.com/page",
      },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/allowed domain/i);
  });

  it("allows null link (text-only post)", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, link: null },
      readyConnection,
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks disallowed image paths", () => {
    const result = canPublishFacebookPost(
      {
        ...validAsset,
        imagePath: "/uploads/user-content/bad.jpg",
      },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/allowed.*assets/i);
  });

  it("allows null image path", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, imagePath: null },
      readyConnection,
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks disallowed claim: 'AI predicts'", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "AI predicts markets will rise 20% this quarter." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/AI predicts/);
  });

  it("blocks disallowed claim: 'guaranteed'", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "This is a guaranteed return on investment." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/guaranteed/i);
  });

  it("blocks disallowed claim: 'investment advice'", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "This is investment advice for clients." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks empty post text", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "" },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/empty/i);
  });

  it("blocks post text exceeding 2200 characters", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "a".repeat(2201) },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/exceeds limit/i);
  });

  it("allows text exactly at 2200 characters", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "a".repeat(2200) },
      readyConnection,
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks post text that begins with MDX frontmatter", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "---\ntitle: Test\n---\nBody here." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/frontmatter/i);
  });

  it("warns on internal control language in post text", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, text: "This asset passed the release gate check." },
      readyConnection,
    );
    expect(result.warnings.some((w) => w.toLowerCase().includes("control language"))).toBe(true);
  });

  it("blocks missing title", () => {
    const result = canPublishFacebookPost(
      { ...validAsset, title: "" },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/title.*missing/i);
  });

  it("deduplicates duplicate blockers", () => {
    // Missing permissions triggers one blocker, not duplicates
    const result = canPublishFacebookPost(validAsset, missingPermConnection);
    const uniqueBlockers = new Set(result.blockers);
    expect(uniqueBlockers.size).toBe(result.blockers.length);
  });
});

// ─── Content resolver ─────────────────────────────────────────────────────────

import { getBlogSeriesFacebookAssets, getFacebookAssetBySlug } from "./facebook-content-resolver";

describe("getBlogSeriesFacebookAssets", () => {
  it("returns all published blog series parts", () => {
    const assets = getBlogSeriesFacebookAssets();
    expect(assets.length).toBeGreaterThan(0);
  });

  it("each asset has a valid first-party link", () => {
    const assets = getBlogSeriesFacebookAssets();
    for (const asset of assets) {
      expect(asset.link).toMatch(/^https:\/\/abrahamoflondon\.com/);
    }
  });

  it("each asset text includes the series title", () => {
    const assets = getBlogSeriesFacebookAssets();
    for (const asset of assets) {
      expect(asset.text).toContain("The Burden Changes Hands");
    }
  });

  it("each asset image path is under blog-series/", () => {
    const assets = getBlogSeriesFacebookAssets();
    for (const asset of assets) {
      if (asset.imagePath) {
        expect(asset.imagePath).toMatch(/^\/assets\/images\/blog-series\//);
      }
    }
  });
});

describe("getFacebookAssetBySlug", () => {
  it("returns asset by exact slug", () => {
    const asset = getFacebookAssetBySlug(
      "blog-series/the-burden-changes-hands/the-accountant-in-uruk",
    );
    expect(asset).not.toBeNull();
    expect(asset?.title).toBe("The Accountant in Uruk");
  });

  it("returns null for unknown slug", () => {
    const asset = getFacebookAssetBySlug("not/a/real/slug");
    expect(asset).toBeNull();
  });
});

// ─── Token encryption round-trip ─────────────────────────────────────────────

import { encryptFacebookToken, decryptFacebookToken } from "./facebook-token-encryption";

describe("Facebook token encryption", () => {
  beforeAll(() => {
    process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY = "test-key-for-unit-tests-32-chars!!";
  });

  it("round-trips a token correctly", () => {
    const plaintext = "EAAtest_fake_page_token_for_testing_only_never_real";
    const ciphertext = encryptFacebookToken(plaintext);
    const decrypted = decryptFacebookToken(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const plaintext = "same-token";
    const ct1 = encryptFacebookToken(plaintext);
    const ct2 = encryptFacebookToken(plaintext);
    expect(ct1).not.toBe(ct2);
    // But both decrypt to same plaintext
    expect(decryptFacebookToken(ct1)).toBe(plaintext);
    expect(decryptFacebookToken(ct2)).toBe(plaintext);
  });

  it("throws on malformed ciphertext", () => {
    expect(() => decryptFacebookToken("not:valid")).toThrow();
  });
});

// ─── Audit helper ─────────────────────────────────────────────────────────────

import {
  recordFacebookPublishingAuditSafe,
} from "./facebook-publishing-audit";

vi.mock("@/lib/server/audit", () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("recordFacebookPublishingAuditSafe", () => {
  it("returns ok: true on success", async () => {
    const result = await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_POST_PUBLISHED",
      assetSlug: "blog-series/the-burden-changes-hands/the-accountant-in-uruk",
      assetType: "blog",
      assetTitle: "The Accountant in Uruk",
      pageId: "123456789",
    });
    expect(result.ok).toBe(true);
  });

  it("returns ok: false with warning on audit failure", async () => {
    const { logAuditEvent } = await import("@/lib/server/audit");
    (logAuditEvent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("DB unavailable"),
    );

    const result = await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_PUBLISH_FAILED",
      requestId: "fb_test_001",
    });
    expect(result.ok).toBe(false);
    expect(result.warning).toBeDefined();
  });
});
