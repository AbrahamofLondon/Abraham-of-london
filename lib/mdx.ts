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
  allCanons 
} from "contentlayer/generated";

export interface RawContentEntry {
  slug: string;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
    case 'blog':
    case 'post':
    case 'posts':
      return allPosts
        .filter((p) => !p.draft)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'book':
    case 'books':
      return allBooks
        .filter((b) => !b.draft)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'download':
    case 'downloads':
      return allDownloads
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'event':
    case 'events':
      return allEvents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'print':
    case 'prints':
      return allPrints
        .filter((p) => p.available !== false)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'strategy':
    case 'strategies':
      return allStrategies
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'resource':
    case 'resources':
      return allResources
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(doc => ({
          slug: doc.slug,
          content: doc.body.raw,
          ...doc,
        }));
    
    case 'canon':
      return allCanons
        .filter((c) => !c.draft)
        .sort((a, b) => {
          // Sort by order field if present, otherwise by title
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.title.localeCompare(b.title);
        })
        .map(doc => ({
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
  options?: GetContentOptions,
): RawContentEntry | null {
  const targetSlug = String(slug).trim();

  // Try Contentlayer first
  let doc;
  switch (collection.toLowerCase()) {
    case 'blog':
    case 'post':
    case 'posts':
      doc = allPosts.find((p) => p.slug === targetSlug);
      break;
    
    case 'book':
    case 'books':
      doc = allBooks.find((b) => b.slug === targetSlug);
      break;
    
    case 'download':
    case 'downloads':
      doc = allDownloads.find((d) => d.slug === targetSlug);
      break;
    
    case 'event':
    case 'events':
      doc = allEvents.find((e) => e.slug === targetSlug);
      break;
    
    case 'print':
    case 'prints':
      doc = allPrints.find((p) => p.slug === targetSlug);
      break;
    
    case 'strategy':
    case 'strategies':
      doc = allStrategies.find((s) => s.slug === targetSlug);
      break;
    
    case 'resource':
    case 'resources':
      doc = allResources.find((r) => r.slug === targetSlug);
      break;
    
    case 'canon':
      doc = allCanons.find((c) => c.slug === targetSlug);
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
      return meta as any;
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
          entry.slug === targetSlug ||
          entry.slug === targetSlug.toLowerCase(),
      ) || null;
    if (!found) return null;

    if (options?.withContent === false) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _omit, ...meta } = found;
      return meta as any;
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
    return meta as any;
  }

  return entry;
}

/**
 * Get featured canon documents
 */
export function getFeaturedCanon() {
  return allCanons
    .filter((c) => !c.draft && c.featured)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    })
    .map(doc => ({
      slug: doc.slug,
      title: doc.title,
      subtitle: doc.subtitle,
      description: doc.description,
      coverImage: doc.coverImage,
      url: doc.url,
      ...doc,
    }));
}