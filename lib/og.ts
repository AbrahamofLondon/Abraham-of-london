// lib/og.ts
// Minimal, safe fallback that never 404s.
// If you later generate per-post covers, implement lookup here.
export const DEFAULT_BLOG_COVER = "/assets/images/blog/default-blog-cover.jpg";

export function generatedCover(slug?: string) {
  // Keep it deterministic in case you add real generated covers later.
  // For now always return the guaranteed default asset.
  return DEFAULT_BLOG_COVER;
}
