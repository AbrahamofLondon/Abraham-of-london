// lib/prints.ts
// Unified helpers + data access for print documents (wrapping print-utils)

import {
  getAllPrintDocuments as _getAllPrintDocuments,
  getAllPrintSlugs as _getAllPrintSlugs,
  getPrintDocumentBySlug as _getPrintDocumentBySlug,
  getPrintPaths as _getPrintPaths,
  type PrintDocument as BasePrintDocument,
} from "@/lib/print-utils";

// Canonical print type used across the app
export type PrintDocument = BasePrintDocument & {
  description?: string;
  category?: string;
  dimensions?: string;
  downloadFile?: string;
  price?: string;
  available?: boolean;
};

// ---------------------------------------------------------------------------
// Data access (used by getStaticProps / getStaticPaths)
// ---------------------------------------------------------------------------

export function getAllPrintDocuments(): PrintDocument[] {
  return _getAllPrintDocuments() as PrintDocument[];
}

export function getAllPrintSlugs(): string[] {
  return _getAllPrintSlugs();
}

export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  return _getPrintDocumentBySlug(slug) as PrintDocument | null;
}

export function getPrintPaths(): { params: { slug: string } }[] {
  return _getPrintPaths();
}

// ---------------------------------------------------------------------------
// Client helpers
// ---------------------------------------------------------------------------

/** Build the public URL for a print page. */
export function getPrintUrl(slug: string): string {
  return `/prints/${slug}`;
}

/** Format dimensions for UI display. */
export function formatDimensions(dimensions?: string): string {
  if (!dimensions || !dimensions.trim()) return "Standard size";
  return dimensions;
}

/** Check whether a print is currently available. */
export function isPrintAvailable(print: PrintDocument): boolean {
  return print.available !== false;
}

/** Filter by tag (case-insensitive). */
export function filterPrintsByTag(
  prints: PrintDocument[],
  tag: string,
): PrintDocument[] {
  const needle = tag.toLowerCase();
  return prints.filter(
    (print) =>
      Array.isArray(print.tags) &&
      print.tags.some((t) => t.toLowerCase() === needle),
  );
}

/** Filter by category (case-insensitive). */
export function filterPrintsByCategory(
  prints: PrintDocument[],
  category: string,
): PrintDocument[] {
  const needle = category.toLowerCase();
  return prints.filter(
    (print) =>
      typeof print.category === "string" &&
      print.category.toLowerCase() === needle,
  );
}

/** Collect unique tags across all prints. */
export function getAllPrintTags(prints: PrintDocument[]): string[] {
  const tagSet = new Set<string>();
  prints.forEach((print) => {
    if (Array.isArray(print.tags)) {
      print.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/** Collect unique categories across all prints. */
export function getAllPrintCategories(prints: PrintDocument[]): string[] {
  const categorySet = new Set<string>();
  prints.forEach((print) => {
    if (print.category) {
      categorySet.add(print.category);
    }
  });
  return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
}