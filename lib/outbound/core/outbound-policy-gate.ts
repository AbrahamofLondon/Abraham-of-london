/**
 * lib/outbound/core/outbound-policy-gate.ts
 *
 * Shared outbound publishing policy rules applied to ALL providers.
 *
 * Provider-specific constraints (character limits, image paths, org targets)
 * are in the provider adapter's own gate. This file handles:
 *   - Disallowed claim phrases
 *   - Frontmatter leakage detection
 *   - Internal control language warnings
 *   - Link domain allowlist
 *   - Empty text guard
 *   - Title presence guard
 *
 * Usage:
 *   const result = applySharedOutboundPolicy(draft, { maxChars: 280, allowedLinkPrefixes });
 *   // then merge into provider gate result
 */

import type { OutboundDraft, OutboundGateResult } from "./outbound-provider-contract";

// ─── Shared disallowed phrases ────────────────────────────────────────────────

/**
 * Phrases that are categorically banned from outbound post text across all providers.
 * Applied case-insensitively against the full normalised text.
 */
const DISALLOWED_PHRASES: string[] = [
  "ai predicts",
  "guaranteed",
  "guarantee",
  "investment advice",
  "buy now",
  "buy today",
];

/**
 * Regex patterns that signal specific high-risk claim categories.
 * These are checked against normalised (lowercased) text.
 */
const DISALLOWED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    // Q2 report availability claim — blocked while Q2 remains draft
    pattern: /q2\s+(2026\s+)?report\s+(is\s+)?(now\s+)?available/i,
    label: "Q2 report availability claim is not allowed while Q2 remains draft.",
  },
];

// ─── Internal control language ────────────────────────────────────────────────

/**
 * Words/phrases that suggest internal tooling language leaking into public copy.
 * Raises a warning (not a blocker) so an admin can review.
 */
const CONTROL_LANGUAGE_PATTERN = /release gate|quality gate|lifecycle state|contentlayer/i;

// ─── MDX frontmatter guard ───────────────────────────────────────────────────

function startsWithFrontmatter(text: string): boolean {
  return text.trimStart().startsWith("---");
}

// ─── Options ─────────────────────────────────────────────────────────────────

export type SharedPolicyOptions = {
  /**
   * Maximum character count for the post text.
   * Pass 0 or omit to skip character-limit enforcement here
   * (useful when the provider gate does its own weighted counting, e.g. X).
   */
  maxChars?: number;
  /**
   * Allowed link URL prefixes. Pass an empty array or omit to skip link domain check.
   * Null link values are always permitted.
   */
  allowedLinkPrefixes?: readonly string[];
  /**
   * Include the link domain check against allowedLinkPrefixes.
   * Default: true when allowedLinkPrefixes is non-empty.
   */
  enforceLink?: boolean;
};

// ─── Core shared gate ─────────────────────────────────────────────────────────

/**
 * Evaluate shared outbound publishing policy for a draft.
 *
 * Returns the accumulated blockers and warnings from shared rules only.
 * Provider adapters merge this result with their own provider-specific checks.
 */
export function applySharedOutboundPolicy(
  draft: OutboundDraft | null | undefined,
  options: SharedPolicyOptions = {},
): OutboundGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // ── Null check ──────────────────────────────────────────────────────────────
  if (!draft) {
    return {
      allowed: false,
      blockers: ["Outbound asset was not found."],
      warnings: [],
    };
  }

  const { text, title, link } = draft;
  const { maxChars, allowedLinkPrefixes = [], enforceLink = allowedLinkPrefixes.length > 0 } = options;

  // ── Title ────────────────────────────────────────────────────────────────────
  if (!title || !title.trim()) {
    blockers.push("Title is missing or empty.");
  }

  // ── Text: empty ──────────────────────────────────────────────────────────────
  if (!text || !text.trim()) {
    blockers.push("Post text is empty.");
  } else {
    // ── Text: frontmatter leak ───────────────────────────────────────────────
    if (startsWithFrontmatter(text)) {
      blockers.push("Post text must not include MDX frontmatter (--- delimiter).");
    }

    // ── Text: character limit ────────────────────────────────────────────────
    if (maxChars && maxChars > 0 && text.length > maxChars) {
      blockers.push(`Post text exceeds the character limit (${text.length}/${maxChars}).`);
    }

    const normalised = text.toLowerCase();

    // ── Disallowed phrases ───────────────────────────────────────────────────
    for (const phrase of DISALLOWED_PHRASES) {
      if (normalised.includes(phrase)) {
        blockers.push(`Disallowed phrase in post text: "${phrase}".`);
      }
    }

    // ── Disallowed patterns ──────────────────────────────────────────────────
    for (const { pattern, label } of DISALLOWED_PATTERNS) {
      if (pattern.test(normalised)) {
        blockers.push(label);
      }
    }

    // ── Internal control language warning ────────────────────────────────────
    if (CONTROL_LANGUAGE_PATTERN.test(text)) {
      warnings.push(
        "Post text appears to contain internal control language. Review before publishing.",
      );
    }
  }

  // ── Link domain ──────────────────────────────────────────────────────────────
  if (enforceLink && link !== null && link !== undefined) {
    const isAllowed = allowedLinkPrefixes.some((prefix) => link.startsWith(prefix));
    if (!isAllowed) {
      blockers.push(
        `Link domain is not on the allowed domain list: ${link}`,
      );
    }
  }

  return {
    allowed: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  };
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

/**
 * Merge two OutboundGateResult objects.
 * Combines blockers and warnings, deduplicates, re-evaluates allowed.
 */
export function mergeGateResults(...results: OutboundGateResult[]): OutboundGateResult {
  const blockers = Array.from(new Set(results.flatMap((r) => r.blockers)));
  const warnings = Array.from(new Set(results.flatMap((r) => r.warnings)));
  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
  };
}

// ─── Connection guard helpers ─────────────────────────────────────────────────

/**
 * Produce a standard blocker list for a missing or inactive connection.
 * Providers call this rather than writing their own "not connected" checks.
 */
export function connectionBlockers(input: {
  connected: boolean;
  canPublish: boolean;
  missingScopes: string[];
  requiredScopes?: string[];
}): string[] {
  const blockers: string[] = [];

  if (!input.connected || !input.canPublish) {
    blockers.push("Publishing connection is not active.");
  }

  const required = input.requiredScopes ?? [];
  for (const scope of required) {
    if (!input.missingScopes.includes(scope)) continue;
    blockers.push(`Missing required scope or permission: ${scope}.`);
  }

  // Also include any missingScopes even if requiredScopes not explicitly named
  if (required.length === 0) {
    for (const scope of input.missingScopes) {
      blockers.push(`Missing required scope or permission: ${scope}.`);
    }
  }

  return blockers;
}
