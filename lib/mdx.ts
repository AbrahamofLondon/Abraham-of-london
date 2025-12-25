// lib/mdx.ts - Fixed version
import type { PostMeta } from "@/types/post";

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

// Convert PostDocument to PostMeta - UPDATED to match PostMeta type
export function convertToPostMeta(doc: PostDocument): PostMeta {
  // Convert draft to published (inverse)
  const published = !doc.draft;
  
  return {
    slug: doc.slug,
    title: doc.title || "",
    date: doc.date || "",
    excerpt: doc.excerpt || "",
    published: published,
    featured: doc.featured || false,
    category: doc.category || "",
    tags: doc.tags || [],
    author: doc.author || "",
    readTime: doc.readTime || "",
    ...(doc.subtitle && { subtitle: doc.subtitle }),
    ...(doc.description && { description: doc.description }),
    ...(doc.coverImage && { coverImage: doc.coverImage }),
    ...(doc.ogImage && { ogImage: doc.ogImage }),
    ...(doc.series && { series: doc.series }),
    ...(doc.seriesOrder && { seriesOrder: doc.seriesOrder }),
    ...(doc.coverAspect && { coverAspect: doc.coverAspect }),
    ...(doc.coverFit && { coverFit: doc.coverFit }),
    ...(doc.coverPosition && { coverPosition: doc.coverPosition }),
    ...(doc.authors && { authors: doc.authors }),
    ...(doc.wordCount && { wordCount: doc.wordCount }),
    ...(doc.canonicalUrl && { canonicalUrl: doc.canonicalUrl }),
    ...(doc.noindex && { noindex: doc.noindex }),
    ...(doc.lastModified && { lastModified: doc.lastModified }),
    // Note: draft is NOT included in PostMeta type
  };
}

// Get all content (simplified)
export async function getAllContent(collection?: string): Promise<PostDocument[]> {
  try {
    const { getAllContentlayerDocs } = await import('./contentlayer-helper');
    const docs = getAllContentlayerDocs();
    
    let filteredDocs = docs;
    
    if (collection) {
      // Filter by collection type (simplified logic)
      filteredDocs = docs.filter(doc => {
        // Use flattenedPath instead of sourceFilePath
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

// Get content by slug - FIXED: use getDocumentBySlug instead
export async function getContentBySlug(
  collection: string,
  slug: string
): Promise<PostDocument | null> {
  try {
    // Use getDocumentBySlug instead of getContentlayerDocBySlug
    const { getDocumentBySlug } = await import('./contentlayer-helper');
    const doc = getDocumentBySlug(slug);
    
    if (!doc) return null;
    
    // Optional: check if it belongs to the right collection
    const type = doc._raw?.flattenedPath?.split('/')[0] || '';
    if (collection && type !== collection) return null;
    
    return convertToPostDocument(doc);
  } catch (error) {
    console.error('Error getting content by slug:', error);
    return null;
  }
}