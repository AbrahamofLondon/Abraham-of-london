/* lib/content/real.ts — SERVER-SAFE CONTENTLAYER ACCESS */
import type { DocBase } from "@/lib/contentlayer-compat";
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
} from "@/lib/contentlayer-compat";

function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(
      `[${moduleName}] is server-only but was loaded in the browser.`
    );
  }
}

assertServerOnly("lib/content/real.ts");

export type AnyContentDoc =
  | (typeof allBooks)[number]
  | (typeof allCanons)[number]
  | (typeof allDocuments)[number]
  | (typeof allDownloads)[number]
  | (typeof allEvents)[number]
  | (typeof allPosts)[number]
  | (typeof allPrints)[number]
  | (typeof allResources)[number]
  | (typeof allShorts)[number]
  | (typeof allStrategies)[number];

export function getAllContentlayerDocs(): AnyContentDoc[] {
  return [
    ...allBooks,
    ...allCanons,
    ...allDocuments,
    ...allDownloads,
    ...allEvents,
    ...allPosts,
    ...allPrints,
    ...allResources,
    ...allShorts,
    ...allStrategies,
  ];
}

/**
 * FIXED: Standardized signature to handle the slug lookup.
 * This is the function your API routes are looking for.
 */
export function getDocumentBySlug(slug: string): AnyContentDoc | null {
  const s = normalizeSlug(slug);
  const all = getAllContentlayerDocs();
  return (
    all.find(
      (d: any) =>
        normalizeSlug(d?.slug || d?._raw?.flattenedPath || "") === s
    ) ?? null
  );
}

// Alias for internal consistency
export const getDocBySlug = getDocumentBySlug;

export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function isDraftContent(doc: Partial<DocBase> | null | undefined): boolean {
  if (!doc) return true;
  if (doc.draft === true) return true;
  if (typeof doc.published === "boolean") return doc.published === false;
  return false;
}