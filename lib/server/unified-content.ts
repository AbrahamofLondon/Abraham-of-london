// lib/server/unified-content.ts

// Optional: mark as server-only (defensive)
if (typeof window !== "undefined") {
  throw new Error("lib/server/unified-content.ts must not be imported on the client");
}

export interface UnifiedContent {
  slug: string;
  title: string;
  type: "print" | "blog" | "document" | "page";
  content?: string;
  description?: string;
  author?: string;
  date?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  printSettings?: {
    pageSize?: "A4" | "A5" | "LETTER";
    marginsMm?: number;
    includeHeader?: boolean;
    includeFooter?: boolean;
  };
  seoTitle?: string;
  seoDescription?: string;
  source: "mdx" | "contentlayer" | "api";
  published: boolean;
}

/**
 * Internal helpers — each source can be implemented later.
 * For now they are safe stubs returning empty arrays.
 */

async function getMdxContent(): Promise<UnifiedContent[]> {
  // TODO: Wire MD/MDX filesystem content here.
  return [];
}

async function getContentlayerContent(): Promise<UnifiedContent[]> {
  // TODO: Wire Contentlayer documents here, mapping to UnifiedContent.
  return [];
}

async function getApiContent(): Promise<UnifiedContent[]> {
  // TODO: Wire external API content here (if needed).
  return [];
}

/**
 * Fetch all unified content across all sources.
 */
export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  const sources = await Promise.allSettled<UnifiedContent[]>([
    getMdxContent(),
    getContentlayerContent(),
    getApiContent(),
  ]);

  const all: UnifiedContent[] = [];

  for (const res of sources) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      all.push(...res.value);
    } else if (res.status === "rejected") {
      // Soft-fail: log on server only, avoid breaking runtime
      console.warn("Unified content source failed:", res.reason);
    }
  }

  // Optional: sort by date desc if present
  all.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });

  return all;
}

/**
 * Find a single unified content item by slug.
 */
export async function getUnifiedContentBySlug(
  slug: string
): Promise<UnifiedContent | null> {
  if (!slug) return null;

  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const all = await getAllUnifiedContent();

  return (
    all.find(
      (d) =>
        d.published &&
        d.slug &&
        d.slug.replace(/^\/+|\/+$/g, "") === normalized
    ) || null
  );
}

/**
 * Get items by type (print, blog, document, page).
 */
export async function getUnifiedContentByType(
  type: UnifiedContent["type"]
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((d) => d.type === type && d.published);
}

/**
 * Convenience re-exports in a single object if you prefer default import.
 */
const unifiedContent = {
  getAllUnifiedContent,
  getUnifiedContentBySlug,
  getUnifiedContentByType,
};

export default unifiedContent;