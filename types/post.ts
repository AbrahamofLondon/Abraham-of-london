// types/post.ts - FIXED VERSION
export interface ImageType {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

// Core post metadata with optional fields for real-world resilience
export interface PostMeta {
  // Required core fields (with validation)
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  
  // Optional metadata with safe defaults
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
  
  // Extended metadata (optional)
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
  
  // Internal/derived fields (always optional)
  id?: string;
  url?: string;
  draft?: boolean;
  content?: string;
  html?: string;
  compiledSource?: string;
}

// Post with guaranteed content
export interface Post extends PostMeta {
  content: string;
}

// Validated post with all derived fields
export interface PostWithContent extends Post {
  html: string;
  compiledSource: string;
}

// Client-safe post (no sensitive/optional fields guaranteed)
export interface PostForClient extends PostMeta {
  // All fields optional for client safety
  [key: string]: any;
}

// Lightweight post for listings
export interface PostSummary extends Pick<PostMeta, 
  'slug' | 'title' | 'date' | 'excerpt' | 'published' | 'featured' | 
  'category' | 'tags' | 'author' | 'readTime' | 'subtitle' |
  'coverImage' | 'series' | 'wordCount'> {
  id?: string;
}

// Collection response
export interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Navigation context
export interface PostNavigation {
  prev?: PostSummary | null;
  next?: PostSummary | null;
}

// Validation results
export interface FrontmatterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  required?: string[];
  types?: Record<string, string>;
}

// ============================================================================
// SAFETY UTILITIES (RENAMED FROM 'PostMeta' to 'PostMetaUtils')
// ============================================================================

// Type-safe field accessors with defaults
export const PostMetaUtils = {
  // Get fields with guaranteed defaults
  getSlug: (post: PostMeta, fallback: string = ''): string => 
    post.slug?.trim() || fallback,
  
  getTitle: (post: PostMeta, fallback: string = 'Untitled'): string => 
    post.title?.trim() || fallback,
  
  getDate: (post: PostMeta, fallback: string = ''): string => 
    post.date?.trim() || fallback,
  
  getExcerpt: (post: PostMeta, fallback: string = ''): string => 
    post.excerpt?.trim() || fallback,
  
  getCategory: (post: PostMeta, fallback: string = 'General'): string => 
    post.category?.trim() || fallback,
  
  getAuthor: (post: PostMeta, fallback: string = 'Anonymous'): string => 
    post.author?.trim() || fallback,
  
  getReadTime: (post: PostMeta, fallback: string = '0 min'): string => 
    post.readTime?.trim() || fallback,
  
  getTags: (post: PostMeta): string[] => 
    Array.isArray(post.tags) ? post.tags.filter(tag => typeof tag === 'string') : [],
  
  getCoverImage: (post: PostMeta): string | null => {
    if (!post.coverImage) return null;
    if (typeof post.coverImage === 'string') return post.coverImage;
    return post.coverImage.src || null;
  },
  
  // Validation
  isValid: (post: PostMeta): boolean => {
    return !!(post.slug && post.title && post.date && post.excerpt);
  },
  
  getMissingFields: (post: PostMeta): string[] => {
    const missing: string[] = [];
    if (!post.slug) missing.push('slug');
    if (!post.title) missing.push('title');
    if (!post.date) missing.push('date');
    if (!post.excerpt) missing.push('excerpt');
    return missing;
  },
  
  // Transformations
  toSafeObject: (post: PostMeta): Record<string, any> => {
    return {
      slug: PostMetaUtils.getSlug(post),
      title: PostMetaUtils.getTitle(post),
      date: PostMetaUtils.getDate(post),
      excerpt: PostMetaUtils.getExcerpt(post),
      published: post.published ?? true,
      featured: post.featured ?? false,
      category: PostMetaUtils.getCategory(post),
      author: PostMetaUtils.getAuthor(post),
      readTime: PostMetaUtils.getReadTime(post),
      tags: PostMetaUtils.getTags(post),
      subtitle: post.subtitle?.trim() || undefined,
      description: post.description?.trim() || undefined,
      coverImage: PostMetaUtils.getCoverImage(post),
      ogImage: typeof post.ogImage === 'string' ? post.ogImage : post.ogImage?.src,
      series: post.series?.trim() || undefined,
      seriesOrder: post.seriesOrder,
      wordCount: post.wordCount,
      canonicalUrl: post.canonicalUrl?.trim() || undefined,
      lastModified: post.lastModified?.trim() || undefined,
    };
  },
  
  // Comparison
  areEqual: (a: PostMeta, b: PostMeta): boolean => {
    return PostMetaUtils.getSlug(a) === PostMetaUtils.getSlug(b);
  },
  
  // Sorting
  sortByDate: (posts: PostMeta[], order: 'asc' | 'desc' = 'desc'): PostMeta[] => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(PostMetaUtils.getDate(a)).getTime();
      const dateB = new Date(PostMetaUtils.getDate(b)).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },
  
  // Filtering
  filterPublished: (posts: PostMeta[]): PostMeta[] => {
    return posts.filter(post => post.published !== false);
  },
  
  filterFeatured: (posts: PostMeta[]): PostMeta[] => {
    return posts.filter(post => post.featured === true);
  },
  
  // Grouping
  groupByCategory: (posts: PostMeta[]): Record<string, PostMeta[]> => {
    const groups: Record<string, PostMeta[]> = {};
    posts.forEach(post => {
      const category = PostMetaUtils.getCategory(post);
      if (!groups[category]) groups[category] = [];
      groups[category].push(post);
    });
    return groups;
  },
  
  groupByYear: (posts: PostMeta[]): Record<string, PostMeta[]> => {
    const groups: Record<string, PostMeta[]> = {};
    posts.forEach(post => {
      const year = new Date(PostMetaUtils.getDate(post)).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });
    return groups;
  },
};

