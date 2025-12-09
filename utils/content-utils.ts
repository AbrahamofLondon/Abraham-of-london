// utils/content-utils.ts
import type { PostDocument } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

export function convertToPostMeta(doc: PostDocument): PostMeta {
  // Handle coverImage which could be string | { src?: string } | null
  let coverImageValue: string | { src?: string } | null | undefined;
  if (doc.coverImage) {
    if (typeof doc.coverImage === 'string') {
      coverImageValue = doc.coverImage;
    } else if (doc.coverImage && typeof doc.coverImage === 'object') {
      coverImageValue = doc.coverImage;
    }
  }

  return {
    slug: doc.slug || "",
    title: doc.title || "",
    excerpt: doc.excerpt || doc.description || "",
        date: doc.date || '',
        author: doc.author || '',
        category: doc.category || '',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
        readTime: (typeof doc.readTime === 'number' ? String(doc.readTime) : doc.readTime) || '',
    coverImage: coverImageValue,
    draft: Boolean(doc.draft),
    published: !doc.draft,
    description: doc.description || doc.excerpt || "",
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
