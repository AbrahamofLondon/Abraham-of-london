// lib/canon.ts - COMPLETE CORRECTED VERSION
// Canon data facade

import { getAllCanon as getAllCanonServer } from "@/lib/server/canon-data";

// Type definitions
export type Canon = any;
export type CanonMeta = Canon;
export type CanonFieldKey = keyof CanonMeta;

/**
 * Get all canon
 */
export function getAllCanon(includeDrafts = false): CanonMeta[] {
  try {
    const canon = getAllCanonServer();
    const result = Array.isArray(canon) ? canon : [];
    
    if (!includeDrafts) {
      return result.filter(canon => {
        const isDraft = canon.draft === true;
        const isNotPublished = canon.published === false;
        const isStatusDraft = canon.status === 'draft';
        return !(isDraft || isNotPublished || isStatusDraft);
      });
    }
    
    return result;
  } catch {
    return [];
  }
}

/**
 * Get canon by slug - MISSING FUNCTION ADDED
 */
export function getCanonBySlug(slug: string): Canon | null {
  try {
    const canon = getAllCanon(true); // Include drafts for admin/slug resolution
    return canon.find(c => c.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Get canon slugs
 */
export function getCanonSlugs(): string[] {
  const canon = getAllCanon();
  return canon.map(c => c.slug).filter(Boolean);
}

/**
 * Get public canon
 */
export function getPublicCanon(): CanonMeta[] {
  const canon = getAllCanon();
  return canon.filter(canon => {
    const isDraft = canon.draft === true;
    const isNotPublished = canon.published === false;
    const isStatusDraft = canon.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get featured canon
 */
export function getFeaturedCanon(): CanonMeta[] {
  const canon = getPublicCanon();
  return canon.filter(c => c.featured === true);
}

/**
 * Search canon by title or tags
 */
export function searchCanon(query: string): CanonMeta[] {
  const canon = getPublicCanon();
  
  if (!query?.trim()) {
    return canon;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return canon.filter(c => {
    if (c.title?.toLowerCase().includes(searchTerm)) return true;
    if (c.subtitle?.toLowerCase().includes(searchTerm)) return true;
    if (c.description?.toLowerCase().includes(searchTerm)) return true;
    if (c.excerpt?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in tags
    if (c.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) return true;
    
    return false;
  });
}

/**
 * Get canon by tag
 */
export function getCanonByTag(tag: string): CanonMeta[] {
  const canon = getPublicCanon();
  
  if (!tag) {
    return canon;
  }
  
  const normalizedTag = tag.toLowerCase().trim();
  
  return canon.filter(c => 
    c.tags?.some(t => t.toLowerCase().trim() === normalizedTag)
  );
}

/**
 * Get canon by volume number
 */
export function getCanonByVolumeNumber(volumeNumber: number): CanonMeta[] {
  const canon = getPublicCanon();
  
  return canon.filter(c => 
    typeof c.volumeNumber === 'number' && c.volumeNumber === volumeNumber
  );
}

/**
 * Get all tags from canon
 */
export function getAllCanonTags(): string[] {
  const canon = getPublicCanon();
  const allTags = canon
    .flatMap(c => c.tags || [])
    .filter((tag): tag is string => typeof tag === "string");
  
  // Remove duplicates and sort
  return [...new Set(allTags)].sort();
}

// Default export
const canonExports = {
  getAllCanon,
  getCanonBySlug,
  getCanonSlugs,
  getPublicCanon,
  getFeaturedCanon,
  searchCanon,
  getCanonByTag,
  getCanonByVolumeNumber,
  getAllCanonTags,
};

export default canonExports;