// lib/content/unified-router.ts — PRODUCTION-HARDENED (Zero-Leak Mapping)
import { allPosts, allShorts, allDownloads, type Post, type Short, type Download } from 'contentlayer/generated';

export type UnifiedDoc = Post | Short | Download;

export type DocType = 'dispatch' | 'short' | 'vault';

interface RouteMap {
  type: DocType;
  prefix: string;
  collection: UnifiedDoc[];
}

const ROUTE_CONFIG: Record<string, RouteMap> = {
  Post: { type: 'dispatch', prefix: 'registry/dispatches', collection: allPosts },
  Short: { type: 'short', prefix: 'registry/shorts', collection: allShorts },
  Download: { type: 'vault', prefix: 'vault', collection: allDownloads },
};

/**
 * Resolves the absolute URL for any document in the system.
 */
export function getDocHref(doc: UnifiedDoc): string {
  const config = ROUTE_CONFIG[doc.type];
  if (!config) return `/${doc._raw.flattenedPath}`;
  
  const slug = doc.slug || doc._raw.flattenedPath.split('/').pop() || "";
  return `/${config.prefix}/${slug}`;
}

/**
 * Global lookup for any slug across all collections.
 * Essential for the 163-brief unified search.
 */
export function getDocBySlug(slug: string, type?: DocType) {
  const allDocs = [...allPosts, ...allShorts, ...allDownloads];
  
  return allDocs.find((doc) => {
    const docSlug = doc.slug || doc._raw.flattenedPath.split('/').pop();
    const matchesSlug = docSlug === slug;
    if (type) {
      return matchesSlug && ROUTE_CONFIG[doc.type]?.type === type;
    }
    return matchesSlug;
  });
}