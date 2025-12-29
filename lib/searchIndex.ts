// lib/searchIndex.ts
import {
  getPublishedPosts,
  getAllBooks,
  getAllDownloads,
  getAllPrints,
  getAllResources,
  getAllCanons,
  type ContentDoc,
  getSearchDocForDocument,
} from "./contentlayer-helper";
import { absUrl } from "@/lib/siteConfig";

/* -------------------------------------------------------------------------- */
/* Search index public shape (UI-safe, no unknown)                            */
/* -------------------------------------------------------------------------- */

export type SearchDocType = "post" | "book" | "download" | "print" | "resource" | "canon";

export interface SearchDoc {
  type: SearchDocType;
  slug: string;

  href: string; // internal route
  url: string; // absolute route

  title: string;
  date?: string | null; // ISO string
  excerpt?: string | null;
  tags?: string[];

  coverImage?: string | null;
  coverAspect?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Date sorting                                                               */
/* -------------------------------------------------------------------------- */

function sortByDate<T extends { date?: string | null }>(docs: T[]): T[] {
  return [...(docs || [])].sort((a, b) => {
    const ta = a.date ? +new Date(a.date) : 0;
    const tb = b.date ? +new Date(b.date) : 0;
    return tb - ta;
  });
}

/* -------------------------------------------------------------------------- */
/* Mapper using helper (single source of truth)                               */
/* -------------------------------------------------------------------------- */

function toSearchDoc(doc: ContentDoc): SearchDoc | null {
  const base = getSearchDocForDocument(doc);
  if (!base) return null;

  const href = base.href || `/${base.slug}`;

  return {
    type: base.type,
    slug: base.slug,

    href,
    url: absUrl(href),

    title: base.title,
    date: base.dateISO ?? null,
    excerpt: base.excerpt ?? null,
    tags: base.tags ?? [],

    coverImage: base.coverImage ?? null,
    coverAspect: base.coverAspect ?? null,
  };
}

function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(Boolean) as T[];
}

/* -------------------------------------------------------------------------- */
/* Builders per collection                                                    */
/* -------------------------------------------------------------------------- */

function mapPosts(): SearchDoc[] {
  const posts = getPublishedPosts();
  return compact(posts.map(toSearchDoc));
}

function mapBooks(): SearchDoc[] {
  const books = getAllBooks();
  return compact(books.map(toSearchDoc));
}

function mapDownloads(): SearchDoc[] {
  const downloads = getAllDownloads();
  return compact(downloads.map(toSearchDoc));
}

function mapPrints(): SearchDoc[] {
  const prints = getAllPrints();
  // NOTE: availability filtering belongs in helper if you want it global.
  return compact(prints.map(toSearchDoc));
}

function mapResources(): SearchDoc[] {
  const resources = getAllResources();
  return compact(resources.map(toSearchDoc));
}

function mapCanons(): SearchDoc[] {
  const canons = getAllCanons();
  return compact(canons.map(toSearchDoc));
}

/* -------------------------------------------------------------------------- */
/* Main search index                                                          */
/* -------------------------------------------------------------------------- */

export function buildSearchIndex(): SearchDoc[] {
  const all = [
    ...mapPosts(),
    ...mapBooks(),
    ...mapDownloads(),
    ...mapPrints(),
    ...mapResources(),
    ...mapCanons(),
  ];

  // sort newest first
  return sortByDate(all);
}

export const searchIndex: SearchDoc[] = buildSearchIndex();

/* -------------------------------------------------------------------------- */
/* Query helper                                                               */
/* -------------------------------------------------------------------------- */

export function searchDocuments(query: string, limit: number = 20): SearchDoc[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return searchIndex.slice(0, limit);

  return searchIndex
    .filter((doc) => {
      const searchableText = [doc.title, doc.excerpt ?? "", (doc.tags ?? []).join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    })
    .slice(0, limit);
}