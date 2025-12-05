// lib/unified-content.ts
// -----------------------------------------------------------------------------
// Robust facade over server-side unified content loader.
// Keeps existing exports intact AND provides safe, UI-friendly summaries.
// -----------------------------------------------------------------------------

import {
  getAllUnifiedContent as _getAllUnifiedContent,
  getUnifiedContentByType as _getUnifiedContentByType,
  searchUnifiedContent as _searchUnifiedContent,
} from "@/lib/server/unified-content";

export type { UnifiedContent } from "@/lib/server/unified-content";

// -----------------------------------------------------------------------------
// Re-export original server functions (backwards-compatible)
// -----------------------------------------------------------------------------

export const getAllUnifiedContent = _getAllUnifiedContent;
export const getUnifiedContentByType = _getUnifiedContentByType;
export const searchUnifiedContent = _searchUnifiedContent;

// -----------------------------------------------------------------------------
// Safe UI-facing summary types
// -----------------------------------------------------------------------------

/**
 * Minimal, serialisable unified content shape that is safe to use in pages and UI
 * components (no Dates, no complex nested objects).
 */
export interface UnifiedContentSummary {
  id: string;
  type: "page" | "download" | "event";
  slug: string;
  title: string;
  description?: string | null;
  excerpt?: string | null;
  date?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[] | null;
  url: string;
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// Normalisation helpers
// -----------------------------------------------------------------------------

/**
 * Normalise raw UnifiedContent into a predictable UnifiedContentSummary.
 */
function normaliseUnifiedContent(raw: unknown): UnifiedContentSummary {
  const content = (raw ?? {}) as Record<string, unknown>;

  // Ensure required fields have safe defaults
  const id = String(content.id ?? "").trim();
  const type = (["page", "download", "event"] as const).includes(
    content.type as any
  )
    ? (content.type as "page" | "download" | "event")
    : "page";

  const slug = String(content.slug ?? "").trim();
  const titleValue = typeof content.title === "string" ? content.title : "";
  const title = titleValue.trim().length ? titleValue : "Untitled";

  // Construct URL based on type if not provided
  let url = "";
  if (typeof content.url === "string" && content.url.trim().length > 0) {
    url = content.url.trim();
  } else {
    switch (type) {
      case "page":
        url = `/${slug}`;
        break;
      case "download":
        url = `/downloads/${slug}`;
        break;
      case "event":
        url = `/events/${slug}`;
        break;
      default:
        url = `/${slug}`;
    }
  }

  // Normalise date field
  let date: string | null = null;
  const rawDate = content.date as unknown;
  if (typeof rawDate === "string") {
    date = rawDate;
  } else if (rawDate instanceof Date && !Number.isNaN(rawDate.valueOf())) {
    date = rawDate.toISOString();
  }

  // Normalise tags
  const tags = Array.isArray(content.tags)
    ? (content.tags as unknown[])
        .filter((t) => typeof t === "string")
        .map((t) => t as string)
    : null;

  return {
    id: id || `${type}-${slug}`,
    type,
    slug,
    title,
    description:
      typeof content.description === "string" ? content.description : null,
    excerpt: typeof content.excerpt === "string" ? content.excerpt : null,
    date,
    author: typeof content.author === "string" ? content.author : null,
    category: typeof content.category === "string" ? content.category : null,
    tags,
    url,
    // Keep all raw fields available if needed downstream
    ...content,
  };
}

// -----------------------------------------------------------------------------
// Safe helpers for pages / UI
// -----------------------------------------------------------------------------

/**
 * All unified content as UnifiedContentSummary[], safe for JSON serialisation and UI use.
 */
export async function getAllUnifiedContentSafe(): Promise<
  UnifiedContentSummary[]
> {
  try {
    const raw = await _getAllUnifiedContent();
    return Array.isArray(raw) ? raw.map(normaliseUnifiedContent) : [];
  } catch (error) {
    console.error("[unified-content] Error fetching unified content:", error);
    return [];
  }
}

/**
 * Unified content by type as UnifiedContentSummary[], safe for JSON serialisation.
 */
export async function getUnifiedContentByTypeSafe(
  type: UnifiedContentSummary["type"]
): Promise<UnifiedContentSummary[]> {
  try {
    const raw = await _getUnifiedContentByType(type);
    return Array.isArray(raw) ? raw.map(normaliseUnifiedContent) : [];
  } catch (error) {
    console.error(
      `[unified-content] Error fetching unified content by type (${type}):`,
      error
    );
    return [];
  }
}

/**
 * Search unified content with a query string, returning safe summaries.
 */
export async function searchUnifiedContentSafe(
  query: string
): Promise<UnifiedContentSummary[]> {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return [];
  }

