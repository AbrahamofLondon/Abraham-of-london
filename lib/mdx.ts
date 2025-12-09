// lib/mdx.ts - Simple version
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

// Convert PostDocument to PostMeta
export function convertToPostMeta(doc: PostDocument): PostMeta {
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    description: doc.description,
    date: doc.date,
    author: doc.author,
    category: doc.category,
    tags: doc.tags,
    readTime: doc.readTime,
    coverImage: doc.coverImage,
    draft: doc.draft,
    published: !doc.draft,
    url: doc.url,
    // Pass through additional fields
    ...(doc.subtitle && { subtitle: doc.subtitle }),
    ...(doc.volumeNumber && { volumeNumber: doc.volumeNumber }),
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
        const type = doc._raw.sourceFilePath.split('/')[0];
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
    const { getContentlayerDocBySlug } = await import('./contentlayer-helper');
    const doc = getContentlayerDocBySlug(slug);
    
    if (!doc) return null;
    
    // Optional: check if it belongs to the right collection
    const type = doc._raw.sourceFilePath.split('/')[0];
    if (collection && type !== collection) return null;
    
    return convertToPostDocument(doc);
  } catch (error) {
    console.error('Error getting content by slug:', error);
    return null;
  }
}