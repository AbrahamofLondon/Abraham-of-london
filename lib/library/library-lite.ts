/**
 * lib/library/library-lite.ts — LIBRARY LITE ITEM TYPE + SERIALIZER
 *
 * Defines the minimum item shape shipped in /library page props and stored
 * in public/system/library-index-lite.json for client-side lazy loading.
 *
 * Removed vs. full LibraryIndexItem:
 *   - status      — all items in the index are already "published"; redundant
 *   - category    — search falls back to TYPE_LABELS[item.type]; no unique info
 *   - description — same content as summary; never displayed separately
 *   - sourceType  — internal build metadata; not needed on the client
 *   - sourcePath  — internal build metadata; not needed on the client
 *
 * Trimmed:
 *   - summary  → max 100 chars   (was 150; only 2 lines are displayed in card)
 *   - date     → YYYY-MM-DD only (was full ISO; time component unused in UI)
 *   - tags     → max 3           (was 5; only 3 are displayed in card)
 */

import type {
  LibraryIndexItem,
  LibraryItemType,
  LibrarySection,
  LibraryItemAccess,
  LibraryItemFormat,
} from "./library-index";

// ─────────────────────────────────────────────────────────────────────────────
// Type
// ─────────────────────────────────────────────────────────────────────────────

export type LiteItem = {
  /** Unique identifier (contentlayer _id, pdf-<id>, etc.). Used as React key. */
  id: string;
  title: string;
  /** Canonical URL for this item. Used for navigation links. */
  href: string;
  type: LibraryItemType;
  access: LibraryItemAccess;
  format: LibraryItemFormat | null;
  section: LibrarySection;
  /** Short description, max 100 chars. null for vault/restricted items. */
  summary: string | null;
  /** Publication date as YYYY-MM-DD string, or null. */
  date: string | null;
  /** Up to 3 tags. Used for display and search. */
  tags: string[];
  featured: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Serializer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serializes a full LibraryIndexItem to a minimal LiteItem.
 *
 * This is the ONLY function that should convert items for /library props or
 * the public/system/library-index-lite.json static file.
 */
export function toLibraryLiteItem(item: LibraryIndexItem): LiteItem {
  return {
    id: item.id,
    title: item.title,
    href: item.href,
    type: item.type,
    access: item.access,
    format: item.format,
    section: item.section,
    // Trim summary: cap at 100 chars (2 card lines at ~50 chars/line)
    summary: item.summary ? item.summary.substring(0, 100) : null,
    // Trim date: strip time component — only YYYY-MM-DD needed in UI
    date: item.date ? item.date.substring(0, 10) : null,
    // Cap tags at 3 — only 3 are rendered in the card
    tags: item.tags.slice(0, 3),
    featured: item.featured,
  };
}
