/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  allDocuments,
  allBooks,
  allCanons,
  allPosts,
  allShorts,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
} from "contentlayer/generated";

if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  // This file must NEVER be imported directly by Pages / API / build code
}

// ---------------- CORE ----------------

export const normalizeSlug = (slug: string | string[]): string =>
  Array.isArray(slug) ? slug.join("/") : slug;

export const sanitizeData = <T>(data: T): T | null =>
  data ? JSON.parse(JSON.stringify(data)) : null;

// ---------------- COLLECTIONS ----------------

export const getAllContentlayerDocs = () => allDocuments;
export const getAllBooks = () => allBooks;
export const getAllCanons = () => allCanons;
export const getAllShorts = () => allShorts;
export const getAllPosts = () => allPosts;
export const getAllDownloads = () => allDownloads;
export const getAllEvents = () => allEvents;
export const getAllPrints = () => allPrints;
export const getAllResources = () => allResources;
export const getAllStrategies = () => allStrategies;

// ---------------- LOOKUPS ----------------

export const getDocBySlug = (slug: string | string[]) => {
  const normalized = normalizeSlug(slug);
  return allDocuments.find(
    (doc) => doc.slug === normalized || doc._id.includes(normalized)
  );
};

export const getServerBookBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allBooks.find(
    (b) => b.slug === normalized || b._id.includes(normalized)
  );
};

// ---------------- LEGACY ----------------

export const allDocs = allDocuments;
export { allDocuments };