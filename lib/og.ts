// lib/og.ts
import { siteConfig, absUrl } from "@/lib/siteConfig";

const LOCAL_FALLBACK = "/assets/images/blog/default-blog-cover.jpg";
const DEFAULT_FALLBACK = siteConfig.ogImage || LOCAL_FALLBACK;

function truncate(s: string, max = 120) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Build the social image URL for a post.
 * If your /api/og route is present, this returns a URL like:
 *   https://www.abrahamoflondon.org/api/og?title=...&slug=...&type=og
 * Otherwise it falls back to your configured OG image.
 *
 * @param slug   Post slug (e.g., "my-post")
 * @param title  Post title (used to render text on the image)
 * @param opts   absolute: return absolute URL (default true)
 *               type:     'og' | 'twitter' (default 'og')
 */
export function generatedCover(
  slug?: string,
  title?: string,
  opts: { absolute?: boolean; type?: "og" | "twitter" } = {},
): string {
  const absolute = opts.absolute ?? true;
  const type = opts.type ?? "og";

  if (slug && title) {
    // keep params tidy & safe
    const params = new URLSearchParams({
      title: truncate(title.trim(), 120),
      slug: slug.replace(/^\/+/, "").trim(),
      type,
    });

    const path = `/api/og?${params.toString()}`;
    return absolute ? absUrl(path) : path;
  }

  // Fallback if no title/slug provided
  const fallback = DEFAULT_FALLBACK.startsWith("/")
    ? (absolute ? absUrl(DEFAULT_FALLBACK) : DEFAULT_FALLBACK)
    : DEFAULT_FALLBACK;

  return fallback;
}

/**
 * Convenience alias when you know you need a Twitter image variant.
 * Assumes your /api/og can render a Twitter layout when type=twitter.
 */
export function generatedTwitterImage(
  slug?: string,
  title?: string,
  absolute = true,
): string {
  return generatedCover(slug, title, { absolute, type: "twitter" });
}
