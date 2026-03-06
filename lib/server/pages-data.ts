// lib/server/pages-data.ts — SSOT ALIGNED (CLEAN REBUILD)
// Pages under content/pages/* — MDX collections (async), Windows-safe, build-safe.

import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Page, ContentEntry, ContentMeta } from "@/types/index";
import { safeSlice } from "@/lib/utils/safe";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

export type PageWithContent = Page & { content: string };

// Extended MDX meta with page-specific fields
type PageishMdxMeta = MdxMeta &
  Partial<Page> & {
    publishDate?: string;
    releaseDate?: string;
    [key: string]: any;
  };

type PageishMdxDocument = MdxDocument &
  Partial<Page> & {
    content?: string;
    body?: any;
  };

/* -------------------------------------------------------------------------- */
/* SAFE CONVERTERS                                                            */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const s = value.toLowerCase().trim();
    if (["true", "yes", "1"].includes(s)) return true;
    if (["false", "no", "0"].includes(s)) return false;
  }
  return undefined;
}
function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((x) => typeof x === "string") as string[];
  return out.length ? out : undefined;
}
function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  return value === "draft" || value === "published" || value === "scheduled" || value === "archived"
    ? value
    : undefined;
}
function safeAccessLevel(value: unknown): AccessTier | undefined {
  if (!value) return undefined;
  return normalizeRequiredTier(value);
}
function safeLayout(
  value: unknown
): "narrow" | "default" | "wide" | "fullscreen" | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.toLowerCase().trim();
  if (s === "narrow" || s === "default" || s === "wide" || s === "fullscreen") return s;
  return undefined;
}
function safeTime(v: unknown): number {
  if (!v) return 0;
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : 0;
}

/* -------------------------------------------------------------------------- */
/* MAPPERS                                                                    */
/* -------------------------------------------------------------------------- */

function fromMdxMeta(meta: MdxMeta): Page {
  const m = meta as PageishMdxMeta;

  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);

  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled Page";

  return {
    slug,
    title,
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    subtitle: safeString(m.subtitle),
    date,
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeString((m as any).readTime) || (safeNumber((m as any).readTime) as any),
    coverImage: safeString((m as any).coverImage) || safeString((m as any).image),
    pageType: safeString((m as any).pageType) || "page",
    parentPage: safeString((m as any).parentPage),
    order: safeNumber((m as any).order),
    template: safeString((m as any).template),
    layout: safeLayout((m as any).layout) || "default",
    showInNav: safeBoolean((m as any).showInNav),
    navOrder: safeNumber((m as any).navOrder),
    navTitle: safeString((m as any).navTitle),
    metaTitle: safeString((m as any).metaTitle),
    metaDescription: safeString((m as any).metaDescription),
    keywords: safeArray((m as any).keywords),
    lastModified: safeString((m as any).lastModified),

    draft: safeBoolean((m as any).draft),
    // default: if undefined, treat as published (matches your other loaders)
    published: (m as any).published === undefined ? true : safeBoolean((m as any).published),
    status: safeStatus((m as any).status),

    accessLevel: safeAccessLevel((m as any).accessLevel) || "public",
    lockMessage: safeString((m as any).lockMessage),

    _raw: (m as any)._raw,
    _id: safeString((m as any)._id),
    url: safeString((m as any).url),
    type: safeString((m as any).type) || "page",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): PageWithContent {
  const d = doc as PageishMdxDocument;
  const meta = fromMdxMeta(d as any);
  return {
    ...(meta as any),
    content: typeof d.content === "string" ? d.content : "",
    body: (d as any).body || undefined,
  } as any;
}

export function pageToContentMeta(page: Page): ContentMeta {
  const { content, body, ...meta } = page as any;
  return meta as any;
}

export function pageToContentEntry(page: Page): ContentEntry {
  const p: any = page as any;
  return {
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    description: p.description,
    category: p.category,
    tags: p.tags,
    featured: p.featured,
    readTime: p.readTime,
    _raw: p._raw,
  } as any;
}

/* -------------------------------------------------------------------------- */
/* CACHED META LOADER (SINGLE DECLARATION)                                    */
/* -------------------------------------------------------------------------- */

