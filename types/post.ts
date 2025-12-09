// types/post.ts - Updated Post types with proper inheritance

export interface ImageType {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  published?: boolean;
  featured?: boolean;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
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
}

export interface Post extends PostMeta {
  content: string;
  html?: string;
  compiledSource?: string;
}

export interface PostWithContent extends Post {
  html: string;
  compiledSource: string;
}

export interface PostForClient extends Omit<PostMeta, 'published' | 'featured' | 'category' | 'author' | 'readTime'> {
  published?: boolean;
  featured?: boolean;
  category?: string;
  author?: string;
  readTime?: string;
  id?: string;
  content?: string;
  html?: string;
  coverImage?: string | ImageType | null;
  ogImage?: string | ImageType | null;
  description?: string;
}

export interface PostSummary extends Omit<PostMeta, 'category' | 'readTime' | 'author'> {
  category?: string;
  readTime?: string;
  author?: string;
  id?: string;
}

export interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PostNavigation {
  prev?: PostSummary | null;
  next?: PostSummary | null;
}

export interface FrontmatterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  required?: string[];
  types?: Record<string, string>;
}