// Type guard utilities
export const TypeGuards = {
  isPostMeta: (obj: any): obj is PostMeta => {
    return obj && 
      typeof obj === 'object' &&
      typeof obj.slug === 'string' &&
      typeof obj.title === 'string' &&
      typeof obj.date === 'string' &&
      typeof obj.excerpt === 'string';
  },
  
  isPost: (obj: any): obj is Post => {
    return TypeGuards.isPostMeta(obj) && typeof obj.content === 'string';
  },
  
  isPostWithContent: (obj: any): obj is PostWithContent => {
    return TypeGuards.isPost(obj) && 
      typeof obj.html === 'string' &&
      typeof obj.compiledSource === 'string';
  },
  
  isPostForClient: (obj: any): obj is PostForClient => {
    return TypeGuards.isPostMeta(obj);
  },
  
  isPostSummary: (obj: any): obj is PostSummary => {
    return TypeGuards.isPostMeta(obj);
  },
};

// Factory functions for creating post objects safely
export const PostFactory = {
  createMeta: (data: Partial<PostMeta>): PostMeta => {
    return {
      slug: data.slug?.trim() || '',
      title: data.title?.trim() || 'Untitled',
      date: data.date?.trim() || new Date().toISOString().split('T')[0],
      excerpt: data.excerpt?.trim() || '',
      published: data.published ?? true,
      featured: data.featured ?? false,
      category: data.category?.trim() || 'General',
      tags: Array.isArray(data.tags) ? data.tags.filter(tag => typeof tag === 'string') : [],
      author: data.author?.trim() || 'Anonymous',
      readTime: data.readTime?.trim() || '0 min',
      subtitle: data.subtitle?.trim() || undefined,
      description: data.description?.trim() || undefined,
      coverImage: data.coverImage || undefined,
      ogImage: data.ogImage || undefined,
      series: data.series?.trim() || undefined,
      seriesOrder: data.seriesOrder,
      coverAspect: data.coverAspect?.trim() || undefined,
      coverFit: data.coverFit?.trim() || undefined,
      coverPosition: data.coverPosition?.trim() || undefined,
      authors: Array.isArray(data.authors) ? data.authors.filter(author => typeof author === 'string') : undefined,
      wordCount: typeof data.wordCount === 'number' ? data.wordCount : undefined,
      canonicalUrl: data.canonicalUrl?.trim() || undefined,
      noindex: data.noindex ?? undefined,
      lastModified: data.lastModified?.trim() || undefined,
      id: data.id?.trim() || undefined,
      url: data.url?.trim() || undefined,
      draft: data.draft ?? undefined,
      content: data.content?.trim() || undefined,
      html: data.html?.trim() || undefined,
      compiledSource: data.compiledSource?.trim() || undefined,
    };
  },
  
  createPost: (data: Partial<Post>): Post => {
    const meta = PostFactory.createMeta(data);
    return {
      ...meta,
      content: data.content?.trim() || '',
    };
  },
  
  createForClient: (post: PostMeta): PostForClient => {
    const safe = PostMetaUtils.toSafeObject(post);
    return {
      ...safe,
      // Remove any sensitive fields
      draft: undefined,
      noindex: undefined,
      // Add client-safe fields
      id: post.id || post.slug,
      url: post.url || `/blog/${post.slug}`,
    };
  },
  
  createSummary: (post: PostMeta): PostSummary => {
    return {
      slug: PostMetaUtils.getSlug(post),
      title: PostMetaUtils.getTitle(post),
      date: PostMetaUtils.getDate(post),
      excerpt: PostMetaUtils.getExcerpt(post),
      published: post.published ?? true,
      featured: post.featured ?? false,
      category: PostMetaUtils.getCategory(post),
      tags: PostMetaUtils.getTags(post),
      author: PostMetaUtils.getAuthor(post),
      readTime: PostMetaUtils.getReadTime(post),
      subtitle: post.subtitle?.trim() || undefined,
      coverImage: PostMetaUtils.getCoverImage(post),
      series: post.series?.trim() || undefined,
      wordCount: post.wordCount,
      id: post.id || post.slug,
    };
  },
};

