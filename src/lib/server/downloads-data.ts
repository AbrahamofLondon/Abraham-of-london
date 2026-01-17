// src/lib/server/downloads-data.ts
// Server-only module: read front-matter for downloads (MD/MDX) safely.

// Hard guard – server-only.
if (typeof window !== "undefined") {
  throw new Error("downloads-data must not be imported on the client");
}

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface DownloadMeta {
  slug: string; // URL slug (filename without extension)
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  date?: string;
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
  const mdxPath = path.join(DOWNLOADS_DIR, `${slug}.mdx`);
  const mdPath = path.join(DOWNLOADS_DIR, `${slug}.md`);

  if (fs.existsSync(mdxPath)) return mdxPath;
  if (fs.existsSync(mdPath)) return mdPath;
  return null;
}

/**
 * Used by pages/downloads/[slug].tsx to build getStaticPaths
 */
export function getAllDownloadsMeta(): DownloadMeta[] {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  return files.map((file) => {
    const slug = file.replace(/\.mdx?$/, "");
    const fullPath = path.join(DOWNLOADS_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      excerpt: data.excerpt ?? data.description ?? "",
      category: data.category ?? undefined,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
      date: data.date ?? undefined,
      coverImage:
        typeof data.coverImage === "string" ? data.coverImage : undefined,
      pdfPath: typeof data.pdfPath === "string" ? data.pdfPath : undefined,
    };
  });
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
  if (!filePath) return null;

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? data.description ?? "",
    category: data.category ?? undefined,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    date: data.date ?? undefined,
    coverImage:
      typeof data.coverImage === "string" ? data.coverImage : undefined,
    pdfPath: typeof data.pdfPath === "string" ? data.pdfPath : undefined,
    content,
  };
}

// Create a named object for default export
const downloadsDataApi = {
  getAllDownloadsMeta,
  getDownloadSlugs,
  getDownloadBySlug,
};

// Export default for compatibility
export default downloadsDataApi;