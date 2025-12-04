// lib/mdx.ts
// Centralised MD/MDX utilities using the filesystem + gray-matter.
// NOTE: Primary content (blog, downloads, prints, etc.) is now handled by
// Contentlayer. This helper remains for any legacy or ad-hoc collections.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Import Contentlayer helper
import {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
  type PostDocument,
  type BookDocument,
  type DownloadDocument,
  type EventDocument,
  type PrintDocument,
  type StrategyDocument,
  type ResourceDocument,
  type CanonDocument,
} from "./contentlayer-helper";

export interface RawContentEntry {
  slug: string;
  content: string;
  title: string;
  description?: string;
  subtitle?: string;
  date?: string;
  author?: string;
  readtime?: string;
  readTime?: string;
  coverImage?: string;
  tags?: string[];
  downloadUrl?: string;
  fileUrl?: string;
  excerpt?: string;
  resourceType?: string;
  featured?: boolean;
  [key: string]: unknown;
}

interface GetContentOptions {
  /** If false, content will be omitted from the returned object. */
  withContent?: boolean;
}

// Root folder where your MD/MDX content lives.
const CONTENT_ROOT = path.join(process.cwd(), "content");

function resolveCollectionDir(collection: string): string {
  return path.join(CONTENT_ROOT, collection);
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Return all MD/MDX entries within a collection folder.
 * Now uses Contentlayer for supported collections, falls back to filesystem for others.
 */
export function getAllContent(collection: string): RawContentEntry[] {
  // Try Contentlayer first for supported collections
  switch (collection.toLowerCase()) {
    case "blog":
    case "post":
    case "posts":
      return allPosts
        .filter((p: PostDocument) => !p.draft)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: PostDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          readtime: doc.readTime || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "book":
    case "books":
      return allBooks
        .filter((b: BookDocument) => !b.draft)
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        .map((doc: BookDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "download":
    case "downloads":
      return allDownloads
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: DownloadDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          downloadUrl: doc.downloadUrl || doc.fileUrl || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "event":
    case "events":
      return allEvents
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: EventDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "print":
    case "prints":
      return allPrints
        .filter((p: PrintDocument) => p.available !== false)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: PrintDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "strategy":
    case "strategies":
      return allStrategies
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: StrategyDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "resource":
    case "resources":
      return allResources
        .filter((r: ResourceDocument) => !r.draft)
        .map((doc: ResourceDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          subtitle: doc.subtitle || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          readtime: doc.readtime || doc.readTime || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          downloadUrl: doc.downloadUrl || doc.fileUrl || undefined,
          excerpt: doc.excerpt || undefined,
          resourceType: doc.resourceType || undefined,
          featured: doc.featured || undefined,
          content: doc.body.raw,
          ...doc,
        }));

    case "canon":
      return allCanons
        .filter((c: CanonDocument) => !c.draft)
        .sort((a, b) => {
          // Sort by order field if present, otherwise by title
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (a.title || "").localeCompare(b.title || "");
        })
        .map((doc: CanonDocument) => ({
          slug: doc.slug || "",
          title: doc.title || "",
          description: doc.description || undefined,
          subtitle: doc.subtitle || undefined,
          date: doc.date || undefined,
          author: doc.author || undefined,
          coverImage: doc.coverImage || undefined,
          tags: doc.tags || undefined,
          content: doc.body.raw,
          ...doc,
        }));
  }

  // Fallback to filesystem for unknown collections
  const dir = resolveCollectionDir(collection);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);
  const entries: RawContentEntry[] = [];

  for (const file of files) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;

    const filePath = path.join(dir, file);
    const raw = readFileSafe(filePath);
    if (!raw) continue;

    const { data, content } = matter(raw);
    const slug = (data.slug as string) ?? file.replace(/\.mdx?$/iu, "");

    entries.push({
      slug,
      content,
      title: (data.title as string) || slug || "Untitled",
      description: (data.description as string) || undefined,
      subtitle: (data.subtitle as string) || undefined,
      date: (data.date as string) || undefined,
      author: (data.author as string) || undefined,
      readtime: (data.readtime as string) || undefined,
      coverImage: (data.coverImage as string) || undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
      downloadUrl: (data.downloadUrl as string) || undefined,
      excerpt: (data.excerpt as string) || undefined,
      ...data,
    });
  }

  return entries;
}

