// types/post.d.ts - DECLARATION FILE
declare type ImageType = string | { src?: string } | null;

declare interface PostMeta {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  description?: string;
  date: string;
  lastModified?: string;
  published?: boolean;
  category?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  coverImage?: ImageType;
  ogImage?: ImageType;
  coverAspect?: string;
  coverFit?: "contain" | "cover";
  coverPosition?: string;
  author?: string;
  authors?: string[];
  readTime?: string;
  wordCount?: number;
  canonicalUrl?: string;
  noindex?: boolean;
  [key: string]: unknown;
}

declare interface Post extends PostMeta {
  content: string;
  html?: string;
  compiledSource?: string;
}

declare interface PostWithContent extends Omit<PostMeta, 'coverImage' | 'ogImage'> {
  content: string;
  coverImage?: string | null;
  ogImage?: string | null;
  html?: string;
  compiledSource?: string;
}

declare interface PostSummary {
  slug: string;
  title: string;
  excerpt?: string;
  date: string;
  category?: string;
  readTime?: string;
  coverImage?: string | null;
  tags?: string[];
  author?: string;
}

declare interface PostNavigation {
  previous?: PostSummary;
  next?: PostSummary;
}

declare interface PostList {
  posts: PostSummary[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

declare module "contentlayer" {
  export interface Document {
    _id: string;
    _raw: Record<string, unknown>;
    type: string;
  }
}

declare module "*.mdx" {
  import { ComponentType } from "react";
  
  interface MDXProps {
    components?: Record<string, ComponentType>;
  }
  
  const MDXContent: ComponentType<MDXProps>;
  export default MDXContent;
}

declare interface FrontmatterValidation {
  required: string[];
  optional: string[];
  types: Record<string, string>;
}