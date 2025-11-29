// lib/searchIndex.ts
import {
  allPosts,
  allBooks,
  allDownloads,
  allPrints,
  allResources,
  allCanons,
} from "contentlayer/generated";
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
    .filter((p) => !p.draft)
    .map((p) => ({
      type: "post" as const,
      slug: p.slug,
      href: p.url,
      url: absUrl(p.url),
      title: p.title ?? "Untitled",
      date: p.date ?? null,
      excerpt: p.excerpt ?? p.description ?? null,
      tags: p.tags ?? [],
      coverImage: p.coverImage || null,
    }));
}

function mapBooks(): SearchDoc[] {
  return sortByDate(allBooks)
    .filter((b) => !b.draft)
    .map((b) => ({
      type: "book" as const,
      slug: b.slug,
      href: b.url,
      url: absUrl(b.url),
      title: b.title ?? "Untitled Book",
      date: b.date ?? null,
      excerpt: b.excerpt ?? b.description ?? null,
      tags: b.tags ?? [],
      coverImage: b.coverImage || null,
    }));
}

function mapDownloads(): SearchDoc[] {
  return sortByDate(allDownloads).map((d) => ({
    type: "download" as const,
    slug: d.slug,
    href: d.url,
    url: absUrl(d.url),
    title: d.title ?? "Untitled Download",
    date: d.date ?? null,
    excerpt: d.excerpt ?? d.description ?? null,
    tags: d.tags ?? [],
    coverImage: d.coverImage || null,
  }));
}

function mapPrints(): SearchDoc[] {
  return sortByDate(allPrints)
    .filter((p) => p.available !== false)
    .map((p) => ({
      type: "print" as const,
      slug: p.slug,
      href: p.url,
      url: absUrl(p.url),
      title: p.title ?? "Untitled Print",
      date: p.date ?? null,
      excerpt: p.excerpt ?? p.description ?? null,
      tags: p.tags ?? [],
      coverImage: p.coverImage || null,
    }));
}

function mapResources(): SearchDoc[] {
  return sortByDate(allResources).map((r) => ({
    type: "resource" as const,
    slug: r.slug,
    href: r.url,
    url: absUrl(r.url),
    title: r.title ?? "Untitled Resource",
    date: r.date ?? null,
    excerpt: r.excerpt ?? r.description ?? null,
    tags: r.tags ?? [],
    coverImage: r.coverImage || null,
  }));
}

// *** THIS IS THE IMPORTANT BIT: CANON AS FIRST-CLASS ***

function mapCanons(): SearchDoc[] {
  return sortByDate(allCanons)
    .filter((c) => !c.draft)
    .map((c) => ({
      type: "canon" as const,
      slug: c.slug,
      href: c.url, // e.g. /canon/canon-campaign
      url: absUrl(c.url), // full absolute URL for OG / external use
      title: c.title ?? "Untitled Canon Document",
      date: c.date ?? null,
      excerpt: c.excerpt ?? c.description ?? null,
      tags: c.tags ?? [],
      coverImage: c.coverImage || null,
    }));
}

// ----------------- Public API -----------------

export function buildSearchIndex(): { docs: SearchDoc[] } {
  const docs: SearchDoc[] = [
    ...mapPosts(),
    ...mapBooks(),
    ...mapDownloads(),
    ...mapPrints(),
    ...mapResources(),
    ...mapCanons(), // canon now first-class in the index
  ];

  return { docs };
}
