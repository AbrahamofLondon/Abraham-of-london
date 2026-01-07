// lib/canon.ts — CANONICAL (ASYNC, NO allCanons IMPORTS)

import { getContentlayerData, isDraftContent, normalizeSlug, getAccessLevel as compatAccess } from "@/lib/contentlayer-compat";

export type Canon = any;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const norm = (v: unknown) => normalizeSlug(String(v || "")).toLowerCase();

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
  return String(canon.accessLevel || canon.tier || compatAccess(canon) || "public");
}

export function resolveCanonSlug(canon: Canon): string {
  if (!canon) return "";
  if (canon.slug) return norm(canon.slug).replace(/\/+$/, "");

  const fp = String(canon._raw?.flattenedPath || "");
  const parts = fp.split("/").filter(Boolean);
  return norm(parts[parts.length - 1] || "");
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
    .sort((a: any, b: any) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
}

export async function getCanonBySlug(slug: string): Promise<Canon | undefined> {
  const target = norm(slug);
  const canons = await loadCanons();
  return canons.find((c) => resolveCanonSlug(c) === target);
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
};

export async function getCanonIndexItems(): Promise<CanonIndexItem[]> {
  const canons = await getPublicCanons();
  return canons.map((c) => ({
    slug: resolveCanonSlug(c),
    title: c?.title || "Untitled Canon",
    volumeNumber: typeof c?.volumeNumber === "number" ? c.volumeNumber : null,
    coverImage: c?.coverImage || null,
    excerpt: c?.description || c?.excerpt || null,
    accessLevel: getAccessLevel(c),
  }));
}