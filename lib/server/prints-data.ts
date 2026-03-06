// lib/server/prints-data.ts - SSOT ALIGNED (ASYNC)
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Print, ContentEntry, ContentMeta } from "@/types/index";
import { safeSlice } from "@/lib/utils/safe";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

export type PrintWithContent = Print & { content: string };

type PrintishMdxMeta = MdxMeta & Partial<Print> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type PrintishMdxDocument = MdxDocument & { content: string } & Partial<Print>;

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "1") return true;
    if (lower === "false" || lower === "no" || lower === "0") return false;
  }
  if (typeof value === "number") return value === 1;
  return undefined;
}
function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}
function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") return value;
  return undefined;
}
function safeAccessLevel(value: unknown): AccessTier | undefined {
  if (!value) return undefined;
  return normalizeRequiredTier(value);
}
function safePrintType(value: unknown): "digital" | "physical" | "limited" | "open" | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toLowerCase().trim();
  if (v === "digital" || v === "physical" || v === "limited" || v === "open") return v as any;
  return undefined;
}
function safePrintStatus(value: unknown): "available" | "sold-out" | "coming-soon" | "discontinued" | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toLowerCase().trim();
  if (v === "available" || v === "sold-out" || v === "coming-soon" || v === "discontinued") return v as any;
  return undefined;
}

function fromMdxMeta(meta: MdxMeta): Print {
  const m = meta as PrintishMdxMeta;
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);

  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled Print";

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
    readTime: safeString((m as any).readTime) || safeNumber((m as any).readTime),

    coverImage: safeString(m.coverImage) || safeString((m as any).image),

    printType: safePrintType((m as any).printType) || "digital",
    printStatus: safePrintStatus((m as any).printStatus) || "available",
    price: safeNumber((m as any).price),
    originalPrice: safeNumber((m as any).originalPrice),
    currency: safeString((m as any).currency) || "USD",
    dimensions: safeString((m as any).dimensions),
    paperType: safeString((m as any).paperType),
    printSize: safeString((m as any).printSize),
    editionSize: safeNumber((m as any).editionSize),
    editionNumber: safeNumber((m as any).editionNumber),
    signature: safeBoolean((m as any).signature),
    numbered: safeBoolean((m as any).numbered),
    certificate: safeBoolean((m as any).certificate),
    frameIncluded: safeBoolean((m as any).frameIncluded),
    inStock: (safeBoolean((m as any).inStock) ?? true) as any,
    stockQuantity: safeNumber((m as any).stockQuantity),
    purchaseUrl: safeString((m as any).purchaseUrl),
    maxPurchaseQuantity: safeNumber((m as any).maxPurchaseQuantity),
    sale: safeBoolean((m as any).sale),
    saleEndDate: safeString((m as any).saleEndDate),
    lastModified: safeString((m as any).lastModified),

    draft: safeBoolean(m.draft),
    published: m.published === undefined ? true : safeBoolean(m.published),
    status: safeStatus((m as any).status),

    accessLevel: safeAccessLevel((m as any).accessLevel) || "public",
    lockMessage: safeString((m as any).lockMessage),

    _raw: (m as any)._raw,
    _id: safeString((m as any)._id),
    url: safeString((m as any).url),
    type: safeString((m as any).type) || "print",

    ...Object.fromEntries(
      Object.entries(m).filter(([key]) => ![
        "slug","title","description","excerpt","subtitle",
        "date","author","category","tags","featured","readTime",
        "coverImage","image",
        "printType","printStatus","price","originalPrice","currency",
        "dimensions","paperType","printSize","editionSize","editionNumber",
        "signature","numbered","certificate","frameIncluded","inStock","stockQuantity",
        "purchaseUrl","maxPurchaseQuantity","sale","saleEndDate","lastModified",
        "draft","published","status","accessLevel","lockMessage",
        "_raw","_id","url","type","publishDate","releaseDate"
      ].includes(key))
    ),
  } as any;
}

