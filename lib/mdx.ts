// lib/mdx.ts

// Remove the problematic import and define PostMeta locally
// import type { PostMeta } from "@/types/post"; // REMOVE THIS LINE

// Define PostMeta locally
interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;

  published?: boolean;
  featured?: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  subtitle?: string;
  description?: string;

  coverImage?: string | { src?: string } | null;
  ogImage?: string | { src?: string } | null;

  series?: string;
  seriesOrder?: number;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  authors?: string[];
  wordCount?: number;
  canonicalUrl?: string;
  noindex?: boolean;
  lastModified?: string;

  id?: string;
  url?: string;
  draft?: boolean;
}

// Simple interface that matches your needs
export interface PostDocument {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  coverImage?: string | { src?: string } | null;
  draft?: boolean;
  content?: string;
  body?: {
    raw: string;
    code: string;
  };
  [key: string]: any;
}

// Helper to convert any object to PostDocument
export function convertToPostDocument(data: any): PostDocument {
  return {
    slug: data.slug || "",
    title: data.title || "",
    excerpt: data.excerpt || "",
    description: data.description || data.excerpt || "",
    date: data.date,
    author: data.author,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    readTime: data.readTime || data.readingTime,
    coverImage: data.coverImage || data.image,
    draft: Boolean(data.draft),
    content: data.body?.raw || data.content || "",
    body: data.body ? { raw: data.body.raw || "", code: data.body.code || "" } : undefined,
    ...(data.url && { url: data.url }),
    ...(data.subtitle && { subtitle: data.subtitle }),
    ...(data.volumeNumber && { volumeNumber: data.volumeNumber }),
  };
}

// Convert PostDocument to PostMeta
export function convertToPostMeta(doc: PostDocument): PostMeta {
  // Convert draft to published (inverse)
  const published = !doc.draft;
  
  return {
    slug: doc.slug,
    title: doc.title || "",
    date: doc.date || "",
    excerpt: doc.excerpt || "",
    published: published,
    featured: (doc as any).featured || false,
    category: doc.category || "",
    tags: doc.tags || [],
    author: doc.author || "",
    readTime: doc.readTime || "",
    ...(doc.subtitle && { subtitle: doc.subtitle }),
    ...(doc.description && { description: doc.description }),
    ...(doc.coverImage && { coverImage: doc.coverImage }),
    ...((doc as any).ogImage && { ogImage: (doc as any).ogImage }),
    ...((doc as any).series && { series: (doc as any).series }),
    ...((doc as any).seriesOrder && { seriesOrder: (doc as any).seriesOrder }),
    ...((doc as any).coverAspect && { coverAspect: (doc as any).coverAspect }),
    ...((doc as any).coverFit && { coverFit: (doc as any).coverFit }),
    ...((doc as any).coverPosition && { coverPosition: (doc as any).coverPosition }),
    ...((doc as any).authors && { authors: (doc as any).authors }),
    ...((doc as any).wordCount && { wordCount: (doc as any).wordCount }),
    ...((doc as any).canonicalUrl && { canonicalUrl: (doc as any).canonicalUrl }),
    ...((doc as any).noindex && { noindex: (doc as any).noindex }),
    ...((doc as any).lastModified && { lastModified: (doc as any).lastModified }),
  };
}

// Get all content (simplified)
export async function getAllContent(collection?: string): Promise<PostDocument[]> {
  try {
    const { getAllContentlayerDocs } = await import('./contentlayer-helper');
    const docs = getAllContentlayerDocs();
    
    let filteredDocs = docs;
    
    if (collection) {
      // Filter by collection type
      filteredDocs = docs.filter(doc => {
        // Use flattenedPath instead of sourceFilePath for reliability
        const type = doc._raw?.flattenedPath?.split('/')[0] || '';
        return type === collection;
      });
    }
    
    // Filter out drafts and convert
    return filteredDocs
      .filter(doc => !doc.draft)
      .map(convertToPostDocument);
  } catch (error) {
    console.error('Error getting content:', error);
    return [];
  }
}

// Get content by slug
export async function getContentBySlug(
  collection: string,
  slug: string
): Promise<PostDocument | null> {
  try {
    // Import the helper functions
    const {
      getPostBySlug,
      getBookBySlug,
      getDownloadBySlug,
      getResourceBySlug,
      getEventBySlug,
      getPrintBySlug,
      getStrategyBySlug,
      getCanonBySlug,
      getShortBySlug,
    } = await import('./contentlayer-helper');
    
    // Use any type instead of ContentDoc since it's not exported
    let doc: any = null;
    
    // Use the appropriate function based on collection type
    switch (collection) {
      case 'posts':
      case 'blog':
        doc = getPostBySlug(slug);
        break;
      case 'books':
        doc = getBookBySlug(slug);
        break;
      case 'downloads':
        doc = getDownloadBySlug(slug);
        break;
      case 'resources':
        doc = getResourceBySlug(slug);
        break;
      case 'events':
        doc = getEventBySlug(slug);
        break;
      case 'prints':
        doc = getPrintBySlug(slug);
        break;
      case 'strategies':
      case 'strategy':
        doc = getStrategyBySlug(slug);
        break;
      case 'canons':
      case 'canon':
        doc = getCanonBySlug(slug);
        break;
      case 'shorts':
        doc = getShortBySlug(slug);
        break;
      default:
        // Try all collections if collection is not specified or unknown
        const allFunctions = [
          () => getPostBySlug(slug),
          () => getBookBySlug(slug),
          () => getDownloadBySlug(slug),
          () => getResourceBySlug(slug),
          () => getEventBySlug(slug),
          () => getPrintBySlug(slug),
          () => getStrategyBySlug(slug),
          () => getCanonBySlug(slug),
          () => getShortBySlug(slug),
        ];
        
        for (const fn of allFunctions) {
          doc = fn();
          if (doc) break;
        }
    }
    
    if (!doc) return null;
    
    return convertToPostDocument(doc);
  } catch (error) {
    console.error('Error getting content by slug:', error);
    return null;
  }
}