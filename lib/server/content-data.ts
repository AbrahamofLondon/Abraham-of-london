// lib/server/content-data.ts

export type ContentKind = "post" | "event" | "download" | "print" | "page";

export interface ContentSummary {
  slug: string;
  title: string;
  kind: ContentKind;
  date?: string | null;
  tags?: string[];
  description?: string | null;
}

/**
 * Return all known content items.
 * Stub implementation: returns an empty list.
 */
export function getAllContent(): ContentSummary[] {
  return [];
}

/**
 * Find a single item by slug/kind.
 * Stub implementation: returns null.
 */
export function getContentBySlug(
  _slug: string,
  _kind?: ContentKind
): ContentSummary | null {
  return null;
}

/**
 * Grouped content index.
 * Stub implementation: each group is an empty list.
 */
export function getContentIndex(): {
  posts: ContentSummary[];
  events: ContentSummary[];
  downloads: ContentSummary[];
  prints: ContentSummary[];
  pages: ContentSummary[];
} {
  return {
    posts: [],
    events: [],
    downloads: [],
    prints: [],
    pages: [],
  };
}

const contentData = {
  getAllContent,
  getContentBySlug,
  getContentIndex,
};

export default contentData;