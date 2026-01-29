// lib/content/real.ts — SERVER-SAFE CONTENTLAYER ACCESS (Pages Router friendly)
// IMPORTANT:
// - Do NOT import "server-only" here (pages/ router does not support it).
// - This module MUST only be used from server-side contexts (GSSP/GSP/API/cron).
// - If it’s ever imported into a client bundle, we hard-fail at runtime.

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
  // If this runs in the browser, someone imported this into a client bundle.
  if (typeof window !== "undefined") {
    throw new Error(
      `[${moduleName}] is server-only but was loaded in the browser. ` +
        `Move the import inside getStaticProps/getServerSideProps or an API route.`
    );
  }
}

// Run guard on module load (safe in Node; will explode in browser)
assertServerOnly("lib/content/real.ts");

// -----------------------------
// Unified doc view
// -----------------------------

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
  // Safe: all* arrays are static exports generated at build time
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

export function getDocBySlug(slug: string): AnyContentDoc | null {
  const s = normalizeSlug(slug);
  const all = getAllContentlayerDocs();
  return all.find((d: any) => normalizeSlug(d?.slug ?? d?._raw?.flattenedPath ?? "") === s) ?? null;
}

export function requireDocBySlug(slug: string): AnyContentDoc {
  const doc = getDocBySlug(slug);
  if (!doc) throw new Error(`[content] Doc not found for slug: ${slug}`);
  return doc;
}

// -----------------------------
// Helpers
// -----------------------------

export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function isDraftContent(doc: Partial<DocBase> | null | undefined): boolean {
  if (!doc) return true;
  // Support both "draft" and "published" conventions
  if (doc.draft === true) return true;
  if (typeof doc.published === "boolean") return doc.published === false;
  return false;
}