// ============================================================================
// FILE 2: lib/prints.ts (Client-safe utilities)
// ============================================================================

export interface PrintDocument {
  _id: string;
  title: string;
  slug: string;
  date: string;
  url: string;
  excerpt?: string;
  description?: string;
  tags?: string[];
  category?: string;
  coverImage?: string;
  dimensions?: string;
  downloadFile?: string;
  price?: string;
  available?: boolean;
  content?: string;
  [key: string]: unknown;
}

/**
 * Helper to build print URL from slug
 */
export function getPrintUrl(slug: string): string {
  return `/prints/${slug}`;
}

/**
 * Helper to format print dimensions for display
 */
export function formatDimensions(dimensions?: string): string {
  if (!dimensions) return "Standard size";
  return dimensions;
}

/**
 * Helper to check if a print is available
 */
export function isPrintAvailable(print: PrintDocument): boolean {
  return print.available !== false;
}

/**
 * Filter prints by tag
 */
export function filterPrintsByTag(
  prints: PrintDocument[],
  tag: string
): PrintDocument[] {
  return prints.filter(
    (print) =>
      Array.isArray(print.tags) &&
      print.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Filter prints by category
 */
export function filterPrintsByCategory(
  prints: PrintDocument[],
  category: string
): PrintDocument[] {
  return prints.filter(
    (print) =>
      print.category &&
      print.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all unique tags from prints
 */
export function getAllPrintTags(prints: PrintDocument[]): string[] {
  const tagSet = new Set<string>();
  prints.forEach((print) => {
    if (Array.isArray(print.tags)) {
      print.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}

/**
 * Get all unique categories from prints
 */
export function getAllPrintCategories(prints: PrintDocument[]): string[] {
  const categorySet = new Set<string>();
  prints.forEach((print) => {
    if (print.category) {
      categorySet.add(print.category);
    }
  });
  return Array.from(categorySet).sort();
}