// lib/canon.ts - FIXED VERSION
import { allCanons } from "contentlayer/generated";
import type { Canon as ContentlayerCanon } from "contentlayer/generated";

// Alias for clarity
type Canon = ContentlayerCanon;

// SAFE string helper
function safeString(value: any): string {
  if (typeof value === "string") return value;
  return String(value || "");
}

// SAFE normalize function
function norm(s: any): string {
  return safeString(s).trim().toLowerCase();
}

export function getCanonIndexItems(): Array<
  Pick<
    Canon,
    | "slug"
    | "title"
    | "subtitle"
    | "excerpt"
    | "description"
    | "coverImage"
    | "volumeNumber"
    | "date"
    | "tags"
    | "featured"
    | "accessLevel"
    | "lockMessage"
    | "draft"
    | "order"
  >
> {
  return (allCanons || [])
    .filter((c) => c && c.draft !== true && c.draft !== "true")
    .map((c) => ({
      slug: safeString(c.slug),
      title: safeString(c.title),
      subtitle: safeString(c.subtitle),
      excerpt: safeString(c.excerpt),
      description: safeString(c.description),
      coverImage: safeString(c.coverImage),
      volumeNumber: safeString(c.volumeNumber),
      date: safeString(c.date),
      tags: Array.isArray(c.tags) ? c.tags.map(t => safeString(t)) : [],
      featured: Boolean(c.featured),
      accessLevel: safeString(c.accessLevel),
      lockMessage: safeString(c.lockMessage),
      draft: Boolean(c.draft),
      order: typeof c.order === "number" ? c.order : 0,
    }));
}

/** ✅ FULL DOC (includes body.code) — this is what the slug page must use */
export function getCanonDocBySlug(slug: string): Canon | null {
  const target = norm(slug);
  const doc =
    (allCanons || []).find((c) => norm(c.slug) === target) ??
    (allCanons || []).find((c) => norm(c._raw?.flattenedPath?.split("/").pop() || "") === target) ??
    null;

  return doc;
}

/** ✅ Get public canon documents (non-draft, public access) */
export function getPublicCanon(): Canon[] {
  return (allCanons || []).filter(
    (c) => 
      c && 
      c.draft !== true && 
      c.draft !== "true" && 
      (!c.accessLevel || c.accessLevel === 'public')
  );
}

/** ✅ Get all canon documents (excluding drafts) */
export function getAllCanons(): Canon[] {
  return (allCanons || []).filter(
    (c) => c && c.draft !== true && c.draft !== "true"
  );
}

/** ✅ Get featured canon documents */
export function getFeaturedCanons(): Canon[] {
  return (allCanons || []).filter(
    (c) => c && c.draft !== true && c.draft !== "true" && c.featured === true
  );
}

/** ✅ Get canon by slug with type safety */
export function getCanonBySlug(slug: string): Canon | undefined {
  return (allCanons || []).find(
    (c) => c && norm(c.slug) === norm(slug) && c.draft !== true && c.draft !== "true"
  );
}

// Also export isCanon type guard for consistency
export function isCanon(doc: any): doc is ContentlayerCanon {
  return doc?.type === "Canon";
}

// Re-export the Canon type
export type { Canon };