// lib/searchIndex.ts

// IMPORTANT:
// If your existing file imports from a different path (e.g. "contentlayer2/generated"),
// keep that path. Just replace the body of the file, not the import line.
import {
  allPosts,
  allBooks,
  allDownloads,
  allPrints,
  allResources,
} from "contentlayer/generated";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export type SearchDocType =
  | "post"
  | "book"
  | "download"
  | "resource"
  | "canon"
  | "print";

export type SearchDoc = {
  type: SearchDocType;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  href?: string;
  date?: string;
};

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

const normaliseTags = (tags?: string[] | null): string[] =>
  (tags ?? []).map((t) => t.trim()).filter(Boolean);

const isCanonTagged = (tags?: string[] | null): boolean =>
  normaliseTags(tags).some((t) => t.toLowerCase() === "canon");

const toSearchDoc = (
  item: any,
  type: SearchDocType,
  overrides: Partial<SearchDoc> = {},
): SearchDoc => ({
  type,
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt ?? item.description ?? "",
  coverImage: item.coverImage ?? item.image ?? undefined,
  tags: normaliseTags(item.tags),
  href: item.href ?? undefined,
  date: item.date ?? undefined,
  ...overrides,
});

// Sort newest → oldest, then alpha by title as a stable tie-breaker
const sortDocs = (a: SearchDoc, b: SearchDoc): number => {
  const da = a.date ? Date.parse(a.date) : 0;
  const db = b.date ? Date.parse(b.date) : 0;

  if (da !== db) return db - da;
  return a.title.localeCompare(b.title);
};

// -------------------------------------------------------
// Build index
// -------------------------------------------------------

export const buildSearchIndex = (): SearchDoc[] => {
  // 1. Posts → Insights
  const postDocs: SearchDoc[] = allPosts
    .filter((p: any) => !p.draft)
    .map((p: any) => toSearchDoc(p, "post"));

  // 2. Books → split into Canon vs regular Books
  const bookRaw = allBooks.filter((b: any) => !b.draft);

  const canonDocs: SearchDoc[] = bookRaw
    .filter((b: any) => isCanonTagged(b.tags))
    .map((b: any) => toSearchDoc(b, "canon"));

  const bookDocs: SearchDoc[] = bookRaw
    .filter((b: any) => !isCanonTagged(b.tags))
    .map((b: any) => toSearchDoc(b, "book"));

  // 3. Downloads → Tools
  const downloadDocs: SearchDoc[] = allDownloads
    .filter((d: any) => !d.draft)
    .map((d: any) => toSearchDoc(d, "download"));

  // 4. Resources → Tools
  const resourceDocs: SearchDoc[] = allResources
    .filter((r: any) => !r.draft)
    .map((r: any) => toSearchDoc(r, "resource"));

  // 5. Prints → Archives
  const printDocs: SearchDoc[] = allPrints
    .filter((p: any) => !p.draft)
    .map((p: any) => toSearchDoc(p, "print"));

  // Merge & sort
  const docs: SearchDoc[] = [
    ...postDocs,
    ...bookDocs,
    ...canonDocs,
    ...downloadDocs,
    ...resourceDocs,
    ...printDocs,
  ].sort(sortDocs);

  return docs;
};