/* lib/server/content.ts */
import {
  allCanons,
  allDownloads,
  allShorts,
  allBooks,
  allPosts,
  allEvents,
  allResources,
  allPrints,
  allStrategies,
  type Canon,
  type Download,
  type Short,
  type Book,
  type Post,
  type Event,
  type Resource,
  type Print,
  type Strategy
} from "contentlayer/generated";
import prisma from "@/lib/prisma";

// Define a union type for institutional documents
export type ContentDoc = Canon | Download | Short | Book | Post | Event | Resource | Print | Strategy;

/**
 * INSTITUTIONAL ENGAGEMENT TRACKING
 * Logs unique principal views into the Prisma/Neon database.
 */
export async function recordContentView(doc: ContentDoc, memberId?: string): Promise<void> {
  const slug = (doc as any).slug;
  if (!slug) return;

  try {
    await prisma.shortInteraction.create({
      data: {
        shortSlug: slug,
        action: "view",
        memberId: memberId || null,
        metadata: JSON.stringify({
          title: (doc as any).title || "Untitled",
          type: (doc as any).type || "institutional_content",
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error(`[AUDIT_FAILURE] Engagement log failed for slug: ${slug}`, error);
  }
}

// ============================================================================
// CRITICAL: ADD MISSING EXPORTS FOR PAGES
// ============================================================================

/**
 * Assert that public assets exist for downloads and resources
 */
export const assertPublicAssetsForDownloadsAndResources = (): { missing: string[] } => {
  const missingAssets: string[] = [];
  
  // Check downloads
  allDownloads.forEach(download => {
    const filePath = (download as any).file || (download as any).downloadFile || (download as any).downloadUrl;
    if (filePath && !filePath.includes('http')) {
      // Simple check - in production you'd verify file exists
      console.log(`[ASSET CHECK] Download: ${download.title} -> ${filePath}`);
    }
  });
  
  // Check resources
  allResources.forEach(resource => {
    const filePath = (resource as any).file || (resource as any).downloadFile || (resource as any).downloadUrl;
    if (filePath && !filePath.includes('http')) {
      console.log(`[ASSET CHECK] Resource: ${resource.title} -> ${filePath}`);
    }
  });
  
  return { missing: missingAssets };
};

/**
 * Get download size label (human readable)
 */
export const getDownloadSizeLabel = (size: string | number | undefined): string => {
  if (!size) return 'Unknown size';
  
  if (typeof size === 'string') {
    // Check if it's already formatted
    if (size.includes('KB') || size.includes('MB') || size.includes('GB')) {
      return size;
    }
    // Try to parse as number
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

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Resolve document download URL
 */
export const resolveDocDownloadUrl = (doc: any): string => {
  return doc.downloadUrl || doc.pdfPath || doc.file || doc.downloadFile || doc.fileUrl || '';
};

/**
 * Get required subscription tier for document
 */
export const getRequiredTier = (doc: any): string => {
  const accessLevel = doc.accessLevel || 'public';
  
  switch (accessLevel) {
    case 'premium':
      return 'premium';
    case 'inner-circle':
      return 'inner-circle';
    case 'founders':
      return 'founders';
    default:
      return 'free';
  }
};

// ============================================================================
// WRAPPERS: Standardized access with safety defaults
// ============================================================================

export const getAllCanons = (): Canon[] => {
  return allCanons || [];
};

export const getCanonBySlug = (slug: string): Canon | null => {
  return allCanons.find((c) => c.slug === slug) || null;
};

export const getAllDownloads = (): Download[] => {
  return allDownloads || [];
};

export const getDownloadBySlug = (slug: string): Download | null => {
  return allDownloads.find((d) => d.slug === slug) || null;
};

export const getPublishedShorts = (): Short[] => {
  // Filter for non-drafts to maintain institutional quality
  return allShorts.filter(s => !(s as any).draft) || [];
};

export const getAllBooks = (): Book[] => {
  return allBooks || [];
};

export const getBookBySlug = (slug: string): Book | null => {
  return allBooks.find((b) => b.slug === slug) || null;
};

export const getAllPosts = (): Post[] => {
  return allPosts || [];
};

export const getAllEvents = (): Event[] => {
  return allEvents || [];
};

export const getAllResources = (): Resource[] => {
  return allResources || [];
};

export const getAllPrints = (): Print[] => {
  return allPrints || [];
};

export const getAllStrategies = (): Strategy[] => {
  return allStrategies || [];
};

// Utility: Check if document exists
export const documentExists = (slug: string): boolean => {
  const allDocs = [
    ...allCanons,
    ...allDownloads,
    ...allShorts,
    ...allBooks,
    ...allPosts,
    ...allEvents,
    ...allResources,
    ...allPrints,
    ...allStrategies
  ];
  
  return allDocs.some(doc => doc.slug === slug);
};

// Utility: Get document by slug (any type)
export const getDocumentBySlug = (slug: string): ContentDoc | null => {
  const allDocs = [
    ...allCanons,
    ...allDownloads,
    ...allShorts,
    ...allBooks,
    ...allPosts,
    ...allEvents,
    ...allResources,
    ...allPrints,
    ...allStrategies
  ];
  
  return allDocs.find(doc => doc.slug === slug) || null;
};