// lib/content-utils.ts
import type { DocumentTypes } from "@/lib/contentlayer-helper";
import type { PostMeta } from "@/types/post";

export function convertDocumentToPostMeta(doc: DocumentTypes): PostMeta {
  // Handle coverImage which could be string | { src?: string } | null
  let coverImageValue: string | { src?: string } | null | undefined;
  if (doc.coverImage) {
    if (typeof doc.coverImage === 'string') {
      coverImageValue = doc.coverImage;
    } else if (doc.coverImage && typeof doc.coverImage === 'object') {
      coverImageValue = { src: (doc.coverImage as any).src };
    }
  }

  // Get readTime from either field
  const readTime = (doc as any).readTime || (doc as any).readingTime;

  return {
    slug: doc.slug || "",
    title: doc.title || "Untitled",
    excerpt: doc.excerpt || "",
    description: doc.description || doc.excerpt || "",
    date: doc.date,
    author: (doc as any).author,
    category: (doc as any).category,
    tags: doc.tags || [],
    readTime: typeof readTime === 'number' ? String(readTime) : readTime,
    coverImage: coverImageValue,
    heroImage: (doc as any).image,
    draft: Boolean(doc.draft),
    published: !doc.draft,
    url: doc.url,
    
    // Additional fields from different content types
    ...((doc as any).subtitle && { subtitle: (doc as any).subtitle }),
    ...((doc as any).volumeNumber && { volumeNumber: String((doc as any).volumeNumber) }),
    ...((doc as any).downloadUrl && { downloadUrl: (doc as any).downloadUrl }),
    ...((doc as any).fileSize && { fileSize: (doc as any).fileSize }),
    ...((doc as any).price && { price: (doc as any).price }),
    ...((doc as any).dimensions && { dimensions: (doc as any).dimensions }),
    ...((doc as any).resourceType && { resourceType: (doc as any).resourceType }),
    ...((doc as any).accessLevel && { accessLevel: (doc as any).accessLevel }),
    ...((doc as any).lockMessage && { lockMessage: (doc as any).lockMessage }),
    ...((doc as any).featured && { featured: Boolean((doc as any).featured) }),
  };
}

export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value;
    }
  });
  return result;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.trim().length > 0;
}