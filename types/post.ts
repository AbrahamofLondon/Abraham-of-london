// ============================================================================
// types/post.ts
// SINGLE SOURCE OF TRUTH for all Post-related types
// ============================================================================

export interface ImageType {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// CORE METADATA (NO CONTENT FIELDS)
// ---------------------------------------------------------------------------

export interface PostMeta {
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

// ---------------------------------------------------------------------------
// REQUIRED CONTENT FIELDS
// ---------------------------------------------------------------------------

export type PostContentRequired = {
  content: string;
  html: string;
  compiledSource: string;
};

// ---------------------------------------------------------------------------
// CANONICAL POST TYPE (ONLY ONE ALLOWED)
// ---------------------------------------------------------------------------

export type Post = PostMeta & PostContentRequired;

// ---------------------------------------------------------------------------
// CLIENT VARIANTS
// ---------------------------------------------------------------------------

// FIX: Use Omit to cleanly overwrite image types with string versions
export type PostForClient = Omit<Post, 'coverImage' | 'ogImage'> & {
  coverImage?: string | null;
  ogImage?: string | null;
};

// ---------------------------------------------------------------------------
// LISTING TYPES
// ---------------------------------------------------------------------------

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  coverImage: string | null;
  tags: string[];
  author: string;
  featured: boolean;
}

export interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface PostNavigation {
  prev?: PostSummary;
  next?: PostSummary;
}

export interface FrontmatterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const TypeGuards = {
  isPostMeta(o: unknown): o is PostMeta {
    if (!o || typeof o !== "object") return false;
    const obj = o as Record<string, unknown>;

    return (
      typeof obj.slug === "string" &&
      typeof obj.title === "string" &&
      typeof obj.date === "string" &&
      typeof obj.excerpt === "string"
    );
  },

  isPost(o: unknown): o is Post {
    if (!o || typeof o !== "object") return false;
    const obj = o as Record<string, unknown>;

    return (
      TypeGuards.isPostMeta(obj) &&
      typeof obj.content === "string" &&
      typeof obj.html === "string" &&
      typeof obj.compiledSource === "string"
    );
  },
};

// ============================================================================
// UTILITIES (COMPLETE CONTRACT)
// ============================================================================

export const PostMetaUtils = {
  getSlug(post: PostMeta, fallback = ""): string {
    return post.slug?.trim() || fallback;
  },

  getTitle(post: PostMeta, fallback = "Untitled"): string {
    return post.title?.trim() || fallback;
  },

  getExcerpt(post: PostMeta, fallback = ""): string {
    return post.excerpt?.trim() || fallback;
  },

  getAuthor(post: PostMeta, fallback = "Anonymous"): string {
    return post.author?.trim() || fallback;
  },

  getCategory(post: PostMeta, fallback = "General"): string {
    return post.category?.trim() || fallback;
  },

  getReadTime(post: PostMeta, fallback = ""): string {
    return post.readTime?.trim() || fallback;
  },

  getTags(post: PostMeta): string[] {
    return Array.isArray(post.tags) ? post.tags : [];
  },

  getCoverImage(post: PostMeta): string | null {
    if (!post.coverImage) return null;
    if (typeof post.coverImage === "string") return post.coverImage;
    return post.coverImage.src ?? null;
  },

  // FIX: Normalize now correctly returns PostForClient with nullable images
  normalize(post: Post): PostForClient {
    return {
      ...post,
      coverImage: PostMetaUtils.getCoverImage(post),
      ogImage:
        typeof post.ogImage === "string"
          ? post.ogImage
          : post.ogImage?.src ?? null,
      draft: undefined,
      noindex: undefined,
    };
  },
};

// ============================================================================
// FACTORIES
// ============================================================================

export const PostFactory = {
  createMeta(data: Partial<PostMeta>): PostMeta {
    return {
      slug: data.slug?.trim() || "",
      title: data.title?.trim() || "Untitled",
      date: data.date?.trim() || "",
      excerpt: data.excerpt?.trim() || "",
      published: data.published ?? true,
      featured: data.featured ?? false,
      category: data.category?.trim(),
      tags: data.tags,
      author: data.author?.trim(),
      readTime: data.readTime?.trim(),
      subtitle: data.subtitle?.trim(),
      description: data.description?.trim(),
      coverImage: data.coverImage ?? null,
      ogImage: data.ogImage ?? null,
      series: data.series,
      seriesOrder: data.seriesOrder,
      coverAspect: data.coverAspect,
      coverFit: data.coverFit,
      coverPosition: data.coverPosition,
      authors: data.authors,
      wordCount: data.wordCount,
      canonicalUrl: data.canonicalUrl,
      noindex: data.noindex,
      lastModified: data.lastModified,
      id: data.id,
      url: data.url,
      draft: data.draft,
    };
  },

  createPost(data: Partial<Post>): Post {
    if (
      typeof data.content !== "string" ||
      typeof data.html !== "string" ||
      typeof data.compiledSource !== "string"
    ) {
      throw new Error("PostFactory.createPost: missing content fields");
    }

    return {
      ...PostFactory.createMeta(data),
      content: data.content,
      html: data.html,
      compiledSource: data.compiledSource,
    };
  },

  createSummary(post: PostMeta): PostSummary {
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      category: PostMetaUtils.getCategory(post),
      readTime: PostMetaUtils.getReadTime(post),
      coverImage: PostMetaUtils.getCoverImage(post),
      tags: PostMetaUtils.getTags(post),
      author: PostMetaUtils.getAuthor(post),
      featured: post.featured ?? false,
    };
  },

  createForClient(post: Post): PostForClient {
    return PostMetaUtils.normalize(post);
  },
};

// ============================================================================
// VALIDATION
// ============================================================================

export const Validation = {
  validatePostMeta(post: PostMeta): FrontmatterValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!post.slug) errors.push("Missing slug");
    if (!post.title) errors.push("Missing title");
    if (!post.date) errors.push("Missing date");
    if (!post.excerpt) errors.push("Missing excerpt");

    if (post.slug && !/^[a-z0-9-]+$/.test(post.slug)) {
      warnings.push("Slug should be lowercase and hyphenated");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
};