/**
 * lib/outbound/core/outbound-token-encryption.test.ts
 *
 * Consolidated token encryption audit for all three outbound providers.
 *
 * Verifies:
 *   - Round-trip correctness (encrypt → decrypt returns original plaintext)
 *   - Random IV produces unique ciphertext each call
 *   - Missing encryption key fails closed (throws, not silently degrades)
 *   - Malformed ciphertext throws
 *   - Tampered ciphertext (GCM tag mismatch) throws
 *   - Cross-provider key isolation (LinkedIn key cannot decrypt Facebook token)
 *   - Unicode and long-token payloads handled correctly
 */

import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { encryptLinkedInToken, decryptLinkedInToken } from "../linkedin-token-encryption";
import { encryptFacebookToken, decryptFacebookToken } from "../facebook-token-encryption";
import { encryptXToken, decryptXToken } from "../x-token-encryption";

// ─── Environment setup ────────────────────────────────────────────────────────

const LINKEDIN_TEST_KEY = "li-test-encryption-key-32-chars!";
const FACEBOOK_TEST_KEY = "fb-test-encryption-key-32-chars!";
const X_TEST_KEY = "x-test-encryption-key-32-chars!!";

let savedLinkedInKey: string | undefined;
let savedFacebookKey: string | undefined;
let savedXKey: string | undefined;

beforeAll(() => {
  savedLinkedInKey = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
  savedFacebookKey = process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY;
  savedXKey = process.env.X_TOKEN_ENCRYPTION_KEY;

  process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = LINKEDIN_TEST_KEY;
  process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY = FACEBOOK_TEST_KEY;
  process.env.X_TOKEN_ENCRYPTION_KEY = X_TEST_KEY;
});

afterAll(() => {
  process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = savedLinkedInKey;
  process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY = savedFacebookKey;
  process.env.X_TOKEN_ENCRYPTION_KEY = savedXKey;
});

// ─── LinkedIn token encryption ────────────────────────────────────────────────

describe("LinkedIn token encryption", () => {
  it("round-trips an access token", () => {
    const plaintext = "linkedin_access_token_for_testing_never_real";
    expect(decryptLinkedInToken(encryptLinkedInToken(plaintext))).toBe(plaintext);
  });

  it("round-trips a refresh token", () => {
    const plaintext = "linkedin_refresh_token_for_testing_never_real";
    expect(decryptLinkedInToken(encryptLinkedInToken(plaintext))).toBe(plaintext);
  });

  it("produces unique ciphertext each call (random IV)", () => {
    const pt = "same-plaintext";
    const c1 = encryptLinkedInToken(pt);
    const c2 = encryptLinkedInToken(pt);
    expect(c1).not.toBe(c2);
    expect(decryptLinkedInToken(c1)).toBe(pt);
    expect(decryptLinkedInToken(c2)).toBe(pt);
  });

  it("throws on malformed ciphertext (missing segments)", () => {
    expect(() => decryptLinkedInToken("not.valid")).toThrow();
  });

  it("throws on empty ciphertext", () => {
    expect(() => decryptLinkedInToken("")).toThrow();
  });

  it("round-trips a long token payload", () => {
    const longToken = "a".repeat(2048);
    expect(decryptLinkedInToken(encryptLinkedInToken(longToken))).toBe(longToken);
  });

  it("round-trips a unicode payload", () => {
    const unicode = "token_with_unicode_🔐_chars";
    expect(decryptLinkedInToken(encryptLinkedInToken(unicode))).toBe(unicode);
  });

  it("throws when LINKEDIN_TOKEN_ENCRYPTION_KEY is absent", () => {
    const saved = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
    process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = "";
    try {
      expect(() => encryptLinkedInToken("test")).toThrow(/LINKEDIN_TOKEN_ENCRYPTION_KEY/);
    } finally {
      process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = saved;
    }
  });
});

// ─── Facebook token encryption ────────────────────────────────────────────────

