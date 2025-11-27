// lib/server/canon-data.ts
// Server-side helpers for Canon content (Contentlayer-powered)

import type { Canon } from "contentlayer/generated";
import { allCanons } from "contentlayer/generated";

export type CanonDoc = Canon;

type CanonFilterOptions = {
  includeDrafts?: boolean;
};

function sortCanon(a: CanonDoc, b: CanonDoc): number {
  // 1) Explicit numeric order if both have it
  if (typeof a.order === "number" && typeof b.order === "number") {
    if (a.order !== b.order) return a.order - b.order;
  }

  // 2) Otherwise sort by date desc
  const aDate = new Date(a.date ?? "1970-01-01").getTime();
  const bDate = new Date(b.date ?? "1970-01-01").getTime();
  if (aDate !== bDate) return bDate - aDate;

  // 3) Fallback by title for stability
  return a.title.localeCompare(b.title);
}

/**
 * All Canon docs, sorted consistently.
 */
export function getAllCanon(opts?: CanonFilterOptions): CanonDoc[] {
  const includeDrafts = !!opts?.includeDrafts;

  return allCanons
    .filter((c) => (includeDrafts ? true : !c.draft))
    .slice()
    .sort(sortCanon);
}

/**
 * Featured Canon docs – for hero / primary grids.
 */
export function getFeaturedCanon(): CanonDoc[] {
  return getAllCanon()
    .filter((c) => !!c.featured)
    .sort(sortCanon);
}

/**
 * All numbered Canon volumes (those with a volumeNumber).
 */
export function getCanonVolumes(): CanonDoc[] {
  return getAllCanon().filter((c) => !!c.volumeNumber);
}

/**
 * Canon "campaign" / marketing prelude document.
 */
export function getCanonCampaign(): CanonDoc | null {
  return (
    allCanons.find((c) => c.slug === "canon-campaign" && !c.draft) ?? null
  );
}

/**
 * Canon Master Index / landing helper – adjust slug if you rename it.
 */
export function getCanonMasterIndex(): CanonDoc | null {
  return (
    allCanons.find(
      (c) => c.slug === "canon-master-index-preview" && !c.draft,
    ) ?? null
  );
}

/**
 * Strong handle for Volume X – if you ever change the slug,
 * change it here once instead of hunting across pages.
 */
export function getCanonVolumeX(): CanonDoc | null {
  return (
    allCanons.find(
      (c) =>
        c.slug === "volume-x-the-arc-of-future-civilisation" && !c.draft,
    ) ?? null
  );
}

/**
 * Generic single fetch by slug.
 */
export function getCanonBySlug(slug: string): CanonDoc | null {
  const normalised = String(slug).trim().toLowerCase();
  return (
    allCanons.find((c) => c.slug.toLowerCase() === normalised) ?? null
  );
}