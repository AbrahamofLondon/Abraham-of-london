// lib/posts-utils.ts
// Recreated fresh with proper syntax

export interface ImageType {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  html?: string;
  compiledSource?: string;
  
  published?: boolean;
  featured?: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  subtitle?: string;
  description?: string;

  coverImage?: string | ImageType | null;
  ogImage?: string | ImageType | null;

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

export interface PostForClient extends Post {
  content: string;
  html: string;
  compiledSource: string;
  coverImage?: string;
  ogImage?: string;
}

export function normalizeImageToUndefined(image: string | ImageType | null | undefined): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image;
  if (typeof image === "object" && (image as ImageType).src) return (image as ImageType).src;
  return undefined;
}

export function transformPostForClient(post: Post): PostForClient {
  return {
    ...post,
    coverImage: normalizeImageToUndefined(post.coverImage),
    ogImage: normalizeImageToUndefined(post.ogImage),
    content: post.content || "",
    html: post.html || "",
    compiledSource: post.compiledSource || "",
  };
}