describe("Facebook token encryption", () => {
  it("round-trips a Page access token", () => {
    const plaintext = "EAAtest_fake_facebook_page_token_for_testing_only";
    expect(decryptFacebookToken(encryptFacebookToken(plaintext))).toBe(plaintext);
  });

  it("produces unique ciphertext each call (random IV)", () => {
    const pt = "fb-same-plaintext";
    const c1 = encryptFacebookToken(pt);
    const c2 = encryptFacebookToken(pt);
    expect(c1).not.toBe(c2);
    expect(decryptFacebookToken(c1)).toBe(pt);
    expect(decryptFacebookToken(c2)).toBe(pt);
  });

  it("throws on malformed ciphertext (wrong number of segments)", () => {
    expect(() => decryptFacebookToken("bad:format")).toThrow();
  });

  it("throws on empty ciphertext", () => {
    expect(() => decryptFacebookToken("")).toThrow();
  });

  it("throws on GCM tag tamper (integrity check)", () => {
    const ct = encryptFacebookToken("secure-value");
    // Corrupt the middle segment (auth tag)
    const parts = ct.split(":");
    parts[1] = "00".repeat(16); // zeroed tag
    expect(() => decryptFacebookToken(parts.join(":"))).toThrow();
  });

  it("round-trips a long token payload", () => {
    const longToken = "b".repeat(2048);
    expect(decryptFacebookToken(encryptFacebookToken(longToken))).toBe(longToken);
  });

  it("throws when FACEBOOK_TOKEN_ENCRYPTION_KEY is absent (no fallback)", () => {
    const savedFb = process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY;
    const savedLi = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
    process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY = "";
    process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = "";
    try {
      expect(() => encryptFacebookToken("test")).toThrow(/FACEBOOK_TOKEN_ENCRYPTION_KEY/);
    } finally {
      process.env.FACEBOOK_TOKEN_ENCRYPTION_KEY = savedFb;
      process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = savedLi;
    }
  });
});

// ─── X token encryption ───────────────────────────────────────────────────────

describe("X token encryption", () => {
  it("round-trips an OAuth 2.0 access token", () => {
    const plaintext = "x_oauth2_access_token_for_testing_never_real";
    expect(decryptXToken(encryptXToken(plaintext))).toBe(plaintext);
  });

  it("round-trips a refresh token", () => {
    const plaintext = "x_oauth2_refresh_token_for_testing_never_real";
    expect(decryptXToken(encryptXToken(plaintext))).toBe(plaintext);
  });

  it("produces unique ciphertext each call (random IV)", () => {
    const pt = "x-same-plaintext";
    const c1 = encryptXToken(pt);
    const c2 = encryptXToken(pt);
    expect(c1).not.toBe(c2);
    expect(decryptXToken(c1)).toBe(pt);
    expect(decryptXToken(c2)).toBe(pt);
  });

  it("throws on malformed ciphertext (wrong segments)", () => {
    expect(() => decryptXToken("bad:format")).toThrow();
  });

  it("throws on empty ciphertext", () => {
    expect(() => decryptXToken("")).toThrow();
  });

  it("throws on GCM tag tamper (integrity check)", () => {
    const ct = encryptXToken("secure-x-value");
    const parts = ct.split(":");
    parts[1] = "00".repeat(16);
    expect(() => decryptXToken(parts.join(":"))).toThrow();
  });

  it("round-trips a long token payload", () => {
    const longToken = "c".repeat(2048);
    expect(decryptXToken(encryptXToken(longToken))).toBe(longToken);
  });

  it("throws when X_TOKEN_ENCRYPTION_KEY is absent (no fallback)", () => {
    const savedX = process.env.X_TOKEN_ENCRYPTION_KEY;
    const savedLi = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
    process.env.X_TOKEN_ENCRYPTION_KEY = "";
    process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = "";
    try {
      expect(() => encryptXToken("test")).toThrow(/X_TOKEN_ENCRYPTION_KEY/);
    } finally {
      process.env.X_TOKEN_ENCRYPTION_KEY = savedX;
      process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY = savedLi;
    }
  });
});

// ─── Cross-provider key isolation ────────────────────────────────────────────

describe("Cross-provider key isolation", () => {
  it("LinkedIn ciphertext cannot be decrypted with Facebook key", () => {
    // Use a different key for Facebook to simulate key isolation
    const liCiphertext = encryptLinkedInToken("cross-provider-test");
    // Facebook decryptor uses a different key — GCM tag will fail
    expect(() => decryptFacebookToken(liCiphertext)).toThrow();
  });

  it("Facebook ciphertext cannot be decrypted with X key", () => {
    const fbCiphertext = encryptFacebookToken("cross-provider-test");
    // X decryptor uses a different key — GCM tag will fail or malformed
    expect(() => decryptXToken(fbCiphertext)).toThrow();
  });

  it("X ciphertext cannot be decrypted with LinkedIn key", () => {
    const xCiphertext = encryptXToken("cross-provider-test");
    // LinkedIn uses base64url format with '.', X uses hex with ':' — will throw on format or GCM
    expect(() => decryptLinkedInToken(xCiphertext)).toThrow();
  });
});

// ─── Shared policy gate ───────────────────────────────────────────────────────

import { applySharedOutboundPolicy, mergeGateResults, connectionBlockers } from "./outbound-policy-gate";
import type { OutboundDraft } from "./outbound-provider-contract";

