// lib/canon.ts
import { allCanons, type Canon } from "@/lib/contentlayer";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const norm = (v: unknown) => String(v || "").trim().toLowerCase();

/**
 * Determines visibility based on draft status and explicit access level
 */
export function isPublicCanon(canon: Canon): boolean {
  if (canon.draft) return false;
  const access = canon.accessLevel || "public";
  return access === "public";
}

/**
 * RESTORED: Get access level for a document (required by pages/canon/[slug].tsx)
 */
export function getAccessLevel(canon: Canon | undefined): string {
  if (!canon) return "public";
  return canon.accessLevel || "public";
}

/**
 * Robust slug resolver handling standard slug field and fallback to file path
 */
export function resolveCanonSlug(canon: Canon): string {
  if (canon.slug) return norm(canon.slug).replace(/\/+$/, "");
  
  // Fallback to filename if slug is missing
  const pathParts = canon._raw.flattenedPath.split('/');
  return norm(pathParts[pathParts.length - 1]);
}

/* -------------------------------------------------------------------------- */
/* Getters                                                                    */
/* -------------------------------------------------------------------------- */

export function getAllCanons(): Canon[] {
  return allCanons;
}

export function getPublicCanons(): Canon[] {
  return allCanons.filter(isPublicCanon).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getCanonBySlug(slug: string): Canon | undefined {
  const target = norm(slug);
  return allCanons.find(c => resolveCanonSlug(c) === target);
}

/**
 * RESTORED: Alias for getCanonBySlug (required by existing pages)
 */
export const getCanonDocBySlug = getCanonBySlug;

/* -------------------------------------------------------------------------- */
/* Index Mapping (For Grid Views)                                             */
/* -------------------------------------------------------------------------- */

export type CanonIndexItem = {
  slug: string;
  title: string;
  volumeNumber: number | null;
  coverImage: string | null;
  excerpt: string | null;
  accessLevel: string;
};

export function getCanonIndexItems(): CanonIndexItem[] {
  return getPublicCanons().map((c) => ({
    slug: resolveCanonSlug(c),
    title: c.title || "Untitled Canon",
    volumeNumber: typeof c.volumeNumber === 'number' ? c.volumeNumber : null,
    coverImage: c.coverImage || null,
    excerpt: c.description || null,
    accessLevel: c.accessLevel || "public",
  }));
}