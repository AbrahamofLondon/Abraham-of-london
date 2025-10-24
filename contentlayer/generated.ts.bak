// contentlayer/generated.ts
// Temporary compatibility shim to unblock pages that still import Contentlayer.
// We export empty (but typed) collections so pages render gracefully (0 items)
// instead of failing at build time. We can replace usage page-by-page later.

export type GenericDoc = {
  slug: string;
  title?: string;
  date?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
};

export type Event = GenericDoc & { location?: string; resources?: any };
export type Book = GenericDoc & { author: string };
export type Post = GenericDoc;
export type Download = GenericDoc;
export type Resource = GenericDoc;

export const allEvents: Event[] = [];
export const allBooks: Book[] = [];
export const allPosts: Post[] = [];
export const allDownloads: Download[] = [];
export const allResources: Resource[] = [];

// Optional helpers some pages used to receive from Contentlayer
export const allDocuments: GenericDoc[] = [];
