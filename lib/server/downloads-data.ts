// lib/server/downloads-data.ts
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
  // Compatibility fields
  date?: string | null;
  author?: string | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
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

const COMPATIBILITY_FIELDS: FieldKey[] = [
  ...DEFAULT_FIELDS,
  "date",
  "author",
  "readTime",
  "category",
  "tags",
];

// ---------- Path + normalisation helpers ----------

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
  if (/^https?:\/\//i.test(s)) return s; // absolute URL
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

function normalizeCoverImage(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  if (
    !raw.startsWith("/assets/") &&
    !raw.startsWith("/_next/") &&
    !/^https?:\/\//i.test(raw)
  ) {
    return `/assets/images/downloads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

function normalizePdfFile(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  if (!raw.startsWith("/downloads/") && !/^https?:\/\//i.test(raw)) {
    return `/downloads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

// ---------- Resources extraction ----------

/** Extract possible resource slugs from front-matter `resources` blocks */
export function extractResourceSlugs(content: any): string[] {
  if (!content?.resources) return [];
  const slugs: string[] = [];

  try {
    if (Array.isArray(content.resources.downloads)) {
      content.resources.downloads.forEach((r: any) => {
        if (r?.href) {
          const slug = String(r.href).split("/").pop();
          if (slug) slugs.push(slug);
        }
      });
    }
    if (Array.isArray(content.resources.reads)) {
      content.resources.reads.forEach((r: any) => {
        if (r?.href) {
          const slug = String(r.href).split("/").pop();
          if (slug) slugs.push(slug);
        }
      });
    }
  } catch (e) {
    console.warn("[downloads-data] Error extracting resource slugs:", e);
  }

  return [...new Set(slugs)];
}

// ---------- Core loaders ----------

export function getDownloadSlugs(): string[] {
  if (!fs.existsSync(downloadsDir)) return [];
  try {
    return fs
      .readdirSync(downloadsDir)
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch (err) {
    console.error("[downloads-data] Error reading downloads directory:", err);
    return [];
  }
}

export function getDownloadBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false
): DownloadMeta {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveDownloadPath(real);

  // If file is missing, return a non-throwing placeholder
  if (!fullPath) {
    console.warn("[downloads-data] Download not found for slug:", real);

    const base: DownloadMeta = {
      slug: real,
      title: "Download Not Found",
      excerpt: null,
      coverImage: null,
      file: null,
      coverAspect: null,
      coverFit: null,
      coverPosition: null,
      content: includeContent ? "" : undefined,
      date: null,
      author: "Abraham of London",
      readTime: null,
      category: null,
      tags: null,
    };

    const out: any = { slug: base.slug };
    for (const f of fields) {
      out[f] = (base as any)[f] ?? null;
    }
    if (includeContent) out.content = base.content ?? "";
    return out as DownloadMeta;
  }

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const fm = (data || {}) as Record<string, unknown>;
    const out: any = { slug: real };

    for (const f of fields) {
      switch (f) {
        case "slug":
          out.slug = real;
          break;
        case "title":
          out.title =
            typeof fm.title === "string" ? fm.title.trim() : null;
          break;
        case "excerpt":
          out.excerpt =
            typeof fm.excerpt === "string" ? fm.excerpt.trim() : null;
          break;
        case "coverImage":
          out.coverImage = normalizeCoverImage(fm.coverImage);
          break;
        case "file":
          out.file = normalizePdfFile(fm.file);
          break;
        case "coverAspect":
        case "coverFit":
        case "coverPosition":
        case "date":
        case "author":
        case "readTime":
        case "category":
          out[f] = typeof fm[f] === "string" ? String(fm[f]).trim() : null;
          break;
        case "tags":
          out.tags = Array.isArray(fm.tags)
            ? (fm.tags as any[]).map(String)
            : null;
          break;
        case "content":
          if (includeContent) out.content = content || "";
          break;
        default:
          break;
      }
    }

    return out as DownloadMeta;
  } catch (err) {
    console.error(`[downloads-data] Error processing download ${slug}:`, err);

    const base: DownloadMeta = {
      slug: real,
      title: "Error Loading Download",
      excerpt: null,
      coverImage: null,
      file: null,
      coverAspect: null,
      coverFit: null,
      coverPosition: null,
      content: includeContent ? "" : undefined,
      date: null,
      author: "Abraham of London",
      readTime: null,
      category: null,
      tags: null,
    };

    const out: any = { slug: base.slug };
    for (const f of fields) {
      out[f] = (base as any)[f] ?? null;
    }
    if (includeContent) out.content = base.content ?? "";
    return out as DownloadMeta;
  }
}

export function getDownloadsBySlugs(
  slugs: unknown[],
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  if (!Array.isArray(slugs)) return [];

  const seen = new Set<string>();
  const items: DownloadMeta[] = [];

  for (const raw of slugs) {
    const slug = String(raw ?? "").trim();
    if (!slug) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    try {
      const meta = getDownloadBySlug(slug, fields);
      if (meta && meta.slug) {
        items.push(meta);
      } else {
        console.warn("[downloads-data] Empty meta returned for slug:", slug);
      }
    } catch (err) {
      // Should not happen with the current getDownloadBySlug, but guard anyway
      console.error("[downloads-data] Skipping bad download slug:", slug, err);
    }
  }

  return items;
}

export function getAllDownloads(
  fields: FieldKey[] = DEFAULT_FIELDS
): DownloadMeta[] {
  const slugs = getDownloadSlugs();
  const items = slugs.map((s) => getDownloadBySlug(s, fields));
  items.sort((a, b) => {
    const at = (a.title || a.slug || "").toLowerCase();
    const bt = (b.title || b.slug || "").toLowerCase();
    return at.localeCompare(bt);
  });
  return items;
}

// Compatibility export for a unified loader
export function getAllContent(type: "downloads"): DownloadMeta[] {
  if (type !== "downloads") {
    throw new Error(`Unsupported content type: ${type}`);
  }
  return getAllDownloads(COMPATIBILITY_FIELDS);
}

export default {
  getDownloadSlugs,
  getDownloadBySlug,
  getDownloadsBySlugs,
  getAllDownloads,
  getAllContent,
  extractResourceSlugs,
};

export type { FieldKey as DownloadFieldKey };