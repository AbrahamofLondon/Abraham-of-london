// lib/canon.ts
// Canon data facade

import { getAllCanon as getAllCanonServer } from "@/lib/server/canon-data";

// Type definitions
export type Canon = any;
export type CanonMeta = Canon;
export type CanonFieldKey = keyof CanonMeta;

/**
 * Get all canon
 */
export function getAllCanon(): CanonMeta[] {
  try {
    const canon = getAllCanonServer();
    return Array.isArray(canon) ? canon : [];
  } catch {
    return [];
  }
}

/**
 * Get canon by slug
 */
export function getCanonBySlug(slug: string): Canon | null {
  try {
    const canon = getAllCanon();
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