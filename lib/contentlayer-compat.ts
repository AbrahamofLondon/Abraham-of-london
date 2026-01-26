// lib/contentlayer-compat.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  isType,
} from "@/lib/contentlayer-generated";

/**
 * Pages Router stability: SYNC-FIRST only.
 * This file exports raw Contentlayer collections and basic selectors.
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

export function isPublished(doc: any): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;

  if (doc.date) {
    const d = new Date(doc.date);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return false;
  }
  return true;
}

export function getPublishedDocuments(): any[] {
  return (allDocuments ?? []).filter(isPublished);
}

export function getPublishedDocumentsByType(kind: string): any[] {
  return getPublishedDocuments().filter((d) => isType(kind as any, d));
}

export function getAllContentlayerDocs(): any[] {
  return getPublishedDocuments();
}

export function getAllShorts(): any[] {
  return getPublishedDocumentsByType("Short");
}

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
  isType,
};