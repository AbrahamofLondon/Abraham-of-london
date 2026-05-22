/**
 * lib/outbound/x-content-resolver.ts
 *
 * Resolves publishable assets for the X (Twitter) outbound console.
 * Composes tweet-length text (max 280 chars, respecting t.co URL wrapping).
 *
 * Server-safe — no server-only imports.
 */

import { getBlogSeriesCatalogue } from "@/lib/blog/series";
import { X_TWEET_MAX_CHARS, X_TWEET_URL_LENGTH } from "./x-types";
import type { XPublishedAsset, XAssetType } from "./x-types";
import { countTweetChars } from "./x-publish-gate";

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_BASE = "https://abrahamoflondon.com";

// ─── Tweet composition ────────────────────────────────────────────────────────

/**
 * Compose a tweet for a blog series part.
 * Respects Twitter's weighted character counting (URLs = 23 chars each).
 * Structure: title + newline + truncated excerpt + newline + url
 */
function composeBlogSeriesTweet(
  partTitle: string,
  excerpt: string,
  link: string,
): string {
  // URL counts as 23 chars in Twitter's system, plus 2 newlines
  const urlWeight = X_TWEET_URL_LENGTH;
  const overhead = partTitle.length + 2 + 1 + urlWeight; // title + \n\n + excerpt placeholder + \n + url
  const excerptBudget = X_TWEET_MAX_CHARS - overhead - 1; // -1 for safety

  let usedExcerpt = excerpt.trim();
  if (countTweetChars(usedExcerpt) > excerptBudget) {
    // Truncate excerpt to budget, preserving word boundaries
    const words = usedExcerpt.split(" ");
    let built = "";
    for (const word of words) {
      const candidate = built ? `${built} ${word}` : word;
      if (candidate.length + 1 > excerptBudget) break; // +1 for ellipsis
      built = candidate;
    }
    usedExcerpt = `${built}…`;
  }

  return [`${partTitle}`, ``, usedExcerpt, ``, link].join("\n");
}

// ─── Blog series assets ───────────────────────────────────────────────────────

export function getBlogSeriesXAssets(): XPublishedAsset[] {
  const catalogue = getBlogSeriesCatalogue();
  const assets: XPublishedAsset[] = [];

  for (const series of catalogue) {
    for (const part of series.parts) {
      if (part.status !== "PUBLISHED") continue;

      const link = `${SITE_BASE}/blog/series/${series.slug}/${part.slug}`;
      const text = composeBlogSeriesTweet(part.title, part.excerpt, link);

      assets.push({
        assetType: "blog" as XAssetType,
        slug: `blog-series/${series.slug}/${part.slug}`,
        title: part.title,
        text,
        link,
      });
    }
  }

  return assets;
}

// ─── Asset lookup ─────────────────────────────────────────────────────────────

export function getXAssetBySlug(slug: string): XPublishedAsset | null {
  const all = getAllXPublishableAssets();
  return all.find((a) => a.slug === slug) ?? null;
}

export function getAllXPublishableAssets(): XPublishedAsset[] {
  return getBlogSeriesXAssets();
}

// ─── Custom tweet builder ─────────────────────────────────────────────────────

export function buildCustomXAsset(input: {
  title: string;
  text: string;
  link?: string | null;
}): XPublishedAsset {
  return {
    assetType: "custom",
    slug: `custom/${Date.now()}`,
    title: input.title,
    text: input.text,
    link: input.link ?? null,
  };
}

// ─── Facebook → X text adapter ───────────────────────────────────────────────

/**
 * Converts a Facebook post text into a tweet-length version.
 * Used for the "sync to X" option on the Facebook console.
 * Takes the first paragraph + URL, truncates to 280 chars.
 */
export function adaptFacebookTextToTweet(
  facebookText: string,
  link?: string | null,
): string {
  // Take first non-empty paragraph (before first double newline)
  const firstPara = facebookText.split(/\n\n+/)[0]?.trim() ?? facebookText.trim();

  const urlPart = link ? `\n${link}` : "";
  const urlWeight = link ? X_TWEET_URL_LENGTH + 1 : 0; // +1 for newline
  const textBudget = X_TWEET_MAX_CHARS - urlWeight;

  if (countTweetChars(firstPara) <= textBudget) {
    return `${firstPara}${urlPart}`;
  }

  // Truncate at word boundary
  const words = firstPara.split(" ");
  let built = "";
  for (const word of words) {
    const candidate = built ? `${built} ${word}` : word;
    if (candidate.length + 1 > textBudget) break;
    built = candidate;
  }
  return `${built}…${urlPart}`;
}
