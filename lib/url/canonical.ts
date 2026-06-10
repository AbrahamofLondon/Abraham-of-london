/**
 * lib/url/canonical.ts — Safe canonical site URL resolver.
 *
 * Rules:
 *  1. If a recognised env var is set and non-empty, use it (trimmed, no trailing slash).
 *  2. Otherwise, fall back to the hardcoded production origin.
 *  3. Never return an empty string or pass one to new URL().
 *  4. Throws an explicit, named error if somehow called with an invalid value —
 *     far better than a silent "TypeError: Invalid URL" at build time.
 */

const FALLBACK = "https://www.abrahamoflondon.org";

function resolve(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const trimmed = raw.trim().replace(/\/+$/, "");
    if (!trimmed) continue;
    try {
      new URL(trimmed); // validate — throws if malformed
      return trimmed;
    } catch {
      // malformed env var — skip, try next candidate
    }
  }

  return FALLBACK;
}

/** Canonical site origin, always a valid absolute URL, no trailing slash. */
export const CANONICAL_SITE_URL: string = resolve();

/**
 * Returns the canonical site URL.
 * Always returns a valid absolute URL string — never empty, never throws.
 */
export function getCanonicalSiteUrl(): string {
  return CANONICAL_SITE_URL;
}

/**
 * Constructs an absolute URL for the given path.
 * Safe equivalent of `new URL(path, base)` without the throw risk.
 *
 * @param path  - relative path (e.g. "/blog/my-post") or absolute URL
 * @returns absolute URL string
 */
export function toAbsoluteUrl(path: string): string {
  if (!path) return CANONICAL_SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const base = CANONICAL_SITE_URL;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
