// lib/print-utils.ts
// Low-level helpers wired directly to Contentlayer's Print documents.

import { allPrints, type PrintDocument as ContentlayerPrint } from "./contentlayer-helper";

// Re-export the type for consistency
export type PrintDocument = ContentlayerPrint;

// Normalise a "slug" for a print from either frontmatter or file path
function resolveSlug(print: ContentlayerPrint): string {
  if (print.slug && print.slug.trim()) return print.slug;

  // Fallback: strip "prints/" from the flattened path
  const fromPath = print._raw.flattenedPath.replace(/^prints\//u, "");
  return fromPath || "untitled-print";
}

// Validate print document
function isValidPrint(print: ContentlayerPrint): boolean {
  return Boolean(print && print.slug && print.title);
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export function getAllPrintDocuments(): PrintDocument[] {
  // Filter valid prints and those that are available
  const validPrints = allPrints.filter(print => 
    isValidPrint(print) && print.available !== false
  );

  // Sort newest first by date, then by title for undated items
  const sorted = validPrints.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    
    if (dateA && dateB) {
      return dateB - dateA; // Newest first
    }
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    
    // Both undated, sort by title
    return (a.title || '').localeCompare(b.title || '');
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
  const normalizedSlug = slug.trim();
  const match = allPrints.find((p) => resolveSlug(p) === normalizedSlug);
  
  if (!match || match.available === false) {
    return null;
  }
  
  return { 
    ...match, 
    slug: resolveSlug(match) 
  };
}

export function getPrintPaths(): { params: { slug: string } }[] {
  return getAllPrintSlugs().map((slug) => ({
    params: { slug },
  }));
}

// Additional utility functions
export function getFeaturedPrints(): PrintDocument[] {
  return getAllPrintDocuments().filter(print => 
    print.available !== false
  ).slice(0, 6); // Return first 6 available prints
}

export function getPrintsByTag(tag: string): PrintDocument[] {
  return getAllPrintDocuments().filter(print => 
    print.tags?.includes(tag)
  );
}

export function getAllPrintTags(): string[] {
  const allTags = getAllPrintDocuments().flatMap(print => 
    print.tags || []
  );
  return Array.from(new Set(allTags)).sort();
}