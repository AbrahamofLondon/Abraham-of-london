// lib/server/content-data.ts

export type ContentKind = "post" | "event" | "download" | "print" | "page";

export interface ContentSummary {
  slug: string;
  title: string;
  kind: ContentKind;
  date?: string | null;
  tags?: string[] | null;
  description?: string | null;
}

/**
 * Core registry type if/when you wire real loaders.
 */
export interface ContentIndex {
  posts: ContentSummary[];
  events: ContentSummary[];
  downloads: ContentSummary[];
  prints: ContentSummary[];
  pages: ContentSummary[];
}

/**
 * Factory for an empty index - used both now (stub) and later
 * if you want to merge from multiple sources.
 */
function createEmptyIndex(): ContentIndex {
  return {
    posts: [],
    events: [],
    downloads: [],
    prints: [],
    pages: [],
  };
}

/**
 * Return all known content items.
 *
 * CURRENTLY STUBBED:
 *  - Returns an empty array so it is 100% safe and non-breaking.
 *  - You can later replace this with a merge of your real loaders, e.g.:
 *
 *    import { getAllPosts } from "@/lib/server/posts-data";
 *    import { getAllEvents } from "@/lib/server/events-data";
 *    import { getAllDownloads } from "@/lib/server/downloads-data";
 *
 *    export function getAllContent(): ContentSummary[] {
 *      const posts = getAllPosts().map(...);
 *      const events = getAllEvents().map(...);
 *      const downloads = getAllDownloads().map(...);
 *      return [...posts, ...events, ...downloads];
 *    }
 */
export function getAllContent(): ContentSummary[] {
  return [];
}

/**
 * Find a single item by slug/kind.
 *
 * Safe behaviour:
 *  - Returns `null` if nothing matches.
 *  - If `kind` is provided, it enforces the match on kind as well.
 */
export function getContentBySlug(
  slug: string,
  kind?: ContentKind
): ContentSummary | null {
  if (!slug) return null;

  const all = getAllContent();
  if (!Array.isArray(all) || all.length === 0) return null;

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");

  const match = all.find((item) => {
    if (!item || typeof item.slug !== "string") return false;
    const itemSlug = item.slug.replace(/^\/+|\/+$/g, "");
    if (itemSlug !== normalizedSlug) return false;
    if (kind && item.kind !== kind) return false;
    return true;
  });

  return match ?? null;
}

/**
 * Grouped content index.
 *
 * Behaviour:
 *  - Uses `getAllContent()` as the single source of truth.
 *  - Groups items by `kind` into stable arrays.
 *  - Any unknown `kind` is ignored rather than throwing.
 */
export function getContentIndex(): ContentIndex {
  const all = getAllContent();
  const index = createEmptyIndex();

  if (!Array.isArray(all) || all.length === 0) {
    return index;
  }

  for (const item of all) {
    if (!item || !item.slug || !item.kind) continue;

    const safeItem: ContentSummary = {
      slug: item.slug,
      title: item.title || item.slug,
      kind: item.kind,
      date: item.date ?? null,
      tags: item.tags ?? null,
      description: item.description ?? null,
    };

    switch (item.kind) {
      case "post":
        index.posts.push(safeItem);
        break;
      case "event":
        index.events.push(safeItem);
        break;
      case "download":
        index.downloads.push(safeItem);
        break;
      case "print":
        index.prints.push(safeItem);
        break;
      case "page":
        index.pages.push(safeItem);
        break;
      default:
        // Unknown kind - ignore gracefully, no throw.
        break;
    }
  }

  return index;
}

const contentData = {
  getAllContent,
  getContentBySlug,
  getContentIndex,
};

export default contentData;
