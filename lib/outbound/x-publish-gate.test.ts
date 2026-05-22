import { beforeAll, describe, expect, it } from "vitest";

import { canPublishXPost, countTweetChars } from "./x-publish-gate";
import { getBlogSeriesXAssets, getXAssetBySlug, adaptFacebookTextToTweet } from "./x-content-resolver";
import type { XPublishedAsset, XConnectionStatus } from "./x-types";
import { X_TWEET_MAX_CHARS } from "./x-types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const readyConnection: XConnectionStatus = {
  connected: true,
  state: "oauth",
  userId: "123456789",
  username: "abrahamoflondon",
  scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  missingScopes: [],
  canPublish: true,
  lastPublishAt: null,
  readiness: "READY",
  oauthConfigured: true,
};

const notConnected: XConnectionStatus = {
  connected: false,
  state: "not_connected",
  userId: null,
  username: null,
  scopes: [],
  missingScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  canPublish: false,
  lastPublishAt: null,
  readiness: "NOT_CONNECTED",
  oauthConfigured: true,
};

const missingScopeConnection: XConnectionStatus = {
  ...readyConnection,
  scopes: ["tweet.read", "users.read"],
  missingScopes: ["tweet.write", "offline.access"],
  canPublish: false,
  readiness: "MISSING_SCOPE",
};

const validAsset: XPublishedAsset = {
  assetType: "blog",
  slug: "blog-series/the-burden-changes-hands/the-accountant-in-uruk",
  title: "The Accountant in Uruk",
  text: "The Accountant in Uruk\n\nIn a warehouse in Uruk, someone realised that clay could remember.\n\nhttps://abrahamoflondon.com/blog/series/the-burden-changes-hands/the-accountant-in-uruk",
  link: "https://abrahamoflondon.com/blog/series/the-burden-changes-hands/the-accountant-in-uruk",
};

// ─── Character counting ───────────────────────────────────────────────────────

describe("countTweetChars", () => {
  it("counts plain text by character length", () => {
    expect(countTweetChars("Hello world")).toBe(11);
  });

  it("counts any URL as 23 characters", () => {
    // 5 chars "Hello" + 1 space + 23 (URL placeholder) = 29
    expect(countTweetChars("Hello https://abrahamoflondon.com/a-very-long-path/here")).toBe(29);
  });

  it("counts multiple URLs each as 23", () => {
    const text = "https://abrahamoflondon.com https://example.com";
    expect(countTweetChars(text)).toBe(23 + 1 + 23); // two URLs + space
  });
});

// ─── Publish gate ─────────────────────────────────────────────────────────────

