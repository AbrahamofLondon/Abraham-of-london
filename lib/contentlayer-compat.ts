/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CONTENTLAYER COMPATIBILITY LAYER (HARDENED)
 * - Directly resolves "getAllContentlayerDocs is not a function" errors.
 * - Standardizes data access for Pages Router stability.
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
} from "contentlayer/generated";

// Export DocBase type for use in other files
export type DocBase = {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  published?: boolean;
  featured?: boolean;
  slug?: string;
  slugComputed?: string;
  coverImage?: string;
  image?: string;
  author?: string;
  readTime?: string;
  category?: string;
  body?: {
    raw: string;
    html?: string;
    code?: string;
  };
  [key: string]: any;
};

/**
 * Core Governance: Filters out drafts and future-dated content.
 */
export function isPublished(doc: any): boolean {
  if (!doc) return false;
  if (doc.draft === true || doc.status === 'draft') return false;

  if (doc.date) {
    const d = new Date(doc.date);
    // If the date is valid and in the future, it's not "published" yet
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return false;
  }
  return true;
}

/**
 * Standardized Data Fetchers
 */
export function getContentlayerData() {
  return {
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
  };
}

export function getPublishedDocuments(): any[] {
  return (allDocuments ?? []).filter(isPublished);
}

// Resilient Type Check replacing the complex isType helper
export function getPublishedDocumentsByType(kind: string): any[] {
  const targetKind = kind.toLowerCase();
  return getPublishedDocuments().filter((d) => {
    const docKind = (d.kind || d.type || d._type || "").toLowerCase();
    return docKind === targetKind;
  });
}

/**
 * CRITICAL EXPORTS: These resolve the Netlify Build Panics
 */
export const getAllContentlayerDocs = () => getPublishedDocuments();

export const getAllShorts = () => getPublishedDocumentsByType("Short");

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
  allStrategies
};