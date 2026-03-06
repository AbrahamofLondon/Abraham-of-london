/* ============================================================================
 * ENTERPRISE SEARCH INDEX SYSTEM
 * Version: 3.0.1 (Hardened)
 * ============================================================================ */

import {
  getCardProps,
  documentKinds,
  getPublishedDocumentsByType,
  type ContentDoc,
  type DocKind,
} from "@/lib/content/server";
import { absUrl } from "@/lib/siteConfig";
import { safeSlice } from "@/lib/utils/safe";

export interface SearchDoc {
  type: string;
  slug: string;
  href: string;
  url: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  tags?: string[];
  coverImage?: string | null;
  coverAspect?: string | null;
  category?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function toTime(date?: string | null): number {
  if (!date) return 0;
  const t = Date.parse(date);
  return Number.isFinite(t) ? t : 0;
}

function sortByDate<T extends { date?: string | null }>(docs: T[]): T[] {
  return [...(docs || [])].sort((a, b) => toTime(b.date) - toTime(a.date));
}

function toSearchDoc(doc: ContentDoc): SearchDoc | null {
  if (!doc) return null;

  const props = getCardProps(doc);

  // Hard guard: if helper can’t resolve, skip (prevents junk index)
  const kind = String((props as any).kind || "").trim();
  const slug = String((props as any).slug || "").trim();
  const href = String((props as any).href || "").trim();

  if (!kind || !slug || slug === "unknown" || !href || href === "/") return null;

  return {
    type: kind,
    slug,
    href,
    url: absUrl(href),
    title: String((props as any).title || "Untitled"),
    date: (props as any).dateISO ?? null,
    excerpt: (props as any).description ?? null,
    tags: Array.isArray((props as any).tags) ? (props as any).tags : [],
    coverImage: (props as any).coverImage ?? null,
    coverAspect: (props as any).coverAspect ?? null,
    category: (props as any).category ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Builder + Lazy Singleton                                                   */
/* -------------------------------------------------------------------------- */

function uniqueKinds(kinds: readonly any[]): DocKind[] {
  const set = new Set<string>();
  const out: DocKind[] = [];
  for (const k of kinds || []) {
    const kk = String(k || "").toLowerCase().trim() as DocKind;
    if (!kk) continue;
    if (set.has(kk)) continue;
    set.add(kk);
    out.push(kk);
  }
  return out;
}

export function buildSearchIndex(): SearchDoc[] {
  const kinds = uniqueKinds(documentKinds as any);

  const allSearchDocs: SearchDoc[] = [];

  for (const kind of kinds) {
    const docs = getPublishedDocumentsByType(kind);
    for (const doc of docs) {
      const entry = toSearchDoc(doc);
      if (entry) allSearchDocs.push(entry);
    }
  }

  return sortByDate(allSearchDocs);
}

// Cache in-module (works across imports in same runtime)
let _indexCache: SearchDoc[] | null = null;

export function getSearchIndex(): SearchDoc[] {
  if (_indexCache) return _indexCache;

  try {
    _indexCache = buildSearchIndex();
  } catch (e) {
    // Fail-soft: return empty index rather than crashing server/build
    console.warn("⚠️ [SEARCH_INDEX] Build failed; returning empty index.", e);
    _indexCache = [];
  }

  return _indexCache;
}

/* -------------------------------------------------------------------------- */
/* Query Engine                                                               */
/* -------------------------------------------------------------------------- */

export function searchDocuments(query: string, limit: number = 20): SearchDoc[] {
  const searchTerm = String(query || "").toLowerCase().trim();

  const index = getSearchIndex();

  if (!searchTerm) return safeSlice(index, 0, limit);

  const results = index.filter((doc) => {
    const searchableText = [
      doc.title,
      doc.excerpt ?? "",
      doc.category ?? "",
      (doc.tags ?? []).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm);
  });

  return safeSlice(results, 0, limit);
}