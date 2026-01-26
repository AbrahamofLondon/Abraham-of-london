// lib/content/real.ts - COMPLETE WITH ALL NEEDED EXPORTS
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * LEGACY REAL CONTENT ACCESS (SERVER SAFE)
 * - Must NOT import from "contentlayer2" package paths.
 * - Must only rely on your generated module.
 *
 * Some older pages import from "@/lib/content/real".
 * Keep it stable and boring.
 */

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
} from "@/lib/contentlayer-generated";

// ✅ ADD THESE FUNCTIONS - they're being imported by pages
export function normalizeSlug(input: string): string {
  return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export function isDraftContent(doc: any): boolean {
  return doc?.draft === true;
}

export function sanitizeData<T = any>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (value === undefined) return null;
      if (typeof value === "function") return undefined;
      if (typeof value === "bigint") return value.toString();
      return value;
    })
  );
}

export function isPublished(doc: any): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.date) {
    const d = new Date(doc.date);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return false;
  }
  return true;
}

export function getContentlayerData() {
  return {
    allDocuments: Array.isArray(allDocuments) ? allDocuments : [],
    allBooks: Array.isArray(allBooks) ? allBooks : [],
    allCanons: Array.isArray(allCanons) ? allCanons : [],
    allDownloads: Array.isArray(allDownloads) ? allDownloads : [],
    allPosts: Array.isArray(allPosts) ? allPosts : [],
    allEvents: Array.isArray(allEvents) ? allEvents : [],
    allPrints: Array.isArray(allPrints) ? allPrints : [],
    allResources: Array.isArray(allResources) ? allResources : [],
    allStrategies: Array.isArray(allStrategies) ? allStrategies : [],
    allShorts: Array.isArray(allShorts) ? allShorts : [],
  };
}

export function getPublishedDocuments(): any[] {
  return getContentlayerData().allDocuments.filter(isPublished);
}

export function getAllContentlayerDocs(): any[] {
  return getPublishedDocuments();
}

export function getDocBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedDocuments().find((d) => normalizeSlug(d?.slug) === target) || null;
}

export function getDocumentBySlug(slug: string): any | null {
  return getDocBySlug(slug);
}

export function getPublishedPosts(): any[] {
  const posts = getContentlayerData().allPosts;
  return posts.filter(isPublished);
}

export function getPostBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedPosts().find((p) => normalizeSlug(p?.slug) === target) || null;
}

// If your schemas contain MDX body (e.g., doc.body.raw), this returns it as-is.
export function getPostBySlugWithContent(slug: string): any | null {
  return getPostBySlug(slug);
}

// ✅ ADD THESE COLLECTION GETTERS (pages need them)
export function getBooks(): any[] {
  const books = getContentlayerData().allBooks;
  return books.filter(isPublished);
}

export function getCanons(): any[] {
  const canons = getContentlayerData().allCanons;
  return canons.filter(isPublished);
}

export function getDownloads(): any[] {
  const downloads = getContentlayerData().allDownloads;
  return downloads.filter(isPublished);
}

export function getEvents(): any[] {
  const events = getContentlayerData().allEvents;
  return events.filter(isPublished);
}

export function getPrints(): any[] {
  const prints = getContentlayerData().allPrints;
  return prints.filter(isPublished);
}

export function getResources(): any[] {
  const resources = getContentlayerData().allResources;
  return resources.filter(isPublished);
}

export function getShorts(): any[] {
  const shorts = getContentlayerData().allShorts;
  return shorts.filter(isPublished);
}

export function getStrategies(): any[] {
  const strategies = getContentlayerData().allStrategies;
  return strategies.filter(isPublished);
}

// ✅ ADD THESE SINGLE DOCUMENT GETTERS
export function getBookBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getBooks().find((b) => normalizeSlug(b?.slug) === target) || null;
}

export function getCanonBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getCanons().find((c) => normalizeSlug(c?.slug) === target) || null;
}

export function getDownloadBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getDownloads().find((d) => normalizeSlug(d?.slug) === target) || null;
}

export function getEventBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getEvents().find((e) => normalizeSlug(e?.slug) === target) || null;
}

export function getPrintBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPrints().find((p) => normalizeSlug(p?.slug) === target) || null;
}

export function getResourceBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getResources().find((r) => normalizeSlug(r?.slug) === target) || null;
}

export function getShortBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getShorts().find((s) => normalizeSlug(s?.slug) === target) || null;
}

export function getStrategyBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getStrategies().find((s) => normalizeSlug(s?.slug) === target) || null;
}

// ✅ ADD THESE UTILITIES (pages might need them)
export { resolveDocCoverImage, getDocHref, getDocKind, getAccessLevel } from "./shared";