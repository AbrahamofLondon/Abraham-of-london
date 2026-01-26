import { safeSlice } from "@/lib/utils/safe";

// lib/utils/docs.ts
// Enhanced document utilities for content management

export type BasicDoc = {
  slug: string;
  title?: string;
  date?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  published?: boolean;
  draft?: boolean;
  status?: "published" | "draft" | "archived" | "scheduled" | "private";
  author?: string | { name: string; [key: string]: any } | null;
  category?: string | null;
  // allow simple body search when needed
  content?: string | null;
};

export interface ContentItem extends BasicDoc {
  type: string;
  content?: string | null;
  [key: string]: any; // Allow additional fields
}

export function indexBySlug<T extends BasicDoc>(docs: T[] = []): Record<string, T> {
  const out: Record<string, T> = {};
  for (const d of docs) {
    const key = String(d.slug || "")
      .trim()
      .toLowerCase();
    if (key) out[key] = d;
  }
  return out;
}

export function sortByDate<T extends { date?: string | null }>(docs: T[] = []): T[] {
  return [...docs].sort(
    (a, b) => +new Date(b.date || 0) - +new Date(a.date || 0),
  );
}

/**
 * Filter published documents
 */
export function filterPublished<T extends BasicDoc>(docs: T[] = []): T[] {
  return docs.filter((doc) => {
    const isDraft = doc.draft === true;
    const isNotPublished = doc.published === false;
    const isStatusDraft = doc.status === "draft";
    const isStatusArchived = doc.status === "archived";
    const isStatusPrivate = doc.status === "private";
    const isStatusScheduled = doc.status === "scheduled";

    return !(
      isDraft ||
      isNotPublished ||
      isStatusDraft ||
      isStatusArchived ||
      isStatusPrivate ||
      isStatusScheduled
    );
  });
}

/**
 * Extract author name from document (handles string or object author)
 */
export function getAuthorName(doc: BasicDoc): string | null {
  if (!doc.author) return null;

  if (typeof doc.author === "string") {
    return doc.author;
  }

  if (typeof doc.author === "object") {
    return (doc.author as any).name || null;
  }

  return null;
}

/**
 * Get documents with a specific tag
 */
export function filterByTag<T extends BasicDoc>(docs: T[] = [], tag: string): T[] {
  const needle = tag.toLowerCase();
  return docs.filter((doc) =>
    doc.tags?.some((t) => t.toLowerCase() === needle),
  );
}

/**
 * Group documents by year
 */
export function groupByYear<T extends BasicDoc>(docs: T[] = []): Record<number, T[]> {
  const grouped: Record<number, T[]> = {};

  for (const doc of docs) {
    if (!doc.date) continue;

    const year = new Date(doc.date).getFullYear();
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(doc);
  }

  return grouped;
}

/**
 * Search documents by title, excerpt, or content
 */
export function searchDocuments<
  T extends { title?: string | null; excerpt?: string | null; content?: string | null }
>(
  docs: T[] = [],
  query: string,
  searchFields: ("title" | "excerpt" | "content")[] = ["title", "excerpt"],
): T[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return docs;

  return docs.filter((doc) =>
    searchFields.some((field) => {
      const value = doc[field];
      return (
        typeof value === "string" &&
        value.toLowerCase().includes(searchTerm)
      );
    }),
  );
}

/**
 * Paginate documents
 */
export function paginateDocuments<T>(
  docs: T[] = [],
  page: number = 1,
  limit: number = 10,
): {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const safeDocs = docs;
  const total = safeDocs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * limit;
  const end = start + limit;

  return {
    items: safeSlice(safeDocs, start, end),
    total,
    page: safePage,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}


