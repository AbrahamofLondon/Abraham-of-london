// lib/og.ts

import { siteConfig, absUrl } from "@/lib/siteConfig";

// --- Constants ---
const LOCAL_FALLBACK = "/assets/images/blog/default-blog-cover.jpg";
// Use siteConfig.ogImage if available, otherwise use the local fallback
const DEFAULT_STATIC_FALLBACK = siteConfig.ogImage || LOCAL_FALLBACK;

// --- Helper Functions ---

/**
 * Safely truncates a string, appending a correct ellipsis if truncated.
 * @param s The string to truncate.
 * @param max The maximum length (default 100 characters).
 * @returns The truncated string.
 */
function truncate(s: string, max = 100): string {
  const trimmed = s.trim();
  if (trimmed.length > max) {
    // FIX: Use the correct UTF-8 ellipsis character
    return `${trimmed.slice(0, max - 1)}\u2026`; 
  }
  return trimmed;
}

// --- Main Exported Functions ---

interface GeneratedCoverOptions {
  /** Return an absolute URL (default: true). */
  absolute?: boolean;
  /** The social card type: 'og' (default) or 'twitter'. */
  type?: "og" | "twitter";
}

/**
 * Builds the social image URL for a post, prioritizing a dynamic /api/og endpoint.
 * Falls back to a static image if slug/title are missing or if the API is intentionally bypassed.
 *
 * @param slug Post slug (e.g., "my-post").
 * @param title Post title (used to render text on the image).
 * @param opts Options for absolute URL and card type.
 */
export function generatedCover(
  slug: string | null | undefined,
  title: string | null | undefined,
  opts: GeneratedCoverOptions = {},
): string {
  const absolute = opts.absolute ?? true;
  const type = opts.type ?? "og";

  const safeTitle = title?.trim();
  const safeSlug = slug?.replace(/^\/+/, "").trim();

  // 1. Attempt to generate the dynamic URL
  if (safeSlug && safeTitle) {
    const params = new URLSearchParams({
      // Truncate the title to keep the URL length manageable and safe
      title: truncate(safeTitle, 100), 
      slug: safeSlug,
      type: type,
    });

    // NOTE: The URLSearchParams object automatically handles URL encoding (e.g., spaces to + or %20).
    const path = `/api/og?${params.toString()}`;
    return absolute ? absUrl(path) : path;
  }

  // 2. Fallback to the static image
  
  const fallback = DEFAULT_STATIC_FALLBACK;

  if (fallback.startsWith("/")) {
    // If the fallback is a relative path, resolve it
    return absolute ? absUrl(fallback) : fallback;
  }
  
  // If the fallback is already a full absolute URL
  return fallback;
}

/**
 * Convenience alias when you know you need a Twitter image variant.
 * Assumes your /api/og can render a Twitter layout when type=twitter.
 *
 * @param slug Post slug.
 * @param title Post title.
 * @param absolute Whether to return an absolute URL (default: true).
 */
export function generatedTwitterImage(
  slug: string | null | undefined,
  title: string | null | undefined,
  absolute = true,
): string {
  return generatedCover(slug, title, { absolute, type: "twitter" });
}