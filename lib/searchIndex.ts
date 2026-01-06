/* ============================================================================
 * ENTERPRISE SEARCH INDEX SYSTEM
 * Version: 3.0.0
 * * Fully synchronized with ContentHelper v5.0.0
 * ============================================================================ */

import ContentHelper, { 
  type ContentDoc,
  type DocKind 
} from "./contentlayer-helper";
import { absUrl } from "@/lib/siteConfig";

/* -------------------------------------------------------------------------- */
/* 1. SEARCH INDEX SHAPE                                                      */
/* -------------------------------------------------------------------------- */

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
/* 2. UTILITIES                                                               */
/* -------------------------------------------------------------------------- */

function sortByDate<T extends { date?: string | null }>(docs: T[]): T[] {
  return [...(docs || [])].sort((a, b) => {
    const ta = a.date ? +new Date(a.date) : 0;
    const tb = b.date ? +new Date(b.date) : 0;
    return tb - ta;
  });
}

/**
 * Transforms any document from the 24 contexts into a searchable shape.
 * Uses getCardProps to resolve casing differences (readTime/readtime)
 * and positioning fields (coverFit).
 */
function toSearchDoc(doc: ContentDoc): SearchDoc | null {
  if (!doc) return null;

  const props = ContentHelper.getCardProps(doc);
  
  // Filter out any documents that failed to resolve correctly
  if (props.slug === "unknown") return null;

  return {
    type: props.kind,
    slug: props.slug,
    href: props.href,
    url: absUrl(props.href),
    title: props.title,
    date: props.dateISO ?? null,
    excerpt: props.description ?? null, // Uses the safe extraction from helper
    tags: props.tags ?? [],
    coverImage: props.coverImage ?? null,
    coverAspect: props.coverAspect ?? null,
    category: props.category ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* 3. AUTOMATED INDEX BUILDER                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Iterates through all 24 document kinds defined in ContentHelper
 * and flattens them into a single sorted index.
 */
export function buildSearchIndex(): SearchDoc[] {
  // Use the master list of document kinds from the helper
  const allKinds = ContentHelper.documentKinds;
  
  const allSearchDocs: SearchDoc[] = [];

  allKinds.forEach((kind: DocKind) => {
    const docs = ContentHelper.getPublishedDocumentsByType(kind);
    docs.forEach(doc => {
      const searchEntry = toSearchDoc(doc);
      if (searchEntry) allSearchDocs.push(searchEntry);
    });
  });

  return sortByDate(allSearchDocs);
}

// Global Singleton for the Search Index
export const searchIndex: SearchDoc[] = buildSearchIndex();

/* -------------------------------------------------------------------------- */
/* 4. QUERY ENGINE                                                            */
/* -------------------------------------------------------------------------- */

export function searchDocuments(query: string, limit: number = 20): SearchDoc[] {
  const searchTerm = query.toLowerCase().trim();
  
  // Return recent content if no query provided
  if (!searchTerm) return searchIndex.slice(0, limit);

  return searchIndex
    .filter((doc) => {
      const searchableText = [
        doc.title, 
        doc.excerpt ?? "", 
        doc.category ?? "",
        (doc.tags ?? []).join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    })
    .slice(0, limit);
}
