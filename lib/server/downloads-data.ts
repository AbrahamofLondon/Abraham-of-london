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
  coverImage?: string | null; // e.g. /assets/images/downloads/foo.jpg
  file?: string | null; // e.g. /downloads/foo.pdf
  coverAspect?: "book" | "square" | "16/9" | string | null;
  coverFit?: "contain" | "cover" | string | null;
  coverPosition?: "center" | "top" | "left" | "right" | string | null;
  content?: string; // optional full MD/MDX content
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

function ensureLocal(p?: string | null): string | undefined {
  if (!p) return undefined;
  const s = String(p).trim();
  if (!s) return undefined;
  // Leave absolute URLs alone
  if (/^https?:\/\//i.test(s)) return s;
  // Make sure we always return a root-based path for Next/Image, etc.
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

/** Try to normalize likely locations for assets */
function normalizeCoverImage(v: unknown): string | undefined {
  const raw = ensureLocal(typeof v === "string" ? v : undefined);
  if (!raw) return undefined;
  // If user just wrote a filename, assume downloads images folder
  if (
    !raw.startsWith("/assets/") &&
    !raw.startsWith("/_next/") &&
    !/^https?:\/\//i.test(raw)
  ) {
    return `/assets/images/downloads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

function normalizePdfFile(v: unknown): string | undefined {
  const raw = ensureLocal(typeof v === "string" ? v : undefined);
  if (!raw) return undefined;
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

/**
 * Read a single download by slug and return a partial object containing requested fields.
 * - Never throws on missing files; returns a minimal Ãƒ¢Ã¢â€š¬Ã..."Not FoundÃƒ¢Ã¢â€š¬Ã‚ entry instead.
 * - Normalizes strings (trim), asset paths, and avoids `undefined` in fields (uses null instead).
 */
export function getDownloadBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false,
): DownloadMeta {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveDownloadPath(real);

  if (!fullPath) {
    // Safe fallback: wonÃƒ¢Ã¢â€š¬Ã¢â€ž¢t break build if a download MD is missing
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
    };
    // Only keep requested fields
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = base[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out as DownloadMeta;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = (data || {}) as Record<string, unknown>;

  // Construct output and normalize
  const out: any = { slug: real };

  for (const f of fields) {
    switch (f) {
      case "slug":
        out.slug = real;
        break;
      case "title": {
        const v = typeof fm.title === "string" ? fm.title.trim() : undefined;
        out.title = v ?? null;
        break;
      }
      case "excerpt": {
        const v =
          typeof fm.excerpt === "string" ? fm.excerpt.trim() : undefined;
        out.excerpt = v ?? null;
        break;
      }
      case "coverImage": {
        const v = normalizeCoverImage(fm.coverImage);
        out.coverImage = v ?? null;
        break;
      }
      case "file": {
        const v = normalizePdfFile(fm.file);
        out.file = v ?? null;
        break;
      }
      case "coverAspect": {
        const v =
          typeof fm.coverAspect === "string"
            ? fm.coverAspect.trim()
            : undefined;
        out.coverAspect = v ?? null;
        break;
      }
      case "coverFit": {
        const v =
          typeof fm.coverFit === "string" ? fm.coverFit.trim() : undefined;
        out.coverFit = v ?? null;
        break;
      }
      case "coverPosition": {
        const v =
          typeof fm.coverPosition === "string"
            ? fm.coverPosition.trim()
            : undefined;
        out.coverPosition = v ?? null;
        break;
      }
      case "content": {
        // not usually requested; gated by `includeContent` param below
        break;
      }
      default:
        // ignore unknowns
        break;
    }
  }

  if (includeContent) {
    out.content = content || "";
  }

  return out as DownloadMeta;
}

/**
 * Convenience: load several slugs at once.
 * Uses sane defaults for the typical card display fields.
 */
export function getDownloadsBySlugs(
  slugs: string[],
  fields: FieldKey[] = DEFAULT_FIELDS,
): DownloadMeta[] {
  return slugs.map((s) => getDownloadBySlug(s, fields));
}

/**
 * All downloads present in /content/downloads, already normalized.
 * Sorted alphabetically by title (fallback to slug).
 */
export function getAllDownloads(
  fields: FieldKey[] = DEFAULT_FIELDS,
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
