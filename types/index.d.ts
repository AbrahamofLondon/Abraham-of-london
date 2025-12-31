// types/index.d.ts - Type declaration file
declare module '@/types/post' {
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
    subtitle?: string;
    lastModified?: string;
    series?: string;
    seriesOrder?: number;
    coverAspect?: string;
    coverFit?: "contain" | "cover";
    coverPosition?: string;
    authors?: string[];
    wordCount?: number;
    canonicalUrl?: string;
    noindex?: boolean;
    html?: string;
    compiledSource?: string;
    [key: string]: unknown;
  }
}
