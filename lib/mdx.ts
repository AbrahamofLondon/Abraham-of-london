// lib/mdx.ts
// Centralised MD/MDX utilities using the filesystem + gray-matter.
// NOTE: Primary content (blog, downloads, prints, etc.) is now handled by
// Contentlayer. This helper remains for any legacy or ad-hoc collections.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Import Contentlayer generated types and use them directly
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
          ...doc,
          content: doc.body.raw,
        }));

    case "book":
    case "books":
      return allBooks
        .filter((b: BookDocument) => !b.draft)
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        .map((doc: BookDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "download":
    case "downloads":
      return allDownloads
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: DownloadDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "event":
    case "events":
      return allEvents
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: EventDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "print":
    case "prints":
      return allPrints
        .filter((p: PrintDocument) => p.available !== false)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: PrintDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "strategy":
    case "strategies":
      return allStrategies
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .map((doc: StrategyDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "resource":
    case "resources":
      return allResources
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        .map((doc: ResourceDocument) => ({
          ...doc,
          content: doc.body.raw,
        }));

    case "canon":
      return allCanons
        .filter((c: CanonDocument) => !c.draft)
        .sort((a, b) => {
          // Sort by order field if present, otherwise by title
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (a.title || '').localeCompare(b.title || '');
        })
        .map((doc: CanonDocument) => ({
          ...doc,
          content: doc.body.raw,
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
  let doc: RawContentEntry | null = null;

  switch (collection.toLowerCase()) {
    case "blog":
    case "post":
    case "posts":
      doc = allPosts.find((p: PostDocument) => p.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "book":
    case "books":
      doc = allBooks.find((b: BookDocument) => b.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "download":
    case "downloads":
      doc = allDownloads.find((d: DownloadDocument) => d.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "event":
    case "events":
      doc = allEvents.find((e: EventDocument) => e.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "print":
    case "prints":
      doc = allPrints.find((p: PrintDocument) => p.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "strategy":
    case "strategies":
      doc = allStrategies.find((s: StrategyDocument) => s.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "resource":
    case "resources":
      doc = allResources.find((r: ResourceDocument) => r.slug === targetSlug) as unknown as RawContentEntry || null;
      break;

    case "canon":
      doc = allCanons.find((c: CanonDocument) => c.slug === targetSlug) as unknown as RawContentEntry || null;
      break;
  }

  if (doc) {
    // Add content from body.raw
    const entry: RawContentEntry = {
      ...doc,
      content: (doc as any).body.raw,
    };

    if (options?.withContent === false) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _omit, ...meta } = entry;
      return meta as RawContentEntry;
    }

    return entry;
  }

  // Fallback to filesystem for unknown collections
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
    ...data,
  };

  if (options?.withContent === false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content: _omit, ...meta } = entry;
    return meta as RawContentEntry;
  }

  return entry;
}

interface FeaturedCanonItem {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Get featured canon documents
 */
export function getFeaturedCanon(): FeaturedCanonItem[] {
  return allCanons
    .filter((c: CanonDocument) => !c.draft && c.featured)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (a.title || '').localeCompare(b.title || '');
    })
    .map((doc: CanonDocument) => ({
      slug: doc.slug,
      title: doc.title || '',
      subtitle: doc.subtitle,
      description: doc.description,
      coverImage: doc.coverImage,
      url: doc.url,
    }));
}

/**
 * Check if a collection is managed by Contentlayer
 */
export function isContentlayerCollection(collection: string): boolean {
  const knownCollections = [
    'blog', 'post', 'posts',
    'book', 'books', 
    'download', 'downloads',
    'event', 'events',
    'print', 'prints',
    'strategy', 'strategies',
    'resource', 'resources',
    'canon'
  ];
  return knownCollections.includes(collection.toLowerCase());
}