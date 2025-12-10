// lib/searchIndex.ts
import {
  getPublishedPosts,
  getAllBooks,
  getAllDownloads,
  getAllPrints,
  getAllResources,
  getAllCanons,
  type Post as PostDocument,
  type Book as BookDocument,
  type Download as DownloadDocument,
  type Print as PrintDocument,
  type Resource as ResourceDocument,
  type Canon as CanonDocument,
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
  const posts = getPublishedPosts();
  return sortByDate(posts)
    .filter((p: PostDocument) => !(p as any).draft)
    .map((p: PostDocument) => ({
      type: "post" as const,
      slug: p.slug,
      href: (p as any).url || `/blog/${p.slug}`,
      url: absUrl((p as any).url || `/blog/${p.slug}`),
      title: p.title ?? "Untitled",
      date: (p as any).date ?? null,
      excerpt: (p as any).excerpt ?? (p as any).description ?? null,
      tags: (p as any).tags ?? [],
      coverImage: (p as any).coverImage || null,
    }));
}

function mapBooks(): SearchDoc[] {
  const books = getAllBooks();
  return sortByDate(books)
    .filter((b: BookDocument) => !(b as any).draft)
    .map((b: BookDocument) => ({
      type: "book" as const,
      slug: b.slug,
      href: (b as any).url || `/books/${b.slug}`,
      url: absUrl((b as any).url || `/books/${b.slug}`),
      title: b.title ?? "Untitled Book",
      date: (b as any).date ?? null,
      excerpt: (b as any).excerpt ?? (b as any).description ?? null,
      tags: (b as any).tags ?? [],
      coverImage: (b as any).coverImage || null,
    }));
}

function mapDownloads(): SearchDoc[] {
  const downloads = getAllDownloads();
  return sortByDate(downloads).map((d: DownloadDocument) => ({
    type: "download" as const,
    slug: d.slug,
    href: (d as any).url || `/downloads/${d.slug}`,
    url: absUrl((d as any).url || `/downloads/${d.slug}`),
    title: d.title ?? "Untitled Download",
    date: (d as any).date ?? null,
    excerpt: (d as any).excerpt ?? (d as any).description ?? null,
    tags: (d as any).tags ?? [],
    coverImage: (d as any).coverImage || null,
  }));
}

function mapPrints(): SearchDoc[] {
  const prints = getAllPrints();
  return sortByDate(prints)
    .filter((p: PrintDocument) => (p as any).available !== false)
    .map((p: PrintDocument) => ({
      type: "print" as const,
      slug: p.slug,
      href: (p as any).url || `/prints/${p.slug}`,
      url: absUrl((p as any).url || `/prints/${p.slug}`),
      title: p.title ?? "Untitled Print",
      date: (p as any).date ?? null,
      excerpt: (p as any).excerpt ?? (p as any).description ?? null,
      tags: (p as any).tags ?? [],
      coverImage: (p as any).coverImage || null,
    }));
}

function mapResources(): SearchDoc[] {
  const resources = getAllResources();
  return sortByDate(resources).map((r: ResourceDocument) => ({
    type: "resource" as const,
    slug: r.slug,
    href: (r as any).url || `/resources/${r.slug}`,
    url: absUrl((r as any).url || `/resources/${r.slug}`),
    title: r.title ?? "Untitled Resource",
    date: (r as any).date ?? null,
    excerpt: (r as any).excerpt ?? (r as any).description ?? null,
    tags: (r as any).tags ?? [],
    coverImage: (r as any).coverImage || null,
  }));
}

function mapCanons(): SearchDoc[] {
  const canons = getAllCanons();
  return sortByDate(canons)
    .filter((c: CanonDocument) => !(c as any).draft)
    .map((c: CanonDocument) => ({
      type: "canon" as const,
      slug: c.slug,
      href: (c as any).url || `/canon/${c.slug}`,
      url: absUrl((c as any).url || `/canon/${c.slug}`),
      title: c.title ?? "Untitled Canon",
      date: (c as any).date ?? null,
      excerpt: (c as any).excerpt ?? (c as any).description ?? null,
      tags: (c as any).tags ?? [],
      coverImage: (c as any).coverImage || null,
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