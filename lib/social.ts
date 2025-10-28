// lib/social.ts

import type { SocialLink } from "@/lib/siteConfig";

// --- Constants ---

// Use a fallback for the handle, derived from an environment variable if set.
// This handle is used for standardizing X/Twitter links.
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_X_HANDLE || "AbrahamAda48634";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "s", // Common short-form tracking param
  "ref", // Generic referrer
  "fbclid", // Facebook Click ID
  "gclid", // Google Click ID
  "msclkid", // Microsoft Click ID
];

// --- URL Manipulation Helpers ---

/**
 * Removes common tracking parameters from a given URL string.
 * Leaves non-URL schemes (like mailto:, tel:) untouched.
 * @param href The URL string.
 * @returns The cleaned URL string.
 */
function stripTrackingParams(href: string): string {
  if (!href) return href;
  try {
    const u = new URL(href);
    TRACKING_PARAMS.forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    // Return original href if it's not a valid URL (e.g., mailto, tel)
    return href;
  }
}

/**
 * Normalizes an X/Twitter URL to a standardized format using the site's configured handle.
 * If the link points to *any* X/Twitter profile URL, it redirects to the canonical profile URL.
 * @param href The original link href.
 * @param canonicalHandle The handle to use for normalization (defaults to TWITTER_HANDLE).
 * @returns The normalized X profile URL or the original href if it wasn't an X URL.
 */
export function normalizeX(
  href: string,
  canonicalHandle: string = TWITTER_HANDLE,
): string {
  if (!href || !canonicalHandle) return href;
  
  // Regex to check if the href points to a twitter.com or x.com domain
  const isXUrl = /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^/?#]+/i.test(href);

  if (isXUrl) {
    // If it is an X URL, enforce the canonical structure using the site's official handle
    return `https://x.com/${canonicalHandle.replace(/^@/, "")}`;
  }
  
  return href;
}

// --- Main Exported Function ---

/**
 * Processes an array of SocialLink objects to clean up their hrefs.
 * 1. Normalizes all X/Twitter links to the canonical handle.
 * 2. Strips common tracking parameters.
 * @param links The array of SocialLink objects.
 * @returns The sanitized array of SocialLink objects.
 */
export function sanitizeSocialLinks(links: readonly SocialLink[]): readonly SocialLink[] {
  return links.map((l) => {
    // 1. Normalize X links if the 'kind' is x
    let href = l.kind === "x" ? normalizeX(l.href) : l.href;
    
    // 2. Strip tracking parameters
    href = stripTrackingParams(href);

    return { ...l, href };
  }) as readonly SocialLink[];
}