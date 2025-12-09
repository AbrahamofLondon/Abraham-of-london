// types/post-new.ts
export type ImageType = string | { src?: string } | null;

export interface PostBase {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  description?: string;
  coverImage?: ImageType;
  ogImage?: ImageType;
  published?: boolean;
  featured?: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
}

export interface Post extends PostBase {
  content: string;
  [key: string]: unknown;
}