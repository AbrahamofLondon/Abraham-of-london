// lib/content.ts
// Central content access layer, using Contentlayer2’s generated module directly.

import {
  allPosts,
  allBooks,
  allEvents,
  allDownloads,
  allPrints,
  allResources,
  allCanons,
} from "../.contentlayer/generated";

import type {
  Post,
  Book,
  Event,
  Download,
  Print,
  Resource,
  Canon,
} from "../.contentlayer/generated";

export type AnyContent = Post | Book | Event | Download | Print | Resource;
export type CanonDoc = Canon;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function sortByDate<T extends { date?: string | null }>(
  items: readonly T[]
): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da; // newest first
  });
}

/* -------------------------------------------------------------------------- */
/* POSTS (Strategic Essays)                                                   */
/* -------------------------------------------------------------------------- */

export function getAllPosts(): Post[] {
  return sortByDate(
    (allPosts as Post[]).filter((p) => !(p as any).draft)
  );
}

export function getPostBySlug(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* BOOKS (Curated Volumes)                                                    */
/* -------------------------------------------------------------------------- */

export function getAllBooks(): Book[] {
  return sortByDate(allBooks as Book[]).filter(
    (b) => !(b as any).draft && (b as any).status !== "draft"
  );
}

export function getBookBySlug(slug: string): Book | null {
  return getAllBooks().find((b) => b.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* EVENTS (Live Sessions)                                                     */
/* -------------------------------------------------------------------------- */

export function getAllEvents(): Event[] {
  return sortByDate(allEvents as Event[]);
}

export function getEventBySlug(slug: string): Event | null {
  return getAllEvents().find((e) => e.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* DOWNLOADS (Execution Tools)                                                */
/* -------------------------------------------------------------------------- */

export function getAllDownloads(): Download[] {
  return sortByDate(allDownloads as Download[]);
}

export function getDownloadBySlug(slug: string): Download | null {
  return getAllDownloads().find((d) => d.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* PRINTS                                                                     */
/* -------------------------------------------------------------------------- */

export function getAllPrints(): Print[] {
  return sortByDate(allPrints as Print[]);
}

export function getPrintBySlug(slug: string): Print | null {
  return getAllPrints().find((p) => p.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* RESOURCES                                                                  */
/* -------------------------------------------------------------------------- */

export function getAllResources(): Resource[] {
  return sortByDate(allResources as Resource[]);
}

export function getResourceBySlug(slug: string): Resource | null {
  return getAllResources().find((r) => r.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* CANON                                                                      */
/* -------------------------------------------------------------------------- */

export function getAllCanonDocs(): CanonDoc[] {
  return [...allCanons].filter((doc) => !(doc as any).draft);
}

export function getCanonBySlug(slug: string): CanonDoc | null {
  return getAllCanonDocs().find((doc) => doc.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* AGGREGATED CONTENT (for /content etc.)                                     */
/* -------------------------------------------------------------------------- */

export function getAllContent(): AnyContent[] {
  return [
    ...getAllPosts(),
    ...getAllBooks(),
    ...getAllEvents(),
    ...getAllDownloads(),
    ...getAllPrints(),
    ...getAllResources(),
  ].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}