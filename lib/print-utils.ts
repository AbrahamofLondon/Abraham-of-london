// lib/print-utils.ts
// Low-level helpers wired directly to Contentlayer's Print documents.

import { allPrints, type Print } from "contentlayer/generated";

// Base type exported for lib/prints.ts to extend
export type PrintDocument = Print;

// Normalise a "slug" for a print from either frontmatter or file path
function resolveSlug(print: Print): string {
  if (print.slug && print.slug.trim()) return print.slug;

  // Fallback: strip "prints/" from the flattened path
  const fromPath = print._raw.flattenedPath.replace(/^prints\//u, "");
  return fromPath || "untitled-print";
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export function getAllPrintDocuments(): PrintDocument[] {
  // Sort newest first by date
  const sorted = [...allPrints].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) < new Date(b.date) ? 1 : -1;
  });

  // Attach a normalised slug to each record (without mutating originals)
  return sorted.map((p) => ({
    ...p,
    slug: resolveSlug(p),
  }));
}

export function getAllPrintSlugs(): string[] {
  return getAllPrintDocuments().map((p) => resolveSlug(p));
}

export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  const match = allPrints.find((p) => resolveSlug(p) === slug);
  return match ? { ...match, slug: resolveSlug(match) } : null;
}

export function getPrintPaths(): { params: { slug: string } }[] {
  return getAllPrintSlugs().map((slug) => ({
    params: { slug },
  }));
}