  try {
    const raw = await _searchUnifiedContent(query);
    return Array.isArray(raw) ? raw.map(normaliseUnifiedContent) : [];
  } catch (error) {
    console.error(
      "[unified-content] Error searching unified content:",
      error
    );
    return [];
  }
}

/**
 * Get recent unified content, sorted by date (newest first).
 * Optionally limit the number of results.
 */
export async function getRecentUnifiedContentSafe(
  limit?: number
): Promise<UnifiedContentSummary[]> {
  try {
    const all = await getAllUnifiedContentSafe();
    
    // Sort by date (newest first), with null/undefined dates at the end
    const sorted = all.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // Handle invalid dates
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;
      
      return dateB - dateA;
    });
    
    return limit ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error(
      "[unified-content] Error getting recent unified content:",
      error
    );
    return [];
  }
}

/**
 * Get unified content by slug, regardless of type.
 * Returns the first matching content item.
 */
export async function getUnifiedContentBySlugSafe(
  slug: string
): Promise<UnifiedContentSummary | null> {
  const target = String(slug ?? "").trim();
  if (!target) return null;

  try {
    const all = await getAllUnifiedContentSafe();
    return all.find((item) => item.slug === target) || null;
  } catch (error) {
    console.error(
      `[unified-content] Error fetching unified content by slug (${slug}):`,
      error
    );
    return null;
  }
}

/**
 * Get unified content by ID (format: "type-slug").
 */
export async function getUnifiedContentByIdSafe(
  id: string
): Promise<UnifiedContentSummary | null> {
  const target = String(id ?? "").trim();
  if (!target) return null;

  try {
    const all = await getAllUnifiedContentSafe();
    return all.find((item) => item.id === target) || null;
  } catch (error) {
    console.error(
      `[unified-content] Error fetching unified content by ID (${id}):`,
      error
    );
    return null;
  }
}

/**
 * Get all unique categories across all content types.
 */
export async function getAllCategoriesSafe(): Promise<string[]> {
  try {
    const all = await getAllUnifiedContentSafe();
    const categories = new Set<string>();
    
    all.forEach((item) => {
      if (item.category && typeof item.category === "string") {
        categories.add(item.category);
      }
    });
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error(
      "[unified-content] Error getting all categories:",
      error
    );
    return [];
  }
}

/**
 * Get all unique tags across all content types.
 */
export async function getAllTagsSafe(): Promise<string[]> {
  try {
    const all = await getAllUnifiedContentSafe();
    const tags = new Set<string>();
    
    all.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (typeof tag === "string") {
            tags.add(tag);
          }
        });
      }
    });
    
    return Array.from(tags).sort();
  } catch (error) {
    console.error(
      "[unified-content] Error getting all tags:",
      error
    );
    return [];
  }
}

/**
 * Get unified content by category, safe for UI.
 */
export async function getUnifiedContentByCategorySafe(
  category: string
): Promise<UnifiedContentSummary[]> {
  try {
    const all = await getAllUnifiedContentSafe();
    return all.filter(item => item.category === category);
  } catch (error) {
    console.error(
      `[unified-content] Error getting unified content by category (${category}):`,
      error
    );
    return [];
  }
}

/**
 * Get unified content by tag, safe for UI.
 */
export async function getUnifiedContentByTagSafe(
  tag: string
): Promise<UnifiedContentSummary[]> {
  try {
    const all = await getAllUnifiedContentSafe();
    return all.filter(item => 
      Array.isArray(item.tags) && item.tags.includes(tag)
    );
  } catch (error) {
    console.error(
      `[unified-content] Error getting unified content by tag (${tag}):`,
      error
    );
    return [];
  }
}

// -----------------------------------------------------------------------------
// Default export for backward compatibility
// -----------------------------------------------------------------------------
export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
  getAllUnifiedContentSafe,
  getUnifiedContentByTypeSafe,
  searchUnifiedContentSafe,
  getRecentUnifiedContentSafe,
  getUnifiedContentBySlugSafe,
  getUnifiedContentByIdSafe,
  getAllCategoriesSafe,
  getAllTagsSafe,
  getUnifiedContentByCategorySafe,
  getUnifiedContentByTagSafe,
};