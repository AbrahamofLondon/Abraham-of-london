// ============================================================================
// FILE 1: lib/server/prints-data.ts
// ============================================================================

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

export type PrintMeta = MdxMeta & {
  description?: string;
  excerpt?: string;
  coverImage?: string;
  dimensions?: string;
  downloadFile?: string;
  price?: string;
  available?: boolean;
  category?: string;
  tags?: string[];
};

export type PrintWithContent = PrintMeta & {
  content: string;
};

// ----------------- helpers -----------------

function cleanSlug(raw: unknown): string {
  return String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function normalisePrintSlug(raw: unknown): string {
  const s = cleanSlug(raw);
  return s.replace(/^prints?\//i, "");
}

function normaliseDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (raw instanceof Date) {
    return raw.toISOString().split("T")[0];
  }
  return String(raw);
}

function fromMdxMeta(meta: MdxMeta): PrintMeta {
  const anyMeta = meta as any;
  const tags = Array.isArray(anyMeta.tags)
    ? (anyMeta.tags as unknown[]).map((t) => String(t))
    : undefined;

  return {
    ...meta,
    slug: normalisePrintSlug(meta.slug),
    date: normaliseDate(anyMeta.date),
    description: anyMeta.description ?? meta.excerpt ?? undefined,
    excerpt: anyMeta.excerpt ?? anyMeta.description ?? meta.excerpt ?? undefined,
    coverImage: anyMeta.coverImage ?? undefined,
    dimensions: anyMeta.dimensions ?? undefined,
    downloadFile: anyMeta.downloadFile ?? undefined,
    price: anyMeta.price ?? "Free",
    available: anyMeta.available !== false, // default to true
    category: anyMeta.category ?? "Printables",
    tags,
  };
}

function fromMdxDocument(doc: MdxDocument): PrintWithContent {
  const meta = fromMdxMeta(doc);
  return {
    ...meta,
    content: doc.content,
  };
}

// ----------------- public API -----------------

export function getAllPrintsMeta(): PrintMeta[] {
  try {
    const metas = getMdxCollectionMeta("prints");
    return metas.map(fromMdxMeta);
  } catch (error) {
    console.error("[prints] Error fetching prints metadata:", error);
    return [];
  }
}

export function getPrintSlugs(): string[] {
  return getAllPrintsMeta()
    .map((m) => m.slug)
    .filter((s): s is string => Boolean(s && s.trim()));
}

export function getPrintBySlug(slug: string): PrintWithContent | null {
  try {
    const key = normalisePrintSlug(slug);
    const doc = getMdxDocumentBySlug("prints", key);
    
    if (!doc) {
      return null;
    }

    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[prints] Error fetching print by slug "${slug}":`, error);
    return null;
  }
}