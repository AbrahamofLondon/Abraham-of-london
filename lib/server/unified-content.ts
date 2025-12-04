// lib/server/unified-content.ts
// Unified content index for the Library page – no Contentlayer dependency.

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEvents } from "./events-data";
import { getAllBooksMeta } from "./books-data";
import { getAllPrintsMeta } from "./prints-data";
import { getAllResourcesMeta } from "./resources-data";

// Same posts helper you already use in pages/[slug].tsx
import { getAllPosts } from "../posts";

export type UnifiedContentType =
  | "page"
  | "post"      // essays / blog
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
  tags?: string[];
  content?: string | null;
  url: string;
  originalType?: string; // debug / introspection
}

function safeTags(input: any): string[] {
  return Array.isArray(input) ? input.filter(Boolean) : [];
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const [pages, downloads, events, books, prints, resources, posts] =
      await Promise.all([
        getAllPages(),
        getAllDownloadsMeta(),
        getAllEvents(),
        getAllBooksMeta(),
        getAllPrintsMeta(),
        getAllResourcesMeta(),
        getAllPosts(),
      ]);

    const unified: UnifiedContent[] = [];

    /* ----------------------------- PAGES ----------------------------- */
    pages.forEach((page: any) => {
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
        tags: safeTags(page.tags),
        content: page.content ?? null,
        url: `/${page.slug}`,
        originalType: "page",
      });
    });

    /* ----------------------------- POSTS (ESSAYS) ----------------------------- */
    posts.forEach((post: any) => {
      const meta = post.frontMatter ?? post.meta ?? post;

      unified.push({
        id: `post-${meta.slug}`,
        type: "post",
        slug: meta.slug,
        title: meta.title ?? "Untitled Essay",
        description: meta.description ?? meta.excerpt ?? null,
        excerpt: meta.excerpt ?? null,
        date: meta.date ?? null,
        author: meta.author ?? null,
        category: meta.category ?? "essay",
        tags: safeTags(meta.tags),
        content: null, // we only index meta here
        url: `/blog/${meta.slug}`,
        originalType: "post",
      });
    });

    /* ----------------------------- BOOKS ----------------------------- */
    books.forEach((book: any) => {
      unified.push({
        id: `book-${book.slug}`,
        type: "book",
        slug: book.slug,
        title: book.title ?? "Untitled Book",
        description: book.description ?? book.excerpt ?? null,
        excerpt: book.excerpt ?? null,
        date: book.date ?? null,
        author: book.author ?? null,
        category: "book",
        tags: safeTags(book.tags),
        content: null,
        url: `/books/${book.slug}`,
        originalType: "book",
      });
    });

    /* ----------------------------- DOWNLOADS ----------------------------- */
    downloads.forEach((download: any) => {
      unified.push({
        id: `download-${download.slug}`,
        type: "download",
        slug: download.slug,
        title: download.title ?? "Untitled Download",
        description:
          download.description ??
          download.excerpt ??
          download.summary ??
          null,
        excerpt: download.excerpt ?? null,
        date: download.date ?? null,
        author: download.author ?? null,
        category: download.category ?? "download",
        tags: safeTags(download.tags),
        content: null,
        url: `/downloads/${download.slug}`,
        originalType: "download",
      });
    });

    /* ----------------------------- EVENTS ----------------------------- */
    events.forEach((event: any) => {
      unified.push({
        id: `event-${event.slug}`,
        type: "event",
        slug: event.slug,
        title: event.title ?? "Event",
        description: event.description ?? event.excerpt ?? null,
        excerpt: event.excerpt ?? null,
        date: event.date ?? null,
        author: event.author ?? null,
        category: event.category ?? "event",
        tags: safeTags(event.tags),
        content: null,
        url: `/events/${event.slug}`,
        originalType: "event",
      });
    });

    /* ----------------------------- PRINTS ----------------------------- */
    prints.forEach((print: any) => {
      unified.push({
        id: `print-${print.slug}`,
        type: "print",
        slug: print.slug,
        title: print.title ?? "Untitled Print",
        description: print.description ?? print.excerpt ?? null,
        excerpt: print.excerpt ?? null,
        date: print.date ?? null,
        author: print.author ?? null,
        category: print.category ?? "print",
        tags: safeTags(print.tags),
        content: null,
        url: `/prints/${print.slug}`,
        originalType: "print",
      });
    });

    /* ----------------------------- RESOURCES ----------------------------- */
    resources.forEach((resource: any) => {
      unified.push({
        id: `resource-${resource.slug}`,
        type: "resource",
        slug: resource.slug,
        title: resource.title ?? "Resource",
        description: resource.description ?? resource.excerpt ?? null,
        excerpt: resource.excerpt ?? null,
        date: resource.date ?? null,
        author: resource.author ?? null,
        category: resource.category ?? "resource",
        tags: safeTags(resource.tags),
        content: null,
        url: `/resources/${resource.slug}`,
        originalType: "resource",
      });
    });

    /* ----------------------------- SORT NEWEST → OLDEST ----------------------------- */
    unified.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    return unified;
  } catch (error) {
    console.error("[unified-content] Error fetching unified content:", error);
    return [];
  }
}

export async function getUnifiedContentByType(
  type: UnifiedContentType,
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function searchUnifiedContent(query: string) {
  const all = await getAllUnifiedContent();
  const q = query.toLowerCase();

  return all.filter((item) => {
    const haystack =
      (item.title ?? "") +
      " " +
      (item.description ?? "") +
      " " +
      (item.excerpt ?? "") +
      " " +
      (item.content ?? "") +
      " " +
      (item.tags ?? []).join(" ");

    return haystack.toLowerCase().includes(q);
  });
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
};