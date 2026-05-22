/**
 * lib/blog/select-featured-post.ts
 *
 * Featured essay selection helper for the blog index page.
 *
 * Rules (in priority order):
 *  1. Any post with featured === true wins.
 *  2. If multiple featured posts exist, the newest (by dateIso) wins.
 *  3. If no featured post exists, the newest eligible post wins.
 *  4. Series parts are excluded unless allowSeriesParts is true.
 *
 * Framework-agnostic — accepts any object that conforms to
 * FeaturedCandidate. Generic T means callers recover the full
 * concrete type without casting.
 */

export type FeaturedCandidate = {
  dateIso?: string | null;
  featured?: boolean;
  series?: string | null;
};

export type SelectFeaturedOptions = {
  /**
   * When true, series parts are eligible as candidates.
   * Default: false — series parts are excluded so the lead story is always
   * a standalone essay.
   */
  allowSeriesParts?: boolean;
};

/**
 * Select the featured essay from a list of posts.
 *
 * @param posts   Array of post candidates (any sort order).
 * @param options Optional configuration.
 * @returns       The selected post, or null if no eligible posts exist.
 */
export function selectFeaturedEssay<T extends FeaturedCandidate>(
  posts: T[],
  options: SelectFeaturedOptions = {},
): T | null {
  if (!posts || posts.length === 0) return null;

  const { allowSeriesParts = false } = options;

  // Drop series parts unless the caller explicitly opts in
  const eligible = allowSeriesParts
    ? posts
    : posts.filter((p) => !p.series);

  if (eligible.length === 0) return null;

  // ── 1. Explicit featured flag ─────────────────────────────────────────────
  const featuredPosts = eligible.filter((p) => p.featured === true);

  if (featuredPosts.length > 0) {
    // Multiple featured → newest wins
    return [...featuredPosts].sort((a, b) =>
      (b.dateIso ?? "").localeCompare(a.dateIso ?? ""),
    )[0] ?? null;
  }

  // ── 2. No featured flag → newest eligible post ────────────────────────────
  return [...eligible].sort((a, b) =>
    (b.dateIso ?? "").localeCompare(a.dateIso ?? ""),
  )[0] ?? null;
}