const validDraft: OutboundDraft = {
  provider: "facebook",
  assetType: "blog",
  slug: "blog-series/test/test-part",
  title: "Test Post",
  text: "This is a valid test post with content that is fine to publish.",
  link: "https://abrahamoflondon.com/blog/test",
  meta: {},
};

describe("applySharedOutboundPolicy", () => {
  it("passes a clean draft", () => {
    const result = applySharedOutboundPolicy(validDraft, {
      allowedLinkPrefixes: ["https://abrahamoflondon.com"],
    });
    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks null draft", () => {
    const result = applySharedOutboundPolicy(null);
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not found/i);
  });

  it("blocks empty text", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "" });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/empty/i);
  });

  it("blocks MDX frontmatter", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "---\ntitle: Test\n---\nBody." });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/frontmatter/i);
  });

  it("blocks 'AI predicts' phrase", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "AI predicts market growth." });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/ai predicts/i);
  });

  it("blocks 'guaranteed' phrase", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "Guaranteed returns." });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/guaranteed/i);
  });

  it("blocks 'investment advice' phrase", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "This is investment advice." });
    expect(result.allowed).toBe(false);
  });

  it("blocks 'buy now' phrase", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "Buy now to get started." });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/buy now/i);
  });

  it("blocks Q2 report availability claim", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, text: "Q2 2026 report is now available." });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/Q2 report/i);
  });

  it("blocks disallowed link domain", () => {
    const result = applySharedOutboundPolicy(
      { ...validDraft, link: "https://competitor.com/page" },
      { allowedLinkPrefixes: ["https://abrahamoflondon.com"] },
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/allowed domain/i);
  });

  it("passes null link (link-optional posts)", () => {
    const result = applySharedOutboundPolicy(
      { ...validDraft, link: null },
      { allowedLinkPrefixes: ["https://abrahamoflondon.com"] },
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks empty title", () => {
    const result = applySharedOutboundPolicy({ ...validDraft, title: "" });
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/title/i);
  });

  it("blocks text exceeding maxChars", () => {
    const result = applySharedOutboundPolicy(
      { ...validDraft, text: "a".repeat(2201), link: null },
      { maxChars: 2200 },
    );
    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/character limit/i);
  });

  it("passes text exactly at maxChars", () => {
    const result = applySharedOutboundPolicy(
      { ...validDraft, text: "a".repeat(2200), link: null },
      { maxChars: 2200 },
    );
    expect(result.allowed).toBe(true);
  });

  it("warns on internal control language", () => {
    const result = applySharedOutboundPolicy({
      ...validDraft,
      text: "This passed the release gate check.",
    });
    expect(result.warnings.some((w) => /control language/i.test(w))).toBe(true);
  });

  it("deduplicates identical blockers", () => {
    // 'guaranteed' appears twice in text — should produce one blocker
    const result = applySharedOutboundPolicy({
      ...validDraft,
      text: "guaranteed guaranteed",
    });
    const guaranteedBlockers = result.blockers.filter((b) => /guaranteed/i.test(b));
    expect(guaranteedBlockers.length).toBe(1);
  });
});

describe("mergeGateResults", () => {
  it("merges blockers and warnings from multiple results", () => {
    const r1 = { allowed: false, blockers: ["blocker A"], warnings: ["warn 1"] };
    const r2 = { allowed: false, blockers: ["blocker B"], warnings: ["warn 1"] };
    const merged = mergeGateResults(r1, r2);
    expect(merged.allowed).toBe(false);
    expect(merged.blockers).toContain("blocker A");
    expect(merged.blockers).toContain("blocker B");
    expect(merged.warnings).toHaveLength(1); // deduplicated
  });

  it("allows when all results are clear", () => {
    const r1 = { allowed: true, blockers: [], warnings: [] };
    const r2 = { allowed: true, blockers: [], warnings: [] };
    expect(mergeGateResults(r1, r2).allowed).toBe(true);
  });
});

describe("connectionBlockers", () => {
  it("returns blocker when not connected", () => {
    const blockers = connectionBlockers({
      connected: false,
      canPublish: false,
      missingScopes: [],
    });
    expect(blockers.join(" ")).toMatch(/not active/i);
  });

  it("returns scope blockers when scopes are missing and requiredScopes provided", () => {
    const blockers = connectionBlockers({
      connected: true,
      canPublish: true,
      missingScopes: ["tweet.write"],
      requiredScopes: ["tweet.write"],
    });
    expect(blockers.join(" ")).toMatch(/tweet\.write/);
  });

  it("returns no blockers for healthy connection with no missing scopes", () => {
    const blockers = connectionBlockers({
      connected: true,
      canPublish: true,
      missingScopes: [],
    });
    expect(blockers).toHaveLength(0);
  });
});
