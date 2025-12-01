// lib/searchIndex.ts
import {
  allPosts,
  allBooks,
  allDownloads,
  allPrints,
  allResources,
  allCanons,
  type PostDocument,
  type BookDocument,
  type DownloadDocument,
  type PrintDocument,
  type ResourceDocument,
  type CanonDocument
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
};

export function indexBySlug<T extends BasicDoc>(docs: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const d of docs || []) {
    const key = String(d.slug || "")
      .trim()
      .toLowerCase();
    if (key) out[key] = d;
  }
  return out;
}

export function sortByDate<T extends { date?: string }>(docs: T[]): T[] {
  return [...(docs || [])].sort(
    (a, b) => +new Date(b.date || 0) - +new Date(a.date || 0)
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
  href: string;
  url: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
}

// ----------------- Builders per collection -----------------

function mapPosts(): SearchDoc[] {
  return sortByDate(allPosts)
    .filter((p: PostDocument) => !p.draft)
    .map((p: PostDocument) => ({
      type: "post" as const,
      slug: p.slug,
      href: p.url || `/blog/${p.slug}`,
      url: absUrl(p.url || `/blog/${p.slug}`),
      title: p.title ?? "Untitled",
      date: p.date ?? null,
      excerpt: p.excerpt ?? p.description ?? null,
      tags: p.tags ?? [],
      coverImage: p.coverImage || null,
    }));
}

function mapBooks(): SearchDoc[] {
  return sortByDate(allBooks)
    .filter((b: BookDocument) => !b.draft)
    .map((b: BookDocument) => ({
      type: "book" as const,
      slug: b.slug,
      href: b.url || `/books/${b.slug}`,
      url: absUrl(b.url || `/books/${b.slug}`),
      title: b.title ?? "Untitled Book",
      date: b.date ?? null,
      excerpt: b.excerpt ?? b.description ?? null,
      tags: b.tags ?? [],
      coverImage: b.coverImage || null,
    }));
}

function mapDownloads(): SearchDoc[] {
  return sortByDate(allDownloads).map((d: DownloadDocument) => ({
    type: "download" as const,
    slug: d.slug,
    href: d.url || `/downloads/${d.slug}`,
    url: absUrl(d.url || `/downloads/${d.slug}`),
    title: d.title ?? "Untitled Download",
    date: d.date ?? null,
    excerpt: d.excerpt ?? d.description ?? null,
    tags: d.tags ?? [],
    coverImage: d.coverImage || null,
  }));
}

function mapPrints(): SearchDoc[] {
  return sortByDate(allPrints)
    .filter((p: PrintDocument) => p.available !== false)
    .map((p: PrintDocument) => ({
      type: "print" as const,
      slug: p.slug,
      href: p.url || `/prints/${p.slug}`,
      url: absUrl(p.url || `/prints/${p.slug}`),
      title: p.title ?? "Untitled Print",
      date: p.date ?? null,
      excerpt: p.excerpt ?? p.description ?? null,
      tags: p.tags ?? [],
      coverImage: p.coverImage || null,
    }));
}

function mapResources(): SearchDoc[] {
  return sortByDate(allResources).map((r: ResourceDocument) => ({
    type: "resource" as const,
    slug: r.slug,
    href: r.url || `/resources/${r.slug}`,
    url: absUrl(r.url || `/resources/${r.slug}`),
    title: r.title ?? "Untitled Resource",
    date: r.date ?? null,
    excerpt: r.excerpt ?? r.description ?? null,
    tags: r.tags ?? [],
    coverImage: r.coverImage || null,
  }));
}

function mapCanons(): SearchDoc[] {
  return sortByDate(allCanons)
    .filter((c: CanonDocument) => !c.draft)
    .map((c: CanonDocument) => ({
      type: "canon" as const,
      slug: c.slug,
      href: c.url || `/canon/${c.slug}`,
      url: absUrl(c.url || `/canon/${c.slug}`),
      title: c.title ?? "Untitled Canon",
      date: c.date ?? null,
      excerpt: c.excerpt ?? c.description ?? null,
      tags: c.tags ?? [],
      coverImage: c.coverImage || null,
    }));
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
export function searchDocuments(query: string, limit: number = 20): SearchDoc[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return searchIndex.slice(0, limit);

  return searchIndex
    .filter(doc => {
      const searchableText = [
        doc.title,
        doc.excerpt,
        doc.tags?.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchTerm);
    })
    .slice(0, limit);
}