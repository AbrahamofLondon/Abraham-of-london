// src/lib/server/downloads-data.ts
// Server-only helpers for Downloads (MD/MDX in content/downloads)

if (typeof window !== "undefined") {
  throw new Error("downloads-data must not be imported on the client");
}

import * as fs from "fs";
import * as path from "path";
import * as matter from "gray-matter";

export interface DownloadMeta {
  slug: string; // URL slug (filename without extension)
  title: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  author?: string;
  coverImage?: string;
  pdfPath?: string;
}

export interface Download extends DownloadMeta {
  content: string;
}

export type DownloadFieldKey = keyof DownloadMeta;

const DOWNLOADS_DIR = path.join(process.cwd(), "content", "downloads");

/**
 * Internal helper – resolve a slug to an actual md/mdx file if it exists.
 */
function resolveDownloadPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  const mdxPath = path.join(DOWNLOADS_DIR, `${real}.mdx`);
  const mdPath = path.join(DOWNLOADS_DIR, `${real}.md`);

  if (fs.existsSync(mdxPath)) return mdxPath;
  if (fs.existsSync(mdPath)) return mdPath;
  return null;
}

/**
 * Read all download front-matter metadata (no body).
 */
export function getAllDownloadsMeta(): DownloadMeta[] {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.warn("[downloads-data] Downloads directory does not exist:", DOWNLOADS_DIR);
    return [];
  }

  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md") || f.toLowerCase().endsWith(".mdx"));

  return files.map((file) => {
    const slug = file.replace(/\.mdx?$/i, "");
    const fullPath = path.join(DOWNLOADS_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);
    const fm = data || {};

    const title =
      typeof fm.title === "string" && fm.title.trim().length
        ? fm.title
        : slug;

    const description =
      typeof fm.description === "string" && fm.description.trim().length
        ? fm.description
        : undefined;

    const excerpt =
      typeof fm.excerpt === "string" && fm.excerpt.trim().length
        ? fm.excerpt
        : description;

    return {
      slug,
      title,
      excerpt,
      description,
      category:
        typeof fm.category === "string" && fm.category.trim().length
          ? fm.category
          : undefined,
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
      date:
        typeof fm.date === "string" && fm.date.trim().length
          ? fm.date
          : undefined,
      author:
        typeof fm.author === "string" && fm.author.trim().length
          ? fm.author
          : "Abraham of London",
      coverImage:
        typeof fm.coverImage === "string" && fm.coverImage.trim().length
          ? fm.coverImage
          : undefined,
      pdfPath:
        typeof fm.pdfPath === "string" && fm.pdfPath.trim().length
          ? fm.pdfPath
          : undefined,
    } satisfies DownloadMeta;
  });
}

/**
 * For callers like unified-content – full list of metadata.
 * (Thin wrapper for backwards compatibility.)
 */
export function getAllDownloads(): DownloadMeta[] {
  return getAllDownloadsMeta();
}

/**
 * Convenience: just the slugs (for getStaticPaths).
 */
export function getDownloadSlugs(): string[] {
  return getAllDownloadsMeta().map((d) => d.slug);
}

/**
 * Full download (frontmatter + content body).
 */
export function getDownloadBySlug(slug: string): Download | null {
  const filePath = resolveDownloadPath(slug);
  if (!filePath) {
    console.warn("[downloads-data] No file found for slug:", slug);
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);
  const fm = data || {};

  const title =
    typeof fm.title === "string" && fm.title.trim().length
      ? fm.title
      : slug;

  const description =
    typeof fm.description === "string" && fm.description.trim().length
      ? fm.description
      : undefined;

  const excerpt =
    typeof fm.excerpt === "string" && fm.excerpt.trim().length
      ? fm.excerpt
      : description;

  return {
    slug,
    title,
    excerpt,
    description,
    category:
      typeof fm.category === "string" && fm.category.trim().length
        ? fm.category
        : undefined,
    tags: Array.isArray(fm.tags) ? fm.tags : undefined,
    date:
      typeof fm.date === "string" && fm.date.trim().length
        ? fm.date
        : undefined,
    author:
      typeof fm.author === "string" && fm.author.trim().length
        ? fm.author
        : "Abraham of London",
    coverImage:
      typeof fm.coverImage === "string" && fm.coverImage.trim().length
        ? fm.coverImage
        : undefined,
    pdfPath:
      typeof fm.pdfPath === "string" && fm.pdfPath.trim().length
        ? fm.pdfPath
        : undefined,
    content,
  } satisfies Download;
}

/**
 * Default export for any legacy imports.
 */
export default {
  getAllDownloadsMeta,
  getAllDownloads,
  getDownloadSlugs,
  getDownloadBySlug,
};
