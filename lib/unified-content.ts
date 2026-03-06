/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/unified-content.ts
// ✅ Server-only unified content facade (guarded)

import { safeSlice } from "@/lib/utils/safe";
import {
  getAllCombinedDocs,
  getDocKind,
  normalizeSlug,
  getDocHref,
  resolveDocCoverImage,
} from "@/lib/content/server";

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

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("UnifiedContentFacade is server-only. Do not import in client code.");
  }
}

function toISO(value: any): string | null {
  if (!value) return null;
  const t = Date.parse(String(value));
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function normalizeToSummary(doc: any): UnifiedContentSummary {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");

  return {
    id: doc._id ?? `${kind}-${slug}`,
    type: kind,
    slug,
    title: doc.title ?? "Untitled",
    description: doc.description ?? doc.excerpt ?? null,
    excerpt: doc.excerpt ?? doc.description ?? null,
    date: toISO(doc.date),
    author: doc.author ?? null,
    category: doc.category ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags : null,
    url: getDocHref(doc),
    image: resolveDocCoverImage(doc),
  };
}

// -----------------------------------------------------------------------------
// SYNCHRONOUS VERSION
// -----------------------------------------------------------------------------
export function getUnifiedContent(limit = 50): UnifiedContentSummary[] {
  assertServerOnly();
  const docs = getAllCombinedDocs();
  const normalized = docs.map(normalizeToSummary);
  return safeSlice(normalized, 0, limit);
}

// -----------------------------------------------------------------------------
// ASYNC VERSION (kept for compatibility; still server-only)
// -----------------------------------------------------------------------------
export async function getAllUnifiedContentSafe(): Promise<UnifiedContentSummary[]> {
  assertServerOnly();
  const docs = getAllCombinedDocs();
  return docs.map(normalizeToSummary);
}

export async function getRecentUnifiedContentSafe(limit?: number): Promise<UnifiedContentSummary[]> {
  assertServerOnly();
  const all = await getAllUnifiedContentSafe();
  const sorted = all.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
  return limit ? safeSlice(sorted, 0, limit) : sorted;
}

export async function getUnifiedContentByTypeSafe(type: string): Promise<UnifiedContentSummary[]> {
  assertServerOnly();
  const all = await getAllUnifiedContentSafe();
  const target = String(type || "").toLowerCase().trim();
  return all.filter((item) => item.type === target);
}

export async function getUnifiedContentBySlugSafe(slug: string): Promise<UnifiedContentSummary | null> {
  assertServerOnly();
  const all = await getAllUnifiedContentSafe();
  const target = normalizeSlug(String(slug || ""));
  return all.find((item) => item.slug === target) || null;
}

export async function getAllTagsSafe(): Promise<string[]> {
  assertServerOnly();
  const all = await getAllUnifiedContentSafe();
  const tags = new Set<string>();
  all.forEach((item) => item.tags?.forEach((t) => tags.add(String(t))));
  return Array.from(tags).sort();
}

export async function getAllCategoriesSafe(): Promise<string[]> {
  assertServerOnly();
  const all = await getAllUnifiedContentSafe();
  const cats = new Set<string>();
  all.forEach((item) => {
    if (item.category) cats.add(String(item.category));
  });
  return Array.from(cats).sort();
}

const UnifiedContentFacade = {
  getUnifiedContent,
  getAllUnifiedContentSafe,
  getRecentUnifiedContentSafe,
  getUnifiedContentByTypeSafe,
  getUnifiedContentBySlugSafe,
  getAllTagsSafe,
  getAllCategoriesSafe,
};

export default UnifiedContentFacade;