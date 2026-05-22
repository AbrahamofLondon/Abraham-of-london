/**
 * lib/outbound/x-publish-gate.ts
 *
 * Publish gate for X (Twitter) posts.
 * Pure, synchronous, no side effects.
 * Enforces tweet character limit, claim safety, and connection readiness.
 */

import {
  X_TWEET_MAX_CHARS,
  X_TWEET_URL_LENGTH,
  X_ALLOWED_LINK_PREFIXES,
  type XPublishGateResult,
  type XPublishedAsset,
  type XConnectionStatus,
} from "./x-types";

// ─── Disallowed claim fragments ───────────────────────────────────────────────

const DISALLOWED_CLAIM_FRAGMENTS: [RegExp, string][] = [
  [/ai predicts/i, '"AI predicts"'],
  [/guaranteed\b/i, '"guaranteed"'],
  [/investment advice/i, '"investment advice"'],
  [/buy\s+(now|today)\b/i, '"buy now / buy today"'],
  [/\bguarantee\b/i, '"guarantee"'],
  [/q2\s+(2026\s+)?report\s+(is\s+)?(now\s+)?available/i, "Q2 report availability claim"],
];

// ─── Character counting ───────────────────────────────────────────────────────

/**
 * Count tweet characters the way Twitter does.
 * URLs (any http/https link) count as X_TWEET_URL_LENGTH regardless of actual length.
 */
export function countTweetChars(text: string): number {
  const urlPattern = /https?:\/\/\S+/g;
  const stripped = text.replace(urlPattern, "_".repeat(X_TWEET_URL_LENGTH));
  return stripped.length;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLinkAllowed(link: string | null): boolean {
  if (!link) return true;
  return X_ALLOWED_LINK_PREFIXES.some((prefix) => link.startsWith(prefix));
}

function textOf(asset: XPublishedAsset): string {
  return [asset.title, asset.text].filter(Boolean).join("\n");
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

export function canPublishXPost(
  asset: XPublishedAsset | null | undefined,
  connection: XConnectionStatus | null | undefined,
): XPublishGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!asset) {
    return {
      allowed: false,
      blockers: ["X asset was not found."],
      warnings,
    };
  }

  // ── Connection checks ──────────────────────────────────────────────────────
  if (!connection || !connection.connected) {
    blockers.push("X (Twitter) connection is not active. Connect via OAuth.");
  } else {
    if (!connection.canPublish) {
      const missing = connection.missingScopes;
      if (missing.length > 0) {
        blockers.push(`Missing required X scopes: ${missing.join(", ")}.`);
      } else {
        blockers.push("X connection cannot publish (scope check failed).");
      }
    }
    if (connection.readiness === "TOKEN_INVALID") {
      blockers.push("X token is invalid or expired. Reconnect via OAuth.");
    }
    if (connection.readiness === "CONFIG_MISSING") {
      blockers.push("X app configuration is incomplete. Set X_CLIENT_ID and X_REDIRECT_URI.");
    }
  }

  // ── Text checks ────────────────────────────────────────────────────────────
  const tweetText = asset.text?.trim() ?? "";
  if (!tweetText) {
    blockers.push("Tweet text is empty.");
  }

  const charCount = countTweetChars(tweetText);
  if (charCount > X_TWEET_MAX_CHARS) {
    blockers.push(
      `Tweet exceeds X character limit (${charCount}/${X_TWEET_MAX_CHARS} weighted chars).`,
    );
  }

  if (tweetText.trimStart().startsWith("---")) {
    blockers.push("Tweet text must not include MDX frontmatter.");
  }
  if (/release gate|quality gate|lifecycle state|contentlayer/i.test(tweetText)) {
    warnings.push("Tweet text appears to include internal control language.");
  }

  // ── Claim safety ───────────────────────────────────────────────────────────
  const fullText = textOf(asset);
  for (const [pattern, label] of DISALLOWED_CLAIM_FRAGMENTS) {
    if (pattern.test(fullText)) {
      blockers.push(`Disallowed claim phrase: ${label}.`);
    }
  }

  // ── Link safety ────────────────────────────────────────────────────────────
  if (asset.link && !isLinkAllowed(asset.link)) {
    blockers.push(
      `Link "${asset.link}" is not from an allowed domain.`,
    );
  }

  // ── Title check ────────────────────────────────────────────────────────────
  if (!asset.title?.trim()) {
    blockers.push("Asset title is missing.");
  }

  return {
    allowed: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  };
}
