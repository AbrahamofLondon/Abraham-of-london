// types/post.d.ts

declare interface PostMeta {
  // Required fields
  slug: string;
  title: string;

  // Content information
  subtitle?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  body?: string;

  // Dates
  date: string;
  lastModified?: string;
  published?: boolean;

  // Categorization
  category?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;

  // Media
  coverImage?: string;
  ogImage?: string;
  coverAspect?: string;
  coverFit?: "contain" | "cover";
  coverPosition?: string;

  // Authorship
  author?: string;
  authors?: string[];

  // Reading
  readTime?: string;
  wordCount?: number;

  // SEO
  canonicalUrl?: string;
  noindex?: boolean;

  // Legacy/compatibility
  [key: string]: unknown;
}

declare interface Post extends PostMeta {
  // Extended post with full content
  content: string;
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
  coverImage?: string;
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

// Content layer types (if using contentlayer)
declare module "contentlayer" {
  export interface Document {
    _id: string;
    _raw: Record<string, unknown>;
    type: string;
  }
}

// MDX related types
declare module "*.mdx" {
  import { ComponentType } from "...";

  interface MDXProps {
    components?: Record<string, ComponentType>;
  }

  const MDXContent: ComponentType<MDXProps>;
  export default MDXContent;
}

// Frontmatter validation
declare interface FrontmatterValidation {
  required: string[];
  optional: string[];
  types: Record<string, string>;
}
