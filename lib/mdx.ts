// lib/mdx.ts
// Centralised MD/MDX utilities using the filesystem + gray-matter.
// NOTE: Primary content (blog, downloads, prints, etc.) is now handled by
// Contentlayer. This helper remains for any legacy or ad-hoc collections.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Import Contentlayer generated types
import {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
} from "contentlayer/generated";

// Define Contentlayer document base interface
interface ContentlayerDoc {
  slug: string;
  body: {
    raw: string;
  };
  [key: string]: unknown;
}

interface PostDoc extends ContentlayerDoc {
  date: string;
  draft?: boolean;
}

interface BookDoc extends ContentlayerDoc {
  title: string;
  draft?: boolean;
}

interface DownloadDoc extends ContentlayerDoc {
  date: string;
}

interface EventDoc extends ContentlayerDoc {
  date: string;
}

interface PrintDoc extends ContentlayerDoc {
  date: string;
  available?: boolean;
}

interface StrategyDoc extends ContentlayerDoc {
  date: string;
}

interface ResourceDoc extends ContentlayerDoc {
  title: string;
}

interface CanonDoc extends ContentlayerDoc {
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  url?: string;
  draft?: boolean;
  featured?: boolean;
  order?: number;
}

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
      return (allPosts as PostDoc[])
        .filter((p) => !p.draft)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "book":
    case "books":
      return (allBooks as BookDoc[])
        .filter((b) => !b.draft)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "download":
    case "downloads":
      return (allDownloads as DownloadDoc[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "event":
    case "events":
      return (allEvents as EventDoc[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "print":
    case "prints":
      return (allPrints as PrintDoc[])
        .filter((p) => p.available !== false)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "strategy":
    case "strategies":
      return (allStrategies as StrategyDoc[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "resource":
    case "resources":
      return (allResources as ResourceDoc[])
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((doc) => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));

    case "canon":
      return (allCanons as CanonDoc[])
        .filter((c) => !c.draft)
        .sort((a, b) => {
          // Sort by order field if present, otherwise by title
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.title.localeCompare(b.title);
        })
        .map((doc) => ({
          slug: doc.slug,
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
  options?: GetContentOptions
): RawContentEntry | null {
  const targetSlug = String(slug).trim();

  // Try Contentlayer first
  let doc: ContentlayerDoc | undefined;
  switch (collection.toLowerCase()) {
    case "blog":
    case "post":
    case "posts":
      doc = (allPosts as PostDoc[]).find((p) => p.slug === targetSlug);
      break;

    case "book":
    case "books":
      doc = (allBooks as BookDoc[]).find((b) => b.slug === targetSlug);
      break;

    case "download":
    case "downloads":
      doc = (allDownloads as DownloadDoc[]).find((d) => d.slug === targetSlug);
      break;

    case "event":
    case "events":
      doc = (allEvents as EventDoc[]).find((e) => e.slug === targetSlug);
      break;

    case "print":
    case "prints":
      doc = (allPrints as PrintDoc[]).find((p) => p.slug === targetSlug);
      break;

    case "strategy":
    case "strategies":
      doc = (allStrategies as StrategyDoc[]).find((s) => s.slug === targetSlug);
      break;

    case "resource":
    case "resources":
      doc = (allResources as ResourceDoc[]).find((r) => r.slug === targetSlug);
      break;

    case "canon":
      doc = (allCanons as CanonDoc[]).find((c) => c.slug === targetSlug);
      break;
  }

  if (doc) {
    const entry: RawContentEntry = {
      slug: doc.slug,
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

  // Fallback to filesystem
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

  // Fallback: search all entries
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
  return (allCanons as CanonDoc[])
    .filter((c) => !c.draft && c.featured)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    })
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      subtitle: doc.subtitle,
      description: doc.description,
      coverImage: doc.coverImage,
      url: doc.url,
      ...doc,
    }));
}
