// lib/print-utils.ts
// PRODUCTION-SAFE utilities - NO Contentlayer dependency

export interface PrintDocument {
  _id: string;
  title: string;
  slug: string;
  date: string;
  url: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  content?: string;
  // Allow future-safe extension without breaking consumers
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// Mock data for when Contentlayer is not available
// In production with real data, you can replace this with a filesystem/DB source
// -----------------------------------------------------------------------------

const MOCK_PRINTS: PrintDocument[] = [
  {
    _id: "sample-print-1",
    title: "Sample Print Document",
    slug: "sample-print",
    date: "2024-01-01",
    url: "/print/sample-print",
    excerpt: "This is a sample print document for demonstration.",
    tags: ["sample", "document"],
    content: "# Sample Content\n\nThis is sample content for the print document.",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Return all print documents.
 * In non-production, logs that mock data is being used.
 */
export function getAllPrintDocuments(): PrintDocument[] {
  if (process.env.NODE_ENV !== "production") {
    // Keep the warning for dev only so production logs stay clean
    // eslint-disable-next-line no-console
    console.warn("⚠️ Using mock print data - Contentlayer is disabled");
  }
  // Return a shallow copy to avoid accidental mutation of the source array
  return [...MOCK_PRINTS];
}

/**
 * Return all slugs for static path generation.
 */
export function getAllPrintSlugs(): string[] {
  return getAllPrintDocuments()
    .map((d) => d.slug)
    .filter((slug): slug is string => Boolean(slug && slug.trim()));
}

/**
 * Safely retrieve a single print document by slug (case-insensitive).
 */
export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  if (!slug) return null;

  const normalizedSlug = slug.toLowerCase().trim();

  const doc = getAllPrintDocuments().find((d) => {
    const candidate = (d.slug || "").toString().toLowerCase().trim();
    return candidate === normalizedSlug;
  });

  return doc ?? null;
}

/**
 * Helper for Next.js getStaticPaths.
 */
export function getPrintPaths(): { params: { slug: string } }[] {
  return getAllPrintSlugs().map((slug) => ({ params: { slug } }));
}