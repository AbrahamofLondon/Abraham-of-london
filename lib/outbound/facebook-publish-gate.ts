/**
 * lib/outbound/facebook-publish-gate.ts
 *
 * Publish gate for Facebook Page posts.
 * Mirrors the LinkedIn gate pattern — pure, synchronous, no side effects.
 *
 * Blockers prevent publishing. Warnings are advisory only.
 */

import {
  FACEBOOK_ALLOWED_LINK_PREFIXES,
  FACEBOOK_ALLOWED_IMAGE_PREFIXES,
  type FacebookPublishGateResult,
  type FacebookPublishedAsset,
} from "./facebook-types";
import type { FacebookConnectionStatus } from "./facebook-types";

// ─── Character limits ─────────────────────────────────────────────────────────

// Facebook Page posts: practical limit is 63,206 chars, but we enforce a sane
// editorial cap of 2,200 to discourage wall-of-text posts.
const FACEBOOK_MAX_POST_CHARS = 2200;

// ─── Disallowed claim fragments ───────────────────────────────────────────────

const DISALLOWED_CLAIM_FRAGMENTS: [RegExp, string][] = [
  [/ai predicts/i, '"AI predicts"'],
  [/guaranteed\b/i, '"guaranteed"'],
  [/investment advice/i, '"investment advice"'],
  [/buy\s+(now|today)\b/i, '"buy now / buy today"'],
  [/\bguarantee\b/i, '"guarantee"'],
  [/q2\s+(2026\s+)?report\s+(is\s+)?(now\s+)?available/i, "Q2 report availability claim"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function textOf(asset: FacebookPublishedAsset): string {
  return [asset.title, asset.text].filter(Boolean).join("\n");
}

function isLinkAllowed(link: string | null): boolean {
  if (!link) return true; // no link = allowed (text-only post)
  return FACEBOOK_ALLOWED_LINK_PREFIXES.some((prefix) => link.startsWith(prefix));
}

function isImagePathAllowed(imagePath: string | null): boolean {
  if (!imagePath) return true; // no image = allowed
  return FACEBOOK_ALLOWED_IMAGE_PREFIXES.some((prefix) => imagePath.startsWith(prefix));
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

export function canPublishFacebookPost(
  asset: FacebookPublishedAsset | null | undefined,
  connection: FacebookConnectionStatus | null | undefined,
): FacebookPublishGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!asset) {
    return {
      allowed: false,
      blockers: ["Facebook asset was not found."],
      warnings,
    };
  }

  // ── Connection checks ──────────────────────────────────────────────────────
  if (!connection || !connection.connected) {
    blockers.push("Facebook Page connection is not active.");
  } else {
    if (!connection.canPublish) {
      const missing = connection.missingPermissions;
      if (missing.length > 0) {
        blockers.push(`Missing required Facebook permissions: ${missing.join(", ")}.`);
      } else {
        blockers.push("Facebook connection cannot publish (permission check failed).");
      }
    }
    if (connection.readiness === "TOKEN_INVALID") {
      blockers.push("Facebook token is invalid or expired. Reconnect via OAuth.");
    }
    if (connection.readiness === "CONFIG_MISSING") {
      blockers.push("Facebook app configuration is incomplete.");
    }
    if (connection.state === "env_token") {
      warnings.push(
        "Using environment variable token. OAuth connection is recommended for production.",
      );
    }
  }

  // ── Text checks ────────────────────────────────────────────────────────────
  const composedText = asset.text?.trim() ?? "";
  if (!composedText) {
    blockers.push("Post text is empty.");
  }
  if (composedText.length > FACEBOOK_MAX_POST_CHARS) {
    blockers.push(
      `Post text exceeds limit (${composedText.length}/${FACEBOOK_MAX_POST_CHARS} characters).`,
    );
  }
  if (composedText.trimStart().startsWith("---")) {
    blockers.push("Post text must not include MDX frontmatter.");
  }
  if (/release gate|quality gate|lifecycle state|contentlayer/i.test(composedText)) {
    warnings.push("Post text appears to include internal control language.");
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
      `Link "${asset.link}" is not from an allowed domain. Only first-party abrahamoflondon.com links are permitted.`,
    );
  }

  // ── Image path safety ─────────────────────────────────────────────────────
  if (asset.imagePath && !isImagePathAllowed(asset.imagePath)) {
    blockers.push(
      `Image path "${asset.imagePath}" is not under an allowed public assets directory.`,
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
