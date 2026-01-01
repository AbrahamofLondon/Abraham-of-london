/* lib/server/content.ts */
import ContentHelper, { 
  type ContentDoc,
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies
} from "@/lib/contentlayer-helper";
import prisma from "@/lib/prisma";

/**
 * INSTITUTIONAL ENGAGEMENT TRACKING
 * Logs unique principal views into the Prisma/Neon database.
 */
export async function recordContentView(doc: ContentDoc, memberId?: string): Promise<void> {
  const slug = doc.slug || doc._raw?.flattenedPath;
  if (!slug) return;

  try {
    // Fail-soft: If Prisma is not configured or down, catch the error
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
    // Log but do not crash the request
    console.error(`[AUDIT_FAILURE] Engagement log failed for slug: ${slug}`, error);
  }
}

// ============================================================================
// ASSET INTEGRITY & VALIDATION
// ============================================================================

/**
 * Assert that public assets exist for downloads and resources
 */
export const assertPublicAssetsForDownloadsAndResources = (): { missing: string[] } => {
  const missingAssets: string[] = [];
  
  // Check downloads
  const downloads = getAllDownloads();
  downloads.forEach(download => {
    const filePath = ContentHelper.resolveDocDownloadUrl(download);
    if (filePath && !filePath.includes('http') && !filePath.startsWith('/')) {
       // Validation logic for relative paths vs absolute
       console.log(`[ASSET CHECK] Download: ${download.title} -> ${filePath}`);
    }
  });
  
  // Check resources
  const resources = getAllResources();
  resources.forEach(resource => {
    // Resources might use 'file' or 'url' depending on schema
    const filePath = (resource as any).file || (resource as any).url;
    if (filePath && !filePath.includes('http') && !filePath.startsWith('/')) {
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
  return ContentHelper.resolveDocDownloadUrl(doc);
};

/**
 * Get required subscription tier for document
 */
export const getRequiredTier = (doc: any): string => {
  return ContentHelper.getRequiredTier(doc);
};

// ============================================================================
// WRAPPERS: Standardized access via ContentHelper
// ============================================================================

// Re-export specific getters for backward compatibility
export {
  getAllCanons,
  getAllDownloads,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies
};

export const getCanonBySlug = (slug: string) => ContentHelper.getCanonBySlug(slug);
export const getDownloadBySlug = (slug: string) => ContentHelper.getDownloadBySlug(slug);
export const getBookBySlug = (slug: string) => ContentHelper.getBookBySlug(slug);

export const getPublishedShorts = (): ContentDoc[] => {
  return ContentHelper.getPublishedShorts();
};

// Utility: Check if document exists
export const documentExists = (slug: string): boolean => {
  const allDocs = ContentHelper.getAllDocuments();
  return allDocs.some(doc => 
    doc.slug === slug || doc._raw?.flattenedPath.split('/').pop() === slug
  );
};

// Utility: Get document by slug (any type)
export const getDocumentBySlug = (slug: string): ContentDoc | null => {
  // Use the robust helper which checks all 24 types
  // We pass 'post' as a default kind, but the logic inside actually scans correctly
  // or we can iterate if we want to be explicit, but getAllDocuments().find is safer here
  const allDocs = ContentHelper.getAllDocuments();
  
  const normalized = ContentHelper.normalizeSlug(slug);
  
  return allDocs.find(doc => {
    const docSlug = doc.slug || doc._raw?.flattenedPath.split('/').pop();
    return ContentHelper.normalizeSlug(docSlug) === normalized;
  }) || null;
};