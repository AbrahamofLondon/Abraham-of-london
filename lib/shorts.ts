// lib/shorts.ts
import {
  type ContentDoc,
  getAllShorts,
  normalizeSlug,
} from "@/lib/content/server";

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

/** Normalize short theme safely */
function coerceShortTheme(input: unknown): string | null {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return null;

  // Keep this permissive unless you already enforce a strict union elsewhere
  if (
    s === "light" ||
    s === "dark" ||
    s === "gold" ||
    s === "premium" ||
    s === "editorial" ||
    s === "sermon" ||
    s === "midnight" ||
    s === "classic"
  ) {
    return s;
  }

  return s;
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
  const docs = getAllShorts();

  const items: ShortIndexItem[] = docs.map((d: ContentDoc) => {
    const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");

    const title = String(d?.title ?? "").trim() || "Untitled";
    const excerpt =
      String(d?.excerpt ?? "").trim() ||
      String(d?.description ?? "").trim() ||
      null;

    const date = toIsoDate(d?.date);
    const readTime = getReadTime(d);
    const tags = toTags((d as any)?.tags);
    const theme = coerceShortTheme((d as any)?.theme);

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

  return items
    .filter((s) => !s.draft && s.published !== false)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
}

/**
 * Export a simple published shorts getter
 */
export function getPublishedShorts() {
  return getAllShorts()
    .filter((short: ContentDoc) => {
      const draft = Boolean((short as any)?.draft);
      const published =
        typeof (short as any)?.published === "boolean"
          ? (short as any).published
          : true;
      return !draft && published !== false;
    })
    .map((short: ContentDoc) => ({
      ...short,
      slug: normalizeSlug(short.slug || short._raw?.flattenedPath || ""),
    }));
}