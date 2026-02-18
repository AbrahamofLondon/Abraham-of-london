// lib/content/safe-patch.ts
/**
 * Emergency safe patch for content imports
 * Use this as a temporary measure while migrating
 */

// Re-export everything from the new location
export * from "./index";

// Import from the actual source file that contains the functions
import { getAllContentlayerDocs as originalGetAllDocs } from "./real";

// Provide a safe wrapper for getAllContentlayerDocs
export function getAllContentlayerDocs(): any[] {
  try {
    return originalGetAllDocs();
  } catch (error) {
    console.warn("⚠️ getAllContentlayerDocs failed, returning empty array");
    return [];
  }
}

// Helper to get content data structure (matches what getContentlayerData would return)
export function getContentlayerData(): any {
  try {
    const docs = originalGetAllDocs();
    // Group docs by type for easier access
    const grouped = {
      allDocuments: docs,
      allBooks: docs.filter((d: any) => d?.type === 'Book' || d?.kind === 'book'),
      allCanons: docs.filter((d: any) => d?.type === 'Canon' || d?.kind === 'canon'),
      allDownloads: docs.filter((d: any) => d?.type === 'Download' || d?.kind === 'download'),
      allPosts: docs.filter((d: any) => d?.type === 'Post' || d?.kind === 'post'),
      allEvents: docs.filter((d: any) => d?.type === 'Event' || d?.kind === 'event'),
      allPrints: docs.filter((d: any) => d?.type === 'Print' || d?.kind === 'print'),
      allResources: docs.filter((d: any) => d?.type === 'Resource' || d?.kind === 'resource'),
      allStrategies: docs.filter((d: any) => d?.type === 'Strategy' || d?.kind === 'strategy'),
      allShorts: docs.filter((d: any) => d?.type === 'Short' || d?.kind === 'short'),
    };
    return grouped;
  } catch (error) {
    console.warn("⚠️ getContentlayerData failed, returning empty structure");
    return {
      allDocuments: [],
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allPosts: [],
      allEvents: [],
      allPrints: [],
      allResources: [],
      allStrategies: [],
      allShorts: [],
    };
  }
}

// Create a local implementation of getPublishedDocuments
import { isDraftContent } from "./real";

export function getPublishedDocuments(): any[] {
  try {
    const docs = originalGetAllDocs();
    return docs.filter((doc) => !isDraftContent(doc));
  } catch (error) {
    console.warn("⚠️ getPublishedDocuments failed, returning empty array");
    return [];
  }
}