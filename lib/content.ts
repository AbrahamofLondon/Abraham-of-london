// lib/content.ts
import {
  allPosts,
  allBooks,
  allEvents,
  allDownloads,
  allPrints,
  allResources,
  type Post,
  type Book,
  type Event,
  type Download,
  type Print,
  type Resource,
} from "contentlayer/generated";

export type AnyContent = Post | Book | Event | Download | Print | Resource;

function sortByDate<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

/* ---------- POSTS (STRATEGIC ESSAYS / BLOG) ---------- */

export function getAllPosts(): Post[] {
  return sortByDate(allPosts.filter((p) => !p.draft));
}

export function getPostBySlug(slug: string): Post | null {
  return allPosts.find((p) => p.slug === slug && !p.draft) ?? null;
}

/* ---------- BOOKS ---------- */

export function getAllBooks(): Book[] {
  return sortByDate(
    allBooks.filter(
      (b) => !b.draft && (b as any).status !== "draft",
    ),
  );
}

export function getBookBySlug(slug: string): Book | null {
  return (
    allBooks.find(
      (b) => b.slug === slug && !b.draft && (b as any).status !== "draft",
    ) ?? null
  );
}

/* ---------- EVENTS ---------- */

export function getAllEvents(): Event[] {
  return sortByDate(allEvents.filter((e) => !e.draft));
}

export function getEventBySlug(slug: string): Event | null {
  return allEvents.find((e) => e.slug === slug && !e.draft) ?? null;
}

/* ---------- DOWNLOADS ---------- */

export function getAllDownloads(): Download[] {
  return sortByDate(allDownloads.filter((d) => !d.draft));
}

export function getDownloadBySlug(slug: string): Download | null {
  return allDownloads.find((d) => d.slug === slug && !d.draft) ?? null;
}

/* ---------- PRINTS ---------- */

export function getAllPrints(): Print[] {
  return sortByDate(allPrints.filter((p) => !p.draft));
}

export function getPrintBySlug(slug: string): Print | null {
  return allPrints.find((p) => p.slug === slug && !p.draft) ?? null;
}

/* ---------- RESOURCES ---------- */

export function getAllResources(): Resource[] {
  return sortByDate(allResources.filter((r) => !r.draft));
}

export function getResourceBySlug(slug: string): Resource | null {
  return allResources.find((r) => r.slug === slug && !r.draft) ?? null;
}

/* ---------- /content HUB AGGREGATION ---------- */

export type ContentKind =
  | "post"
  | "book"
  | "event"
  | "download"
  | "print"
  | "resource";

export type HubItem = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string;
  tags?: string[];
};

export function getAllContent(): HubItem[] {
  const posts: HubItem[] = getAllPosts().map((p) => ({
    kind: "post",
    slug: p.slug,
    title: p.title,
    excerpt: (p as any).excerpt ?? (p as any).description ?? "",
    date: p.date,
    tags: p.tags,
  }));

  const books: HubItem[] = getAllBooks().map((b) => ({
    kind: "book",
    slug: b.slug,
    title: b.title,
    excerpt: (b as any).excerpt ?? (b as any).description ?? "",
    date: b.date,
    tags: b.tags,
  }));

  const events: HubItem[] = getAllEvents().map((e) => ({
    kind: "event",
    slug: e.slug,
    title: e.title,
    excerpt: (e as any).excerpt ?? (e as any).description ?? "",
    date: e.date,
    tags: e.tags,
  }));

  const downloads: HubItem[] = getAllDownloads().map((d) => ({
    kind: "download",
    slug: d.slug,
    title: d.title,
    excerpt: (d as any).excerpt ?? (d as any).description ?? "",
    date: d.date,
    tags: d.tags,
  }));

  const prints: HubItem[] = getAllPrints().map((p) => ({
    kind: "print",
    slug: p.slug,
    title: p.title,
    excerpt: (p as any).excerpt ?? (p as any).description ?? "",
    date: p.date,
    tags: p.tags,
  }));

  const resources: HubItem[] = getAllResources().map((r) => ({
    kind: "resource",
    slug: r.slug,
    title: r.title,
    excerpt: (r as any).excerpt ?? (r as any).description ?? "",
    date: r.date,
    tags: r.tags,
  }));

  return sortByDate([
    ...posts,
    ...books,
    ...events,
    ...downloads,
    ...prints,
    ...resources,
  ]);
}

export function getUrlForHubItem(item: HubItem): string {
  switch (item.kind) {
    case "post":
      return `/${item.slug}`;
    case "book":
      return `/books/${item.slug}`;
    case "event":
      return `/events/${item.slug}`;
    case "download":
      return `/downloads/${item.slug}`;
    case "print":
      return `/prints/${item.slug}`;
    case "resource":
      return `/resources/${item.slug}`;
    default:
      return `/${item.slug}`;
  }
}