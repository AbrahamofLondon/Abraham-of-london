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
  [key: string]: unknown;
}

// Mock data for when Contentlayer is not available
const MOCK_PRINTS: PrintDocument[] = [
  {
    _id: "sample-print-1",
    title: "Sample Print Document",
    slug: "sample-print",
    date: "2024-01-01",
    url: "/print/sample-print",
    excerpt: "This is a sample print document for demonstration.",
    tags: ["sample", "document"],
    content: "# Sample Content\n\nThis is sample content for the print document."
  }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function getAllPrintDocuments(): PrintDocument[] {
  console.warn('⚠️ Using mock print data - Contentlayer is disabled');
  return [...MOCK_PRINTS];
}

export function getAllPrintSlugs(): string[] {
  return getAllPrintDocuments().map(d => d.slug).filter(Boolean);
}

export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  const normalizedSlug = slug.toLowerCase().trim();
  return getAllPrintDocuments().find(d => d.slug === normalizedSlug) || null;
}

export function getPrintPaths(): { params: { slug: string } }[] {
  return getAllPrintSlugs().map(slug => ({ params: { slug } }));
}