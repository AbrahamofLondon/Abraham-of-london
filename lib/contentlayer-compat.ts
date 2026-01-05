// lib/contentlayer-compat.ts
// COMPLETE EXPORT LAYER — compat wrapper around Contentlayer "generated" exports

import {
  allBooks,
  allCanons,
  allDocuments,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
  // IMPORTANT: alias to avoid collision with our wrapper below
  getDocumentBySlug as getDocumentBySlugRaw,
  getPublishedDocuments,
} from "@/lib/contentlayer";

// Type exports for compatibility
export type {
  Book,
  Canon,
  Download,
  Event,
  Post,
  Print,
  Resource,
  Short,
  Strategy,
} from "@/lib/contentlayer";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/, "");
}

export function isDraftContent(doc: any): boolean {
  return Boolean(doc?.draft) || doc?.status === "draft";
}

export function isDraft(doc: any): boolean {
  return isDraftContent(doc);
}

// -----------------------------------------------------------------------------
// Core accessors (draft-filtered)
// -----------------------------------------------------------------------------
export function getAllPosts() {
  return allPosts.filter((p: any) => !isDraftContent(p));
}
export function getAllBooks() {
  return allBooks.filter((b: any) => !isDraftContent(b));
}
export function getAllCanons() {
  return allCanons.filter((c: any) => !isDraftContent(c));
}
export function getAllDownloads() {
  return allDownloads.filter((d: any) => !isDraftContent(d));
}
export function getAllEvents() {
  return allEvents.filter((e: any) => !isDraftContent(e));
}
export function getAllPrints() {
  return allPrints.filter((p: any) => !isDraftContent(p));
}
export function getAllResources() {
  return allResources.filter((r: any) => !isDraftContent(r));
}
export function getAllShorts() {
  return allShorts.filter((s: any) => !isDraftContent(s));
}
export function getAllStrategies() {
  return allStrategies.filter((st: any) => !isDraftContent(st));
}

export function getRecentShorts(count: number = 10) {
  const shorts = getAllShorts();
  return shorts
    .slice()
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

export function getAllContentlayerDocs() {
  return [
    ...getAllPosts(),
    ...getAllBooks(),
    ...getAllCanons(),
    ...getAllDownloads(),
    ...getAllEvents(),
    ...getAllPrints(),
    ...getAllResources(),
    ...getAllShorts(),
    ...getAllStrategies(),
  ];
}

// Published “aliases”
export function getPublishedPosts() {
  return getAllPosts();
}
export function getPublishedShorts() {
  return getAllShorts();
}
export function getPublishedDownloads() {
  return getAllDownloads();
}

// -----------------------------------------------------------------------------
// Per-type getters (draft-filtered)
// -----------------------------------------------------------------------------
export function getPostBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const post = allPosts.find((p: any) => normalizeSlug(p.slug || p._raw.flattenedPath) === normalized);
  return post && !isDraftContent(post) ? post : null;
}

export function getBookBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const book = allBooks.find((b: any) => normalizeSlug(b.slug || b._raw.flattenedPath) === normalized);
  return book && !isDraftContent(book) ? book : null;
}

export function getDownloadBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const download = allDownloads.find((d: any) => normalizeSlug(d.slug || d._raw.flattenedPath) === normalized);
  return download && !isDraftContent(download) ? download : null;
}

export function getCanonBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const canon = allCanons.find((c: any) => normalizeSlug(c.slug || c._raw.flattenedPath) === normalized);
  return canon && !isDraftContent(canon) ? canon : null;
}

export function getEventBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const event = allEvents.find((e: any) => normalizeSlug(e.slug || e._raw.flattenedPath) === normalized);
  return event && !isDraftContent(event) ? event : null;
}

export function getPrintBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const print = allPrints.find((p: any) => normalizeSlug(p.slug || p._raw.flattenedPath) === normalized);
  return print && !isDraftContent(print) ? print : null;
}

export function getStrategyBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const strategy = allStrategies.find((s: any) => normalizeSlug(s.slug || s._raw.flattenedPath) === normalized);
  return strategy && !isDraftContent(strategy) ? strategy : null;
}

// -----------------------------------------------------------------------------
// Unified getter (THIS is the wrapper you want)
// -----------------------------------------------------------------------------
export function getDocumentBySlug(slug: string) {
  const normalized = normalizeSlug(slug);

  // Prefer raw Contentlayer getter if present, then enforce your filters
  const raw = getDocumentBySlugRaw ? getDocumentBySlugRaw(normalized as any) : null;
  if (raw && !isDraftContent(raw)) return raw;

  // Fallback: scan all types
  const allDocs = [
    ...allPosts,
    ...allBooks,
    ...allCanons,
    ...allDownloads,
    ...allEvents,
    ...allPrints,
    ...allResources,
    ...allShorts,
    ...allStrategies,
  ];

  const doc = allDocs.find((d: any) => normalizeSlug(d.slug || d._raw.flattenedPath) === normalized);
  return doc && !isDraftContent(doc) ? doc : null;
}

// -----------------------------------------------------------------------------
// Routing helpers
// -----------------------------------------------------------------------------
export function getDocHref(doc: any): string {
  if (!doc) return "/";

  const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
  const type = (doc._type || doc.type || "").toLowerCase();

  switch (type) {
    case "book":
      return `/books/${slug}`;
    case "canon":
      return `/canon/${slug}`;
    case "download":
      return `/downloads/${slug}`;
    case "event":
      return `/events/${slug}`;
    case "short":
      return `/shorts/${slug}`;
    case "print":
      return `/prints/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    case "strategy":
      return `/strategies/${slug}`;
    case "post":
    default:
      return `/blog/${slug}`;
  }
}

export function toUiDoc(doc: any) {
  return {
    ...doc,
    href: getDocHref(doc),
    slug: normalizeSlug(doc.slug || doc._raw?.flattenedPath || ""),
    isDraft: isDraft(doc),
  };
}

// Legacy exports (arrays + published list)
export {
  allBooks,
  allCanons,
  allDocuments,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
  getPublishedDocuments,
};

// Optional: expose raw getter under a different name (useful for debugging)
export { getDocumentBySlugRaw };