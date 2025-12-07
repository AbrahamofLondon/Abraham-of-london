// lib/prints.ts
// Prints data facade

import { getAllPrintsMeta } from "@/lib/server/prints-data";

// Type definitions
export type Print = any;
export type PrintMeta = Print;
export type PrintFieldKey = keyof PrintMeta;

/**
 * Get all prints
 */
export function getAllPrints(): PrintMeta[] {
  try {
    const prints = getAllPrintsMeta();
    return Array.isArray(prints) ? prints : [];
  } catch {
    return [];
  }
}

/**
 * Get print by slug
 */
export function getPrintBySlug(slug: string): Print | null {
  try {
    const prints = getAllPrints();
    return prints.find(p => p.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Get print slugs
 */
export function getPrintSlugs(): string[] {
  const prints = getAllPrints();
  return prints.map(p => p.slug).filter(Boolean);
}

/**
 * Get public prints
 */
export function getPublicPrints(): PrintMeta[] {
  const prints = getAllPrints();
  return prints.filter(print => {
    const isDraft = print.draft === true;
    const isNotPublished = print.published === false;
    const isStatusDraft = print.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}
