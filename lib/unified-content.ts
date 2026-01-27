/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/unified-content.ts
// ✅ Contentlayer-native implementation
// ✅ Supports all Vault types (Canon, Books, Strategy, etc.)

import { safeSlice } from "@/lib/utils/safe";

import {
  getPublishedDocuments,
  getDocKind,
  normalizeSlug,
  getDocHref,
  resolveDocCoverImage,
} from "./contentlayer-helper";

/**
 * Predictable, serialisable unified content shape for UI components.
 */
export interface UnifiedContentSummary {
  id: string;
  type: string;
  slug: string;
  title: string;
  description?: string | null;
  excerpt?: string | null;
  date?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[] | null;
  url: string;
  image?: string | null;
}

/**
 * Normalises raw Contentlayer documents into UnifiedContentSummary.
 */
function normalizeToSummary(doc: any): UnifiedContentSummary {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  
  return {
    id: doc._id ?? `${kind}-${slug}`,
    type: kind,
    slug: slug,
    title: doc.title ?? "Untitled",
    description: doc.description ?? doc.excerpt ?? null,
    excerpt: doc.excerpt ?? doc.description ?? null,
    date: doc.date ? new Date(doc.date).toISOString() : null,
    author: doc.author ?? null,
    category: doc.category ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags : null,
    url: getDocHref(doc),
    image: resolveDocCoverImage(doc),
  };
}

// -----------------------------------------------------------------------------
// DATA ACCESS HELPERS (Async for architecture compatibility)
// -----------------------------------------------------------------------------

export async function getAllUnifiedContentSafe(): Promise<UnifiedContentSummary[]> {
  const docs = getPublishedDocuments();
  return docs.map(normalizeToSummary);
}

export async function getRecentUnifiedContentSafe(limit?: number): Promise<UnifiedContentSummary[]> {
  const all = await getAllUnifiedContentSafe();
  const sorted = all.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return limit ? safeSlice(sorted, 0, limit) : sorted;
}

export async function getUnifiedContentByTypeSafe(type: string): Promise<UnifiedContentSummary[]> {
  const all = await getAllUnifiedContentSafe();
  const target = type.toLowerCase();
  return all.filter(item => item.type === target);
}

export async function getUnifiedContentBySlugSafe(slug: string): Promise<UnifiedContentSummary | null> {
  const all = await getAllUnifiedContentSafe();
  const target = slug.toLowerCase();
  return all.find(item => item.slug === target) || null;
}

export async function getAllTagsSafe(): Promise<string[]> {
  const all = await getAllUnifiedContentSafe();
  const tags = new Set<string>();
  all.forEach(item => item.tags?.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

export async function getAllCategoriesSafe(): Promise<string[]> {
  const all = await getAllUnifiedContentSafe();
  const cats = new Set<string>();
  all.forEach(item => { if (item.category) cats.add(item.category); });
  return Array.from(cats).sort();
}

// -----------------------------------------------------------------------------
// DEFAULT EXPORT
// -----------------------------------------------------------------------------
const UnifiedContentFacade = {
  getAllUnifiedContentSafe,
  getRecentUnifiedContentSafe,
  getUnifiedContentByTypeSafe,
  getUnifiedContentBySlugSafe,
  getAllTagsSafe,
  getAllCategoriesSafe
};

export default UnifiedContentFacade;