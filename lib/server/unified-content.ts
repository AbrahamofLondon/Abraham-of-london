// lib/server/unified-content.ts
// Unified content index for /content – no Contentlayer import needed here.

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEvents } from "./events-data";

// These are already used elsewhere in your project
import { getAllPosts } from "@/lib/posts";
import { getAllBooksMeta } from "@/lib/server/books-data";

// If these don't exist yet, create light wrappers or comment them out for now
import { getAllPrintsMeta } from "@/lib/server/prints-data";
import { getAllResourcesMeta } from "@/lib/server/resources-data";

export type UnifiedType =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "page"
  | "resource";

export interface UnifiedContent {
  id: string;
  type: UnifiedType;
  slug: string;
  title: string;
  description?: string | null;
  excerpt?: string | null;
  date?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[];
  content?: string | null;
  url: string;
}

// Small helper – keeps one bad source from killing everything
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[unified-content] Failed loading ${label}:`, err);
    return [];
  }
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  const [
    pages,
    downloads,
    events,
    posts,
    books,
    prints,
    resources,
  ] = await Promise.all([
    safe("pages", () => getAllPages()),
    safe("downloads", () => getAllDownloadsMeta()),
    safe("events", () => getAllEvents()),
    safe("posts", () => getAllPosts()),
    safe("books", () => getAllBooksMeta()),
    safe("prints", () => getAllPrintsMeta()),
    safe("resources", () => getAllResourcesMeta()),
  ]);

  const unified: UnifiedContent[] = [];

  // Pages (about, context, consulting, etc.)
  (pages as any[]).forEach((page) => {
    unified.push({
      id: `page-${page.slug}`,
      type: "page",
      slug: page.slug,
      title: page.title ?? "Untitled Page",
      description: page.description ?? page.excerpt ?? null,
      excerpt: page.excerpt ?? null,
      date: page.date ?? null,
      author: page.author ?? null,
      category: page.category ?? null,
      tags: page.tags ?? [],
      content: page.content ?? null,
      url: `/${page.slug}`,
    });
  });

  // Essays / blog posts
  (posts as any[]).forEach((post) => {
    unified.push({
      id: `essay-${post.slug}`,
      type: "essay",
      slug: post.slug,
      title: post.title ?? "Untitled Essay",
      description: post.description ?? post.excerpt ?? null,
      excerpt: post.excerpt ?? null,
      date: post.date ?? null,
      author: post.author ?? null,
      category: post.category ?? "Essay",
      tags: post.tags ?? [],
      content: null,
      url: `/blog/${post.slug}`,
    });
  });

  // Books
  (books as any[]).forEach((book) => {
    unified.push({
      id: `book-${book.slug}`,
      type: "book",
      slug: book.slug,
      title: book.title ?? "Untitled Book",
      description: book.description ?? book.excerpt ?? null,
      excerpt: book.excerpt ?? null,
      date: book.date ?? null,
      author: book.author ?? null,
      category: "Book",
      tags: book.tags ?? [],
      content: null,
      url: `/books/${book.slug}`,
    });
  });

  // Downloads
  (downloads as any[]).forEach((download) => {
    unified.push({
      id: `download-${download.slug}`,
      type: "download",
      slug: download.slug,
      title: download.title ?? "Untitled Download",
      description: download.description ?? download.excerpt ?? null,
      excerpt: download.excerpt ?? null,
      date: download.date ?? null,
      author: download.author ?? null,
      category: download.category ?? "Download",
      tags: download.tags ?? [],
      content: null,
      url: `/downloads/${download.slug}`,
    });
  });

  // Events
  (events as any[]).forEach((event) => {
    unified.push({
      id: `event-${event.slug}`,
      type: "event",
      slug: event.slug,
      title: event.title ?? "Event",
      description: event.description ?? event.excerpt ?? null,
      excerpt: event.excerpt ?? null,
      date: event.date ?? null,
      author: event.author ?? null,
      category: event.category ?? "Event",
      tags: event.tags ?? [],
      content: null,
      url: `/events/${event.slug}`,
    });
  });

  // Prints
  (prints as any[]).forEach((print) => {
    unified.push({
      id: `print-${print.slug}`,
      type: "print",
      slug: print.slug,
      title: print.title ?? "Print",
      description: print.description ?? print.excerpt ?? null,
      excerpt: print.excerpt ?? null,
      date: print.date ?? null,
      author: print.author ?? null,
      category: "Print",
      tags: print.tags ?? [],
      content: null,
      url: `/prints/${print.slug}`,
    });
  });

  // Resources (if you have a dedicated section)
  (resources as any[]).forEach((resource) => {
    unified.push({
      id: `resource-${resource.slug}`,
      type: "resource",
      slug: resource.slug,
      title: resource.title ?? "Resource",
      description: resource.description ?? resource.excerpt ?? null,
      excerpt: resource.excerpt ?? null,
      date: resource.date ?? null,
      author: resource.author ?? null,
      category: "Resource",
      tags: resource.tags ?? [],
      content: null,
      url: `/resources/${resource.slug}`,
    });
  });

  // Sort newest → oldest
  unified.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return unified;
}

export async function getUnifiedContentByType(type: UnifiedType) {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function searchUnifiedContent(query: string) {
  const all = await getAllUnifiedContent();
  const q = query.toLowerCase();

  return all.filter((item) => {
    const inTags = (item.tags ?? []).some((tag) =>
      tag.toLowerCase().includes(q)
    );
    return (
      (item.title ?? "").toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q) ||
      (item.excerpt ?? "").toLowerCase().includes(q) ||
      inTags
    );
  });
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
};