/**
 * Get a single MD/MDX entry by slug from a collection.
 * Uses Contentlayer for supported collections, falls back to filesystem.
 */
export function getContentBySlug(
  collection: string,
  slug: string,
  options: GetContentOptions = { withContent: true }
): RawContentEntry | null {
  const targetSlug = String(slug).trim();

  // Try Contentlayer first
  let doc: ResourceDocument | null = null;

  switch (collection.toLowerCase()) {
    case "resource":
    case "resources":
      doc = allResources.find((r: ResourceDocument) => r.slug === targetSlug) || null;
      break;
  }

  if (doc) {
    const entry: RawContentEntry = {
      slug: doc.slug || "",
      title: doc.title || "",
      description: doc.description || undefined,
      subtitle: doc.subtitle || undefined,
      date: doc.date || undefined,
      author: doc.author || undefined,
      readtime: doc.readtime || doc.readTime || undefined,
      coverImage: doc.coverImage || undefined,
      tags: doc.tags || undefined,
      downloadUrl: doc.downloadUrl || doc.fileUrl || undefined,
      excerpt: doc.excerpt || undefined,
      resourceType: doc.resourceType || undefined,
      featured: doc.featured || undefined,
      content: doc.body.raw,
      ...doc,
    };

    if (options?.withContent === false) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _omit, ...meta } = entry;
      return meta as RawContentEntry;
    }

    return entry;
  }

  // Fallback to filesystem for unknown collections or if not found in Contentlayer
  const dir = resolveCollectionDir(collection);
  const candidates = [
    path.join(dir, `${targetSlug}.mdx`),
    path.join(dir, `${targetSlug}.md`),
    path.join(dir, `${targetSlug.toLowerCase()}.mdx`),
    path.join(dir, `${targetSlug.toLowerCase()}.md`),
  ];

  let filePath: string | null = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      filePath = candidate;
      break;
    }
  }

  // If no exact file match, search all entries in the collection
  if (!filePath) {
    const all = getAllContent(collection);
    const found =
      all.find(
        (entry) =>
          entry.slug === targetSlug || entry.slug === targetSlug.toLowerCase()
      ) || null;
    if (!found) return null;

    if (options?.withContent === false) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _omit, ...meta } = found;
      return meta as RawContentEntry;
    }
    return found;
  }

  const raw = readFileSafe(filePath);
  if (!raw) return null;

  const { data, content } = matter(raw);
  const resolvedSlug = (data.slug as string) || targetSlug;

  const entry: RawContentEntry = {
    slug: resolvedSlug,
    content,
    title: (data.title as string) || resolvedSlug || "Untitled",
    description: (data.description as string) || undefined,
    subtitle: (data.subtitle as string) || undefined,
    date: (data.date as string) || undefined,
    author: (data.author as string) || undefined,
    readtime: (data.readtime as string) || undefined,
    coverImage: (data.coverImage as string) || undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    downloadUrl: (data.downloadUrl as string) || undefined,
    excerpt: (data.excerpt as string) || undefined,
    ...data,
  };

  if (options?.withContent === false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content: _omit, ...meta } = entry;
    return meta as RawContentEntry;
  }

  return entry;
}

/**
 * Check if a collection is managed by Contentlayer
 */
export function isContentlayerCollection(collection: string): boolean {
  const knownCollections = [
    "blog",
    "post",
    "posts",
    "book",
    "books",
    "download",
    "downloads",
    "event",
    "events",
    "print",
    "prints",
    "strategy",
    "strategies",
    "resource",
    "resources",
    "canon",
  ];
  return knownCollections.includes(collection.toLowerCase());
}