// lib/canon.ts — CANONICAL (ASYNC, NO allCanons IMPORTS)

import { getContentlayerData, isDraftContent } from "@/lib/contentlayer-compat";

export type Canon = any;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

// Local normalizeSlug function since it's not exported from contentlayer-compat
function normalizeSlug(slug: string): string {
  if (!slug) return "";
  // Remove file extensions and trailing slashes
  return slug
    .replace(/\.(md|mdx)$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .trim();
}

const norm = (v: unknown) => normalizeSlug(String(v || ""));

export function isPublicCanon(canon: Canon): boolean {
  if (!canon) return false;
  if (isDraftContent(canon)) return false;
  if (canon.draft) return false;

  const access = String(canon.accessLevel || canon.tier || "public");
  return access === "public";
}

/** Required by pages/canon/[slug].tsx */
export function getAccessLevel(canon: Canon | undefined): string {
  if (!canon) return "public";
  
  // Try multiple possible access level properties
  const access = 
    canon.accessLevel || 
    canon.tier || 
    canon.access || 
    "public";
  
  return String(access).toLowerCase();
}

export function resolveCanonSlug(canon: Canon): string {
  if (!canon) return "";
  
  // Try multiple slug properties
  const slug = 
    canon.slug || 
    canon.slugComputed || 
    canon._raw?.flattenedPath || 
    "";
  
  return normalizeSlug(slug);
}

async function loadCanons(): Promise<Canon[]> {
  const d = await getContentlayerData();
  const canons = (d.allCanons ?? []) as any[];
  return canons.filter((c) => c && !isDraftContent(c));
}

/* -------------------------------------------------------------------------- */
/* Getters                                                                    */
/* -------------------------------------------------------------------------- */

export async function getAllCanons(): Promise<Canon[]> {
  return loadCanons();
}

export async function getPublicCanons(): Promise<Canon[]> {
  const canons = await loadCanons();
  return canons
    .filter(isPublicCanon)
    .sort((a: any, b: any) => {
      // Sort by volume number if available, otherwise by date
      const aVolume = Number(a?.volumeNumber) || Number(a?.order) || 0;
      const bVolume = Number(b?.volumeNumber) || Number(b?.order) || 0;
      if (aVolume !== bVolume) return aVolume - bVolume;
      
      // Fallback to date
      const aDate = a?.date || a?.createdAt || '';
      const bDate = b?.date || b?.createdAt || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
}

export async function getCanonBySlug(slug: string): Promise<Canon | undefined> {
  const target = normalizeSlug(slug);
  const canons = await loadCanons();
  return canons.find((c) => {
    const canonSlug = resolveCanonSlug(c);
    return canonSlug === target;
  });
}

/** Alias for legacy pages */
export const getCanonDocBySlug = getCanonBySlug;

/* -------------------------------------------------------------------------- */
/* Index Mapping                                                               */
/* -------------------------------------------------------------------------- */

export type CanonIndexItem = {
  slug: string;
  title: string;
  volumeNumber: number | null;
  coverImage: string | null;
  excerpt: string | null;
  accessLevel: string;
  date?: string;
};

export async function getCanonIndexItems(): Promise<CanonIndexItem[]> {
  const canons = await getPublicCanons();
  return canons.map((c) => ({
    slug: resolveCanonSlug(c),
    title: c?.title || "Untitled Canon",
    volumeNumber: typeof c?.volumeNumber === "number" ? c.volumeNumber : 
                 typeof c?.order === "number" ? c.order : null,
    coverImage: c?.coverImage || 
                c?.image || 
                c?.cover || 
                null,
    excerpt: c?.description || 
             c?.excerpt || 
             c?.summary || 
             null,
    accessLevel: getAccessLevel(c),
    date: c?.date || c?.createdAt,
  }));
}