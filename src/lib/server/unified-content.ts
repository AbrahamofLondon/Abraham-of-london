// src/lib/server/unified-content.ts
// Unified view over pages, downloads, and events for search / discovery.

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

// Minimal shapes so we don't fight types from the server modules
type PageLike = {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  content?: string;
};

type DownloadLike = {
  slug: string;
  title?: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
};

type EventLike = {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date: string;
  author?: string;
  category?: string;
  tags?: string[];
};

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const [pagesRaw, downloadsRaw, eventsRaw] = await Promise.all([
      Promise.resolve(getAllPages()),
      Promise.resolve(getAllDownloadsMeta()),
      Promise.resolve(getAllEvents()),
    ]);

    const pages = (pagesRaw ?? []) as PageLike[];
    const downloads = (downloadsRaw ?? []) as DownloadLike[];
    const events = (eventsRaw ?? []) as EventLike[];

    const unified: UnifiedContent[] = [];

    // ---- Pages -------------------------------------------------------------
    for (const page of pages) {
      if (!page?.slug || !page?.title) continue;

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
    }

    // ---- Downloads ---------------------------------------------------------
    for (const download of downloads) {
      if (!download?.slug) continue;

      const title =
        (typeof download.title === "string" && download.title.trim().length
          ? download.title
          : "Untitled Download");

      unified.push({
        id: `download-${download.slug}`,
        type: "download",
        slug: download.slug,
        title,
        description: download.description ?? download.excerpt,
        excerpt: download.excerpt,
        date: download.date,
        author: download.author,
        category: download.category,
        tags: download.tags,
        url: `/downloads/${download.slug}`,
      });
    }

    // ---- Events ------------------------------------------------------------
    for (const event of events) {
      if (!event?.slug || !event?.title) continue;

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
    }

    // ---- Sort by date (newest first) --------------------------------------
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
): Promise<UnifiedContent[]> {
  const allContent = await getAllUnifiedContent();
  return allContent.filter((item) => item.type === type);
}

export async function searchUnifiedContent(
  query: string
): Promise<UnifiedContent[]> {
  const allContent = await getAllUnifiedContent();
  const lowerQuery = query.toLowerCase();

  return allContent.filter((item) => {
    const inTitle = item.title.toLowerCase().includes(lowerQuery);
    const inDescription = item.description?.toLowerCase().includes(lowerQuery);
    const inExcerpt = item.excerpt?.toLowerCase().includes(lowerQuery);
    const inContent = item.content?.toLowerCase().includes(lowerQuery);
    const inTags = item.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    );

    return inTitle || inDescription || inExcerpt || inContent || inTags;
  });
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
};