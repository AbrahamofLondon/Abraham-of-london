// lib/server/downloads-data.ts
// Server-only module: read front-matter for downloads (MD/MDX) safely.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

// --- Type Definitions ---

// Define the core set of fields that will be present *if* requested
export type DownloadMeta = {
  slug: string;
  title: string | null;
  excerpt: string | null;
  coverImage: string | null;     // e.g. /assets/images/downloads/foo.jpg
  file: string | null;           // e.g. /downloads/foo.pdf
  coverAspect: "book" | "square" | "16/9" | string | null;
  coverFit: "contain" | "cover" | string | null;
  coverPosition: "center" | "top" | "left" | "right" | string | null;
  content?: string;              // optional full MD/MDX content
};

type DownloadFrontmatter = { [K in keyof Omit<DownloadMeta, "slug" | "content">]: unknown };
type FieldKey = keyof DownloadMeta;

const downloadsDir = path.join(process.cwd(), "content", "downloads");
const exts = [".mdx", ".md"] as const;

const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "excerpt",
  "coverImage",
  "file",
  "coverAspect",
  "coverFit",
  "coverPosition",
];

// --- Private Helpers ---

/** Finds the full path to a download file, supporting .mdx and .md. */
function resolveDownloadPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  for (const ext of exts) {
    const full = path.join(downloadsDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

/** Safely converts unknown to a trimmed string, or undefined if null/empty. */
function safeTrimmedString(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : undefined;
  return s || undefined;
}

/** Ensures a local path starts with a slash, or returns absolute URLs as-is. */
function ensureLocalRoot(p: string): string {
  // Assuming isExternalUrl utility is available, otherwise use the local regex
  const isExternal = /^https?:\/\//i.test(p); 
  if (isExternal) return p;
  
  const s = p.replace(/^\/+/, "");
  return `/${s}`;
}

/**
 * Normalizes an asset path, assuming common fallback locations if a bare filename is provided.
 * @param v Raw frontmatter value.
 * @param defaultPrefix The default prefix to prepend if a bare filename is used.
 */
function normalizeAssetPath(v: unknown, defaultPrefix: string): string | undefined {
  const raw = safeTrimmedString(v);
  if (!raw) return undefined;
  
  // If it's already an absolute URL, return it as-is (e.g., CDN link)
  if (/^https?:\/\//i.test(raw)) return raw;

  const cleanRooted = ensureLocalRoot(raw);
  
  // Check if it looks like a pre-rooted path (e.g., /assets/images/...)
  if (cleanRooted.startsWith("/assets/") || cleanRooted.startsWith("/downloads/") || cleanRooted.startsWith("/_next/")) {
      return cleanRooted;
  }
  
  // If it's a bare filename, prepend the default prefix
  // Ensure the default prefix itself is clean (ends with a single slash)
  const cleanPrefix = defaultPrefix.endsWith('/') ? defaultPrefix : `${defaultPrefix}/`;
  return ensureLocalRoot(`${cleanPrefix}${cleanRooted.replace(/^\/+/, "")}`);
}

/* ------------------------
    Slug + single loader
------------------------- */

export function getDownloadSlugs(): string[] {
  if (!fs.existsSync(downloadsDir)) return [];
  return fs
    .readdirSync(downloadsDir)
    .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

/**
 * Reads a single download by slug and returns a partial object containing requested fields.
 */
export function getDownloadBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false
): DownloadMeta {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveDownloadPath(real);
  const out: Partial<DownloadMeta> = { slug: real };

  if (!fullPath) {
    // Safe fallback for "Not Found"
    out.title = "Download Not Found";
    // We only include requested fields, defaulting to null/empty string
    for (const f of fields) {
      if (f !== "slug" && f !== "content") (out as any)[f] = null;
    }
    if (includeContent) out.content = "";
    return out as DownloadMeta;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as DownloadFrontmatter;

  // Function to map and normalize frontmatter fields
  const getField = (f: FieldKey): string | null | undefined => {
    const rawValue = fm[f as keyof DownloadFrontmatter];
    
    switch (f) {
      case "title":
      case "excerpt":
      case "coverAspect":
      case "coverFit":
      case "coverPosition":
        return safeTrimmedString(rawValue) ?? null;
      
      case "coverImage":
        // Assets are typically stored under /assets/images/downloads/
        return normalizeAssetPath(rawValue, "/assets/images/downloads") ?? null; 
      
      case "file":
        // Files are typically stored under /downloads/
        return normalizeAssetPath(rawValue, "/downloads") ?? null;
      
      default:
        // Should only be slug/content, handled outside
        return undefined;
    }
  };

  // Populate output object with requested fields
  for (const f of fields) {
    if (f === "slug") {
      out.slug = real;
      continue;
    }
    if (f === "content") {
      if (includeContent) out.content = content || "";
      continue;
    }
    
    // Get and assign the normalized value
    (out as any)[f] = getField(f);
  }

  // Ensure 'title' is never null if content exists (for sorting fallback)
  if (out.title === null) {
      out.title = real.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return out as DownloadMeta;
}

/* ------------------------
    Collection Loaders
------------------------- */

/**
 * Convenience: load several downloads at once.
 */
export function getDownloadsBySlugs(
  slugs: string[],
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  return slugs.map((s) => getDownloadBySlug(s, fields));
}

/**
 * All downloads present in /content/downloads, already normalized.
 * Sorted alphabetically by title (fallback to slug).
 */
export function getAllDownloads(
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  const slugs = getDownloadSlugs();
  const items = slugs.map((s) => getDownloadBySlug(s, fields));
  
  // Sort alphabetically by title (fallback to slug)
  items.sort((a, b) => {
    const at = (a.title || a.slug || "").toLowerCase();
    const bt = (b.title || b.slug || "").toLowerCase();
    return at.localeCompare(bt);
  });
  
  // Filter out any "Not Found" entries, though they shouldn't occur if slugs are correct
  return items.filter(d => d.title !== "Download Not Found");
}