describe("canPublishXPost", () => {
  it("passes a valid asset with ready connection", () => {
    const result = canPublishXPost(validAsset, readyConnection);
    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks when asset is null", () => {
    const result = canPublishXPost(null, readyConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not found/i);
  });

  it("blocks when not connected", () => {
    const result = canPublishXPost(validAsset, notConnected);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not active/i);
  });

  it("blocks when connection is null", () => {
    const result = canPublishXPost(validAsset, null);
    expect(result.allowed).toBe(false);
  });

  it("blocks when tweet.write scope is missing", () => {
    const result = canPublishXPost(validAsset, missingScopeConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/tweet\.write/);
  });

  it("blocks disallowed link domain", () => {
    const result = canPublishXPost(
      { ...validAsset, link: "https://competitor.com/page" },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/allowed domain/i);
  });

  it("allows null link", () => {
    const result = canPublishXPost({ ...validAsset, link: null }, readyConnection);
    expect(result.allowed).toBe(true);
  });

  it("blocks empty tweet text", () => {
    const result = canPublishXPost({ ...validAsset, text: "" }, readyConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/empty/i);
  });

  it("blocks tweet exceeding 280 weighted chars", () => {
    // 281 plain text chars (no URL), should exceed limit
    const result = canPublishXPost(
      { ...validAsset, text: "a".repeat(281), link: null },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/character limit/i);
  });

  it("allows tweet at exactly 280 weighted chars", () => {
    const result = canPublishXPost(
      { ...validAsset, text: "a".repeat(280), link: null },
      readyConnection,
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks 'AI predicts' claim", () => {
    const result = canPublishXPost(
      { ...validAsset, text: "AI predicts the market will rise." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks 'guaranteed' claim", () => {
    const result = canPublishXPost(
      { ...validAsset, text: "Guaranteed results for your portfolio." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks MDX frontmatter in tweet text", () => {
    const result = canPublishXPost(
      { ...validAsset, text: "---\ntitle: Test\n---\nBody." },
      readyConnection,
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/frontmatter/i);
  });

  it("warns on internal control language", () => {
    const result = canPublishXPost(
      { ...validAsset, text: "This passed the release gate successfully." },
      readyConnection,
    );
    expect(result.warnings.some((w) => /control language/i.test(w))).toBe(true);
  });

  it("blocks missing title", () => {
    const result = canPublishXPost({ ...validAsset, title: "" }, readyConnection);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/title/i);
  });
});

// ─── Content resolver ─────────────────────────────────────────────────────────

describe("getBlogSeriesXAssets", () => {
  it("returns published blog series parts as tweet assets", () => {
    const assets = getBlogSeriesXAssets();
    expect(assets.length).toBeGreaterThan(0);
  });

  it("every tweet is within 280 weighted chars", () => {
    const assets = getBlogSeriesXAssets();
    for (const asset of assets) {
      const count = countTweetChars(asset.text);
      expect(count).toBeLessThanOrEqual(X_TWEET_MAX_CHARS);
    }
  });

  it("every tweet contains a first-party link", () => {
    const assets = getBlogSeriesXAssets();
    for (const asset of assets) {
      expect(asset.link).toMatch(/^https:\/\/abrahamoflondon\.com/);
    }
  });

  it("every tweet text includes the link", () => {
    const assets = getBlogSeriesXAssets();
    for (const asset of assets) {
      if (asset.link) {
        expect(asset.text).toContain(asset.link);
      }
    }
  });
});

describe("getXAssetBySlug", () => {
  it("returns asset by slug", () => {
    const asset = getXAssetBySlug(
      "blog-series/the-burden-changes-hands/the-accountant-in-uruk",
    );
    expect(asset).not.toBeNull();
    expect(asset?.title).toBe("The Accountant in Uruk");
  });

  it("returns null for unknown slug", () => {
    expect(getXAssetBySlug("not/real")).toBeNull();
  });
});

// ─── Facebook → X text adapter ───────────────────────────────────────────────

describe("adaptFacebookTextToTweet", () => {
  it("returns a tweet within 280 chars", () => {
    const fb = "This is a test Facebook post. It has some content that could be long.";
    const tweet = adaptFacebookTextToTweet(fb, "https://abrahamoflondon.com/test");
    expect(countTweetChars(tweet)).toBeLessThanOrEqual(280);
  });

  it("truncates long first paragraphs", () => {
    const longPara = "A ".repeat(200); // 400 chars
    const tweet = adaptFacebookTextToTweet(longPara, null);
    expect(countTweetChars(tweet)).toBeLessThanOrEqual(280);
  });

  it("appends link when provided", () => {
    const tweet = adaptFacebookTextToTweet("Short text", "https://abrahamoflondon.com/blog");
    expect(tweet).toContain("https://abrahamoflondon.com/blog");
  });

  it("uses only the first paragraph of multi-paragraph FB text", () => {
    const fb = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const tweet = adaptFacebookTextToTweet(fb, null);
    expect(tweet).toContain("First paragraph.");
    expect(tweet).not.toContain("Second paragraph.");
  });
});

// ─── Token encryption ─────────────────────────────────────────────────────────

import { encryptXToken, decryptXToken } from "./x-token-encryption";

describe("X token encryption", () => {
  beforeAll(() => {
    process.env.X_TOKEN_ENCRYPTION_KEY = "x-test-key-for-unit-tests-32-chars!";
  });

  it("round-trips a token", () => {
    const plaintext = "oauth2_fake_access_token_for_testing_never_real";
    expect(decryptXToken(encryptXToken(plaintext))).toBe(plaintext);
  });

  it("produces unique ciphertext each call (random IV)", () => {
    const pt = "same";
    const c1 = encryptXToken(pt);
    const c2 = encryptXToken(pt);
    expect(c1).not.toBe(c2);
    expect(decryptXToken(c1)).toBe(pt);
    expect(decryptXToken(c2)).toBe(pt);
  });

  it("throws on malformed ciphertext", () => {
    expect(() => decryptXToken("bad:format")).toThrow();
  });
});
