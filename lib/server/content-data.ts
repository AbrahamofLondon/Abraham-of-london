// lib/server/content-data.ts
import { getAllDownloads } from "./downloads-data";
import { getAllBooks } from "./books-data";
import { getAllEvents } from "./events-data";

export type ContentItem = {
  type: "download" | "book" | "event" | "resource";
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  date?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

export function getContentSlugs(type?: "downloads" | "books" | "events"): string[] {
  try {
    if (type === "downloads") {
      const { getDownloadSlugs } = require("./downloads-data");
      return getDownloadSlugs();
    }
    
    if (type === "books") {
      const { getBookSlugs } = require("./books-data");
      return getBookSlugs();
    }
    
    if (type === "events") {
      const { getEventSlugs } = require("./events-data");
      return getEventSlugs();
    }
    
    // Return all slugs if no type specified
    const { getDownloadSlugs } = require("./downloads-data");
    const { getBookSlugs } = require("./books-data");
    const { getEventSlugs } = require("./events-data");
    
    return [
      ...getDownloadSlugs(),
      ...getBookSlugs(), 
      ...getEventSlugs()
    ];
  } catch (error) {
    console.error('Error getting content slugs:', error);
    return [];
  }
}

export function getAllContent(type?: "downloads" | "books" | "events"): ContentItem[] {
  try {
    if (type === "downloads") {
      return getAllDownloads(["slug", "title", "excerpt", "coverImage", "date", "category", "tags"])
        .map(item => ({
          type: "download" as const,
          slug: item.slug,
          title: item.title || "Untitled Download",
          excerpt: item.excerpt,
          coverImage: item.coverImage,
          date: item.date,
          category: item.category,
          tags: item.tags,
        }));
    }
    
    if (type === "books") {
      return getAllBooks(["slug", "title", "excerpt", "coverImage", "date", "category", "tags"])
        .map(item => ({
          type: "book" as const,
          slug: item.slug,
          title: item.title || "Untitled Book",
          excerpt: item.excerpt,
          coverImage: item.coverImage,
          date: item.date,
          category: item.category,
          tags: item.tags,
        }));
    }
    
    if (type === "events") {
      return getAllEvents(["slug", "title", "summary", "coverImage", "date", "tags"])
        .map(item => ({
          type: "event" as const,
          slug: item.slug,
          title: item.title || "Untitled Event",
          excerpt: item.summary,
          coverImage: item.coverImage || item.heroImage,
          date: item.date,
          tags: item.tags,
        }));
    }
    
    // Return all content if no type specified
    const downloads = getAllDownloads(["slug", "title", "excerpt", "coverImage", "date", "category", "tags"])
      .map(item => ({ ...item, type: "download" as const }));
    
    const books = getAllBooks(["slug", "title", "excerpt", "coverImage", "date", "category", "tags"])
      .map(item => ({ ...item, type: "book" as const }));
    
    const events = getAllEvents(["slug", "title", "summary", "coverImage", "date", "tags"])
      .map(item => ({ ...item, type: "event" as const, excerpt: item.summary }));
    
    return [...downloads, ...books, ...events];
  } catch (error) {
    console.error('Error getting all content:', error);
    return [];
  }
}

export function getContentBySlug(
  type: "downloads" | "books" | "events", 
  slug: string, 
  options: { withContent?: boolean } = {}
) {
  try {
    if (type === "downloads") {
      const { getDownloadBySlug } = require("./downloads-data");
      return getDownloadBySlug(slug, undefined, options.withContent);
    }
    
    if (type === "books") {
      const { getBookBySlug } = require("./books-data");
      return getBookBySlug(slug, undefined, options.withContent);
    }
    
    if (type === "events") {
      const { getEventBySlug } = require("./events-data");
      return getEventBySlug(slug, undefined, options.withContent);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting content by slug ${slug}:`, error);
    return null;
  }
}