function fromMdxDocument(doc: MdxDocument): PrintWithContent {
  const printDoc = doc as PrintishMdxDocument;
  const { content, body, ...rest } = printDoc as any;
  const meta = fromMdxMeta(rest);
  return { ...(meta as any), content: typeof content === "string" ? content : "", body: body || undefined };
}

export function printToContentMeta(print: Print): ContentMeta {
  const { content, body, ...meta } = print as any;
  return meta as any;
}
export function printToContentEntry(print: Print): ContentEntry {
  return {
    slug: (print as any).slug,
    title: (print as any).title,
    date: (print as any).date,
    excerpt: (print as any).excerpt,
    description: (print as any).description,
    category: (print as any).category,
    tags: (print as any).tags,
    featured: (print as any).featured,
    readTime: (print as any).readTime,
    _raw: (print as any)._raw,
  } as any;
}

export function canAccessPrint(print: Print, userTier?: string | AccessTier | null): boolean {
  const user = normalizeUserTier(userTier || "public");
  const required = (print as any).accessLevel || "public";
  return hasAccess(user, required);
}

let _printsMetaPromise: Promise<Print[]> | null = null;
async function loadPrintsMeta(): Promise<Print[]> {
  if (_printsMetaPromise) return _printsMetaPromise;

  _printsMetaPromise = (async () => {
    const metas = await getMdxCollectionMeta("prints");
    const prints = (metas || []).map((m) => fromMdxMeta(m));
    return prints.filter((p: any) => p?.slug && p?.title);
  })().catch((err) => {
    console.error("Error fetching all prints meta:", err);
    return [];
  });

  return _printsMetaPromise;
}

export async function getAllPrintsMeta(): Promise<Print[]> {
  return await loadPrintsMeta();
}

