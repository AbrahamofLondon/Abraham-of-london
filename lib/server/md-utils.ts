// lib/server/md-utils.ts
// Server-only helpers for working with MD/MDX content on disk.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Root folder for your content.
 * Adjust if your content lives somewhere else.
 */
export const CONTENT_ROOT = path.join(process.cwd(), "content");

export const MD_EXTS = [".md", ".mdx", ".MD", ".MDX"];

/**
 * Ensure a subdirectory under CONTENT_ROOT exists and is a directory.
 * Returns the absolute path or null.
 */
export function ensureDir(dir: string): string | null {
  try {
    const abs = path.join(CONTENT_ROOT, dir);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      return abs;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * List markdown / MDX files in a given absolute directory path.
 */
export function listMdFiles(absDir: string): string[] {
  try {
    return fs
      .readdirSync(absDir)
      .filter((f) =>
        MD_EXTS.some((ext) => f.toLowerCase().endsWith(ext.toLowerCase()))
      )
      .map((f) => path.join(absDir, f));
  } catch {
    return [];
  }
}

/**
 * Turn a file path into a slug, e.g. `my-post.mdx` -> `my-post`.
 */
export function fileToSlug(filePath: string): string {
  const base = path.basename(filePath);
  const slug = base.replace(/\.(mdx?|MDX?)$/, "");
  return slug.trim();
}

/**
 * Read frontmatter + content from a markdown file.
 */
export function readFrontmatter(absFile: string): {
  data: Record<string, any>;
  content: string;
} {
  const raw = fs.readFileSync(absFile, "utf8");
  const { data, content } = matter(raw);
  return { data: data as Record<string, any>, content };
}

/**
 * Sort items with an optional `date` field (ISO string) descending.
 * Newest first.
 */
export function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  const toKey = (d?: string) => (d ? new Date(d).valueOf() || 0 : 0);

  return [...items].sort((a, b) => toKey(b.date) - toKey(a.date));
}
