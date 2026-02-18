// lib/contentlayer/data.ts
/**
 * ContentLayer data export for build-time usage
 * This file provides the getContentlayerData function that pages need during build
 */

import { safeSlice } from "@/lib/utils/safe";

// Import REAL data from your SSOT wrapper (which itself re-exports contentlayer/generated)
import {
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allShorts,
} from "@/lib/contentlayer-generated";

// Define local types since they're not exported from contentlayer/generated
export type Post = any;
export type Book = any;
export type Download = any;
export type Event = any;
export type Print = any;
export type Resource = any;
export type Strategy = any;
export type Canon = any;
export type Short = any;

export type ContentLayerDocument =
  | Post
  | Book
  | Download
  | Event
  | Print
  | Resource
  | Strategy
  | Canon
  | Short;

export function getContentlayerData(): {
  available: boolean;
  documentCount: number;
  documents: ContentLayerDocument[];
  types: string[];
  error?: string;
  warning?: string;
} {
  try {
    const documents = allDocuments as unknown as ContentLayerDocument[];

    if (!documents || documents.length === 0) {
      return {
        available: false,
        documentCount: 0,
        documents: [],
        types: [],
        warning:
          'No Contentlayer documents found. Run "pnpm contentlayer build" to generate content.',
      };
    }

    const types = Array.from(new Set(documents.map((doc: any) => doc.type || "unknown")));

    return {
      available: true,
      documentCount: documents.length,
      documents: safeSlice(documents, 0, 50), // Limit for safety/perf
      types,
    };
  } catch (error) {
    console.error("[ContentLayer] getContentlayerData failed:", error);

    return {
      available: false,
      documentCount: 0,
      documents: [],
      types: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function getAllDocuments(): ContentLayerDocument[] {
  return allDocuments as unknown as ContentLayerDocument[];
}

export function getDocumentsByType(type: string): ContentLayerDocument[] {
  return getAllDocuments().filter((doc: any) => doc.type === type);
}

export function getDocumentBySlug(slug: string): ContentLayerDocument | null {
  const s = String(slug || "").replace(/^\/+|\/+$/g, "");
  const docs = getAllDocuments();

  return (
    docs.find((doc: any) => {
      const docSlug = String(doc.slug || "").replace(/^\/+|\/+$/g, "");
      const flat = String(doc._raw?.flattenedPath || "").replace(/^\/+|\/+$/g, "");
      return docSlug === s || flat === s;
    }) || null
  );
}

export function getPublishedDocuments(): ContentLayerDocument[] {
  return getAllDocuments().filter((doc: any) => !doc.draft && doc.published !== false);
}

// ---------- Type-specific getters ----------
export function getPostBySlug(slug: string): Post | null {
  return (allPosts as any[]).find((p: any) => p.slug === slug) || null;
}

export function getPostBySlugWithContent(slug: string): Post | null {
  return getPostBySlug(slug);
}

export function getPublishedPosts(): Post[] {
  return (allPosts as any[]).filter((p: any) => !p.draft && p.published !== false);
}

export function getBookBySlug(slug: string): Book | null {
  return (allBooks as any[]).find((b: any) => b.slug === slug) || null;
}

export function getPublishedBooks(): Book[] {
  return (allBooks as any[]).filter((b: any) => !b.draft && b.published !== false);
}

export function getDownloadBySlug(slug: string): Download | null {
  return (allDownloads as any[]).find((d: any) => d.slug === slug) || null;
}

export function getPublishedDownloads(): Download[] {
  return (allDownloads as any[]).filter((d: any) => !d.draft && d.published !== false);
}

export function getEventBySlug(slug: string): Event | null {
  return (allEvents as any[]).find((e: any) => e.slug === slug) || null;
}

export function getPublishedEvents(): Event[] {
  return (allEvents as any[]).filter((e: any) => !e.draft && e.published !== false);
}

export function getPrintBySlug(slug: string): Print | null {
  return (allPrints as any[]).find((p: any) => p.slug === slug) || null;
}

export function getPublishedPrints(): Print[] {
  return (allPrints as any[]).filter((p: any) => !p.draft && p.published !== false);
}

export function getResourceBySlug(slug: string): Resource | null {
  return (allResources as any[]).find((r: any) => r.slug === slug) || null;
}

export function getPublishedResources(): Resource[] {
  return (allResources as any[]).filter((r: any) => !r.draft && r.published !== false);
}

export function getStrategyBySlug(slug: string): Strategy | null {
  return (allStrategies as any[]).find((s: any) => s.slug === slug) || null;
}

export function getPublishedStrategies(): Strategy[] {
  return (allStrategies as any[]).filter((s: any) => !s.draft && s.published !== false);
}

export function getCanonBySlug(slug: string): Canon | null {
  return (allCanons as any[]).find((c: any) => c.slug === slug) || null;
}

export function getPublishedCanons(): Canon[] {
  return (allCanons as any[]).filter((c: any) => !c.draft && c.published !== false);
}

export function getShortBySlug(slug: string): Short | null {
  return (allShorts as any[]).find((s: any) => s.slug === slug) || null;
}

export function getPublishedShorts(): Short[] {
  return (allShorts as any[]).filter((s: any) => !s.draft && s.published !== false);
}

export function coerceShortTheme(theme: any): string {
  if (typeof theme === "string") return theme;
  return theme?.toString() || "default";
}

// Aliases for compatibility
export const getDocBySlug = getDocumentBySlug;

// Default export (backward compatibility)
const dataApi = {
  getContentlayerData,
  getAllDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getPublishedDocuments,
  getDocBySlug,

  getPostBySlug,
  getPostBySlugWithContent,
  getPublishedPosts,

  getBookBySlug,
  getPublishedBooks,

  getDownloadBySlug,
  getPublishedDownloads,

  getEventBySlug,
  getPublishedEvents,

  getPrintBySlug,
  getPublishedPrints,

  getResourceBySlug,
  getPublishedResources,

  getStrategyBySlug,
  getPublishedStrategies,

  getCanonBySlug,
  getPublishedCanons,

  getShortBySlug,
  getPublishedShorts,
  coerceShortTheme,
};

export default dataApi;