export async function getPrintBySlug(slug: string): Promise<PrintWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("prints", slug);
    if (!doc) return null;
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching print by slug (${slug}):`, error);
    return null;
  }
}

export async function getAllPrints(): Promise<PrintWithContent[]> {
  const metas = await loadPrintsMeta();
  const out: PrintWithContent[] = [];
  for (const meta of metas) {
    const p = await getPrintBySlug((meta as any).slug);
    if (p) out.push(p);
  }
  return out;
}

export async function getAccessiblePrints(userTier?: string | AccessTier | null): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  const user = normalizeUserTier(userTier || "public");
  return prints.filter((p: any) => hasAccess(user, p.accessLevel || "public"));
}

export async function getPrintsByCategory(category: string): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  const c = String(category || "").toLowerCase().trim();
  return prints.filter((p: any) => String(p?.category || "").toLowerCase().trim() === c);
}

export async function getPrintsByTag(tag: string): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  const t = String(tag || "").toLowerCase().trim();
  return prints.filter((p: any) => Array.isArray(p?.tags) && p.tags.some((x: any) => String(x).toLowerCase().trim() === t));
}

export async function getFeaturedPrints(): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  return prints.filter((p: any) => p?.featured === true && p?.draft !== true);
}

export async function getPublishedPrints(): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  return prints.filter((p: any) => p?.draft !== true && p?.status !== "draft" && (p?.published === true || p?.published === undefined || p?.status === "published"));
}

export async function getAvailablePrints(): Promise<Print[]> {
  const prints = await getPublishedPrints();
  return prints.filter((p: any) => p?.inStock === true || (typeof p?.stockQuantity === "number" && p.stockQuantity > 0));
}

export async function getPrintsByType(printType: string): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  const t = String(printType || "").toLowerCase().trim();
  return prints.filter((p: any) => String(p?.printType || "").toLowerCase().trim() === t);
}

export async function getPrintsByStatus(status: string): Promise<Print[]> {
  const prints = await loadPrintsMeta();
  const s = String(status || "").toLowerCase().trim();
  return prints.filter((p: any) => String(p?.printStatus || "").toLowerCase().trim() === s);
}

export async function getPrintsOnSale(): Promise<Print[]> {
  const prints = await getAvailablePrints();
  return prints.filter((p: any) => p?.sale === true);
}

export async function searchPrints(query: string): Promise<Print[]> {
  const prints = await getAvailablePrints();
  const q = String(query || "").toLowerCase().trim();
  if (!q) return prints;

  return prints.filter((p: any) => {
    const hay = [
      p.title, p.subtitle, p.description, p.excerpt, p.author,
      Array.isArray(p.tags) ? p.tags.join(" ") : "",
      p.category, p.paperType, p.dimensions
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export async function getRecentPrints(limit?: number): Promise<Print[]> {
  const prints = await getAvailablePrints();
  const sorted = [...prints].sort((a: any, b: any) => {
    const da = a?.date ? Date.parse(String(a.date)) : 0;
    const db = b?.date ? Date.parse(String(b.date)) : 0;
    return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
  });
  return typeof limit === "number" ? safeSlice(sorted, 0, limit) : sorted;
}

export async function getLimitedEditionPrints(): Promise<Print[]> {
  const prints = await getAvailablePrints();
  return prints.filter((p: any) => p?.printType === "limited" || p?.editionSize !== undefined);
}
export async function getDigitalPrints(): Promise<Print[]> {
  const prints = await getAvailablePrints();
  return prints.filter((p: any) => p?.printType === "digital");
}
export async function getPhysicalPrints(): Promise<Print[]> {
  const prints = await getAvailablePrints();
  return prints.filter((p: any) => p?.printType === "physical");
}

export async function getAllPrintCategories(): Promise<string[]> {
  const prints = await loadPrintsMeta();
  return [...new Set(prints.map((p: any) => p?.category).filter((x: any) => typeof x === "string" && x.trim()))].sort();
}
export async function getAllPrintTags(): Promise<string[]> {
  const prints = await loadPrintsMeta();
  const tags = new Set<string>();
  prints.forEach((p: any) => (p?.tags || []).forEach((t: any) => typeof t === "string" && tags.add(t)));
  return Array.from(tags).sort();
}
export async function getAllPrintAuthors(): Promise<string[]> {
  const prints = await loadPrintsMeta();
  return [...new Set(prints.map((p: any) => p?.author).filter((x: any) => typeof x === "string" && x.trim()))].sort();
}
export async function getAllPrintSlugs(): Promise<string[]> {
  const prints = await loadPrintsMeta();
  return prints.map((p: any) => p?.slug).filter(Boolean);
}

export async function getPrintStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  featured: number;
  available: number;
  digital: number;
  physical: number;
  limited: number;
  onSale: number;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
}> {
  const prints = await loadPrintsMeta();
  const available = await getAvailablePrints();

  const stats = {
    total: prints.length,
    published: prints.filter((p: any) => p?.published === true || p?.status === "published").length,
    drafts: prints.filter((p: any) => p?.draft === true || p?.status === "draft").length,
    featured: prints.filter((p: any) => p?.featured === true).length,
    available: available.length,
    digital: available.filter((p: any) => p?.printType === "digital").length,
    physical: available.filter((p: any) => p?.printType === "physical").length,
    limited: available.filter((p: any) => p?.printType === "limited").length,
    onSale: available.filter((p: any) => p?.sale === true).length,
    byCategory: {} as Record<string, number>,
    byYear: {} as Record<string, number>,
  };

  prints.forEach((p: any) => {
    if (p?.category) stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
    if (p?.date) {
      const y = new Date(p.date).getFullYear().toString();
      stats.byYear[y] = (stats.byYear[y] || 0) + 1;
    }
  });

  return stats;
}

const printsData = {
  getAllPrintsMeta,
  getPrintBySlug,
  getAllPrints,
  canAccessPrint,
  getAccessiblePrints,
  getPrintsByCategory,
  getPrintsByTag,
  getFeaturedPrints,
  getPublishedPrints,
  getAvailablePrints,
  getPrintsByType,
  getPrintsByStatus,
  getPrintsOnSale,
  searchPrints,
  getRecentPrints,
  getLimitedEditionPrints,
  getDigitalPrints,
  getPhysicalPrints,
  getAllPrintCategories,
  getAllPrintTags,
  getAllPrintAuthors,
  getAllPrintSlugs,
  getPrintStats,
  printToContentMeta,
  printToContentEntry,
};

export default printsData;