let _pagesMetaPromise: Promise<Page[]> | null = null;

async function loadPagesMeta(): Promise<Page[]> {
  if (_pagesMetaPromise) return _pagesMetaPromise;

  _pagesMetaPromise = (async () => {
    const metas = await getMdxCollectionMeta("pages");
    const pages = (metas || []).map((m) => fromMdxMeta(m));

    // filter invalid
    return pages.filter((p: any) => Boolean(p?.slug && p?.title));
  })().catch((err) => {
    console.error("[pages-data] Failed to load pages meta:", err);
    return [];
  });

  return _pagesMetaPromise;
}

/* -------------------------------------------------------------------------- */
/* ACCESS CONTROL                                                             */
/* -------------------------------------------------------------------------- */

export function canAccessPage(page: Page, userTier?: string | AccessTier | null): boolean {
  const user = normalizeUserTier(userTier || "public");
  const required = (page as any).accessLevel || "public";
  return hasAccess(user, required);
}

export async function getAccessiblePages(userTier?: string | AccessTier | null): Promise<Page[]> {
  const pages = await loadPagesMeta();
  const user = normalizeUserTier(userTier || "public");

  return pages.filter((p: any) => hasAccess(user, p?.accessLevel || "public"));
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getAllPagesMeta(): Promise<Page[]> {
  return await loadPagesMeta();
}

export async function getPageBySlug(slug: string): Promise<PageWithContent | null> {
  try {
    const s = safeString(slug);
    if (!s) return null;

    const doc = await getMdxDocumentBySlug("pages", s);
    if (!doc) return null;

    return fromMdxDocument(doc);
  } catch (err) {
    console.error(`[pages-data] getPageBySlug failed (${slug}):`, err);
    return null;
  }
}

export async function getAllPages(): Promise<PageWithContent[]> {
  const metas = await loadPagesMeta();
  if (metas.length === 0) return [];

  const out: PageWithContent[] = [];
  for (const m of metas) {
    const page = await getPageBySlug((m as any).slug);
    if (page) out.push(page);
  }
  return out;
}

export async function getPagesByCategory(category: string): Promise<Page[]> {
  const pages = await loadPagesMeta();
  const c = (category || "").toLowerCase().trim();
  if (!c) return [];
  return pages.filter((p: any) => String(p?.category || "").toLowerCase().trim() === c);
}

export async function getPagesByTag(tag: string): Promise<Page[]> {
  const pages = await loadPagesMeta();
  const t = (tag || "").toLowerCase().trim();
  if (!t) return [];
  return pages.filter(
    (p: any) => Array.isArray(p?.tags) && p.tags.some((x: any) => String(x).toLowerCase().trim() === t)
  );
}

export async function getFeaturedPages(): Promise<Page[]> {
  const pages = await loadPagesMeta();
  return pages.filter((p: any) => p?.featured === true);
}

export async function getPublishedPages(): Promise<Page[]> {
  const pages = await loadPagesMeta();
  return pages.filter(
    (p: any) =>
      p?.draft !== true &&
      p?.status !== "draft" &&
      (p?.published === true || p?.published === undefined || p?.status === "published")
  );
}

export async function getNavPages(): Promise<Page[]> {
  const pages = await getPublishedPages();
  return pages
    .filter((p: any) => p?.showInNav !== false)
    .sort((a: any, b: any) => {
      const oa = a?.navOrder ?? 999;
      const ob = b?.navOrder ?? 999;
      if (oa !== ob) return oa - ob;
      return String(a?.navTitle || a?.title || "").localeCompare(String(b?.navTitle || b?.title || ""));
    });
}

export async function getChildPages(parentSlug: string): Promise<Page[]> {
  const pages = await getPublishedPages();
  return pages
    .filter((p: any) => p?.parentPage === parentSlug)
    .sort((a: any, b: any) => {
      const oa = a?.order ?? 999;
      const ob = b?.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(a?.title || "").localeCompare(String(b?.title || ""));
    });
}

export async function getPagesByType(pageType: string): Promise<Page[]> {
  const pages = await getPublishedPages();
  const t = (pageType || "").toLowerCase().trim();
  if (!t) return [];
  return pages.filter((p: any) => String(p?.pageType || "").toLowerCase().trim() === t);
}

export async function searchPages(query: string): Promise<Page[]> {
  const pages = await getPublishedPages();
  const q = (query || "").toLowerCase().trim();
  if (!q) return pages;

  return pages.filter((p: any) => {
    const hay = [
      p?.title,
      p?.subtitle,
      p?.description,
      p?.excerpt,
      Array.isArray(p?.tags) ? p.tags.join(" ") : "",
      p?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export async function getRecentPages(limit?: number): Promise<Page[]> {
  const pages = await getPublishedPages();
  const sorted = [...pages].sort((a: any, b: any) => safeTime(b?.date) - safeTime(a?.date));
  return typeof limit === "number" && limit > 0 ? safeSlice(sorted, 0, limit) : sorted;
}

export async function getAllPageCategories(): Promise<string[]> {
  const pages = await loadPagesMeta();
  return [...new Set(pages.map((p: any) => p?.category).filter((c: any) => typeof c === "string" && c.trim()))].sort();
}

export async function getAllPageTags(): Promise<string[]> {
  const pages = await loadPagesMeta();
  const set = new Set<string>();
  pages.forEach((p: any) => (p?.tags || []).forEach((t: any) => typeof t === "string" && set.add(t)));
  return Array.from(set).sort();
}

export async function getAllPageAuthors(): Promise<string[]> {
  const pages = await loadPagesMeta();
  return [...new Set(pages.map((p: any) => p?.author).filter((a: any) => typeof a === "string" && a.trim()))].sort();
}

export async function getAllPageSlugs(): Promise<string[]> {
  const pages = await loadPagesMeta();
  return pages.map((p: any) => p?.slug).filter(Boolean);
}

export async function getHomePage(): Promise<PageWithContent | null> {
  // Heuristics: known slugs first
  const homeSlugs = ["home", "index", "welcome"];
  for (const s of homeSlugs) {
    const p = await getPageBySlug(s);
    if (p) return p;
  }

  const pages = await loadPagesMeta();
  const tagged = pages.find(
    (p: any) =>
      p?.pageType === "home" ||
      p?.template === "home" ||
      (Array.isArray(p?.tags) && p.tags.includes("home"))
  );
  if (tagged) return await getPageBySlug((tagged as any).slug);

  const published = await getPublishedPages();
  if (published[0]) return await getPageBySlug((published[0] as any).slug);

  return null;
}

export async function getPageStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byYear: Record<string, number>;
  byAccessLevel: Record<string, number>;
}> {
  const pages = await loadPagesMeta();

  const stats = {
    total: pages.length,
    published: pages.filter((p: any) => p?.published === true || p?.status === "published").length,
    drafts: pages.filter((p: any) => p?.draft === true || p?.status === "draft").length,
    featured: pages.filter((p: any) => p?.featured === true).length,
    byCategory: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byYear: {} as Record<string, number>,
    byAccessLevel: {} as Record<string, number>,
  };

  pages.forEach((p: any) => {
    if (p?.category) stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
    if (p?.pageType) stats.byType[p.pageType] = (stats.byType[p.pageType] || 0) + 1;

    const al = p?.accessLevel || "public";
    stats.byAccessLevel[al] = (stats.byAccessLevel[al] || 0) + 1;

    if (p?.date) {
      const y = new Date(p.date).getFullYear().toString();
      stats.byYear[y] = (stats.byYear[y] || 0) + 1;
    }
  });

  return stats;
}

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */

const pagesData = {
  getAllPagesMeta,
  getPageBySlug,
  getAllPages,

  canAccessPage,
  getAccessiblePages,

  getPagesByCategory,
  getPagesByTag,
  getFeaturedPages,
  getPublishedPages,
  getNavPages,
  getChildPages,
  getPagesByType,
  searchPages,
  getRecentPages,
  getHomePage,

  getAllPageCategories,
  getAllPageTags,
  getAllPageAuthors,
  getAllPageSlugs,

  getPageStats,

  pageToContentMeta,
  pageToContentEntry,
};

export default pagesData;