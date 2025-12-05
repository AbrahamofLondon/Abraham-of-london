// ============================================================================
// lib/server/prints-data.ts
// Canonical metadata access for print editions (used by unified-content, etc.)
// Source of truth: lib/prints → lib/print-utils (MOCK_PRINTS for now).
// ============================================================================

import {
  getAllPrintDocuments,
  type PrintDocument,
} from "@/lib/prints";

export type PrintMeta = {
  slug: string;
  title: string;
  description?: string | null;
  excerpt?: string | null;
  date?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[];
  coverImage?: string | null;
  // extra fields allowed but not required
  price?: string;
  available?: boolean;
  dimensions?: string;
};

function normaliseDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  return String(raw);
}

function toPrintMeta(doc: PrintDocument): PrintMeta {
  const anyDoc = doc as any;

  const tags = Array.isArray(anyDoc.tags)
    ? (anyDoc.tags as unknown[]).map((t) => String(t))
    : [];

  return {
    slug: String(doc.slug || "").trim(),
    title: String(doc.title || "Untitled Print"),
    description: anyDoc.description ?? doc.excerpt ?? null,
    excerpt: doc.excerpt ?? anyDoc.description ?? null,
    date: normaliseDate(anyDoc.date ?? doc.date),
    author: anyDoc.author ?? null,
    category: anyDoc.category ?? "Print",
    tags,
    coverImage: anyDoc.coverImage ?? doc.coverImage ?? null,
    price: anyDoc.price ?? "Free",
    available: anyDoc.available !== false,
    dimensions: anyDoc.dimensions ?? null,
  };
}

/**
 * Return all print metadata, sorted newest → oldest.
 */
export function getAllPrintsMeta(): PrintMeta[] {
  try {
    const docs = getAllPrintDocuments();
    const metas = docs.map(toPrintMeta);

    metas.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    return metas;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[prints-data] Error fetching prints metadata:", error);
    return [];
  }
}