// lib/server/content.ts
import fs from "node:fs";
import path from "node:path";
import { safeListFiles } from "@/lib/fs-utils";

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
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  type ContentDoc,
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* Strictness                                                                 */
/* -------------------------------------------------------------------------- */

const STRICT_ASSETS = process.env.CONTENT_STRICT_ASSETS === "1";

function failOrWarn(message: string) {
  if (STRICT_ASSETS) throw new Error(message);
  // eslint-disable-next-line no-console
  console.warn(message);
}

/* -------------------------------------------------------------------------- */
/* Public FS helpers                                                          */
/* -------------------------------------------------------------------------- */

function publicUrlToFsPath(publicUrl: string): string | null {
  const u = String(publicUrl || "").trim();
  if (!u.startsWith("/") || u.startsWith("//")) return null;
  return path.join(process.cwd(), "public", u.replace(/^\/+/, ""));
}

function publicExists(publicUrl: string): boolean {
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return false;
  try {
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

function publicSizeBytes(publicUrl: string): number | null {
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return null;
  try {
    const st = fs.statSync(fsPath);
    return typeof st.size === "number" ? st.size : null;
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  const b = Math.max(0, bytes);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

/* -------------------------------------------------------------------------- */
/* Resources (Contentlayer-first, FS fallback for edge cases)                 */
/* -------------------------------------------------------------------------- */

export type ResourceDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  coverImage?: string | null;
  tags?: string[];
  author?: string | null;

  url: string; // canonical route
  href?: string | null; // CTA only

  body?: { raw?: string; code?: string };
  content?: string;

  slug?: string;
  draft?: boolean;
  _raw?: any;
};

const RESOURCES_DIR = path.join(process.cwd(), "content", "resources");

function stripQuotes(s: string): string {
  return String(s || "").replace(/^["']|["']$/g, "").trim();
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

    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        out[key] = JSON.parse(val);
        continue;
      } catch {
        // ignore
      }
    }

    if (val === "true") out[key] = true;
    else if (val === "false") out[key] = false;
    else out[key] = stripQuotes(val);
  }

  return out;
}

function deriveSlugFromFilename(filename: string): string {
  return filename.replace(/\.(md|mdx)$/i, "").toLowerCase();
}

function deriveUrlFromFilename(filename: string): string {
  const base = filename.replace(/\.(md|mdx)$/i, "");
  return `/resources/${base}`;
}

function mapResourceFromContentlayer(r: any): ResourceDoc {
  const url =
    typeof r?.url === "string" && r.url.startsWith("/")
      ? r.url
      : `/resources/${normalizeSlug(r)}`;

  return {
    title: r.title || "Untitled Resource",
    excerpt: r.excerpt ?? r.description ?? null,
    description: r.description ?? r.excerpt ?? null,
    date: r.date ?? null,
    coverImage: r.coverImage ?? r.normalizedCoverImage ?? null,
    tags: Array.isArray(r.tags) ? r.tags : [],
    author: r.author ?? null,
    url,
    href: r.href ?? null,
    body: r.body ?? { raw: r.content || "" },
    content: r.content ?? r.body?.raw ?? "",
    slug: normalizeSlug(r),
    draft: r.draft ?? false,
    _raw: r._raw,
  };
}

export function getAllResources(): ResourceDoc[] {
  // Contentlayer first
  try {
    const items = getResourcesFromContentlayer();
    if (items?.length) {
      const docs = items.map(mapResourceFromContentlayer);
      docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
      return docs;
    }
  } catch {
    // eslint-disable-next-line no-console
    console.warn("⚠️ Contentlayer resources unavailable, using filesystem fallback");
  }

  // FS fallback
  const dirExists = (() => {
    try {
      return fs.existsSync(RESOURCES_DIR) && fs.statSync(RESOURCES_DIR).isDirectory();
    } catch {
      return false;
    }
  })();
  if (!dirExists) return [];

  // ✅ safeListFiles prevents accidental file scandir issues
  const files = safeListFiles(RESOURCES_DIR).filter((p) => /\.(md|mdx)$/i.test(p));

  const docs: ResourceDoc[] = [];
  for (const abs of files) {
    const file = path.basename(abs);
    const raw = fs.readFileSync(abs, "utf8");
    const fm = parseFrontmatter(raw);
    if (fm.draft === true) continue;

    const explicitUrl =
      typeof fm.canonicalUrl === "string"
        ? cleanPath(fm.canonicalUrl)
        : typeof fm.url === "string"
        ? cleanPath(fm.url)
        : "";

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

  docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return docs;
}

export function getResourceBySlug(slug: string): ResourceDoc | null {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;

  const cl = getResourceBySlugFromContentlayer(s);
  if (cl) return mapResourceFromContentlayer(cl);

  return getAllResources().find((r) => (r.slug ?? "").toLowerCase() === s) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Books / Downloads / Posts / Canon / Shorts                                 */
/* -------------------------------------------------------------------------- */

export function getAllBooks(): ContentDoc[] {
  return getBooksFromContentlayer();
}
export function getBookBySlug(slug: string): ContentDoc | null {
  return getBookBySlugFromContentlayer(slug);
}

export function getAllDownloads(): ContentDoc[] {
  return getDownloadsFromContentlayer();
}
export function getDownloadBySlug(slug: string): ContentDoc | null {
  return getDownloadBySlugFromContentlayer(slug);
}

export function getAllPosts(): ContentDoc[] {
  return getPublishedPosts();
}
export function getPostBySlugServer(slug: string): ContentDoc | null {
  return getPostBySlug(slug);
}

export function getAllCanons(): ContentDoc[] {
  return getCanonsFromContentlayer();
}
export function getCanonBySlug(slug: string): ContentDoc | null {
  return getCanonBySlugFromContentlayer(slug);
}

export function getAllShorts(): ContentDoc[] {
  return getPublishedShorts();
}
export function getShortBySlugServer(slug: string): ContentDoc | null {
  return getShortBySlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Build-time asset validation (downloads + resources + covers)               */
/* -------------------------------------------------------------------------- */

export function assertPublicAssetsForDownloadsAndResources() {
  const missing: string[] = [];

  for (const d of getAllDownloads()) {
    const slug = normalizeSlug(d) || "(no-slug)";
    const label = `download/${slug}`;

    const cover = resolveDocCoverImage(d);
    if (cover.startsWith("/assets/") && !publicExists(cover)) {
      missing.push(`${label} coverImage -> ${cover}`);
    }

    const dl = resolveDocDownloadUrl(d);
    if (dl && dl.startsWith("/assets/") && !publicExists(dl)) {
      missing.push(`${label} file -> ${dl}`);
    }
  }

  for (const r of getAllResources()) {
    const slug = (r.slug || "").trim() || "(no-slug)";
    const label = `resource/${slug}`;
    const cover = String(r.coverImage || "").trim();
    if (cover.startsWith("/assets/") && !publicExists(cover)) {
      missing.push(`${label} coverImage -> ${cover}`);
    }
  }

  if (missing.length) {
    failOrWarn(`[Content Assets] Missing public assets:\n${missing.join("\n")}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Optional: download size label (server only)                                */
/* -------------------------------------------------------------------------- */

export function getDownloadSizeLabel(doc: ContentDoc): string | null {
  const explicit = String((doc as any)?.fileSize || "").trim();
  if (explicit) return explicit;

  const url = resolveDocDownloadUrl(doc);
  if (!url || !url.startsWith("/")) return null;

  const bytes = publicSizeBytes(url);
  if (bytes == null) return null;

  return formatBytes(bytes);
}