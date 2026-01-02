// lib/shorts.ts
import {
  type ContentDoc,
  getPublishedShorts, // FIX: Use specific getter instead of generic
  normalizeSlug,
  coerceShortTheme,
} from "./contentlayer-helper";

/**
 * Unified type for Shorts Indexing.
 * Matches the shape expected by pages/shorts/index.tsx
 */
export type ShortIndexItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
  draft?: boolean;
  published?: boolean;
};

/** Safe ISO date (or null) */
function toIsoDate(input: unknown): string | null {
  if (!input) return null;
  try {
    const d = input instanceof Date ? input : new Date(String(input));
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/** Convert unknown tags to string[] */
function toTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
}

/**
 * Helper to resolve read time locally
 */
function getReadTime(doc: any): string | null {
  return doc.readTime || doc.readtime || doc.readingTime || null;
}

/**
 * Public-facing Shorts:
 * - Sourced via helper (single source of truth)
 * - Slug normalized via helper
 * - Draft filtering handled centrally
 */
export function getPublicShorts(): ShortIndexItem[] {
  // FIX: Use the specific getter available in the helper
  const docs = getPublishedShorts();

  const items: ShortIndexItem[] = docs.map((d: ContentDoc) => {
    const slug = normalizeSlug(d);

    // Title/excerpt are optional in ContentDoc, normalize hard
    const title = String(d?.title ?? "").trim() || "Untitled";
    const excerpt =
      (String(d?.excerpt ?? "").trim() ||
        String(d?.description ?? "").trim() ||
        null) ?? null;

    // Date: normalized ISO or null
    const date = toIsoDate(d?.date);

    // Read time: resolve locally
    const readTime = getReadTime(d);

    // Tags: safe string array
    const tags = toTags(d?.tags);

    // Theme: FIX usage to pass the specific property, not the whole doc
    const theme = coerceShortTheme((d as any).theme);

    // These are primarily informational; helper already filtered drafts out.
    const draft = Boolean((d as any)?.draft);
    const published =
      typeof (d as any)?.published === "boolean" ? (d as any).published : true;

    return {
      _id: String((d as any)?._id ?? slug ?? ""),
      slug,
      title,
      excerpt,
      date,
      readTime,
      tags,
      theme,
      draft,
      published,
    };
  });

  // Secondary guard (in case somebody set `published: false` but not `draft`)
  return items
    .filter((s) => !s.draft && s.published !== false)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
}