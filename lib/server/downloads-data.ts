// lib/server/downloads-data.ts (FINAL ROBUST VERSION)
// Server-only module: read front-matter for downloads (MD/MDX) safely.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

export type DownloadMeta = {
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  coverImage?: string | null; 
  file?: string | null; 
  coverAspect?: "book" | "square" | "16/9" | string | null;
  coverFit?: "contain" | "cover" | string | null;
  coverPosition?: "center" | "top" | "left" | "right" | string | null;
  content?: string;
};

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

function resolveDownloadPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  for (const ext of exts) {
    const full = path.join(downloadsDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function ensureLocal(p?: string | null): string | null {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  // Leave absolute URLs alone
  if (/^https?:\/\//i.test(s)) return s;
  // Make sure we always return a root-based path
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

function normalizeCoverImage(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  // If user just wrote a filename, assume downloads images folder
  if (!raw.startsWith("/assets/") && !raw.startsWith("/_next/") && !/^https?:\/\//i.test(raw)) {
    return `/assets/images/downloads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

function normalizePdfFile(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  // If user wrote a bare filename, assume /downloads/
  if (!raw.startsWith("/downloads/") && !/^https?:\/\//i.test(raw)) {
    return `/downloads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
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

export function getDownloadBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false
): DownloadMeta {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveDownloadPath(real);

  if (!fullPath) {
    // Guaranteed safe fallback (no undefined or crash risk)
    const base: DownloadMeta = {
      slug: real,
      title: "Download Not Found",
      excerpt: null,
      coverImage: null,
      file: null,
      coverAspect: null,
      coverFit: null,
      coverPosition: null,
      content: includeContent ? "" : null,
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = base[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out as DownloadMeta;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = (data || {}) as Record<string, unknown>;

  const out: any = { slug: real };

  for (const f of fields) {
    switch (f) {
      case "slug":
        out.slug = real;
        break;
      case "title": {
        const v = typeof fm.title === "string" ? fm.title.trim() : null;
        out.title = v;
        break;
      }
      case "excerpt": {
        const v = typeof fm.excerpt === "string" ? fm.excerpt.trim() : null;
        out.excerpt = v;
        break;
      }
      case "coverImage": {
        const v = normalizeCoverImage(fm.coverImage);
        out.coverImage = v;
        break;
      }
      case "file": {
        const v = normalizePdfFile(fm.file);
        out.file = v;
        break;
      }
      case "coverAspect": 
      case "coverFit": 
      case "coverPosition": {
        const v = typeof fm[f] === "string" ? fm[f].trim() : null;
        out[f] = v;
        break;
      }
      // CRITICAL FIX: Ensure 'content' is only set if requested
      case "content": {
        if (includeContent) {
          out.content = content || "";
        }
        break;
      }
      default:
        // Ignore unknown/unrequested fields
        break;
    }
  }

  return out as DownloadMeta;
}

export function getDownloadsBySlugs(
  slugs: string[],
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  // ROBUSTNESS: Ensure slugs is an array and filter out nulls
  if (!Array.isArray(slugs)) return [];
  return slugs.map((s) => getDownloadBySlug(s, fields)).filter(Boolean) as DownloadMeta[];
}

export function getAllDownloads(
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  const slugs = getDownloadSlugs();
  const items = slugs.map((s) => getDownloadBySlug(s, fields));
  
  // ROBUSTNESS: Use helper function to guarantee strings for comparison
  items.sort((a, b) => {
    const at = (a.title || a.slug || "").toLowerCase();
    const bt = (b.title || b.slug || "").toLowerCase();
    return at.localeCompare(bt);
  });
  return items;
}
