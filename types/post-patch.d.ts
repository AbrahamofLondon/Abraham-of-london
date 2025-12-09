// types/post-patch.d.ts
import { Post as OriginalPost } from './post';

declare module '@/types/post' {
  interface Post extends OriginalPost {
    // Add any additional properties that might be missing
    description?: string;
    coverImage?: string | { src?: string } | null;
    ogImage?: string | { src?: string } | null;
    image?: string;
    published?: boolean;
    featured?: boolean;
    category?: string;
    author?: string;
    readTime?: string;
    subtitle?: string;
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
    html?: string;
    compiledSource?: string;
  }
}

// Also patch ContentlayerDocument if needed
declare module 'contentlayer/source-files' {
  interface Document {
    body?: {
      raw?: string;
    };
    content?: string;
    published?: boolean;
    featured?: boolean;
    category?: string;
    author?: string;
    readTime?: string;
    subtitle?: string;
    description?: string;
    coverImage?: string | { src?: string };
    ogImage?: string | { src?: string };
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
}
