// pages/api/search-index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
} from "contentlayer/generated";

type SearchType =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "strategy"
  | "resource"
  | "canon";

export interface SearchItem {
  type: SearchType;
  slug: string;
  href: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  tags: string[];
  date: string; // ISO string
  coverImage?: string | null;
  // Canon-specific extras (ignored by other types)
  accessLevel?: string | null;
}

// Defensive helper for dates so one bad doc doesn’t blow the sort
function safeDate(input: unknown): string {
  if (!input) return "1970-01-01";
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().split("T")[0]!;
}

// Build the index once at module load – cheap and avoids recomputing per request
function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  // BLOG POSTS ---------------------------------------------------------------
  items.push(
    ...allPosts
      .filter((p) => !p.draft)
      .map((p) => ({
        type: "post" as const,
        slug: p.slug,
        href: p.url ?? `/blog/${p.slug}`,
        title: p.title,
        subtitle: p.authorTitle ?? null,
        description: p.description ?? null,
        excerpt: p.excerpt ?? null,
        tags: p.tags ?? [],
        date: safeDate(p.date),
        coverImage: p.coverImage ?? null,
      })),
  );

  // BOOKS --------------------------------------------------------------------
  items.push(
    ...allBooks
      .filter((b) => !b.draft)
      .map((b) => ({
        type: "book" as const,
        slug: b.slug,
        href: b.url ?? `/books/${b.slug}`,
        title: b.title,
        subtitle: b.subtitle ?? null,
        description: b.description ?? null,
        excerpt: b.excerpt ?? null,
        tags: b.tags ?? [],
        date: safeDate(b.date),
        coverImage: b.coverImage ?? null,
      })),
  );

  // DOWNLOADS ---------------------------------------------------------------
  items.push(
    ...allDownloads.map((d) => ({
      type: "download" as const,
      slug: d.slug,
      href: d.url ?? `/downloads/${d.slug}`,
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description ?? null,
      excerpt: d.excerpt ?? null,
      tags: d.tags ?? [],
      date: safeDate(d.date),
      coverImage: d.coverImage ?? null,
    })),
  );

  // EVENTS ------------------------------------------------------------------
  items.push(
    ...allEvents.map((e) => ({
      type: "event" as const,
      slug: e.slug,
      href: e.url ?? `/events/${e.slug}`,
      title: e.title,
      subtitle: e.time ?? null,
      description: e.description ?? null,
      excerpt: e.excerpt ?? null,
      tags: e.tags ?? [],
      date: safeDate(e.eventDate ?? e.date),
      coverImage: e.coverImage ?? null,
    })),
  );

  // PRINTS ------------------------------------------------------------------
  items.push(
    ...allPrints.map((p) => ({
      type: "print" as const,
      slug: p.slug,
      href: p.url ?? `/prints/${p.slug}`,
      title: p.title,
      subtitle: p.dimensions ?? null,
      description: p.description ?? null,
      excerpt: p.excerpt ?? null,
      tags: p.tags ?? [],
      date: safeDate(p.date),
      coverImage: p.coverImage ?? null,
    })),
  );

  // STRATEGY ----------------------------------------------------------------
  items.push(
    ...allStrategies.map((s) => ({
      type: "strategy" as const,
      slug: s.slug,
      href: s.url ?? `/strategy/${s.slug}`,
      title: s.title,
      subtitle: null,
      description: s.description ?? null,
      excerpt: s.excerpt ?? null,
      tags: s.tags ?? [],
      date: safeDate(s.date),
      coverImage: s.coverImage ?? null,
    })),
  );

  // RESOURCES ---------------------------------------------------------------
  items.push(
    ...allResources.map((r) => ({
      type: "resource" as const,
      slug: r.slug,
      href: r.url ?? `/resources/${r.slug}`,
      title: r.title,
      subtitle: r.subtitle ?? null,
      description: r.description ?? null,
      excerpt: r.excerpt ?? null,
      tags: r.tags ?? [],
      date: safeDate(r.date),
      coverImage: r.coverImage ?? null,
    })),
  );

  // CANON – FIRST-CLASS -----------------------------------------------------
  items.push(
    ...allCanons
      .filter((c) => !c.draft)
      .map((c) => ({
        type: "canon" as const,
        slug: c.slug,
        href: c.url ?? `/canon/${c.slug}`,
        title: c.title,
        subtitle: c.subtitle ?? null,
        description: c.description ?? null,
        excerpt: c.excerpt ?? null,
        tags: c.tags ?? [],
        date: safeDate(c.date),
        coverImage: c.coverImage ?? null,
        accessLevel: c.accessLevel ?? "public",
      })),
  );

  // Global sort: newest first
  return items.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

const SEARCH_INDEX: SearchItem[] = buildIndex();

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<SearchItem[]>,
): void {
  res.setHeader("Content-Type", "application/json");
  // Cache in the edge/CDN layer – safe because content is generated at build
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=3600",
  );
  res.status(200).json(SEARCH_INDEX);
}