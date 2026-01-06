/* lib/client-content.ts */
export interface ContentMetadata {
  slug: string;
  title: string;
  type: string;
  date?: string;
  excerpt?: string;
}

let contentCache: ContentMetadata[] = [];
let isInitialized = false;

/**
 * INSTITUTIONAL HYDRATION
 * Fetches content metadata from the internal API to hydrate the client cache.
 */
export async function initializeClientContent(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const response = await fetch('/api/content/initialize');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.content)) {
      contentCache = data.content;
      isInitialized = true;
      console.log(`[CLIENT_CONTENT] Institutional cache hydrated: ${contentCache.length} nodes.`);
    }
  } catch (error) {
    console.error('[HYDRATION_ERROR] Content metadata could not be synchronized:', error);
  }
}

/**
 * DETERMINISTIC SEARCH
 */
export function searchInstitutionalContent(query: string): ContentMetadata[] {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  return contentCache.filter(item => 
    item.title.toLowerCase().includes(q) || 
    (item.excerpt && item.excerpt.toLowerCase().includes(q)) ||
    item.slug.includes(q)
  );
}

export function getCachedContentBySlug(slug: string): ContentMetadata | null {
  return contentCache.find(item => item.slug === slug) || null;
}

