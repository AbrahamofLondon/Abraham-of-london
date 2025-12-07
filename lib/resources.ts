// lib/resources.ts
// Resources data facade

import { getAllResourcesMeta } from "@/lib/server/resources-data";

// Type definitions
export type Resource = any;
export type ResourceMeta = Resource;
export type ResourceFieldKey = keyof ResourceMeta;

/**
 * Get all resources
 */
export function getAllResources(): ResourceMeta[] {
  try {
    const resources = getAllResourcesMeta();
    return Array.isArray(resources) ? resources : [];
  } catch {
    return [];
  }
}

/**
 * Get resource by slug
 */
export function getResourceBySlug(slug: string): Resource | null {
  try {
    const resources = getAllResources();
    return resources.find(r => r.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Get resource slugs
 */
export function getResourceSlugs(): string[] {
  const resources = getAllResources();
  return resources.map(r => r.slug).filter(Boolean);
}

/**
 * Get public resources
 */
export function getPublicResources(): ResourceMeta[] {
  const resources = getAllResources();
  return resources.filter(resource => {
    const isDraft = resource.draft === true;
    const isNotPublished = resource.published === false;
    const isStatusDraft = resource.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get resources by type
 */
export function getResourcesByType(type: string): ResourceMeta[] {
  const resources = getPublicResources();
  return resources.filter(r => r.resourceType === type);
}
