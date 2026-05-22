/**
 * lib/outbound/facebook-content-resolver.ts
 *
 * Resolves publishable assets for the Facebook outbound console.
 * Supports blog series parts, editorial assets, and custom text.
 *
 * Designed to be imported from API routes and getServerSideProps.
 * Does not use server-only — the caller is responsible for server-context.
 *
 * The canonical site URL used for link construction.
 */

import { getBlogSeriesCatalogue } from "@/lib/blog/series";
import type { FacebookPublishedAsset, FacebookAssetType } from "./facebook-types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_BASE = "https://abrahamoflondon.com";

// ─── Blog series resolver ─────────────────────────────────────────────────────

/**
 * Returns all PUBLISHED blog series parts as FacebookPublishedAsset candidates.
 * The `text` field is a composed post draft — the admin can edit in the console.
 */
export function getBlogSeriesFacebookAssets(): FacebookPublishedAsset[] {
  const catalogue = getBlogSeriesCatalogue();
  const assets: FacebookPublishedAsset[] = [];

  for (const series of catalogue) {
    for (const part of series.parts) {
      if (part.status !== "PUBLISHED") continue;

      const link = `${SITE_BASE}/blog/series/${series.slug}/${part.slug}`;
      const text = composeBlogSeriesText(series.title, part.title, part.excerpt, link);

      assets.push({
        assetType: "blog" as FacebookAssetType,
        slug: `blog-series/${series.slug}/${part.slug}`,
        title: part.title,
        text,
        link,
        imagePath: `/assets/images/blog-series/${series.slug}/${part.slug.split("/").pop()}.jpg`,
      });
    }
  }

  return assets;
}

function composeBlogSeriesText(
  seriesTitle: string,
  partTitle: string,
  excerpt: string,
  link: string,
): string {
  return [
    `${partTitle}`,
    ``,
    excerpt,
    ``,
    `Part of the series: ${seriesTitle}`,
    link,
  ].join("\n");
}

// ─── Asset lookup by slug ─────────────────────────────────────────────────────

export function getFacebookAssetBySlug(slug: string): FacebookPublishedAsset | null {
  const all = getBlogSeriesFacebookAssets();
  return all.find((a) => a.slug === slug) ?? null;
}

/**
 * All publishable Facebook assets from all supported content types.
 * Extend this function when editorial or GMI assets are supported.
 */
export function getAllFacebookPublishableAssets(): FacebookPublishedAsset[] {
  return getBlogSeriesFacebookAssets();
}

// ─── Custom asset builder ─────────────────────────────────────────────────────

/**
 * Build a custom FacebookPublishedAsset from admin-supplied text.
 * Used when the admin selects "custom" in the console.
 */
export function buildCustomFacebookAsset(input: {
  title: string;
  text: string;
  link?: string | null;
  imagePath?: string | null;
}): FacebookPublishedAsset {
  return {
    assetType: "custom",
    slug: `custom/${Date.now()}`,
    title: input.title,
    text: input.text,
    link: input.link ?? null,
    imagePath: input.imagePath ?? null,
  };
}
