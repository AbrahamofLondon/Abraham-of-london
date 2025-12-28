// lib/server/content.ts - COMPLETE UNIFIED SERVER HELPERS
import fs from "fs";
import path from "path";
import {
  getAllResources as getResourcesFromContentlayer,
  getResourceBySlug as getResourceBySlugFromContentlayer,
  getAllBooks as getBooksFromContentlayer,
  getBookBySlug as getBookBySlugFromContentlayer,
  getAllDownloads as getDownloadsFromContentlayer,
  getDownloadBySlug as getDownloadBySlugFromContentlayer,
  getPublishedPosts,
  getPostBySlug,
  getAllCanons as getCanonsFromContentlayer,
  getCanonBySlug as getCanonBySlugFromContentlayer,
  getPublishedShorts,
  getShortBySlug,
  normalizeSlug,
  type ContentDoc,
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ResourceDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  coverImage?: string | null;
  tags?: string[];
  author?: string | null;
  url: string; // Canonical route (must start with /resources/)
  href?: string | null; // CTA destination only (optional)
  body?: { raw?: string; code?: string };
  content?: string;
  slug?: string;
  draft?: boolean;
  _raw?: any;
};

/* -------------------------------------------------------------------------- */
/* File System Helpers (Fallback)                                            */
/* -------------------------------------------------------------------------- */

const RESOURCES_DIR = path.join(process.cwd(), "content", "resources");

function stripQuotes(s: string): string {
  return String(s || "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function cleanPath(p: string): string {
  const s = String(p || "").trim();
  if (!s) return "";
  return s.split("#")[0]!.split("?")[0]!.replace(/\/+$/, "");
}

function parseFrontmatter(raw: string): Record<string, any> {
  const out: Record<string, any> = {};
  const m = raw.match(/^---\s*([\s\S]*?)\s*---/);
  if (!m) return out;

  const lines = m[1].split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();

    // Arrays: tags: ["a","b"]
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        out[key] = JSON.parse(val);
        continue;
      } catch {
        // fall through
      }
    }

    // Booleans
    if (val === "true") out[key] = true;
    else if (val === "false") out[key] = false;
    else out[key] = stripQuotes(val);
  }

  return out;
}

function deriveUrlFromFilename(filename: string): string {
  const base = filename.replace(/\.(md|mdx)$/i, "");
  return `/resources/${base}`;
}

