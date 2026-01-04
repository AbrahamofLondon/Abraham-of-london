// lib/server/content.ts - SIMPLIFIED IMPORT
// Remove all the problematic imports and just use contentlayer.ts
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
  getDocumentBySlug,
  normalizeSlug,
  getDocHref,
  getPublishedShorts,
  getRecentShorts,
  getPublishedDocuments,
  getAllContentlayerDocs,
  isDraftContent,
  isDraft,
  getPublishedDownloads,
  getPublishedPosts,
  getPrintBySlug,
  getStrategyBySlug,
  toUiDoc,
  type ContentDoc,
  type DocKind
} from "@/lib/contentlayer";

import prisma from "@/lib/prisma";

// Re-export everything
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
  getAllLessons,
  getDocumentBySlug,
  normalizeSlug,
  getDocHref,
  getPublishedShorts,
  getRecentShorts,
  getPublishedDocuments,
  getAllContentlayerDocs,
  isDraftContent,
  isDraft,
  getPublishedDownloads,
  getPublishedPosts,
  getPrintBySlug,
  getStrategyBySlug,
  toUiDoc
};

export type { ContentDoc, DocKind };

/* -------------------------------------------------------------------------- */
/* SIMPLIFIED CONTENT FUNCTIONS - NO CONTENTLAYER DEPENDENCY */
/* -------------------------------------------------------------------------- */

export async function recordContentView(doc: ContentDoc, memberId?: string): Promise<void> {
  const slug = (doc as any).slugComputed || doc.slug || doc._raw?.flattenedPath;
  if (!slug) return;

  try {
    await prisma.shortInteraction.create({
      data: {
        shortSlug: slug,
        action: "view",
        memberId: memberId || null,
        metadata: JSON.stringify({
          title: doc.title || "Untitled",
          type: ContentHelper.getDocKind(doc),
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error(`[AUDIT_FAILURE] Engagement log failed for slug: ${slug}`, error);
  }
}

export const resolveDocDownloadUrl = (doc: any): string => {
  return ContentHelper.resolveDocDownloadUrl(doc);
};

export const getRequiredTier = (doc: any): string => {
  return ContentHelper.getRequiredTier(doc);
};

/* -------------------------------------------------------------------------- */
/* SIMPLE GETTER FUNCTIONS USING CONTENTLAYER-HELPER */
/* -------------------------------------------------------------------------- */

// These functions directly use contentlayer-helper which doesn't have Contentlayer import issues
export const getCanonBySlug = (slug: string) => ContentHelper.getCanonBySlug(slug);
export const getDownloadBySlug = (slug: string) => ContentHelper.getDownloadBySlug(slug);
export const getBookBySlug = (slug: string) => ContentHelper.getBookBySlug(slug);

export const getPublishedShorts = (): ContentDoc[] => {
  return getAllShorts().filter(short => !short.draft);
};

export const documentExists = (slug: string): boolean => {
  const allDocs = ContentHelper.getAllDocuments();
  return allDocs.some(doc => {
    const docSlug = (doc as any).slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizeSlug(slug);
  });
};

export const getAllDocumentsWithSlugs = (): Array<ContentDoc & { slugComputed: string }> => {
  const allDocs = ContentHelper.getAllDocuments();
  return allDocs.map(doc => ({
    ...doc,
    slugComputed: (doc as any).slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop() || ''
  }));
};

export const getDocumentByIdentifier = (identifier: string): ContentDoc | null => {
  const allDocs = ContentHelper.getAllDocuments();
  const normalizedIdentifier = normalizeSlug(identifier);
  
  return allDocs.find(doc => {
    const possibleIdentifiers = [
      (doc as any).slugComputed,
      doc.slug,
      doc._raw?.flattenedPath,
      doc._raw?.flattenedPath?.split('/').pop()
    ].filter(Boolean);
    
    return possibleIdentifiers.some(id => 
      normalizeSlug(id) === normalizedIdentifier
    );
  }) || null;
};

export const getRecentShorts = (limit: number = 5): ContentDoc[] => {
  return getAllShorts()
    .filter(doc => !doc.draft)
    .slice(0, limit);
};

/* -------------------------------------------------------------------------- */
/* UTILITY FUNCTIONS */
/* -------------------------------------------------------------------------- */

export const getDownloadSizeLabel = (size: string | number | undefined): string => {
  if (!size) return 'Unknown size';
  
  if (typeof size === 'string') {
    if (size.includes('KB') || size.includes('MB') || size.includes('GB')) {
      return size;
    }
    const bytes = parseInt(size);
    if (!isNaN(bytes)) {
      return formatBytes(bytes);
    }
    return size;
  }
  
  if (typeof size === 'number') {
    return formatBytes(size);
  }
  
  return 'Unknown size';
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const assertPublicAssetsForDownloadsAndResources = (): { missing: string[] } => {
  const missingAssets: string[] = [];
  
  const downloads = getAllDownloads();
  downloads.forEach(download => {
    const filePath = ContentHelper.resolveDocDownloadUrl(download);
    if (filePath && !filePath.includes('http') && !filePath.startsWith('/')) {
      console.log(`[ASSET CHECK] Download: ${download.title} -> ${filePath}`);
    }
  });
  
  const resources = getAllResources();
  resources.forEach(resource => {
    const filePath = (resource as any).file || (resource as any).url;
    if (filePath && !filePath.includes('http') && !filePath.startsWith('/')) {
      console.log(`[ASSET CHECK] Resource: ${resource.title} -> ${filePath}`);
    }
  });
  
  return { missing: missingAssets };
};

/* -------------------------------------------------------------------------- */
/* SERVER-ONLY VERSIONS (For API routes that need async/await) */
/* -------------------------------------------------------------------------- */

// Simple async wrappers for the synchronous functions
export async function getServerAllCanons(): Promise<ContentDoc[]> {
  return getAllCanons();
}

export async function getServerAllDownloads(): Promise<ContentDoc[]> {
  return getAllDownloads();
}

export async function getServerAllBooks(): Promise<ContentDoc[]> {
  return getAllBooks();
}

export async function getServerAllShorts(): Promise<ContentDoc[]> {
  return getAllShorts();
}

export async function getServerAllPosts(): Promise<ContentDoc[]> {
  return getAllPosts();
}

export async function getServerAllEvents(): Promise<ContentDoc[]> {
  return getAllEvents();
}

export async function getServerAllResources(): Promise<ContentDoc[]> {
  return getAllResources();
}

export async function getServerAllPrints(): Promise<ContentDoc[]> {
  return getAllPrints();
}

export async function getServerAllStrategies(): Promise<ContentDoc[]> {
  return getAllStrategies();
}

export async function getServerPostBySlug(slug: string): Promise<ContentDoc | null> {
  const posts = getAllPosts();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = posts.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerBookBySlug(slug: string): Promise<ContentDoc | null> {
  const books = getAllBooks();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = books.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerDownloadBySlug(slug: string): Promise<ContentDoc | null> {
  const downloads = getAllDownloads();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = downloads.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerCanonBySlug(slug: string): Promise<ContentDoc | null> {
  const canons = getAllCanons();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = canons.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerShortBySlug(slug: string): Promise<ContentDoc | null> {
  const shorts = getAllShorts();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = shorts.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerEventBySlug(slug: string): Promise<ContentDoc | null> {
  const events = getAllEvents();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = events.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}

export async function getServerResourceBySlug(slug: string): Promise<ContentDoc | null> {
  const resources = getAllResources();
  const normalizedSlug = normalizeSlug(slug);
  
  const foundDoc = resources.find((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split('/').pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
  
  return foundDoc;
}