// Validation utilities
export const Validation = {
  validatePostMeta: (post: PostMeta): FrontmatterValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required field validation
    if (!post.slug?.trim()) errors.push('Slug is required');
    if (!post.title?.trim()) errors.push('Title is required');
    if (!post.date?.trim()) errors.push('Date is required');
    if (!post.excerpt?.trim()) errors.push('Excerpt is required');
    
    // Field format validation
    if (post.slug && !/^[a-z0-9-]+$/.test(post.slug)) {
      warnings.push('Slug should contain only lowercase letters, numbers, and hyphens');
    }
    
    if (post.date && isNaN(new Date(post.date).getTime())) {
      warnings.push('Date format is invalid');
    }
    
    // Category validation
    if (post.category && post.category.length > 50) {
      warnings.push('Category is too long (max 50 characters)');
    }
    
    // Tags validation
    if (post.tags) {
      if (!Array.isArray(post.tags)) {
        warnings.push('Tags should be an array');
      } else {
        const invalidTags = post.tags.filter(tag => typeof tag !== 'string');
        if (invalidTags.length > 0) {
          warnings.push(`Found ${invalidTags.length} non-string tags`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      required: ['slug', 'title', 'date', 'excerpt'],
      types: {
        slug: 'string',
        title: 'string',
        date: 'string (ISO format)',
        excerpt: 'string',
        published: 'boolean',
        featured: 'boolean',
        category: 'string',
        tags: 'string[]',
        author: 'string',
        readTime: 'string',
      },
    };
  },
};

// Export everything
export type {
  ImageType,
  PostMeta,
  Post,
  PostWithContent,
  PostForClient,
  PostSummary,
  PostList,
  PostNavigation,
  FrontmatterValidation,
};

export {
  PostMetaUtils,
  TypeGuards,
  PostFactory,
  Validation,
};