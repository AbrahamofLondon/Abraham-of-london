/* lib/contentlayer.ts - SIMPLIFIED VERSION */
/**
 * Simple contentlayer exports without Contentlayer dependencies
 * Uses contentlayer-helper as the data source
 */

import { 
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllWhitepapers,
  getAllReports,
  getAllNewsletters,
  getAllSermons,
  getAllDevotionals,
  getAllPrayers,
  getAllTestimonies,
  getAllPodcasts,
  getAllVideos,
  getAllCourses,
  getAllLessons,
  ContentDoc as ContentDocBase,
  DocKind
} from "@/lib/contentlayer-helper";

// Re-export everything from contentlayer-helper
export {
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllWhitepapers,
  getAllReports,
  getAllNewsletters,
  getAllSermons,
  getAllDevotionals,
  getAllPrayers,
  getAllTestimonies,
  getAllPodcasts,
  getAllVideos,
  getAllCourses,
  getAllLessons
};

export type { ContentDocBase as ContentlayerDocument, DocKind };

// Export type aliases for compatibility
export type PostDocument = ContentDocBase;
export type BookDocument = ContentDocBase;
export type DownloadDocument = ContentDocBase;
export type CanonDocument = ContentDocBase;
export type EventDocument = ContentDocBase;
export type ShortDocument = ContentDocBase;
export type PrintDocument = ContentDocBase;
export type StrategyDocument = ContentDocBase;
export type ResourceDocument = ContentDocBase;
export type DocumentTypes = ContentDocBase;

// Collections
export const allPosts = getAllPosts();
export const allBooks = getAllBooks();
export const allDownloads = getAllDownloads();
export const allEvents = getAllEvents();
export const allPrints = getAllPrints();
export const allStrategies = getAllStrategies();
export const allResources = getAllResources();
export const allCanons = getAllCanons();
export const allShorts = getAllShorts();
export const allDocuments = [
  ...allPosts,
  ...allBooks,
  ...allDownloads,
  ...allEvents,
  ...allPrints,
  ...allStrategies,
  ...allResources,
  ...allCanons,
  ...allShorts
];

// Type guards (simplified)
export function isPost(doc: any): boolean { return doc?.type === "Post" || doc?.type === "post"; }
export function isBook(doc: any): boolean { return doc?.type === "Book" || doc?.type === "book"; }
export function isDownload(doc: any): boolean { return doc?.type === "Download" || doc?.type === "download"; }
export function isEvent(doc: any): boolean { return doc?.type === "Event" || doc?.type === "event"; }
export function isPrint(doc: any): boolean { return doc?.type === "Print" || doc?.type === "print"; }
export function isResource(doc: any): boolean { return doc?.type === "Resource" || doc?.type === "resource"; }
export function isCanon(doc: any): boolean { return doc?.type === "Canon" || doc?.type === "canon"; }
export function isStrategy(doc: any): boolean { return doc?.type === "Strategy" || doc?.type === "strategy"; }
export function isShort(doc: any): boolean { return doc?.type === "Short" || doc?.type === "short"; }

// Helper functions
export function getPublishedDocuments<T extends ContentDocBase>(docs: T[] = allDocuments as T[]): T[] {
  return docs
    .filter((d) => d && !d.draft)
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
}

export function getDocumentBySlug(slug: string): ContentDocBase | undefined {
  return allDocuments.find((d) => {
    const docSlug = d.slug || d._raw?.flattenedPath?.split('/').pop();
    return docSlug === slug;
  });
}

// UI Utilities
export function getCardFallbackConfig() {
  return {
    defaultImage: "/assets/images/placeholder.jpg",
    defaultTitle: "Untitled",
    defaultDescription: "No description available.",
    defaultTags: [] as string[],
    defaultAuthor: "Unknown Author",
    defaultAvatar: "/assets/images/avatar.jpg",
  };
}

export function getCardImage(image: string | null | undefined, fallback?: string): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export function getCardPropsForDocument(doc: ContentDocBase) {
  const base = {
    slug: doc.slug || doc._raw?.flattenedPath?.split('/').pop() || "unknown",
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || null,
    description: doc.description || null,
    excerpt: doc.excerpt || doc.description || null,
    coverImage: doc.coverImage || doc.coverimage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    type: doc.type,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    author: doc.author || null,
    category: doc.category || null,
    readTime: doc.readTime || null,
  };

  if (isCanon(doc)) {
    return { ...base, volumeNumber: (doc as any).volumeNumber, order: (doc as any).order };
  }
  if (isBook(doc)) {
    return { ...base, isbn: (doc as any).isbn, publisher: (doc as any).publisher };
  }
  if (isEvent(doc)) {
    return { ...base, eventDate: (doc as any).eventDate, location: (doc as any).location };
  }
  if (isPrint(doc)) {
    return { ...base, price: (doc as any).price, available: (doc as any).available };
  }
  
  return base;
}

// Export the missing function that index.tsx is looking for
export function getRecentShorts(limit: number = 5): ContentDocBase[] {
  return getPublishedDocuments(allShorts)
    .slice(0, limit);
}