function deriveSlugFromFilename(filename: string): string {
  return filename.replace(/\.(md|mdx)$/i, "").toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Resources - Hybrid Approach (Contentlayer + FS Fallback)                  */
/* -------------------------------------------------------------------------- */

export function getAllResources(): ResourceDoc[] {
  try {
    // Try Contentlayer first
    const contentlayerResources = getResourcesFromContentlayer();
    
    if (contentlayerResources && contentlayerResources.length > 0) {
      return contentlayerResources.map((r: any) => ({
        title: r.title || "Untitled Resource",
        excerpt: r.excerpt ?? r.description ?? null,
        description: r.description ?? r.excerpt ?? null,
        date: r.date ?? null,
        coverImage: r.coverImage ?? null,
        tags: Array.isArray(r.tags) ? r.tags : [],
        author: r.author ?? null,
        url: r.url || `/resources/${normalizeSlug(r)}`,
        href: r.href ?? null,
        body: r.body ?? { raw: r.content || "" },
        content: r.content ?? r.body?.raw ?? "",
        slug: normalizeSlug(r),
        draft: r.draft ?? false,
        _raw: r._raw,
      }));
    }
  } catch (error) {
    console.warn("⚠️ Contentlayer resources unavailable, using filesystem fallback");
  }

  // Fallback to filesystem
  if (!fs.existsSync(RESOURCES_DIR)) {
    console.warn(`⚠️ Resources directory not found: ${RESOURCES_DIR}`);
    return [];
  }

  const files = fs
    .readdirSync(RESOURCES_DIR)
    .filter((f) => /\.(md|mdx)$/i.test(f));

  const docs: ResourceDoc[] = [];

  for (const file of files) {
    const abs = path.join(RESOURCES_DIR, file);
    const raw = fs.readFileSync(abs, "utf8");
    const fm = parseFrontmatter(raw);

    if (fm.draft === true) continue;

    const explicitUrl = typeof fm.url === "string" ? cleanPath(fm.url) : "";
    const url =
      explicitUrl && explicitUrl.startsWith("/resources/")
        ? explicitUrl
        : deriveUrlFromFilename(file);

    const href = typeof fm.href === "string" ? cleanPath(fm.href) : "";

    docs.push({
      title: typeof fm.title === "string" ? fm.title : "Untitled Resource",
      excerpt: typeof fm.excerpt === "string" ? fm.excerpt : null,
      description: typeof fm.description === "string" ? fm.description : null,
      date: typeof fm.date === "string" ? fm.date : null,
      coverImage: typeof fm.coverImage === "string" ? fm.coverImage : null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      author: typeof fm.author === "string" ? fm.author : null,
      href: href || null,
      url,
      body: { raw },
      content: raw,
      slug: deriveSlugFromFilename(file),
      draft: false,
    });
  }

  // Sort by date (newest first)
  docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return docs;
}

export function getResourceByUrlPath(urlPath: string): ResourceDoc | null {
  const target = cleanPath(urlPath);
  if (!target) return null;

  const all = getAllResources();
  return all.find((r) => cleanPath(r.url) === target) ?? null;
}

export function getResourceBySlug(slug: string): ResourceDoc | null {
  const cleanSlug = slug.toLowerCase().trim();
  if (!cleanSlug) return null;

  const all = getAllResources();
  return (
    all.find((r) => r.slug?.toLowerCase() === cleanSlug) ??
    all.find((r) => normalizeSlug(r as any) === cleanSlug) ??
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Books                                                                      */
/* -------------------------------------------------------------------------- */

export function getAllBooks(): ContentDoc[] {
  return getBooksFromContentlayer();
}

export function getBookBySlug(slug: string): ContentDoc | null {
  return getBookBySlugFromContentlayer(slug);
}

export function getBookByUrlPath(urlPath: string): ContentDoc | null {
  const slug = urlPath
    .replace(/^\/books\/?/, "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!slug) return null;
  return getBookBySlugFromContentlayer(slug);
}

/* -------------------------------------------------------------------------- */
/* Downloads                                                                  */
/* -------------------------------------------------------------------------- */

export function getAllDownloads(): ContentDoc[] {
  return getDownloadsFromContentlayer();
}

export function getDownloadBySlug(slug: string): ContentDoc | null {
  return getDownloadBySlugFromContentlayer(slug);
}

export function getDownloadByUrlPath(urlPath: string): ContentDoc | null {
  const slug = urlPath
    .replace(/^\/downloads\/?/, "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!slug) return null;
  return getDownloadBySlugFromContentlayer(slug);
}

/* -------------------------------------------------------------------------- */
/* Posts (Blog)                                                               */
/* -------------------------------------------------------------------------- */

export function getAllPosts(): ContentDoc[] {
  return getPublishedPosts();
}

export function getPostBySlugServer(slug: string): ContentDoc | null {
  return getPostBySlug(slug);
}

export function getPostByUrlPath(urlPath: string): ContentDoc | null {
  const slug = urlPath
    .replace(/^\/blog\/?/, "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!slug) return null;
  return getPostBySlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Canon                                                                      */
/* -------------------------------------------------------------------------- */

export function getAllCanons(): ContentDoc[] {
  return getCanonsFromContentlayer();
}

export function getCanonBySlug(slug: string): ContentDoc | null {
  return getCanonBySlugFromContentlayer(slug);
}

export function getCanonByUrlPath(urlPath: string): ContentDoc | null {
  const slug = urlPath
    .replace(/^\/canon\/?/, "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!slug) return null;
  return getCanonBySlugFromContentlayer(slug);
}

/* -------------------------------------------------------------------------- */
/* Shorts                                                                     */
/* -------------------------------------------------------------------------- */

export function getAllShorts(): ContentDoc[] {
  return getPublishedShorts();
}

export function getShortBySlugServer(slug: string): ContentDoc | null {
  return getShortBySlug(slug);
}

export function getShortByUrlPath(urlPath: string): ContentDoc | null {
  const slug = urlPath
    .replace(/^\/shorts\/?/, "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!slug) return null;
  return getShortBySlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Generic Document Finder                                                    */
/* -------------------------------------------------------------------------- */

export function getDocumentByUrlPath(urlPath: string): ContentDoc | ResourceDoc | null {
  if (urlPath.startsWith("/resources/")) {
    return getResourceByUrlPath(urlPath);
  }
  if (urlPath.startsWith("/books/")) {
    return getBookByUrlPath(urlPath);
  }
  if (urlPath.startsWith("/downloads/")) {
    return getDownloadByUrlPath(urlPath);
  }
  if (urlPath.startsWith("/blog/")) {
    return getPostByUrlPath(urlPath);
  }
  if (urlPath.startsWith("/canon/")) {
    return getCanonByUrlPath(urlPath);
  }
  if (urlPath.startsWith("/shorts/")) {
    return getShortByUrlPath(urlPath);
  }

  // Fallback: try as a generic slug across all types
  const slug = urlPath.split("/").filter(Boolean).pop();
  if (!slug) return null;

  return (
    getResourceBySlug(slug) ||
    getBookBySlug(slug) ||
    getDownloadBySlug(slug) ||
    getPostBySlug(slug) ||
    getCanonBySlug(slug) ||
    getShortBySlug(slug) ||
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Validation Helpers                                                         */
/* -------------------------------------------------------------------------- */

export function hasValidContent(doc: ContentDoc | ResourceDoc | null): boolean {
  if (!doc) return false;

  const content =
    (doc as any).body?.raw ||
    (doc as any).body?.code ||
    (doc as any).content ||
    "";

  return typeof content === "string" && content.trim().length > 0;
}

export function getDocumentContent(doc: ContentDoc | ResourceDoc): string {
  return (
    (doc as any).body?.raw ||
    (doc as any).body?.code ||
    (doc as any).content ||
    ""
  );
}

/* -------------------------------------------------------------------------- */
/* Slug Utilities                                                             */
/* -------------------------------------------------------------------------- */

export function extractSlugFromPath(urlPath: string): string | null {
  const parts = urlPath
    .split("/")
    .filter(Boolean)
    .filter((part) => !["resources", "books", "blog", "downloads", "canon", "shorts"].includes(part));

  return parts.length > 0 ? parts[parts.length - 1] : null;
}

export function buildUrlPath(slug: string, type: string): string {
  const typeMap: Record<string, string> = {
    resource: "/resources",
    book: "/books",
    download: "/downloads",
    post: "/blog",
    canon: "/canon",
    short: "/shorts",
  };

  const prefix = typeMap[type] || "/content";
  return `${prefix}/${slug}`;
}