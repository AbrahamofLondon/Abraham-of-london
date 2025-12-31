// types/post.d.ts
export interface ImageType {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
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

// Post with content
export interface Post extends PostMeta {
  content?: string;
  html?: string;
  compiledSource?: string;
  body?: any;
}

// Post formatted for client-side rendering
export interface PostForClient extends Post {
  content: string;
  html: string;
  compiledSource: string;
  coverImage?: string;
  ogImage?: string;
}

// Post summary (for listings)
export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  coverImage?: string;
}

// Paginated post list
export interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Additional exports that lib/posts.ts needs
export const PostFactory = {
  create: (data: Partial<Post>): Post => ({ 
    slug: '', 
    title: '', 
    date: '', 
    excerpt: '',
    ...data 
  }),
  
  createSummary: (post: Post): PostSummary => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    readTime: post.readTime,
    category: post.category,
    tags: post.tags,
    featured: post.featured,
    coverImage: typeof post.coverImage === 'string' ? post.coverImage : (post.coverImage as any)?.src || undefined,
  }),
  
  createForClient: (post: Post): PostForClient => {
    const normalizeImage = (image: string | ImageType | null | undefined): string | undefined => {
      if (!image) return undefined;
      if (typeof image === 'string') return image;
      if (typeof image === 'object' && (image as ImageType).src) return (image as ImageType).src;
      return undefined;
    };
    
    return {
      ...post,
      coverImage: normalizeImage(post.coverImage),
      ogImage: normalizeImage(post.ogImage),
      content: post.content || "",
      html: post.html || "",
      compiledSource: post.compiledSource || "",
    };
  },
  
  createPost: (data: Partial<Post>): Post => PostFactory.create(data),
};

export const PostMetaUtils = {
  getSlug: (post: PostMeta): string => post.slug,
  getTitle: (post: PostMeta): string => post.title,
  getExcerpt: (post: PostMeta): string => post.excerpt,
  getCategory: (post: PostMeta): string => post.category || "",
  getAuthor: (post: PostMeta): string => post.author || "",
  getTags: (post: PostMeta): string[] => post.tags || [],
  isPublished: (post: PostMeta): boolean => !post.draft && (post.published ?? true),
  hasCoverImage: (post: PostMeta): boolean => !!post.coverImage,
};

export const TypeGuards = {
  isPost: (obj: any): obj is Post => {
    return obj && typeof obj.slug === 'string' && typeof obj.title === 'string';
  },
  isPostMeta: (obj: any): obj is PostMeta => {
    return obj && typeof obj.slug === 'string' && typeof obj.title === 'string';
  },
  isPostForClient: (obj: any): obj is PostForClient => {
    return obj && typeof obj.slug === 'string' && typeof obj.title === 'string' && typeof obj.content === 'string';
  },
};

export const Validation = {
  validatePost: (post: Post): string[] => {
    const errors: string[] = [];
    if (!post.slug) errors.push('Slug is required');
    if (!post.title) errors.push('Title is required');
    if (!post.date) errors.push('Date is required');
    return errors;
  },
  
  validatePostMeta: (post: PostMeta): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!post.slug) errors.push('Slug is required');
    if (!post.title) errors.push('Title is required');
    if (!post.date) errors.push('Date is required');
    return { isValid: errors.length === 0, errors };
  },
};
