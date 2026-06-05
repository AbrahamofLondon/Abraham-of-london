/* lib/content/briefs-cover-map.ts — Cover image registry for Briefs publication estate */
/* Single source of truth for OG/social cover images across all brief surfaces. */

export const BRIEFS_COVER_MAP = {
  /** Intelligence Briefs — main index */
  intelligenceBriefs: {
    path: "/assets/images/covers/briefs/intelligence-briefs-cover.webp",
    alt: "Abraham of London — Intelligence Briefs",
  },
  /** Institutional Alpha series */
  institutionalAlpha: {
    path: "/assets/images/covers/briefs/institutional-alpha-cover.webp",
    alt: "Abraham of London — Institutional Alpha",
  },
  /** Sovereign Intelligence series */
  sovereignIntelligence: {
    path: "/assets/images/covers/briefs/sovereign-intelligence-cover.webp",
    alt: "Abraham of London — Sovereign Intelligence",
  },
  /** Vault Briefs — main index */
  vaultBriefs: {
    path: "/assets/images/covers/briefs/vault-briefs-cover.webp",
    alt: "Abraham of London — Vault Briefs",
  },
  /** Frontier Resilience sequence */
  frontierResilience: {
    path: "/assets/images/covers/briefs/frontier-resilience-cover.webp",
    alt: "Abraham of London — Frontier Resilience",
  },
} as const;

export type BriefsCoverKey = keyof typeof BRIEFS_COVER_MAP;

/**
 * Get the cover image path for a briefs publication family.
 */
export function getBriefsCover(key: BriefsCoverKey): { path: string; alt: string } {
  return BRIEFS_COVER_MAP[key];
}

/**
 * Build OG image meta tags for a briefs publication family.
 * Returns an array of meta tag objects suitable for spreading into <Head>.
 */
export function buildBriefsOgMeta(key: BriefsCoverKey, title?: string): Array<{ property?: string; name?: string; content: string }> {
  const cover = getBriefsCover(key);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const imageUrl = `${siteUrl}${cover.path}`;

  return [
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: cover.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: cover.alt },
    ...(title ? [{ property: "og:title" as const, content: title }] : []),
  ];
}
