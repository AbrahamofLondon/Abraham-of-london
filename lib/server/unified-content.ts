// lib/server/unified-content.ts
// Unified content index for the Library – NO Contentlayer dependency

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEvents } from "./events-data";

// If these files don’t exist yet, create them mirroring your existing helpers.
// Names assume the same pattern you used for pages/downloads/events.
import { getAllPosts } from "./posts-data";
import { getAllBooksMeta } from "./books-data";
import { getAllPrintsMeta } from "./prints-data";
import { getAllResourcesMeta } from "./resources-data";

export type UnifiedContentType =
  | "page"
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

export interface UnifiedContent {
  id: string;
  type: UnifiedContentType;
  slug: string;
  title: string;
  description?: string | null;
  excerpt?: string | null;
  date?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[] | null;
  content?: string | null;
  url: string;
}

/* -------------------------------------------------------------------------- */
/* SAFETY WRAPPER – never let one source kill the whole library               */
/* -------------------------------------------------------------------------- */

async function safeFetch<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch (error) {
    console.error(`[unified-content] Failed to fetch ${label}:`, error);
    return fallback;
  }
}

/* -------------------------------------------------------------------------- */
/* MAIN AGGREGATOR                                                            */
/* -------------------------------------------------------------------------- */

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  // Pull everything in parallel, but safely isolated per source
  const [
    pages,
    posts,
    books,
    downloads,
    events,
    prints,
    resources,
  ] = await Promise.all([
    safeFetch("pages", getAllPages, []),
    safeFetch("posts", getAllPosts, []),
    safeFetch("books", getAllBooksMeta, []),
    safeFetch("downloads", getAllDownloadsMeta, []),
    safeFetch("events", getAllEvents, []),
    safeFetch("prints", getAllPrintsMeta, []),
    safeFetch("resources", getAllResourcesMeta, []),
  ]);

  const unified: UnifiedContent[] = [];

  /* --------------------------------- Pages --------------------------------- */
  pages.forEach((page: any) => {
    unified.push({
      id: `page-${page.slug}`,
      type: "page",
      slug: page.slug,
      title: page.title ?? "Untitled page",
      description: page.description ?? page.excerpt ?? null,
      excerpt: page.excerpt ?? null,
      date: page.date ?? null,
      author: page.author ?? null,
      category: page.category ?? null,
      tags: page.tags ?? null,
      content: page.content ?? null,
      url: `/${page.slug}`,
    });
  });

  /* --------------------------------- Posts --------------------------------- */
  posts.forEach((post: any) => {
    unified.push({
      id: `post-${post.slug}`,
      type: "post",
      slug: post.slug,
      title: post.title ?? "Untitled essay",
      description: post.description ?? post.excerpt ?? null,
      excerpt: post.excerpt ?? null,
      date: post.date ?? null,
      author: post.author ?? null,
      category: post.category ?? "Essay",
      tags: post.tags ?? null,
      content: post.content ?? null,
      url: `/blog/${post.slug}`,
    });
  });

  /* --------------------------------- Books --------------------------------- */
  books.forEach((book: any) => {
    unified.push({
      id: `book-${book.slug}`,
      type: "book",
      slug: book.slug,
      title: book.title ?? "Untitled book",
      description: book.description ?? book.excerpt ?? null,
      excerpt: book.excerpt ?? null,
      date: book.date ?? null,
      author: book.author ?? null,
      category: book.category ?? "Book",
      tags: book.tags ?? null,
      url: `/books/${book.slug}`,
    });
  });

  /* ------------------------------- Downloads -------------------------------- */
  downloads.forEach((download: any) => {
    unified.push({
      id: `download-${download.slug}`,
      type: "download",
      slug: download.slug,
      title: download.title ?? "Untitled download",
      description: download.description ?? download.excerpt ?? null,
      excerpt: download.excerpt ?? null,
      date: download.date ?? null,
      author: download.author ?? null,
      category: download.category ?? "Download",
      tags: download.tags ?? null,
      url: `/downloads/${download.slug}`,
    });
  });

  /* --------------------------------- Events -------------------------------- */
  events.forEach((event: any) => {
    unified.push({
      id: `event-${event.slug}`,
      type: "event",
      slug: event.slug,
      title: event.title ?? "Untitled event",
      description: event.description ?? event.excerpt ?? null,
      excerpt: event.excerpt ?? null,
      date: event.date ?? null,
      author: event.organiser ?? event.author ?? null,
      category: event.category ?? "Event",
      tags: event.tags ?? null,
      url: `/events/${event.slug}`,
    });
  });

  /* --------------------------------- Prints -------------------------------- */
  prints.forEach((print: any) => {
    unified.push({
      id: `print-${print.slug}`,
      type: "print",
      slug: print.slug,
      title: print.title ?? "Untitled print",
      description: print.description ?? print.excerpt ?? null,
      excerpt: print.excerpt ?? null,
      date: print.date ?? null,
      author: print.author ?? null,
      category: print.category ?? "Print",
      tags: print.tags ?? null,
      url: `/prints/${print.slug}`,
    });
  });

  /* ------------------------------- Resources -------------------------------- */
  resources.forEach((res: any) => {
    unified.push({
      id: `resource-${res.slug}`,
      type: "resource",
      slug: res.slug,
      title: res.title ?? "Untitled resource",
      description: res.description ?? res.excerpt ?? null,
      excerpt: res.excerpt ?? null,
      date: res.date ?? null,
      author: res.author ?? null,
      category: res.category ?? "Resource",
      tags: res.tags ?? null,
      url: `/resources/${res.slug}`,
    });
  });

  // Sort newest → oldest (falling back gracefully if no date)
  unified.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return unified;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

export async function getUnifiedContentByType(
  type: UnifiedContentType
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function searchUnifiedContent(query: string) {
  const all = await getAllUnifiedContent();
  const q = query.toLowerCase();

  return all.filter((item) => {
    const inTitle = (item.title || "").toLowerCase().includes(q);
    const inDesc = (item.description || "").toLowerCase().includes(q);
    const inExcerpt = (item.excerpt || "").toLowerCase().includes(q);
    const inContent = (item.content || "").toLowerCase().includes(q);
    const inTags = (item.tags || []).some((tag) =>
      (tag || "").toLowerCase().includes(q)
    );

    return inTitle || inDesc || inExcerpt || inContent || inTags;
  });
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
};