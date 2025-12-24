// lib/shorts.ts
import { allShorts } from "@/lib/contentlayer";
import { normalizeSlug, isPublished } from "./contentlayer-helper";

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

/**
 * Robust getter for public-facing Shorts.
 * 1. Safely extracts the array.
 * 2. Uses the CENTRALIZED normalizeSlug to prevent dead links.
 * 3. Filters by your custom publication rules.
 */
export function getPublicShorts(): ShortIndexItem[] {
  // Defensive check for empty generated content
  const docs = allShorts ?? [];

  const items: ShortIndexItem[] = docs.map((d: any) => ({
    _id: d._id,
    // ✅ SYNCED: Uses the robust helper logic to ensure URLs match routes
    slug: normalizeSlug(d),
    title: d.title ?? "Untitled",
    excerpt: d.excerpt ?? d.description ?? null,
    date: d.date ? String(d.date) : null,
    readTime: d.readTime ?? d.readtime ?? "2 min",
    tags: Array.isArray(d.tags) ? d.tags : [],
    theme: d.theme ?? "General",
    draft: Boolean(d.draft),
    published: typeof d.published === "boolean" ? d.published : true,
  }));

  // Application of "Public Rule": (Not a draft) AND (Not explicitly un-published)
  return items
    .filter((s) => !s.draft && s.published !== false)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime; // Newest first
    });
}