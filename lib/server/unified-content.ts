// lib/server/unified-content.ts
// Fully corrected – NO Contentlayer dependency

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEvents } from "./events-data";

export interface UnifiedContent {
  id: string;
  type: "page" | "download" | "event";
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  content?: string;
  url: string;
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const [pages, downloads, events] = await Promise.all([
      getAllPages(),
      getAllDownloadsMeta(),
      getAllEvents(),
    ]);

    const unified: UnifiedContent[] = [];

    // Pages
    pages.forEach((page) => {
      unified.push({
        id: `page-${page.slug}`,
        type: "page",
        slug: page.slug,
        title: page.title,
        description: page.description,
        excerpt: page.excerpt,
        date: page.date,
        author: page.author,
        category: page.category,
        tags: page.tags,
        content: page.content,
        url: `/${page.slug}`,
      });
    });

    // Downloads
    downloads.forEach((download) => {
      unified.push({
        id: `download-${download.slug}`,
        type: "download",
        slug: download.slug,
        title: download.title || "Untitled Download",
        description: download.description || download.excerpt,
        excerpt: download.excerpt,
        date: download.date,
        author: download.author,
        category: download.category,
        tags: download.tags,
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
        description: event.description,
        excerpt: event.excerpt,
        date: event.date,
        author: event.author,
        category: event.category,
        tags: event.tags,
        url: `/events/${event.slug}`,
      });
    });

    // Sort newest → oldest
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