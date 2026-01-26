// lib/content/safe-patch.ts
/**
 * Emergency safe patch for content imports
 * Use this as a temporary measure while migrating
 */

// Re-export everything from the new location
export * from "./index";

// But provide safe fallbacks for critical functions
import { getContentlayerData as originalGetContentlayerData } from "./index";

export function getContentlayerData(): any {
  try {
    return originalGetContentlayerData();
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

// Similar safe wrapper for other critical functions
import { getPublishedDocuments as originalGetPublishedDocuments } from "./index";

export function getPublishedDocuments(): any[] {
  try {
    return originalGetPublishedDocuments();
  } catch (error) {
    console.warn("⚠️ getPublishedDocuments failed, returning empty array");
    return [];
  }
}