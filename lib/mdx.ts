// lib/mdx.ts - Fixed version without next-contentlayer/hooks
/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ✅ Direct import from local generated contentlayer output
import {
  allPosts,
  allCanons,
  allDownloads,
  allBooks,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  type DocumentTypes,
} from "../.contentlayer/generated";

// ---------------------------------------------------------------------------
// Legacy-compatible PostDocument type
// ---------------------------------------------------------------------------

export type PostDocument = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  updated?: string;
  tags?: string[];
  author?: string;
  category?: string;
  readTime?: number;
  image?: string;
  content?: string;
  excerpt?: string;
  draft?: boolean;
  url?: string;
  body?: {
    code: string;
    raw: string;
  };
  _raw?: any;
  subtitle?: string;
  coverImage?: string;
  coverAspect?: string;
  coverFit?: string;
  accessLevel?: string;
  lockMessage?: string;
  volumeNumber?: string;
  order?: number;
};

// Add RawContentEntry type for backward compatibility
export type RawContentEntry = {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: {
    flattenedPath?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

// ---------------------------------------------------------------------------
// Helpers with safe property access
// ---------------------------------------------------------------------------

function safeGetTags(doc: any): string[] {
  if (doc.tags && Array.isArray(doc.tags)) {
    const tags = doc.tags as any[];
    return tags.filter((tag: any): tag is string => typeof tag === 'string');
  }
  return [];
}

function safeGetAuthor(doc: any): string | undefined {
  return doc.author || doc._raw?.flatData?.author || undefined;
}

function safeGetCategory(doc: any): string | undefined {
  return doc.category || doc._raw?.flatData?.category || undefined;
}

function safeGetDescription(doc: any): string | undefined {
  return doc.description || doc._raw?.flatData?.description || undefined;
}

function safeGetReadTime(doc: any): number | undefined {
  return doc.readTime || doc.readingTime || undefined;
}

function safeGetCoverImage(doc: any): string | undefined {
  return doc.coverImage || doc.image || undefined;
}

function safeGetSubtitle(doc: any): string | undefined {
  return doc.subtitle || doc._raw?.flatData?.subtitle || undefined;
}

function safeHasDraft(doc: any): boolean {
  return doc.draft === true;
}

function convertToPostDocument(doc: any): PostDocument {
  const rawData = doc._raw?.flatData || {};

  return {
    slug: doc.slug || "",
    title: doc.title || "",
    description: safeGetDescription(doc),
    date: doc.date ? new Date(doc.date).toISOString() : undefined,
    updated: doc.updated || undefined,
    tags: safeGetTags(doc),
    author: safeGetAuthor(doc),
    category: safeGetCategory(doc),
    readTime: safeGetReadTime(doc),
    image: safeGetCoverImage(doc),
    content: doc.body?.raw || "",
    excerpt:
      doc.excerpt ||
      (doc.body?.raw ? String(doc.body.raw).slice(0, 200) + "..." : "") ||
      "",
    draft: safeHasDraft(doc),
    url: doc.url || undefined,
    body: doc.body || undefined,
    _raw: doc._raw || undefined,
    subtitle: safeGetSubtitle(doc),
    coverImage: safeGetCoverImage(doc),
    coverAspect: rawData.coverAspect || undefined,
    coverFit: rawData.coverFit || undefined,
    accessLevel: doc.accessLevel || rawData.accessLevel || "public",
    lockMessage: doc.lockMessage || rawData.lockMessage || undefined,
    volumeNumber: rawData.volumeNumber || undefined,
    order: rawData.order || undefined,
  };
}

function getAllDocuments(): DocumentTypes[] {
  return [
    ...(allPosts as DocumentTypes[]),
    ...(allCanons as DocumentTypes[]),
    ...(allDownloads as DocumentTypes[]),
    ...(allBooks as DocumentTypes[]),
    ...(allEvents as DocumentTypes[]),
    ...(allPrints as DocumentTypes[]),
    ...(allStrategies as DocumentTypes[]),
    ...(allResources as DocumentTypes[]),
  ];
}

// ---------------------------------------------------------------------------
// Primary API
// ---------------------------------------------------------------------------

export function getSortedPostsData(): PostDocument[] {
  const allDocs = getAllDocuments();

  return allDocs
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export async function getPostData(slug: string): Promise<PostDocument> {
  const allDocs = getAllDocuments();
  const doc = allDocs.find((d: any) => d.slug === slug);

  if (!doc) {
    throw new Error(`Document not found: ${slug}`);
  }

  return convertToPostDocument(doc);
}

// ---------------------------------------------------------------------------
// Static pages (non-contentlayer MDX in /content/pages)
// ---------------------------------------------------------------------------

export function getPageData(slug: string): PostDocument | null {
  try {
    const pagesDirectory = path.join(process.cwd(), "content/pages");
    const fullPath = path.join(pagesDirectory, `${slug}.mdx`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);
    const { data, content } = matterResult;

    return {
      slug,
      title: data.title || "",
      description: data.description || undefined,
      content,
      excerpt: content.slice(0, 200) + "...",
    };
  } catch (error) {
    console.error(`Error reading page ${slug}:`, error);
    return null;
  }
}

export function getAllPages(): PostDocument[] {
  try {
    const pagesDirectory = path.join(process.cwd(), "content/pages");

    if (!fs.existsSync(pagesDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(pagesDirectory);

    return fileNames
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "");
        const fullPath = path.join(pagesDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const matterResult = matter(fileContents);
        const { data, content } = matterResult;

        return {
          slug,
          title: data.title || "",
          description: data.description || undefined,
          excerpt: content.slice(0, 200) + "...",
        };
      });
  } catch (error) {
    console.error("Error reading pages:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Backward-compat helpers used elsewhere (pages/[slug].tsx, etc.)
// ---------------------------------------------------------------------------

export function getAllContent(collection?: string): PostDocument[] {
  if (!collection) {
    return getSortedPostsData();
  }

  switch (collection.toLowerCase()) {
    case "post":
    case "posts":
    case "blog":
    case "essay":
      return (allPosts || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "canon":
    case "canons":
      return (allCanons || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "download":
    case "downloads":
    case "tool":
    case "tools":
      return (allDownloads || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "book":
    case "books":
    case "volume":
    case "volumes":
      return (allBooks || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "event":
    case "events":
    case "session":
    case "sessions":
      return (allEvents || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "print":
    case "prints":
    case "edition":
    case "editions":
      return (allPrints || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "resource":
    case "resources":
    case "framework":
    case "frameworks":
      return (allResources || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    case "strategy":
    case "strategies":
      return (allStrategies || [])
        .filter((doc: any) => !safeHasDraft(doc))
        .map(convertToPostDocument);
    
    default:
      console.warn(`Unknown collection: ${collection}`);
      return [];
  }
}

export function getContentBySlug(
  collection: string,
  slug: string,
  options?: { withContent?: boolean }
): PostDocument | null {
  const sourceArray = (() => {
    switch (collection.toLowerCase()) {
      case "post":
      case "posts":
      case "blog":
      case "essay":
        return allPosts;
      case "canon":
      case "canons":
        return allCanons;
      case "download":
      case "downloads":
      case "tool":
      case "tools":
        return allDownloads;
      case "book":
      case "books":
      case "volume":
      case "volumes":
        return allBooks;
      case "event":
      case "events":
      case "session":
      case "sessions":
        return allEvents;
      case "print":
      case "prints":
      case "edition":
      case "editions":
        return allPrints;
      case "resource":
      case "resources":
      case "framework":
      case "frameworks":
        return allResources;
      case "strategy":
      case "strategies":
        return allStrategies;
      default:
        return getAllDocuments();
    }
  })() as any[];

  const doc = sourceArray.find((d) => d.slug === slug);
  if (!doc) return null;

  const converted = convertToPostDocument(doc);

  if (options?.withContent === false) {
    const { content, ...rest } = converted;
    return rest as PostDocument;
  }

  return converted;
}

// Collection-specific functions
export function getAllCanons(): PostDocument[] {
  return (allCanons || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const volA = a.volumeNumber || "0";
      const volB = b.volumeNumber || "0";
      return parseInt(volA, 10) - parseInt(volB, 10);
    });
}

export function getAllPosts(): PostDocument[] {
  return (allPosts || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllDownloads(): PostDocument[] {
  return (allDownloads || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllBooks(): PostDocument[] {
  return (allBooks || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllEvents(): PostDocument[] {
  return (allEvents || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllPrints(): PostDocument[] {
  return (allPrints || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllResources(): PostDocument[] {
  return (allResources || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getAllStrategies(): PostDocument[] {
  return (allStrategies || [])
    .filter((doc: any) => !safeHasDraft(doc))
    .map(convertToPostDocument)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

// Type-safe finders
export function findDocumentBySlug(slug: string): PostDocument | null {
  const allDocs = getAllDocuments();
  const doc = (allDocs as any[]).find((d) => d.slug === slug);
  return doc ? convertToPostDocument(doc) : null;
}

export function findDocumentsByTag(tag: string): PostDocument[] {
  const allDocs = getAllDocuments();
  return (allDocs as any[])
    .filter((doc) => {
      const tags = safeGetTags(doc);
      return tags.includes(tag);
    })
    .map(convertToPostDocument);
}

export function findDocumentsByAuthor(author: string): PostDocument[] {
  const allDocs = getAllDocuments();
  return (allDocs as any[])
    .filter((doc) => {
      const docAuthor = safeGetAuthor(doc);
      return docAuthor === author;
    })
    .map(convertToPostDocument);
}

// Utility function for RawContentEntry conversion
export function convertToRawContentEntry(doc: PostDocument): RawContentEntry {
  return {
    slug: doc.slug,
    title: doc.title,
    date: doc.date,
    excerpt: doc.excerpt,
    description: doc.description,
    category: doc.category,
    tags: doc.tags || [],
    featured: false,
    readTime: doc.readTime,
    _raw: doc._raw,
    subtitle: doc.subtitle,
    author: doc.author,
    coverImage: doc.coverImage,
    accessLevel: doc.accessLevel,
    lockMessage: doc.lockMessage,
    volumeNumber: doc.volumeNumber,
  };
}