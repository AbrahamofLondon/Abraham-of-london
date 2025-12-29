// lib/content-utils.ts
import type { AnyDoc } from "@/lib/content-fallback";
import type { PostMeta } from "@/types/post";

// Define DocumentTypes locally based on what's actually available
export type DocumentTypes = AnyDoc;

export function convertDocumentToPostMeta(doc: DocumentTypes): PostMeta {
  // --- coverImage normalisation: always string | null ---
  let coverImage: string | null = null;

  if (doc.coverImage) {
    if (typeof doc.coverImage === "string") {
      coverImage = doc.coverImage;
    } else if (
      typeof doc.coverImage === "object" &&
      (doc.coverImage as any).src
    ) {
      coverImage = String((doc.coverImage as any).src);
    }
  }

  // --- readTime from multiple possible fields ---
  const rawReadTime = (doc as any).readTime ?? (doc as any).readingTime;
  const readTime =
    typeof rawReadTime === "number"
      ? `${rawReadTime} min`
      : (rawReadTime as string | undefined);

  // Fallback for date to satisfy strict typing
  const dateStr = doc.date || new Date().toISOString();

  const base: PostMeta & Record<string, any> = {
    slug: doc.slug || "",
    title: doc.title || "Untitled",
    excerpt: doc.excerpt || "",
    description: doc.description || doc.excerpt || "",
    // FIX: Ensure date is a string (fallback to current date if missing)
    date: dateStr,
    author: (doc as any).author,
    category: (doc as any).category,
    tags: doc.tags || [],
    readTime,
    coverImage,
    heroImage: (doc as any).image ?? null,
    draft: Boolean(doc.draft),
    published: !doc.draft,
    url: (doc as any).url,

    // Optional fields - only spread if present and non-undefined
    subtitle: (doc as any).subtitle,
    volumeNumber:
      (doc as any).volumeNumber != null
        ? String((doc as any).volumeNumber)
        : undefined,
    downloadUrl: (doc as any).downloadUrl,
    fileSize: (doc as any).fileSize,
    price: (doc as any).price,
    dimensions: (doc as any).dimensions,
    resourceType: (doc as any).resourceType,
    accessLevel: (doc as any).accessLevel,
    lockMessage: (doc as any).lockMessage,
    featured:
      (doc as any).featured !== undefined
        ? Boolean((doc as any).featured)
        : undefined,
  };

  // Strip only undefined; keep nulls (Next likes null, hates undefined)
  return removeUndefined(base) as PostMeta;
}

/**
 * Remove only `undefined` values from an object.
 * `null` is preserved so it can be safely serialized by Next.js.
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.trim().length > 0;
}