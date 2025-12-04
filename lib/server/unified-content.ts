// lib/server/unified-content.ts
// Unified content registry – no Contentlayer dependency

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEvents } from "./events-data";
import { getAllBooksMeta } from "./books-data";
import { getAllPostsMeta } from "./posts-data";
import { getAllPrintsMeta } from "./prints-data";
import { getAllResourcesMeta } from "./resources-data";

export interface UnifiedContent {
  id: string;
  type:
    | "page"
    | "post"
    | "book"
    | "download"
    | "event"
    | "print"
    | "resource";
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

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const [
      pages,
      downloads,
      events,
      posts,
      books,
      prints,
      resources,
    ] = await Promise.all([
      getAllPages(),
      getAllDownloadsMeta(),
      getAllEvents(),
      getAllPostsMeta(),
      getAllBooksMeta(),
      getAllPrintsMeta(),
      getAllResourcesMeta(),
    ]);

    const unified: UnifiedContent[] = [];

    // Pages
    pages.forEach((page) => {
      unified.push({
        id: `page-${page.slug}`,
        type: "page",
        slug: page.slug,
        title: page.title,
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

    // Posts (blog / essays)
    posts.forEach((post) => {
      unified.push({
        id: `post-${post.slug}`,
        type: "post",
        slug: post.slug,
        title: post.title,
        description: post.description ?? post.excerpt ?? null,
        excerpt: post.excerpt ?? null,
        date: post.date ?? null,
        author: post.author ?? null,
        category: post.category ?? null,
        tags: post.tags ?? null,
        url: `/blog/${post.slug}`,
      });
    });

    // Books
    books.forEach((book) => {
      unified.push({
        id: `book-${book.slug}`,
        type: "book",
        slug: book.slug,
        title: book.title,
        description: book.description ?? book.excerpt ?? null,
        excerpt: book.excerpt ?? null,
        date: book.date ?? null,
        author: book.author ?? null,
        category: book.category ?? null,
        tags: book.tags ?? null,
        url: `/books/${book.slug}`,
      });
    });

    // Downloads
    downloads.forEach((download) => {
      unified.push({
        id: `download-${download.slug}`,
        type: "download",
        slug: download.slug,
        title: download.title || "Untitled Download",
        description: download.description || download.excerpt || null,
        excerpt: download.excerpt ?? null,
        date: download.date ?? null,
        author: download.author ?? null,
        category: download.category ?? null,
        tags: download.tags ?? null,
        url: `/downloads/${download.slug}`,
      });
    });

    // Events
    events.forEach((event) => {
      unified.push({
        id: `event-${event.slug}`,
        type: "event",
        slug: event.slug,
        title: event.title,
        description: event.description ?? event.excerpt ?? null,
        excerpt: event.excerpt ?? null,
        date: event.date ?? null,
        author: event.author ?? null,
        category: event.category ?? null,
        tags: event.tags ?? null,
        url: `/events/${event.slug}`,
      });
    });

    // Prints
    prints.forEach((print) => {
      unified.push({
        id: `print-${print.slug}`,
        type: "print",
        slug: print.slug,
        title: print.title,
        description: print.description ?? print.excerpt ?? null,
        excerpt: print.excerpt ?? null,
        date: print.date ?? null,
        author: print.author ?? null,
        category: print.category ?? null,
        tags: print.tags ?? null,
        url: `/prints/${print.slug}`,
      });
    });

    // Resources (singletons / misc)
    resources.forEach((resource) => {
      unified.push({
        id: `resource-${resource.slug}`,
        type: "resource",
        slug: resource.slug,
        title: resource.title,
        description: resource.description ?? resource.excerpt ?? null,
        excerpt: resource.excerpt ?? null,
        date: resource.date ?? null,
        author: resource.author ?? null,
        category: resource.category ?? null,
        tags: resource.tags ?? null,
        url: `/resources/${resource.slug}`,
      });
    });

    // Sort newest → oldest (fallback to 0 when no date)
    unified.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return unified;
  } catch (error) {
    console.error("[unified-content] Error fetching unified content:", error);
    return [];
  }
}

export async function getUnifiedContentByType(
  type: UnifiedContent["type"]
) {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function searchUnifiedContent(query: string) {
  const all = await getAllUnifiedContent();
  const q = query.toLowerCase();

  return all.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.excerpt?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(q))
  );
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
};
