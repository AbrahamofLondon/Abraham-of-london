// lib/canon.ts
import {
  allCanons,
  getPublishedDocuments,
  getDocumentBySlug,
  type Canon as CanonDocument,
} from "./contentlayer-helper";

/**
 * Return all Canon documents (including drafts if you ever decide to).
 * Currently we only return published (non-draft) items.
 */
export function getAllCanon(): CanonDocument[] {
  return getPublishedDocuments(allCanons as CanonDocument[]);
}

/**
 * Return a single Canon volume by slug.
 */
export function getCanonBySlug(slug: string): CanonDocument | undefined {
  const doc = getDocumentBySlug(slug, "Canon");
  return doc as CanonDocument | undefined;
}

/**
 * Return featured Canon volumes (featured = true in frontmatter).
 */
export function getFeaturedCanon(): CanonDocument[] {
  return getAllCanon().filter((canon) => (canon as any).featured === true);
}

/**
 * Return Canon volumes ordered by their "order" field (ascending).
 */
export function getOrderedCanon(): CanonDocument[] {
  return getAllCanon().sort((a, b) => {
    const aOrder = typeof a.order === "number" ? a.order : 9999;
    const bOrder = typeof b.order === "number" ? b.order : 9999;
    return aOrder - bOrder;
  });
}

// Re-export the Canon type for convenience
export type Canon = CanonDocument;