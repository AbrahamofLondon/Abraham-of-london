// lib/searchIndex.ts
import {
  getPublishedPosts,
  getAllBooks,
  getAllDownloads,
  getAllPrints,
  getAllResources,
  getAllCanons,
  type ContentDoc, // Use ContentDoc type instead of individual types
} from "./contentlayer-helper";
import { absUrl } from "@/lib/siteConfig";

// ----------------- Shared types & helpers -----------------

export type BasicDoc = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  coverAspect?: string | null;
};

export function indexBySlug<T extends BasicDoc>(docs: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const d of docs || []) {
    const key = String(d.slug || "").trim().toLowerCase();
    if (key) out[key] = d;
  }
  return out;
}

export function sortByDate<T extends { date?: string }>(docs: T[]): T[] {
  return [...(docs || [])].sort(
    (a, b) => +new Date(b.date || 0) - +new Date(a.date || 0),
  );
}

// ----------------- Search index shape -----------------

export type SearchDocType =
  | "post"
  | "book"
  | "download"
  | "print"
  | "resource"
  | "canon";

export interface SearchDoc {
  type: SearchDocType;
  slug: string;
  href: string; // path within the site, e.g. "/ultimate-purpose-of-man"
  url: string;  // absolute URL
  title: string;
  date?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  coverAspect?: string | null;
}

// Type aliases for clarity (these are just ContentDoc, but named for readability)
type PostDocument = ContentDoc;
type BookDocument = ContentDoc;
type DownloadDocument = ContentDoc;
type PrintDocument = ContentDoc;
type ResourceDocument = ContentDoc;
type CanonDocument = ContentDoc;

// ----------------- Builders per collection -----------------

function mapPosts(): SearchDoc[] {
  const posts = getPublishedPosts();
  return sortByDate(posts)
    .filter((p: PostDocument) => !p.draft)
    .map((p: PostDocument) => {
      // IMPORTANT: default to top-level "/slug" which is always handled
      const href = p.url || `/${p.slug}`;
      return {
        type: "post" as const,
        slug: p.slug || "",
        href,
        url: absUrl(href),
        title: p.title ?? "Untitled",
        date: p.date ?? null,
        excerpt: p.excerpt ?? p.description ?? null,
        tags: Array.isArray(p.tags) ? p.tags : [],
        coverImage: p.coverImage || null,
        coverAspect: p.coverAspect ?? p.aspect ?? null,
      };
    });
}

function mapBooks(): SearchDoc[] {
  const books = getAllBooks();
  return sortByDate(books)
    .filter((b: BookDocument) => !b.draft)
    .map((b: BookDocument) => {
      // Books do have dedicated /books/[slug] pages
      const href = b.url || `/books/${b.slug}`;
      return {
        type: "book" as const,
        slug: b.slug || "",
        href,
        url: absUrl(href),
        title: b.title ?? "Untitled Book",
        date: b.date ?? null,
        excerpt: b.excerpt ?? b.description ?? null,
        tags: Array.isArray(b.tags) ? b.tags : [],
        coverImage: b.coverImage || null,
        coverAspect: b.coverAspect ?? b.aspect ?? null,
      };
    });
}

function mapDownloads(): SearchDoc[] {
  const downloads = getAllDownloads();
  return sortByDate(downloads).map((d: DownloadDocument) => {
    const href = d.url || `/downloads/${d.slug}`;
    return {
      type: "download" as const,
      slug: d.slug || "",
      href,
      url: absUrl(href),
      title: d.title ?? "Untitled Download",
      date: d.date ?? null,
      excerpt: d.excerpt ?? d.description ?? null,
      tags: Array.isArray(d.tags) ? d.tags : [],
      coverImage: d.coverImage || null,
      coverAspect: d.coverAspect ?? d.aspect ?? null,
    };
  });
}

function mapPrints(): SearchDoc[] {
  const prints = getAllPrints();
  return sortByDate(prints)
    .filter((p: PrintDocument) => p.available !== false)
    .map((p: PrintDocument) => {
      // Many prints are still served by the universal "/[slug]" route
      const href = p.url || `/${p.slug}`;
      return {
        type: "print" as const,
        slug: p.slug || "",
        href,
        url: absUrl(href),
        title: p.title ?? "Untitled Print",
        date: p.date ?? null,
        excerpt: p.excerpt ?? p.description ?? null,
        tags: Array.isArray(p.tags) ? p.tags : [],
        coverImage: p.coverImage || null,
        coverAspect: p.coverAspect ?? p.aspect ?? null,
      };
    });
}

function mapResources(): SearchDoc[] {
  const resources = getAllResources();
  return sortByDate(resources).map((r: ResourceDocument) => {
    // Same logic as prints: default to "/slug" to hit pages/[slug].tsx
    const href = r.url || `/${r.slug}`;
    return {
      type: "resource" as const,
      slug: r.slug || "",
      href,
      url: absUrl(href),
      title: r.title ?? "Untitled Resource",
      date: r.date ?? null,
      excerpt: r.excerpt ?? r.description ?? null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      coverImage: r.coverImage || null,
      coverAspect: r.coverAspect ?? r.aspect ?? null,
    };
  });
}

function mapCanons(): SearchDoc[] {
  const canons = getAllCanons();
  return sortByDate(canons)
    .filter((c: CanonDocument) => !c.draft)
    .map((c: CanonDocument) => {
      const href = c.url || `/canon/${c.slug}`;
      return {
        type: "canon" as const,
        slug: c.slug || "",
        href,
        url: absUrl(href),
        title: c.title ?? "Untitled Canon",
        date: c.date ?? null,
        excerpt: c.excerpt ?? c.description ?? null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        coverImage: c.coverImage || null,
        coverAspect: c.coverAspect ?? c.aspect ?? null,
      };
    });
}

// ----------------- Main search index -----------------

export function buildSearchIndex(): SearchDoc[] {
  return [
    ...mapPosts(),
    ...mapBooks(),
    ...mapDownloads(),
    ...mapPrints(),
    ...mapResources(),
    ...mapCanons(),
  ];
}

// Pre-built search index
export const searchIndex: SearchDoc[] = buildSearchIndex();

// Helper to search the index
export function searchDocuments(
  query: string,
  limit: number = 20,
): SearchDoc[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return searchIndex.slice(0, limit);

  return searchIndex
    .filter((doc) => {
      const searchableText = [doc.title, doc.excerpt, doc.tags?.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    })
    .slice(0, limit);
}