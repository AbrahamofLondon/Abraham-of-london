// lib/content/unified-router.ts — PRODUCTION-HARDENED (Zero-Leak Mapping)
import {
  allPosts,
  allShorts,
  allDownloads,
} from "contentlayer/generated";

// Minimal structural typing (avoids import-type breakage if Contentlayer changes)
type BaseDoc = {
  type: string;
  slug?: string;
  _raw: { flattenedPath: string };
};

export type UnifiedDoc = BaseDoc;
export type DocType = "dispatch" | "short" | "vault";

interface RouteMap {
  type: DocType;
  prefix: string;
  collection: BaseDoc[];
}

// Defensive: collections always exist, even if empty
const POSTS = (allPosts as unknown as BaseDoc[]) ?? [];
const SHORTS = (allShorts as unknown as BaseDoc[]) ?? [];
const DOWNLOADS = (allDownloads as unknown as BaseDoc[]) ?? [];

const ROUTE_CONFIG: Record<string, RouteMap> = {
  Post: { type: "dispatch", prefix: "registry/dispatches", collection: POSTS },
  Short: { type: "short", prefix: "registry/shorts", collection: SHORTS },
  Download: { type: "vault", prefix: "vault", collection: DOWNLOADS },
};

// Normalizer: tolerate unexpected doc.type values
function resolveRoute(docType: string): RouteMap | null {
  if (ROUTE_CONFIG[docType]) return ROUTE_CONFIG[docType];

  // fallback heuristics (flattenedPath based)
  // (keeps you live even if doc.type naming changes)
  return null;
}

/**
 * Resolves the absolute URL for any document in the system.
 */
export function getDocHref(doc: UnifiedDoc): string {
  const config = resolveRoute(doc.type);

  const fp = doc._raw?.flattenedPath || "";
  const last = fp.split("/").pop() || "";
  const slug = doc.slug || last;

  if (!config) return `/${fp}`;
  return `/${config.prefix}/${slug}`;
}

/**
 * Global lookup for any slug across all collections.
 */
export function getDocBySlug(slug: string, type?: DocType) {
  const allDocs = [...POSTS, ...SHORTS, ...DOWNLOADS];

  return allDocs.find((doc) => {
    const fp = doc._raw?.flattenedPath || "";
    const last = fp.split("/").pop() || "";
    const docSlug = doc.slug || last;

    if (docSlug !== slug) return false;

    if (!type) return true;

    const cfg = resolveRoute(doc.type);
    return cfg ? cfg.type === type : false;
  });
}