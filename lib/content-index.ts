// lib/content/index.ts - FIXED
// Unified content system with fallback support

export * from '@/lib/content-fallback';
export * from '@/lib/server/unified-content';

// Re-export all types
export type {
  UnifiedContent,
  ContentType,
  ContentQuery,
  ContentStats,
} from '@/lib/server/unified-content';

export type {
  AnyDoc,
  DocKind,
  ContentlayerCardProps,
  PostType as Post,
  BookType as Book,
  ShortType as Short,
  CanonType as Canon,
} from '@/lib/content-fallback';

// Main content loader with fallback support
export async function loadContent<T = any>(
  contentType: string,
  options?: { useFallback?: boolean }
): Promise<T[]> {
  try {
    if (options?.useFallback) {
      // Use direct contentlayer imports
      const { getAllContentDirect } = await import('@/lib/content-fallback');
      const allContent = getAllContentDirect();
      
      switch(contentType) {
        case 'post': return allContent.posts as unknown as T[];
        case 'book': return allContent.books as unknown as T[];
        case 'canon': return allContent.canon as unknown as T[];
        case 'short': return allContent.shorts as unknown as T[];
        case 'download': return allContent.downloads as unknown as T[];
        case 'event': return allContent.events as unknown as T[];
        case 'print': return allContent.prints as unknown as T[];
        case 'resource': return allContent.resources as unknown as T[];
        case 'strategy': return allContent.strategies as unknown as T[];
        default: return allContent.posts as unknown as T[];
      }
    }
    
    // Use unified content system
    const { getUnifiedContentByType } = await import('@/lib/server/unified-content');
    const typeMap: Record<string, any> = {
      post: 'essay',
      book: 'book',
      canon: 'canon',
      short: 'essay', // Unified treats shorts as essays
      download: 'download',
      event: 'event',
      print: 'print',
      resource: 'resource',
      strategy: 'strategy',
    };
    
    const unifiedType = typeMap[contentType] || contentType;
    const content = await getUnifiedContentByType(unifiedType as any);
    return content as unknown as T[];
  } catch (error) {
    console.error(`Error loading ${contentType}:`, error);
    return [];
  }
}

// Universal getter for any content type
export async function getContent<T = any>(
  slug: string,
  type?: string
): Promise<T | null> {
  try {
    // Try unified system first
    const { getUnifiedContentBySlug } = await import('@/lib/server/unified-content');
    const unifiedType = type === 'post' ? 'essay' : type;
    const content = await getUnifiedContentBySlug(slug, unifiedType as any);
    
    if (content) return content as unknown as T;
    
    // Fallback to direct contentlayer
    const { getDocumentBySlugDirect } = await import('@/lib/content-fallback');
    const doc = getDocumentBySlugDirect(slug);
    
    return doc ? convertToUnifiedFormat(doc) as unknown as T : null;
  } catch (error) {
    console.error(`Error getting content ${slug}:`, error);
    return null;
  }
}

// Helper to convert contentlayer docs to unified format
function convertToUnifiedFormat(doc: any): any {
  const typeMap: Record<string, string> = {
    Post: 'essay',
    Book: 'book',
    Canon: 'canon',
    Short: 'essay',
    Download: 'download',
    Event: 'event',
    Print: 'print',
    Resource: 'resource',
    Strategy: 'strategy',
  };
  
  return {
    id: `${doc.type.toLowerCase()}-${doc.slug}`,
    type: typeMap[doc.type] || doc.type.toLowerCase(),
    slug: doc.slug,
    title: doc.title,
    url: getContentUrl(doc.type, doc.slug),
    excerpt: doc.excerpt,
    description: doc.description,
    date: doc.date,
    coverImage: doc.coverImage,
    tags: doc.tags || [],
    featured: Boolean(doc.featured),
    draft: Boolean(doc.draft),
    published: !doc.draft,
    status: doc.draft ? 'draft' : 'published',
    author: doc.author,
    category: (doc as any).category,
    readTime: (doc as any).readTime,
    _raw: doc,
  };
}

function getContentUrl(docType: string, slug: string): string {
  const typeMap: Record<string, string> = {
    Post: 'blog',
    Book: 'books',
    Canon: 'canon',
    Short: 'shorts',
    Download: 'downloads',
    Event: 'events',
    Print: 'prints',
    Resource: 'resources',
    Strategy: 'strategies',
  };
  
  const path = typeMap[docType] || docType.toLowerCase();
  return `/${path}/${slug}`;
}

// Convenience exports
export const content = {
  load: loadContent,
  get: getContent,
  getAll: async (options?: { useFallback?: boolean }) => {
    if (options?.useFallback) {
      const { getAllContentFlatDirect } = await import('@/lib/content-fallback');
      return getAllContentFlatDirect();
    }
    
    const { getAllUnifiedContent } = await import('@/lib/server/unified-content');
    return getAllUnifiedContent();
  },
  getPublished: async (options?: { useFallback?: boolean }) => {
    if (options?.useFallback) {
      const { getPublishedDocumentsDirect } = await import('@/lib/content-fallback');
      return getPublishedDocumentsDirect();
    }
    
    const { getPublishedUnifiedContent } = await import('@/lib/server/unified-content');
    return getPublishedUnifiedContent();
  },
};