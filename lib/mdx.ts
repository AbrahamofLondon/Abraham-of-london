// lib/mdx.ts
// Centralised MDX utilities: load, parse, and read frontmatter.
// Only used in getStaticProps / getStaticPaths (server-side).

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface RawContentEntry {
  slug: string;
  content: string;
  [key: string]: any;
}

interface GetContentOptions {
  /** If false, content will be omitted from the returned object. */
  withContent?: boolean;
}

// Root folder where your MD/MDX content lives.
// Adjust this to your actual structure if needed.
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
 * Return all MD/MDX entries within a collection folder, parsed with gray-matter.
 *
 * Example structure:
 *   content/
 *     downloads/
 *       brotherhood-cue-card.mdx
 *     resources/
 *       lessons-from-noah.mdx
 */
export function getAllContent(collection: string): RawContentEntry[] {
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
    const slug =
      (data.slug as string) ?? file.replace(/\.mdx?$/i, "");

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
 * Will try file-based lookups first, then fall back to scanning all content.
 */
export function getContentBySlug(
  collection: string,
  slug: string,
  options?: GetContentOptions
): RawContentEntry | null {
  const dir = resolveCollectionDir(collection);
  const targetSlug = String(slug).trim();
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
          entry.slug === targetSlug.toLowerCase()
      ) || null;

    if (!found) return null;

    if (options?.withContent === false) {
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
    const { content: _omit, ...meta } = entry;
    return meta as any;
  }

  return entry;
}